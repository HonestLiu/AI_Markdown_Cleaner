import { useEffect, useMemo, useRef } from 'react';
import { renderPreview } from '../lib/preview';
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
        const codeBlocks = [...container.querySelectorAll<HTMLElement>('pre code[class*="language-"]')];
        if (!codeBlocks.length) return;
        void import('../../node_modules/highlight.js/es/common.js').then(({ default: hljs }) => {
            if (cancelled) return;
            for (const code of codeBlocks) {
                const language = code.className.match(/(?:^|\s)language-([\w+-]+)/)?.[1];
                if (language && hljs.getLanguage(language)) hljs.highlightElement(code);
            }
        }).catch(() => undefined);
        return () => { cancelled = true; };
    }, [content, html, locale]);
    if (content.length > MAX_PREVIEW_CHARS)
        return <div className="preview-note">{t.previewTooLong}</div>;
    return <article className="prose" ref={root} dangerouslySetInnerHTML={{ __html: html }}/>;
}
