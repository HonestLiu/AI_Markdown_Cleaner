import { unified } from 'unified';
import parse from 'remark-parse';
import gfm from 'remark-gfm';
import math from 'remark-math';
import rehype from 'remark-rehype';
import katex from 'rehype-katex';
import stringify from 'rehype-stringify';
import DOMPurify from 'dompurify';
function remarkPreviewEnhancements() {
    return (tree: any) => {
        const walk = (node: any) => {
            if (!Array.isArray(node.children)) return;
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                walk(child);
                if (child.type !== 'text' || !/==[^=\n]+?==/.test(child.value)) continue;
                const parts: any[] = [];
                let last = 0;
                const pattern = /(^|[^\\])==([^=\n]+?)==/g;
                for (const match of child.value.matchAll(pattern)) {
                    const start = match.index! + match[1].length;
                    if (start > last) parts.push({ type: 'text', value: child.value.slice(last, start) });
                    parts.push({ type: 'highlight', data: { hName: 'mark', hProperties: { className: ['markdown-highlight'] } }, children: [{ type: 'text', value: match[2] }] });
                    last = start + match[0].length - match[1].length;
                }
                if (!parts.length) continue;
                if (last < child.value.length) parts.push({ type: 'text', value: child.value.slice(last) });
                node.children.splice(i, 1, ...parts);
                i += parts.length - 1;
            }
            if (node.type !== 'blockquote' || node.children[0]?.type !== 'paragraph') return;
            const paragraph = node.children[0];
            const firstText = paragraph.children?.find((child: any) => child.type === 'text');
            const match = firstText?.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
            if (!match) return;
            const kind = match[1].toLowerCase();
            firstText.value = firstText.value.slice(match[0].length);
            if (!firstText.value && paragraph.children.length === 1) node.children.shift();
            node.type = 'container';
            node.data = { hName: 'div', hProperties: { className: ['markdown-alert', `markdown-alert-${kind}`] } };
            node.children.unshift({ type: 'paragraph', data: { hProperties: { className: ['markdown-alert-title'] } }, children: [{ type: 'text', value: match[1][0] + match[1].slice(1).toLowerCase() }] });
        };
        walk(tree);
    };
}
export function renderPreview(content: string): string {
    const html = String(unified().use(parse).use(gfm).use(math).use(remarkPreviewEnhancements).use(rehype).use(katex, { strict: false, trust: false, output: 'html' }).use(stringify).processSync(content));
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['script', 'iframe', 'object', 'style', 'img'], FORBID_ATTR: ['onerror', 'onclick'] });
}
export function sanitizeMermaidSvg(svg: string): string {
    return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ['foreignObject', 'script'], FORBID_ATTR: ['onclick', 'onerror'] });
}
