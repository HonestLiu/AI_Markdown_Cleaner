import { useEffect, useMemo, useRef } from 'react';
import { renderPreview, sanitizeMermaidSvg } from '../lib/preview';
import { getMessages, type Locale } from '../i18n';
import '../../node_modules/highlight.js/styles/github.css';
const MAX_PREVIEW_CHARS = 150000;
export function Preview({ content, locale }: {
    content: string;
    locale: Locale;
}) {
    const t = getMessages(locale);
    const root = useRef<HTMLElement>(null);
    const html = useMemo(() => { try {
        return content.length > MAX_PREVIEW_CHARS ? '' : renderPreview(content);
    }
    catch {
        return `<p>${t.previewFailed}</p>`;
    } }, [content]);
    useEffect(() => {
        const container = root.current;
        if (!container || content.length > MAX_PREVIEW_CHARS) return;
        let cancelled = false;
        const mermaidBlocks = [...container.querySelectorAll<HTMLElement>('pre code.language-mermaid')];
        const codeBlocks = [...container.querySelectorAll<HTMLElement>('pre code[class*="language-"]:not(.language-mermaid)')];
        if (!mermaidBlocks.length && !codeBlocks.length) return;
        if (codeBlocks.length) void import('../../node_modules/highlight.js/es/common.js').then(({ default: hljs }) => {
            if (cancelled) return;
            for (const code of codeBlocks) {
                const language = code.className.match(/(?:^|\s)language-([\w+-]+)/)?.[1];
                if (language && hljs.getLanguage(language)) hljs.highlightElement(code);
            }
        }).catch(() => undefined);
        if (mermaidBlocks.length) void import('mermaid').then(async ({ default: mermaid }) => {
            mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', htmlLabels: false, flowchart: { htmlLabels: false } });
            for (const [index, code] of mermaidBlocks.entries()) {
                if (cancelled) return;
                const source = code.textContent ?? '';
                try {
                    const { svg } = await mermaid.render(`mermaid-${Date.now()}-${index}`, source);
                    if (cancelled) return;
                    const safeSvg = sanitizeMermaidSvg(svg);
                    const figure = document.createElement('figure');
                    figure.className = 'mermaid-diagram';
                    figure.innerHTML = safeSvg;
                    code.closest('pre')?.replaceWith(figure);
                } catch {
                    const message = document.createElement('p');
                    message.className = 'mermaid-error';
                    message.textContent = t.diagramFailed;
                    code.closest('pre')?.after(message);
                }
            }
        }).catch(() => undefined);
        return () => { cancelled = true; };
    }, [content, html, locale]);
    if (content.length > MAX_PREVIEW_CHARS)
        return <div className="preview-note">{t.previewTooLong}</div>;
    return <article className="prose" ref={root} dangerouslySetInnerHTML={{ __html: html }}/>;
}
