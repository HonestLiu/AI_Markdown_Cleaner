import type { Report } from './types';
export function normalizeUnicode(s: string, report: Report) {
    return s.replace(/[\u200B\uFEFF\u00A0\u202F\u2000-\u200A\u205F\u3000\u2028\u2029\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, c => {
        if (/[\u202A-\u202E\u2066-\u2069]/.test(c)) {
            report('unicode', '发现双向文本控制字符，可能承载语言方向信息，已保留', 1, true);
            return c;
        }
        report('unicode', '规范化异常空白或不可见控制字符');
        return /[\u2028\u2029]/.test(c) ? '\n' : /[\u00A0\u202F\u2000-\u200A\u205F\u3000]/.test(c) ? ' ' : '';
    });
}
