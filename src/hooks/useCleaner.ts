import { useEffect, useRef, useState } from 'react';
import type { CleanOptions, CleanResult } from '../lib/cleaner';
const empty: CleanResult = { content: '', changes: [], statistics: { math: 0, unicode: 0, markdown: 0, artifacts: 0, html: 0, warnings: 0 } };
interface Request {
    id: number;
    input: string;
    options: CleanOptions;
}
export function useCleaner(input: string, options: CleanOptions) {
    const worker = useRef<Worker | null>(null), version = useRef(0), request = useRef<Request | null>(null);
    const [result, setResult] = useState(empty), [error, setError] = useState(''), [busy, setBusy] = useState(true), [completed, setCompleted] = useState<Request | null>(null);
    const fallback = async (job: Request) => {
        try {
            const { cleanMarkdown } = await import('../lib/cleaner');
            if (job.id !== version.current) return;
            setResult(cleanMarkdown(job.input, job.options));
            setCompleted(job);
            setError('');
        } catch (cause) {
            console.error('Markdown cleaning failed', cause);
            setError('清洗失败。请打开控制台查看详细错误，原文仍保留在输入框中。');
        } finally {
            if (job.id === version.current) setBusy(false);
        }
    };
    useEffect(() => {
        let w: Worker;
        try {
            w = new Worker(new URL('../lib/cleaner.worker.ts', import.meta.url), { type: 'module' });
        } catch (cause) {
            console.error('Markdown worker could not be created', cause);
            return;
        }
        worker.current = w;
        w.onmessage = e => { if (e.data.id !== version.current)
            return; setBusy(false); setError(e.data.error ?? ''); if (e.data.result) {
            setResult(e.data.result);
            setCompleted(request.current);
        } };
        w.onerror = event => {
            console.error('Markdown worker failed to load', event.message, event.filename, event.lineno);
            w.terminate();
            worker.current = null;
            const job = request.current;
            if (job) void fallback(job);
        };
        return () => { w.terminate(); worker.current = null; };
    }, []);
    useEffect(() => { const id = ++version.current; request.current = { id, input, options }; setBusy(true); const timer = setTimeout(() => {
        if (worker.current) worker.current.postMessage(request.current);
        else void fallback(request.current!);
    }, 220); return () => clearTimeout(timer); }, [input, options]);
    return { result, error, busy: busy || completed?.input !== input || completed?.options !== options };
}
