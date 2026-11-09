import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, Clipboard, Code2, FileText, GitFork, LockKeyhole, Monitor, Moon, Settings2, ShieldCheck, Sparkles, Sun, Trash2, X, WrapText } from 'lucide-react';
import { defaultOptions, type CleanOptions } from './lib/cleaner';
import { useCleaner } from './hooks/useCleaner';
import { Preview } from './components/Preview';
import { scenario } from './tests/scenario';
type Theme = 'system' | 'light' | 'dark';
const labels: Record<keyof Omit<CleanOptions, 'mode' | 'highestHeadingLevel' | 'numberHeadings'>, string> = { normalizeMath: '数学公式规范化', normalizeUnicode: 'Unicode 特殊字符清洗', normalizeMarkdown: '安全 Markdown 规范化', cleanHtml: '简单 HTML 转 Markdown', removeAiArtifacts: 'AI 平台引用清理', removeChinesePeriod: '移除中文句号“。”', trimTrailingSpaces: '移除行尾空格', collapseBlankLines: '压缩连续空行', cleanBlankLineSpaces: '清理空白行空格' };
const settingGroups = [
    { title: '内容规范化', keys: ['normalizeMath', 'normalizeUnicode', 'normalizeMarkdown'] as const, descriptions: ['统一 LaTeX 公式定界符', '整理不可见字符和异常空白', '规范标题标记与多余空行'] },
    { title: '内容转换与清理', keys: ['cleanHtml', 'removeAiArtifacts', 'removeChinesePeriod'] as const, descriptions: ['转换可识别的简单 HTML', '移除已识别的平台内部引用', '删除中文句号“。”'] },
    { title: '空白整理', keys: ['cleanBlankLineSpaces', 'collapseBlankLines', 'trimTrailingSpaces'] as const, descriptions: ['清理空白行里的空格', '多个空行压缩为一个', '可能取消 Markdown 硬换行'] },
];

function HeadingLevelPicker({ value, onChange }: { value: number; onChange: (value: CleanOptions['highestHeadingLevel']) => void }) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const levels = [0, 1, 2, 3, 4, 5, 6];
    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, [open]);
    return <div className="heading-picker" ref={root}>
        <span className="heading-picker-label" id="highest-heading-label">最高标题</span>
        <button ref={trigger} className="heading-picker-trigger" type="button" aria-labelledby="highest-heading-label" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>{value ? `H${value}（${value} 级标题）` : '保持原层级'}<ChevronDown size={14}/></button>
        {open && <div className="heading-picker-menu" role="listbox" aria-labelledby="highest-heading-label">{levels.map(level => <button type="button" role="option" aria-selected={value === level} className={value === level ? 'selected' : ''} key={level} onClick={() => { onChange(level as CleanOptions['highestHeadingLevel']); setOpen(false); trigger.current?.focus(); }} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const options = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? [])]; const i = options.indexOf(event.currentTarget); options[(i + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length]?.focus(); } }}>{level ? <><strong>H{level}</strong><span>{level} 级标题</span></> : <span>保持原层级</span>}{value === level && <Check size={15}/>}</button>)}</div>}
    </div>;
}

export default function App() {
    const [input, setInput] = useState(''), [options, setOptions] = useState<CleanOptions>(defaultOptions), [tab, setTab] = useState<'source' | 'preview'>('source'), [settings, setSettings] = useState(false), [notice, setNotice] = useState(''), [logs, setLogs] = useState(false);
    const [theme, setTheme] = useState<Theme>(() => { try {
        return (localStorage.getItem('cleaner-theme') as Theme) || 'system';
    }
    catch {
        return 'system';
    } });
    const file = useRef<HTMLInputElement>(null), editor = useRef<HTMLTextAreaElement>(null), dialog = useRef<HTMLDialogElement>(null);
    const { result, error, busy } = useCleaner(input, options);
    useEffect(() => { const media = matchMedia('(prefers-color-scheme: dark)'); const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches)); apply(); media.addEventListener('change', apply); try {
        localStorage.setItem('cleaner-theme', theme);
    }
    catch { /* storage optional */ } return () => media.removeEventListener('change', apply); }, [theme]);
    useEffect(() => { if (settings)
        dialog.current?.showModal();
    else
        dialog.current?.close(); }, [settings]);
    useEffect(() => { if (!notice)
        return; const t = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(t); }, [notice]);
    const ready = !busy && !error && !!result.content;
    const copy = async () => { if (!ready)
        return; try {
        await navigator.clipboard.writeText(result.content);
        setNotice('已复制 Markdown 源码，可以粘贴到 Markdown 笔记应用');
    }
    catch {
        setNotice('复制失败，请选中右侧源码并手动复制');
    } };
    useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        void copy();
    } if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        editor.current?.focus();
    } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); });
    const download = () => { if (!ready)
        return; const url = URL.createObjectURL(new Blob([result.content], { type: 'text/markdown;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'cleaned-note.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    const paste = async () => { try {
        setInput(await navigator.clipboard.readText());
        editor.current?.focus();
    }
    catch {
        setNotice('浏览器未允许读取剪贴板，请在输入框使用 ⌘V / Ctrl+V');
        editor.current?.focus();
    } };
    const stats = useMemo(() => [{ label: '数学公式', value: result.statistics.math, color: 'blue' }, { label: '特殊字符', value: result.statistics.unicode, color: 'violet' }, { label: 'Markdown 结构', value: result.statistics.markdown, color: 'green' }, { label: 'AI 专有标记', value: result.statistics.artifacts, color: 'orange' }], [result]);
    const github = import.meta.env.VITE_GITHUB_URL as string | undefined;
    return <div className="app">
  <header className="nav"><a className="brand" href="./"><span className="app-icon"><WrapText size={23}/></span><span>AI Markdown Cleaner<span className="brand-tag">AI 笔记整理工具</span></span></a><nav aria-label="工具"><button className="icon-button" title={'主题：' + theme} aria-label={'切换主题，当前 ' + theme} onClick={() => setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')}>{theme === 'system' ? <Monitor size={19}/> : theme === 'light' ? <Sun size={19}/> : <Moon size={19}/>}</button>{github && /^https:\/\//.test(github) && <a className="icon-button" aria-label="GitHub 项目" href={github} target="_blank" rel="noreferrer"><GitFork size={19}/></a>}<span className="nav-divider"/><button className="icon-button" aria-label="打开设置" onClick={() => setSettings(true)}><Settings2 size={19}/></button></nav></header>
  <main>
   <section className="intro"><div><div className="intro-badge"><span />你的内容，只留在你的浏览器</div><h1>让 AI 回答，成为好笔记。</h1><p>清理公式、特殊字符与格式杂音，整理后保存为 Markdown 笔记。</p></div><div className="intro-side"><span className="brand-mark">◇</span><span>从灵感到知识库<br /><strong>少一点整理，多一点思考。</strong></span></div></section>
   <section className="workspace" aria-label="Markdown 清洗工作台">
    <div className="workspace-toolbar"><div className="mode-control" aria-label="清洗模式"><button className={options.mode === 'standard' ? 'active' : ''} onClick={() => setOptions({ ...options, mode: 'standard', cleanHtml: false })}><ShieldCheck size={15}/>标准模式</button><button className={options.mode === 'deep' ? 'active' : ''} onClick={() => setOptions({ ...options, mode: 'deep', cleanHtml: true })}><Sparkles size={15}/>深度清洗</button></div><span className="toolbar-status"><span className={busy ? 'status-dot working' : 'status-dot'}/>{busy ? '正在清洗…' : '自动清洗已开启'}<span className="desktop-only">· 本地处理</span></span></div>
    {options.mode === 'deep' && <fieldset className="deep-options"><div className="deep-options-intro"><p>按需组合，结果即时更新</p><span>{(['normalizeMath','normalizeUnicode','normalizeMarkdown','cleanHtml','removeAiArtifacts','removeChinesePeriod','trimTrailingSpaces','cleanBlankLineSpaces','collapseBlankLines'] as const).filter(key => options[key]).length} 项已启用</span></div>{(['normalizeMath','normalizeUnicode','normalizeMarkdown','cleanHtml','removeAiArtifacts','removeChinesePeriod','trimTrailingSpaces','cleanBlankLineSpaces','collapseBlankLines'] as const).map(key => <label className="deep-option" key={key}><input type="checkbox" checked={options[key]} onChange={e => setOptions({ ...options, [key]: e.target.checked })}/><span><strong>{labels[key]}</strong><small>{{normalizeMath:'规范 LaTeX 定界符并处理独立公式环境',normalizeUnicode:'清理零宽字符、异常空白并提示双向控制符',normalizeMarkdown:'整理标题标记与多余空行',cleanHtml:'将简单 HTML 段落、列表和强调转换为 Markdown',removeAiArtifacts:'移除可识别的平台内部引用标记',removeChinesePeriod:'删除全文中的中文句号“。”',trimTrailingSpaces:'清除每行末尾的空格；可能取消 Markdown 硬换行',cleanBlankLineSpaces:'仅清理空白行里的空格和制表符',collapseBlankLines:'将连续多个空白行压缩为一个空行'}[key]}</small></span></label>)}</fieldset>}
    <div className="heading-toolbar"><HeadingLevelPicker value={options.highestHeadingLevel ?? 0} onChange={highestHeadingLevel => setOptions({ ...options, highestHeadingLevel })}/><label className="heading-numbering" htmlFor="number-headings"><input id="number-headings" type="checkbox" checked={options.numberHeadings ?? true} onChange={e => setOptions({ ...options, numberHeadings: e.target.checked })}/>统一标题序号</label><span id="heading-hint">下级标题同步移动；超出 H6 时转为表情序号加粗文字并提示。</span></div>
    <div className="editors">
     <section className="editor-pane"><div className="pane-header"><h2><FileText size={17}/>原始 Markdown</h2><div className="pane-actions"><button title="导入 .md / .txt 文件" aria-label="导入文件" onClick={() => file.current?.click()}><ArrowDownToLine size={16}/></button><button title="清空输入" aria-label="清空输入" disabled={!input} onClick={() => setInput('')}><Trash2 size={16}/></button></div></div>
      <div className="input-wrap"><textarea ref={editor} value={input} onChange={e => setInput(e.target.value)} placeholder={'在这里粘贴 AI 生成的 Markdown…\n\n支持 ChatGPT、Claude、Gemini、DeepSeek\n\n公式、代码和笔记结构，我们来整理。'} aria-label="原始 Markdown 输入" spellCheck={false}/>{!input && <div className="empty-actions"><button className="secondary" onClick={() => void paste()}><Clipboard size={15}/>粘贴内容</button><button className="text-button" onClick={() => setInput(scenario)}>试试示例 <ArrowRight size={14}/></button></div>}</div>
      <div className="pane-footer"><span>{input.length.toLocaleString()} 字符<span className="separator">/</span>{input ? input.split('\n').length : 0} 行</span><span>纯文本输入</span></div>
     </section>
     <section className="editor-pane result-pane"><div className="pane-header"><div className="tabs" role="tablist" aria-label="结果显示方式"><button role="tab" aria-selected={tab === 'source'} className={tab === 'source' ? 'selected' : ''} onClick={() => setTab('source')}><Code2 size={16}/>Markdown 源码</button><button role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'selected' : ''} onClick={() => setTab('preview')}>渲染预览</button></div><span className="result-check"><Check size={14}/>Markdown 已整理</span></div>
      <div className="output-wrap">{!input ? <div className="empty-output"><span className="empty-icon"><FileText size={29}/><Check size={14}/></span><h3>干净的 Markdown，从这里开始</h3><p>粘贴内容后，清洗结果会自动出现在这里。</p><span className="syntax-hint">\( x² \) <ArrowRight size={14}/> $x²$</span></div> : tab === 'source' ? <textarea value={result.content} readOnly aria-label="清洗后的 Markdown 源码" spellCheck={false}/> : <Preview content={result.content}/>}</div>
      <div className="pane-footer"><span>{result.content.length.toLocaleString()} 字符<span className="separator">/</span>{result.content ? result.content.split('\n').length : 0} 行</span><span>{busy ? '处理中' : result.statistics.warnings ? result.statistics.warnings + ' 条待确认提示' : '保留代码与原始语义'}</span></div>
     </section>
    </div>
    <div className="action-bar"><span><ShieldCheck size={16}/>为你的知识库，保留每一份内容</span><div><button className="secondary" disabled={!ready} onClick={download}><ArrowDownToLine size={16}/><span className="desktop-only">下载 </span>.md</button><button className="primary" disabled={!ready} onClick={() => void copy()}><Clipboard size={16}/>复制结果 <kbd>⌘ ⇧ C</kbd></button></div></div>
   </section>
   {error && <p role="alert" className="error">{error}</p>}
   <section className="summary"><div className="summary-heading"><h2>清洗概览</h2><span>{options.mode === 'deep' ? '深度清洗' : '标准模式'} · {busy ? '处理中' : '实时检测'}</span><button className="text-button" aria-expanded={logs} onClick={() => setLogs(!logs)}>修改记录 <ChevronDown size={15} className={logs ? 'rotated' : ''}/></button></div><div className="stats">{stats.map((s, i) => <div className="stat" key={s.label}><span className={'stat-icon ' + s.color}>{i === 0 ? 'ƒ' : i === 1 ? 'Aa' : i === 2 ? '#' : '✧'}</span><div><strong>{s.value}</strong><span>{s.label}</span></div><Check size={14}/></div>)}</div>{logs && <div className="logs">{!result.changes.length ? <p>暂无修改记录。粘贴一段 Markdown 开始检查。</p> : result.changes.map((c, i) => <p key={i} className={c.warning ? 'warning' : ''}><span>{c.warning ? '待确认' : '✓'}</span>{c.message}{c.count > 1 && <b>×{c.count}</b>}</p>)}</div>}{!logs && result.statistics.warnings > 0 && <button className="warning warning-link" onClick={() => setLogs(true)}>有 {result.statistics.warnings} 条内容需要人工确认，展开查看提示</button>}</section>
   <div className="privacy"><LockKeyhole size={14}/><span>100% 浏览器本地处理</span><i />无需登录<i />不上传内容<i /><span>不调用 AI API</span></div>
  </main>
  <footer><span>AI Markdown Cleaner</span><span>让内容回归内容。<span className="desktop-only"> 支持标准 Markdown、LaTeX 与常见扩展语法。</span></span></footer>
  <input type="file" ref={file} hidden accept=".md,.txt,text/plain,text/markdown" onChange={async (e) => { const f = e.target.files?.[0]; if (!f)
        return; if (f.size > 4000000) {
        setNotice('文件超过 4 MB，请拆分后导入');
        e.target.value = '';
        return;
    } try {
        setInput(await f.text());
    }
    catch {
        setNotice('文件读取失败，请重新导入');
    } e.target.value = ''; }}/>
  <dialog ref={dialog} onCancel={() => setSettings(false)} onClick={e => { if (e.target === dialog.current)
        setSettings(false); }}><div className="dialog-heading"><h2>清洗设置</h2><button className="icon-button" aria-label="关闭设置" onClick={() => setSettings(false)}><X size={19}/></button></div><p>勾选规则会即时应用。输入内容只在本地处理，不会保存。</p>{settingGroups.map(group => <section className="setting-group" key={group.title}><h3>{group.title}</h3>{group.keys.map((key, index) => <label className="setting" key={key}><span><strong>{labels[key]}</strong><small>{group.descriptions[index]}</small></span><input type="checkbox" checked={options[key]} onChange={e => setOptions({ ...options, [key]: e.target.checked })}/></label>)}</section>)}<p className="dialog-note">深度清洗面板提供同一组规则的快捷调整。行尾空格可能表示 Markdown 硬换行，开启移除前请确认需要删除。</p><button className="primary" onClick={() => setSettings(false)}>完成</button></dialog>
  <div className={'toast ' + (notice ? 'visible' : '')} role="status" aria-live="polite">{notice}</div>
 </div>;
}
