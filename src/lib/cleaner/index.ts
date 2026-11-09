import { protect } from './protect';
import { normalizeMath } from './math';
import { normalizeUnicode } from './unicode';
import { adjustHeadings } from './headings';
import { normalizeMarkdown } from './markdown';
import { cleanHtml } from './html';
import { cleanReferences } from './references';
import { defaultOptions, type CleanOptions, type CleanResult, type CleanChange, type CleanStatistics, type Report } from './types';
export * from './types';
export function cleanMarkdown(input: string, options: CleanOptions = defaultOptions): CleanResult {
    const changes: CleanChange[] = [];
    const statistics: CleanStatistics = { math: 0, unicode: 0, markdown: 0, artifacts: 0, html: 0, warnings: 0 };
    const report: Report = (category, message, count = 1, warning = false) => { const existing = changes.find(c => c.category === category && c.message === message && !!c.warning === warning); if (existing)
        existing.count += count;
    else
        changes.push({ category, message, count, warning }); if (warning)
        statistics.warnings += count;
    else
        statistics[category] += count; };
    if (input.length > 2000000) {
        report('markdown', '文本超过 200 万字符，请拆分后清洗；当前保留原文', 1, true);
        return { content: input, changes, statistics };
    }
    const p = protect(input, report);
    let s = p.text;
    if (options.normalizeMath)
        s = normalizeMath(s, report);
    const mathProtection = protect(s, report, true);
    s = mathProtection.text;
    if (options.normalizeUnicode)
        s = normalizeUnicode(s, report);
    if (options.removeChinesePeriod)
        s = s.replace(/。/g, () => { report('unicode', '移除中文句号“。”'); return ''; });
    if (options.trimTrailingSpaces)
        s = s.replace(/[\t ]+(?=\r?$)/gm, () => { report('markdown', '移除行尾空格（会取消 Markdown 硬换行）'); return ''; });
    if (options.cleanBlankLineSpaces)
        s = s.replace(/(\r?\n)[\t ]+(?=\r?\n)/g, '$1');
    if (options.collapseBlankLines)
        s = s.replace(/(\r?\n)(?:[\t ]*\r?\n){2,}/g, match => { report('markdown', '压缩连续空行为一个空行'); const eol = match.startsWith('\r\n') ? '\r\n' : '\n'; return eol + eol; });
    if (options.cleanHtml)
        s = cleanHtml(s, report);
    if (options.removeAiArtifacts)
        s = cleanReferences(s, report);
    if (options.normalizeMarkdown)
        s = normalizeMarkdown(s, report, options.mode === 'deep');
    s = adjustHeadings(s, options.highestHeadingLevel ?? 0, report, options.numberHeadings ?? true);
    return { content: p.restore(mathProtection.restore(s)), changes, statistics };
}
