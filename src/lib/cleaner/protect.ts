import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';
import { unified } from 'unified';
import parse from 'remark-parse';
import gfm from 'remark-gfm';
import math from 'remark-math';
import type { Report } from './types';
interface Node {
    type: string;
    children?: Node[];
    position?: {
        start: {
            offset?: number;
        };
        end: {
            offset?: number;
        };
    };
}
export function protect(input: string, report: Report, includeMath = false) {
    const spans: [
        number,
        number
    ][] = [];
    const tree = unified().use(parse).use(gfm).use(math).parse(input) as Node;
    function walk(n: Node) {
        if ((n.type === 'code' || n.type === 'inlineCode' || (includeMath && (n.type === 'math' || n.type === 'inlineMath'))) && n.position) {
            const a = n.position.start.offset!, b = n.position.end.offset!;
            spans.push([a, b]);
            if (n.type === 'code') {
                const text = input.slice(a, b), lines = text.split('\n');
                const fence = lines[0].match(/^\s*(`{3,}|~{3,})/);
                if (fence && (lines.length === 1 || !new RegExp('^\\s*' + fence[1][0] + '{' + fence[1].length + ',}\\s*$').test(lines.at(-1)!)))
                    report('markdown', '代码围栏未闭合：保留原文，请确认代码结束位置', 1, true);
            }
            return;
        }
        n.children?.forEach(walk);
    }
    walk(tree);
    // Raw HTML code containers are also opaque, even outside Markdown fences.
    const html = parseFragment(input, { sourceCodeLocationInfo: true });
    function protectHtmlCode(node: DefaultTreeAdapterMap['node']) {
        if ('tagName' in node && (node.tagName === 'pre' || node.tagName === 'code')) {
            const position = node.sourceCodeLocation;
            if (position && !spans.some(([a, b]) => position.startOffset >= a && position.startOffset < b)) spans.push([position.startOffset, position.endOffset]);
            return;
        }
        if ('childNodes' in node) node.childNodes.forEach(protectHtmlCode);
    }
    protectHtmlCode(html);
    // Preserve common note-app extensions that standard serializers may rewrite.
    for (const m of input.matchAll(/!?\[\[[^\n]*?\]\]|==[^\n]+?==/g))
        spans.push([m.index!, m.index! + m[0].length]);
    spans.sort((a, b) => a[0] - b[0]);
    const merged: [
        number,
        number
    ][] = [];
    for (const s of spans) {
        const last = merged.at(-1);
        if (last && s[0] <= last[1])
            last[1] = Math.max(last[1], s[1]);
        else
            merged.push([...s]);
    }
    let prefix = 'CLEANERPROTECTED';
    while (input.includes(prefix))
        prefix += 'X';
    const values: string[] = [];
    let cursor = 0, text = '';
    for (const [a, b] of merged) {
        text += input.slice(cursor, a) + prefix + values.length + 'TOKEN';
        values.push(input.slice(a, b));
        cursor = b;
    }
    text += input.slice(cursor);
    return { text, restore: (s: string) => s.replace(new RegExp(prefix + '(\\d+)TOKEN', 'g'), (_, n: string) => values[Number(n)]) };
}
