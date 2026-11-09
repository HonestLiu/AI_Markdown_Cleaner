// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { cleanMarkdown, defaultOptions } from '../lib/cleaner';
import { renderPreview } from '../lib/preview';
import { scenario } from './scenario';
const clean = (s: string) => cleanMarkdown(s, { ...defaultOptions, numberHeadings: false }).content;
const deep = (s: string) => cleanMarkdown(s, { ...defaultOptions, mode: 'deep', cleanHtml: true });
describe('数学与代码保护', () => {
    it('转换行内 LaTeX', () => expect(clean(String.raw `中文 \(x^2+1\) 公式`)).toBe('中文 $x^2+1$ 公式'));
    it('转换块级 LaTeX', () => expect(clean(String.raw `\[\frac{a}{b}\]`)).toContain('$$\n\\frac{a}{b}\n$$'));
    it('转换 AI 双反斜杠公式定界符', () => { expect(clean(String.raw `收到 \\(n\\) 字节`)).toBe('收到 $n$ 字节'); expect(clean(String.raw `\\[ \boxed{seq=2019} \\]`)).toContain('\\boxed{seq=2019}'); });
    it('保留多行公式环境与命令', () => {
        const s = String.raw `\[
\begin{aligned}
a &= \boxed{\frac{1}{2}} \\
b &= \sum_i i + \int_0^1 x dx
\end{aligned}
\]`;
        expect(clean(s)).toContain(String.raw `\begin{aligned}`);
        expect(clean(s)).toContain(String.raw `\boxed{\frac{1}{2}}`);
        expect(clean(s)).not.toContain(String.raw `\[`);
    });
    it('保护围栏代码', () => { const s = '~~~python\nprint("\\(hello\\)")\n~~~'; expect(clean(s)).toBe(s); });
    it('保护行内代码及 Unicode', () => { const s = '`\\(x\\)\u200b\u00a0`'; expect(clean(s)).toBe(s); });
    it('保护 HTML 代码容器', () => {
        const s = '<pre><code>\\(x\\) a\u200bb</code></pre>';
        expect(deep(s).content).toBe(s);
    });
    it('保护缩进代码', () => { const s = '    print("\\(hello\\)")\n    x = "\u200b"'; expect(clean(s)).toBe(s); });
    it('保留正确的 Markdown 与 dollar 公式', () => { const s = '# 标题\n\n公式 $x^2$\n\n$$\n\\frac{1}{2}\n$$\n\n![图](../assets/a.png)'; expect(clean(s)).toBe(s); });
    it('处理转义定界符', () => { expect(clean(String.raw `\\(literal\\)`)).toBe(String.raw `\\(literal\\)`); });
    it('独立 equation 与 align', () => { expect(clean(String.raw `\begin{equation}x=1\end{equation}`)).toBe('$$\nx=1\n$$'); expect(clean(String.raw `\begin{align}x&=1\\y&=2\end{align}`)).toContain('\\begin{aligned}'); });
    it('保留不匹配环境并警告', () => { const r = cleanMarkdown(String.raw `\begin{align}x\end{cases}`, defaultOptions); expect(r.content).toContain('\\begin{align}'); expect(r.statistics.warnings).toBeGreaterThan(0); });
    it('定界符不匹配嵌套环境时保留', () => { const s = String.raw `\[\begin{aligned}x\end{cases}\]`; expect(clean(s)).toBe(s); expect(cleanMarkdown(s).statistics.warnings).toBeGreaterThan(0); });
    it('不提前结束花括号内的定界符', () => { const s = String.raw `\(x+\text{literal \) symbol}\)`; expect(clean(s)).toBe(String.raw `$x+\text{literal \) symbol}$`); });
    it('未闭合数学原样保留并警告', () => { const s = String.raw `\(x`; expect(clean(s)).toBe(s); expect(cleanMarkdown(s, defaultOptions).statistics.warnings).toBe(1); });
});
describe('文本、结构与平台引用', () => {
    it('清理不可见字符', () => expect(clean('a\u200bb\u00a0c\u202fd\ufeff\u2028e')).toBe('ab c d\ne'));
    it('保留中日韩', () => { const s = '中文 日本語 한국어 ∑∞≤'; expect(clean(s)).toBe(s); });
    it('保留 Emoji 组合', () => { const s = '👩‍💻 👨‍👩‍👧‍👦 🏳️‍🌈 👍🏽'; expect(clean(s)).toBe(s); });
    it('双向控制保守警告', () => { const s = 'a\u202eb'; expect(clean(s)).toBe(s); expect(cleanMarkdown(s).statistics.warnings).toBe(1); });
    it('保留 GFM 表格及转义竖线', () => { const s = '| 公式 | 路径 |\n| --- | --- |\n| $a \\mid b$ | a\\|b |'; expect(clean(s)).toBe(s); });
    it('保留 Mermaid', () => { const s = '```mermaid\ngraph LR\nA-->B\n```'; expect(clean(s)).toBe(s); });
    it('保留 Callout', () => { const s = '> [!note]\n> 提示内容'; expect(clean(s)).toBe(s); });
    it('保留扩展链接、嵌入与高亮', () => { const s = '[[笔记名称|别名]] ![[image.png|300]] ==重点内容=='; expect(clean(s)).toBe(s); });
    it('移除平台内部引用且不伪造链接', () => { const r = cleanMarkdown('资料 citeturn0search1'); expect(r.content).toBe('资料 '); expect(r.statistics.artifacts).toBe(1); });
    it('未知平台内容保留并提示', () => { const s = '<antArtifact title="信息">正文</antArtifact>'; expect(clean(s)).toBe(s); expect(cleanMarkdown(s).statistics.warnings).toBeGreaterThan(0); });
    it('简单 HTML 转换', () => { expect(deep('<strong>加粗</strong> <em>斜体</em> <a href="https://example.com">链接</a>').content).toBe('**加粗** *斜体* [链接](https://example.com)'); expect(deep('<ul><li>A</li><li>B</li></ul>').content).toContain('- A\n- B'); });
    it('复杂嵌套列表保持层级与编号', () => { const s = '3. 外层\n   - 内层\n     1. 第一级\n     2. 第二级\n4. 后续\n\n- [x] 完成\n- [ ] 待办'; expect(clean(s)).toBe(s); });
    it('未闭合代码围栏保留并提示', () => { const s = '```python\nprint("\\(x\\)")'; expect(deep(s).content).toBe(s); expect(deep(s).statistics.warnings).toBeGreaterThan(0); });
    it('修复标题闭合标记', () => expect(clean('## 标题 ##')).toBe('## 标题'));
    it('选项可关闭', () => { const s = String.raw `\(x\) a​b`; expect(cleanMarkdown(s, { ...defaultOptions, normalizeMath: false, normalizeUnicode: false }).content).toBe(s); });
});
describe('幂等性、性能与安全', () => {
    it('真实场景混合文档幂等', () => { for (const options of [defaultOptions, { ...defaultOptions, mode: 'deep' as const, cleanHtml: true }]) {
        const r = cleanMarkdown(scenario, options);
        expect(cleanMarkdown(r.content, options).content).toBe(r.content);
        expect(r.statistics.math).toBeGreaterThan(0);
    } });
    it('HTML 嵌套转换幂等', () => { const r = deep('<p><strong>重要</strong></p>'); expect(deep(r.content).content).toBe(r.content); });
    it('大型文档', () => { const s = scenario.repeat(100); const start = performance.now(); const r = clean(s); expect(r).toContain('int binary_search'); expect(clean(r)).toBe(r); expect(performance.now() - start).toBeLessThan(12000); }, 20000);
    it('超限文档保留并提示', () => { const s = 'a'.repeat(2000001); const r = cleanMarkdown(s); expect(r.content).toBe(s); expect(r.statistics.warnings).toBe(1); });
    it('恶意 HTML 不进入预览 DOM', () => { const html = renderPreview('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert%281%29)'); const root = document.createElement('div'); root.innerHTML = html; expect(root.querySelector('script,[onerror],[onclick]')).toBeNull(); expect(root.querySelector('a')?.getAttribute('href') ?? '').not.toContain('javascript:'); });
    it('深度模式去掉脚本并记录', () => { const r = deep('<script>alert(1)</script>正文'); expect(r.content).toBe('正文'); expect(r.statistics.html).toBeGreaterThan(0); });
    it('预览支持 GFM 与 KaTeX', () => { const html = renderPreview('| A | B |\n| - | - |\n| 1 | 2 |\n\n$x^2$'); expect(html).toContain('<table>'); expect(html).toContain('katex'); });
});


describe('最高标题调整', () => {
    const adjust = (s: string, level: 0 | 1 | 2 | 3 | 4 | 5 | 6) => cleanMarkdown(s, { ...defaultOptions, highestHeadingLevel: level, numberHeadings: false });
    it('按全文最高标题整体升降，保留跳级及顺序', () => {
        expect(adjust('#### 子节\n\n## 主标题\n\n### 节', 1).content).toBe('### 子节\n\n# 主标题\n\n## 节');
        expect(adjust('# 主标题\n\n## 子节', 3).content).toBe('### 主标题\n\n#### 子节');
    });
    it('默认关闭且无标题不修改', () => {
        expect(adjust('## 标题', 0).content).toBe('## 标题');
        expect(adjust('正文', 2).content).toBe('正文');
    });
    it('超出 H6 降级为加粗表情序号并警告', () => {
        const input = '# 主标题\n\n###### 最低标题';
        const result = adjust(input, 2);
        expect(result.content).toBe('## 主标题\n\n**1️⃣ 最低标题**');
        expect(result.statistics.warnings).toBe(1);
    });
    it('保护代码、数学及 HTML 代码中的伪标题', () => {
        const input = '## 真标题\n\n```md\n# 代码\n```\n\n<pre># 原样</pre>\n\n$$\n# 数学\n$$';
        expect(adjust(input, 3).content).toBe(input.replace('## 真标题', '### 真标题'));
    });
    it('支持 Setext、引用、列表标题及行内代码', () => {
        expect(adjust('主标题\n===\n\n> ## 引用 `代码`\n\n- ### 列表', 2).content).toBe('## 主标题\n\n> ### 引用 `代码`\n\n- #### 列表');
    });
    it('保留行内格式并且重复清洗幂等', () => {
        const result = adjust('## **重点** [链接](https://example.com)\n\n#### 子标题', 3);
        expect(result.content).toBe('### **重点** [链接](https://example.com)\n\n##### 子标题');
        expect(adjust(result.content, 3).content).toBe(result.content);
        expect(result.statistics.markdown).toBe(2);
    });
    it('独立于 Markdown 规范化开关', () => {
        expect(cleanMarkdown('## 标题', { ...defaultOptions, normalizeMarkdown: false, numberHeadings: false, highestHeadingLevel: 1 }).content).toBe('# 标题');
    });
});


describe('统一标题序号和超深标题', () => {
    it('六级序号使用不同样式，括号统一半角', () => {
        const input = '# 第一层\n\n## 第二层\n\n### 第三层\n\n#### 第四层\n\n##### 第五层\n\n###### 第六层';
        const result = cleanMarkdown(input).content;
        expect(result).toBe('# 一、 第一层\n\n## (一) 第二层\n\n### 1. 第三层\n\n#### (1) 第四层\n\n##### ① 第五层\n\n###### ❶ 第六层');
        expect(cleanMarkdown(result).content).toBe(result);
    });
    it('移除不同原序号，遇到父标题重置子序号', () => {
        expect(cleanMarkdown('# 三、 主章\n\n## （二） 子章\n\n## 2. 子章\n\n# 4. 另一章\n\n## 1️⃣ 子章').content).toBe('# 一、 主章\n\n## (一) 子章\n\n## (二) 子章\n\n# 二、 另一章\n\n## (一) 子章');
    });
    it('保护数字正文、代码、链接及公式', () => {
        const input = '## 2026 年总结 `1. code` [文档](https://example.com/a__b) $x$\n\n```md\n# 一、 原样\n```';
        expect(cleanMarkdown(input).content).toBe(input.replace('## 2026', '## (一) 2026'));
    });
    it('调整最高标题后再按最终层级编号', () => {
        expect(cleanMarkdown('## 一、 主标题\n\n### ① 小节', { ...defaultOptions, highestHeadingLevel: 1 }).content).toBe('# 一、 主标题\n\n## (一) 小节');
    });
    it('H7 以下直接降级，支持连续超深标题与两位表情序号', () => {
        const input = Array.from({ length: 11 }, (_, i) => '####### ' + (i + 1) + '. 小节').join('\n\n');
        const result = cleanMarkdown(input);
        expect(result.content).toContain('**1️⃣ 小节**');
        expect(result.content).toContain('**1️⃣1️⃣ 小节**');
        expect(result.statistics.warnings).toBe(11);
        expect(cleanMarkdown(result.content).content).toBe(result.content);
    });
    it('超深加粗保留链接地址和代码内容', () => {
        expect(cleanMarkdown('####### **重点** [链接](https://example.com/a__b) `__code__`').content).toBe('**1️⃣ 重点 [链接](https://example.com/a__b) `__code__`**');
    });
    it('编号可关闭，超过 H6 仍提示降级', () => {
        expect(cleanMarkdown('## 二、 原序号', { ...defaultOptions, numberHeadings: false }).content).toBe('## 二、 原序号');
        expect(cleanMarkdown('####### 二、 原序号', { ...defaultOptions, numberHeadings: false }).content).toBe('**1️⃣ 原序号**');
    });
});


describe('中文句号选项', () => {
    it('仅在选项开启时删除中文句号，保留其他标点', () => {
        const input = '你好。你好！你好？句中。也删除。';
        expect(cleanMarkdown(input).content).toBe(input);
        expect(cleanMarkdown(input, { ...defaultOptions, removeChinesePeriod: true }).content).toBe('你好你好！你好？句中也删除');
    });
    it('记录每个被移除的句号', () => {
        const result = cleanMarkdown('甲。乙。。', { ...defaultOptions, removeChinesePeriod: true });
        expect(result.content).toBe('甲乙');
        expect(result.changes.find(change => change.message.includes('中文句号'))?.count).toBe(3);
    });
});
