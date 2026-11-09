import { unified } from 'unified';
import parse from 'remark-parse';
import gfm from 'remark-gfm';
import type { RootContent } from 'mdast';
import type { Report } from './types';

type Title = { start: number; end: number; depth: number; content: string };
const emojiNumber = (n: number) => String(n).split('').map(d => `${d}\uFE0F\u20E3`).join('');
function chinese(n: number): string {
    const digits = '零一二三四五六七八九';
    if (n < 10) return digits[n];
    if (n < 100) return (n < 20 ? '' : digits[Math.floor(n / 10)]) + '十' + (n % 10 ? digits[n % 10] : '');
    if (n < 10000) {
        const unit = n < 1000 ? 100 : 1000;
        const rest = n % unit;
        return digits[Math.floor(n / unit)] + (unit === 100 ? '百' : '千') + (rest ? (rest < unit / 10 ? '零' : '') + chinese(rest) : '');
    }
    return String(n);
}
function numberStyle(level: number, n: number): string {
    switch (level) {
        case 1: return chinese(n) + '、';
        case 2: return `(${chinese(n)})`;
        case 3: return `${n}.`;
        case 4: return `(${n})`;
        case 5: return n <= 20 ? String.fromCodePoint(0x2460 + n - 1) : `(${n})`;
        case 6: return n <= 10 ? String.fromCodePoint(0x2776 + n - 1) : `(${n})`;
        default: return emojiNumber(n);
    }
}
// Only strip recognizable numbering with separators, never bare numbers (e.g. “2026 年”).
function withoutNumber(text: string): string {
    const prefix = /^(?:(?:[0-9]\uFE0F?\u20E3)+|[①-⑳❶-❿]|[（(](?:\d+|[零〇一二三四五六七八九十百千]+)[）)]|(?:\d+(?:\.\d+)+)[.、．]?|\d+[.、．)]|[零〇一二三四五六七八九十百千]+[、．.])\s*/u;
    return text.replace(prefix, '').trim();
}
function flattenStrong(body: string): string {
    const spans: number[] = [];
    const walk = (node: RootContent) => {
        if (node.type === 'strong') {
            spans.push(node.position!.start.offset!, node.position!.end.offset! - 2);
        }
        if ('children' in node) node.children.forEach(child => walk(child as RootContent));
    };
    unified().use(parse).use(gfm).parse(body).children.forEach(walk);
    let result = body;
    for (const offset of spans.sort((a, b) => b - a)) result = result.slice(0, offset) + result.slice(offset + 2);
    return result;
}
export function adjustHeadings(input: string, target: number, report: Report, numbered = false): string {
    const titles: Title[] = [];
    const walk = (node: RootContent) => {
        if (node.type === 'heading') {
            const start = node.position!.start.offset!, end = node.position!.end.offset!;
            const raw = input.slice(start, end);
            let content: string;
            if (/^#{1,6}(?:[\t ]|$)/.test(raw)) {
                content = raw.replace(/^#{1,6}[\t ]*/, '').replace(/[\t ]+#+[\t ]*$/, '');
            } else {
                const lines = raw.split(/\r?\n/);
                lines.pop();
                content = lines.map((line, i) => i ? line.replace(/^[\t ]*(?:>[\t ]*)*/, '') : line).join(' ');
            }
            titles.push({ start, end, depth: node.depth, content });
        } else if (node.type === 'paragraph') {
            // Markdown itself only recognizes H1–H6; accept deeper ATX lines for graceful downgrade.
            const start = node.position!.start.offset!;
            const raw = input.slice(start, node.position!.end.offset!);
            for (const match of raw.matchAll(/^(?:[\t ]*>[\t ]*)*[\t ]*(#{7,})[\t ]+([^\r\n]*)/gm)) {
                const marker = match[0].indexOf('#');
                titles.push({ start: start + match.index! + marker, end: start + match.index! + match[0].length,
                    depth: match[1].length, content: match[2].replace(/[\t ]+#+[\t ]*$/, '') });
            }
        } else if ('children' in node) node.children.forEach(child => walk(child as RootContent));
    };
    unified().use(parse).use(gfm).parse(input).children.forEach(walk);
    if (!titles.length) return input;
    titles.sort((a, b) => a.start - b.start);
    const highest = titles.reduce((min, h) => Math.min(min, h.depth), Infinity);
    const shift = Number.isInteger(target) && target >= 1 && target <= 6 ? target - highest : 0;
    const counts = new Map<number, number>();
    const edits: { start: number; end: number; text: string }[] = [];
    let downgraded = 0;
    for (const title of titles) {
        const level = title.depth + shift;
        for (const depth of counts.keys()) if (depth > level) counts.delete(depth);
        const count = (counts.get(level) ?? 0) + 1;
        counts.set(level, count);
        const body = numbered || level > 6 ? withoutNumber(title.content) : title.content;
        let text: string;
        if (level > 6) {
            // Nested strong markers would break the enclosing bold; retain the inner text instead.
            const boldBody = flattenStrong(body);
            text = `**${emojiNumber(count)} ${boldBody}**`;
            downgraded++;
        } else {
            text = '#'.repeat(level) + ' ' + (numbered ? numberStyle(level, count) + ' ' : '') + body;
        }
        if (text !== input.slice(title.start, title.end)) edits.push({ start: title.start, end: title.end, text });
    }
    let output = input;
    for (const edit of edits.reverse()) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
    if (edits.length) report('markdown', numbered ? '统一标题序号与层级' : '同步调整标题层级', edits.length);
    if (downgraded) report('markdown', '超出 H6 的标题已降级为加粗文字和表情序号，不再属于标题大纲', downgraded, true);
    return output;
}
