import type { Report } from './types';
const escaped = (s: string, i: number) => { let n = 0; while (i > 0 && s[--i] === '\\')
    n++; return n % 2 === 1; };
function validBody(s: string): boolean {
    const stack: string[] = [];
    let braces = 0;
    for (let i = 0; i < s.length; i++) {
        if (escaped(s, i))
            continue;
        if (s[i] === '{')
            braces++;
        if (s[i] === '}' && --braces < 0)
            return false;
        if (s[i] === '\\') {
            const token = s.slice(i).match(/^\\(begin|end)\{([^}]+)\}/);
            if (token) {
                if (token[1] === 'begin')
                    stack.push(token[2]);
                else if (stack.pop() !== token[2])
                    return false;
                i += token[0].length - 1;
            }
        }
    }
    return braces === 0 && stack.length === 0;
}
export function normalizeMath(text: string, report: Report): string {
    let out = '', i = 0;
    while (i < text.length) {
        // Existing dollar math is copied atomically, including LaTeX environments.
        if (text[i] === '$' && !escaped(text, i)) {
            const delimiter = text[i + 1] === '$' ? '$$' : '$';
            let end = i + delimiter.length;
            while (end < text.length && !(text.startsWith(delimiter, end) && !escaped(text, end)))
                end++;
            if (end < text.length) {
                out += text.slice(i, end + delimiter.length);
                i = end + delimiter.length;
                continue;
            }
        }
        const doubledDelimiter = text[i] === '\\' && text[i + 1] === '\\' && (text[i + 2] === '(' || text[i + 2] === '[');
        const singleDelimiter = text[i] === '\\' && !escaped(text, i) && (text[i + 1] === '(' || text[i + 1] === '[');
        if (doubledDelimiter || singleDelimiter) {
            const width = doubledDelimiter ? 3 : 2;
            const block = text[i + width - 1] === '[', close = (doubledDelimiter ? '\\\\' : '\\') + (block ? ']' : ')');
            let end = i + width, depth = 0;
            while (end < text.length) {
                if (text.startsWith(close, end) && depth === 0 && (doubledDelimiter || !escaped(text, end)))
                    break;
                if (!escaped(text, end)) {
                    if (text[end] === '{')
                        depth++;
                    if (text[end] === '}')
                        depth--;
                }
                end++;
            }
            if (end === text.length) {
                report('math', '数学定界符未闭合，已保留原文', 1, true);
                out += text.slice(i);
                break;
            }
            const body = text.slice(i + width, end);
            const prefix = text.slice(text.lastIndexOf('\n', i - 1) + 1, i);
            const listIndent = /^ {1,4}$/.test(prefix) ? prefix : '';
            if (block && (/^\s*(?:>|[-+*]\s|\d+[.)]\s)/.test(prefix) || prefix.includes('|') || (/^\s{2,}/.test(prefix) && !listIndent))) {
                report('math', '容器或表格内的块公式需要人工确认，已保留原文', 1, true);
                out += text.slice(i, end + close.length);
                i = end + close.length;
                continue;
            }

            if (!validBody(body) || !body.trim() || (!block && (body.includes('\n') || body.includes('$'))) || (block && body.includes('$$'))) {
                report('math', '公式存在错配环境、括号或歧义定界符，已保留原文', 1, true);
                out += text.slice(i, end + close.length);
            }
            else {
                if (block && listIndent)
                    out = out.slice(0, -listIndent.length);
                const formula = body.trim().split('\n').map(line => listIndent + (listIndent ? line.trimStart() : line)).join('\n');
                out += block ? '\n' + listIndent + '$$\n' + formula + '\n' + listIndent + '$$\n' : '$' + body.trim() + '$';
                report('math', block ? '转换块级数学定界符' : '转换行内数学定界符');
            }
            i = end + close.length;
            continue;
        }
        const env = text.slice(i).match(/^\\begin\{(equation\*?|align\*?|aligned|cases|gather\*?)\}/);
        if (env && !escaped(text, i)) {
            const stack: string[] = [];
            const token = /\\(begin|end)\{([^}]+)\}/g;
            token.lastIndex = i;
            let end = -1, valid = true, m;
            while ((m = token.exec(text))) {
                if (m[1] === 'begin')
                    stack.push(m[2]);
                else if (stack.pop() !== m[2]) {
                    valid = false;
                    break;
                }
                if (!stack.length) {
                    end = token.lastIndex;
                    break;
                }
            }
            if (valid && end !== -1 && /^\s*$/.test(text.slice(text.lastIndexOf('\n', i - 1) + 1, i)) && /^\s*$/.test(text.slice(end, text.indexOf('\n', end) === -1 ? text.length : text.indexOf('\n', end)))) {
                let body = text.slice(i + env[0].length, end - ('\\end{' + env[1] + '}').length);
                if (env[1].startsWith('align'))
                    body = '\\begin{aligned}' + body + '\\end{aligned}';
                else if (env[1] === 'cases')
                    body = '\\begin{cases}' + body + '\\end{cases}';
                else if (env[1].startsWith('gather'))
                    body = '\\begin{gathered}' + body + '\\end{gathered}';
                if (/\\(?:label|tag|ref)\b/.test(body)) {
                    out += text.slice(i, end);
                    report('math', '公式包含编号或引用，保留环境供人工确认', 1, true);
                }
                else {
                    out += '$$\n' + body.trim() + '\n$$';
                    report('math', '独立数学环境转换为标准数学块');
                }
                i = end;
                continue;
            }
            report('math', '无法可靠转换数学环境，已保留原文', 1, true);
        }
        out += text[i++];
    }
    return out;
}
