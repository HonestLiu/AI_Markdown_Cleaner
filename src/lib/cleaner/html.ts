import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';
import type { Report } from './types';
type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];
const escapeText = (s: string) => s.replace(/([\\`*_[\]<>])/g, '\\$1');
export function cleanHtml(s: string, report: Report) {
    const tree = parseFragment(s, { sourceCodeLocationInfo: true });
    const raw = (node: Node) => { const p = node.sourceCodeLocation; return p ? s.slice(p.startOffset, p.endOffset) : ''; };
    const render = (node: Node): string | null => {
        if (node.nodeName === '#text')
            return escapeText((node as DefaultTreeAdapterMap['textNode']).value);
        if (!('tagName' in node))
            return null;
        const el = node as Element, tag = el.tagName;
        if (['script', 'style', 'iframe', 'object'].includes(tag)) {
            report('html', '移除可执行 HTML 区域');
            return '';
        }
        const children: string[] = [];
        for (const child of el.childNodes) {
            const value = render(child);
            if (value === null)
                return null;
            children.push(value);
        }
        const body = children.join('');
        if (['strong', 'b'].includes(tag))
            return '**' + body + '**';
        if (['em', 'i'].includes(tag))
            return '*' + body + '*';
        if (tag === 'br')
            return '  \n';
        if (tag === 'p')
            return '\n\n' + body + '\n\n';
        if (tag === 'a') {
            const href = el.attrs.find(a => a.name === 'href')?.value;
            if (!href || /^(?:javascript|data|vbscript):/i.test(href.replace(/[\u0000-\u0020]/g, '')) || /[\s<>]/.test(href))
                return null;
            return '[' + body + '](' + href.replace(/\(/g, '%28').replace(/\)/g, '%29') + ')';
        }
        if (tag === 'li')
            return body;
        if (tag === 'ul' || tag === 'ol') {
            if (el.childNodes.some(n => n.nodeName !== 'li' && !(n.nodeName === '#text' && !(n as DefaultTreeAdapterMap['textNode']).value.trim())))
                return null;
            const start = Number(el.attrs.find(a => a.name === 'start')?.value ?? 1);
            if (!Number.isSafeInteger(start) || start < 0)
                return null;
            let index = start;
            return '\n\n' + el.childNodes.filter(n => n.nodeName === 'li').map(n => {
                const value = render(n);
                return (tag === 'ol' ? index++ + '. ' : '- ') + value?.split('\n').join('\n    ');
            }).join('\n') + '\n\n';
        }
        return null;
    };
    let out = '', cursor = 0;
    for (const node of tree.childNodes) {
        const loc = node.sourceCodeLocation;
        if (!loc)
            continue;
        out += s.slice(cursor, loc.startOffset);
        if ('tagName' in node) {
            const converted = render(node);
            if (converted === null) {
                out += raw(node);
                report('html', '复杂或未知 HTML 已保留；预览不执行原始 HTML', 1, true);
            }
            else {
                out += converted;
                report('html', 'HTML 转换为 Markdown');
            }
        }
        else
            out += raw(node);
        cursor = loc.endOffset;
    }
    return out + s.slice(cursor);
}
