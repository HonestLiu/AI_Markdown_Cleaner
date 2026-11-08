import { unified } from 'unified';
import parse from 'remark-parse';
import gfm from 'remark-gfm';
import math from 'remark-math';
import rehype from 'remark-rehype';
import katex from 'rehype-katex';
import stringify from 'rehype-stringify';
import DOMPurify from 'dompurify';
export function renderPreview(content: string): string {
    const html = String(unified().use(parse).use(gfm).use(math).use(rehype).use(katex, { strict: false, trust: false, output: 'html' }).use(stringify).processSync(content));
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['script', 'iframe', 'object', 'style', 'img'], FORBID_ATTR: ['onerror', 'onclick'] });
}
