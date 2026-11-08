import { cleanMarkdown, type CleanOptions } from './cleaner';
self.onmessage = (e: MessageEvent<{
    id: number;
    input: string;
    options: CleanOptions;
}>) => {
    try {
        self.postMessage({ id: e.data.id, result: cleanMarkdown(e.data.input, e.data.options) });
    }
    catch {
        self.postMessage({ id: e.data.id, error: '清洗失败，原文已保留。请减少文本长度或检查异常语法。' });
    }
};
