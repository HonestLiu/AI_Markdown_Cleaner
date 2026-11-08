import { unified } from 'unified';
import parse from 'remark-parse';
import gfm from 'remark-gfm';
import stringify from 'remark-stringify';
import type { Report } from './types';
export function normalizeMarkdown(s: string, report: Report, deep: boolean) {
    // Parse to validate without serializing opaque math, callouts, tables or links.
    unified().use(parse).use(gfm).use(stringify).parse(s);
    let out = s.replace(/^(#{1,6})[\t ]+(.+?)[\t ]+#+[\t ]*$/gm, '$1 $2');
    if (deep)
        out = out.replace(/\n{4,}/g, '\n\n\n');
    if (out !== s)
        report('markdown', '规范化标题闭合标记或多余空行');
    return out;
}
