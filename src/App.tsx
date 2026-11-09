import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, Clipboard, Code2, FileText, GitFork, LockKeyhole, Monitor, Moon, Settings2, ShieldCheck, Sparkles, Sun, Trash2, X, WrapText } from 'lucide-react';
import { defaultOptions, type CleanOptions } from './lib/cleaner';
import { useCleaner } from './hooks/useCleaner';
import { Preview } from './components/Preview';
import { scenario } from './tests/scenario';
import { getMessages, readLanguagePreference, resolveLocale, type LanguagePreference, type Locale } from './i18n';
type Theme = 'system' | 'light' | 'dark';
function localizeChange(message: string, locale: Locale) {
    if (locale === 'zh') return message;
    const translations = getMessages('en').changeMessages;
    if (translations[message]) return translations[message];
    const prefix = Object.keys(translations).find(key => message.startsWith(key));
    return prefix ? translations[prefix] + message.slice(prefix.length) : message;
}
const settingGroupKeys = [
    { title: 'groupNormalize', keys: ['normalizeMath', 'normalizeUnicode', 'normalizeMarkdown'] as const, descriptions: ['descMath', 'descUnicode', 'descMarkdown'] },
    { title: 'groupConvert', keys: ['cleanHtml', 'removeAiArtifacts', 'removeChinesePeriod'] as const, descriptions: ['descHtml', 'descArtifacts', 'descPeriod'] },
    { title: 'groupWhitespace', keys: ['cleanBlankLineSpaces', 'collapseBlankLines', 'trimTrailingSpaces'] as const, descriptions: ['descBlankSpaces', 'descCollapse', 'descTrailing'] },
] as const;
const ruleDescriptionKeys = { normalizeMath: 'descMath', normalizeUnicode: 'descUnicode', normalizeMarkdown: 'descMarkdown', cleanHtml: 'descHtml', removeAiArtifacts: 'descArtifacts', removeChinesePeriod: 'descPeriod', trimTrailingSpaces: 'descTrailing', cleanBlankLineSpaces: 'descBlankSpaces', collapseBlankLines: 'descCollapse' } as const;

function HeadingLevelPicker({ value, onChange, locale }: { value: number; onChange: (value: CleanOptions['highestHeadingLevel']) => void; locale: Locale }) {
    const t = getMessages(locale);
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
        <span className="heading-picker-label" id="highest-heading-label">{t.highestHeading}</span>
        <button ref={trigger} className="heading-picker-trigger" type="button" aria-labelledby="highest-heading-label" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>{value ? `H${value} (${t.level.replace('{count}', String(value))})` : t.keepHierarchy}<ChevronDown size={14}/></button>
        {open && <div className="heading-picker-menu" role="listbox" aria-labelledby="highest-heading-label">{levels.map(level => <button type="button" role="option" aria-selected={value === level} className={value === level ? 'selected' : ''} key={level} onClick={() => { onChange(level as CleanOptions['highestHeadingLevel']); setOpen(false); trigger.current?.focus(); }} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const options = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? [])]; const i = options.indexOf(event.currentTarget); options[(i + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length]?.focus(); } }}>{level ? <><strong>H{level}</strong><span>{t.level.replace('{count}', String(level))}</span></> : <span>{t.keepHierarchy}</span>}{value === level && <Check size={15}/>}</button>)}</div>}
    </div>;
}

export default function App() {
    const [languagePreference, setLanguagePreference] = useState<LanguagePreference>(readLanguagePreference);
    const locale = resolveLocale(languagePreference);
    const t = getMessages(locale);
    const labels: Record<keyof Omit<CleanOptions, 'mode' | 'highestHeadingLevel' | 'numberHeadings'>, string> = { normalizeMath: t.ruleMath, normalizeUnicode: t.ruleUnicode, normalizeMarkdown: t.ruleMarkdown, cleanHtml: t.ruleHtml, removeAiArtifacts: t.ruleArtifacts, removeChinesePeriod: t.rulePeriod, trimTrailingSpaces: t.ruleTrailing, collapseBlankLines: t.ruleBlankLines, cleanBlankLineSpaces: t.ruleBlankSpaces };
    const [input, setInput] = useState(''), [options, setOptions] = useState<CleanOptions>(defaultOptions), [tab, setTab] = useState<'source' | 'preview'>('source'), [settings, setSettings] = useState(false), [notice, setNotice] = useState(''), [logs, setLogs] = useState(false);
    const [theme, setTheme] = useState<Theme>(() => { try {
        return (localStorage.getItem('cleaner-theme') as Theme) || 'system';
    }
    catch {
        return 'system';
    } });
    const file = useRef<HTMLInputElement>(null), editor = useRef<HTMLTextAreaElement>(null), dialog = useRef<HTMLDialogElement>(null);
    const { result, error, busy } = useCleaner(input, options);
    useEffect(() => { document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'; document.title = t.pageTitle; const description = document.querySelector<HTMLMetaElement>('meta[name="description"]'); if (description) description.content = t.pageDescription; try { localStorage.setItem('cleaner-language', languagePreference); } catch { /* storage optional */ } }, [languagePreference, locale, t.pageDescription, t.pageTitle]);
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
        setNotice(t.copyShortcut);
    }
    catch {
        setNotice(t.copyFailed);
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
        setNotice(t.pasteDenied);
        editor.current?.focus();
    } };
    const stats = useMemo(() => [{ label: t.statMath, value: result.statistics.math, color: 'blue' }, { label: t.statUnicode, value: result.statistics.unicode, color: 'violet' }, { label: t.statMarkdown, value: result.statistics.markdown, color: 'green' }, { label: t.statArtifacts, value: result.statistics.artifacts, color: 'orange' }], [result, locale]);
    const github = import.meta.env.VITE_GITHUB_URL as string | undefined;
    return <div className="app">
  <header className="nav"><a className="brand" href="./"><span className="app-icon"><WrapText size={23}/></span><span>AI Markdown Cleaner<span className="brand-tag">{t.brandTag}</span></span></a><nav aria-label={t.navTools}><button className="icon-button" title={t.themeToggle.replace('{theme}', t[`theme${theme[0].toUpperCase()}${theme.slice(1)}` as 'themeSystem' | 'themeLight' | 'themeDark'])} aria-label={t.themeToggle.replace('{theme}', t[`theme${theme[0].toUpperCase()}${theme.slice(1)}` as 'themeSystem' | 'themeLight' | 'themeDark'])} onClick={() => setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')}>{theme === 'system' ? <Monitor size={19}/> : theme === 'light' ? <Sun size={19}/> : <Moon size={19}/>}</button>{github && /^https:\/\//.test(github) && <a className="icon-button" aria-label={t.githubProject} href={github} target="_blank" rel="noreferrer"><GitFork size={19}/></a>}<span className="nav-divider"/><button className="icon-button" aria-label={t.openSettings} onClick={() => setSettings(true)}><Settings2 size={19}/></button></nav></header>
  <main>
   <section className="intro"><div><div className="intro-badge"><span />{t.introBadge}</div><h1>{t.heroTitle}</h1><p>{t.heroDescription}</p></div><div className="intro-side"><span className="brand-mark">◇</span><span>{t.introSide}<br /><strong>{t.introSideStrong}</strong></span></div></section>
   <section className="workspace" aria-label={t.workspace}>
    <div className="workspace-toolbar"><div className="mode-control" aria-label={t.cleaningModes}><button className={options.mode === 'standard' ? 'active' : ''} onClick={() => setOptions({ ...options, mode: 'standard', cleanHtml: false })}><ShieldCheck size={15}/>{t.standardMode}</button><button className={options.mode === 'deep' ? 'active' : ''} onClick={() => setOptions({ ...options, mode: 'deep', cleanHtml: true })}><Sparkles size={15}/>{t.deepMode}</button></div><span className="toolbar-status"><span className={busy ? 'status-dot working' : 'status-dot'}/>{busy ? t.cleaning : t.autoCleaning}<span className="desktop-only">· {t.localProcessing}</span></span></div>
    {options.mode === 'deep' && <fieldset className="deep-options"><div className="deep-options-intro"><p>{t.deepIntro}</p><span>{t.enabledCount.replace('{count}', String((['normalizeMath','normalizeUnicode','normalizeMarkdown','cleanHtml','removeAiArtifacts','removeChinesePeriod','trimTrailingSpaces','cleanBlankLineSpaces','collapseBlankLines'] as const).filter(key => options[key]).length))}</span></div>{(['normalizeMath','normalizeUnicode','normalizeMarkdown','cleanHtml','removeAiArtifacts','removeChinesePeriod','trimTrailingSpaces','cleanBlankLineSpaces','collapseBlankLines'] as const).map(key => <label className="deep-option" key={key}><input type="checkbox" checked={options[key]} onChange={e => setOptions({ ...options, [key]: e.target.checked })}/><span><strong>{labels[key]}</strong><small>{t[ruleDescriptionKeys[key]]}</small></span></label>)}</fieldset>}
    <div className="heading-toolbar"><HeadingLevelPicker locale={locale} value={options.highestHeadingLevel ?? 0} onChange={highestHeadingLevel => setOptions({ ...options, highestHeadingLevel })}/><label className="heading-numbering" htmlFor="number-headings"><input id="number-headings" type="checkbox" checked={options.numberHeadings ?? true} onChange={e => setOptions({ ...options, numberHeadings: e.target.checked })}/>{t.headingNumbering}</label><span id="heading-hint">{t.headingHint}</span></div>
    <div className="editors">
     <section className="editor-pane"><div className="pane-header"><h2><FileText size={17}/>{t.sourceMarkdown}</h2><div className="pane-actions"><button title={t.importFile} aria-label={t.import} onClick={() => file.current?.click()}><ArrowDownToLine size={16}/></button><button title={t.clearInput} aria-label={t.clearInput} disabled={!input} onClick={() => setInput('')}><Trash2 size={16}/></button></div></div>
      <div className="input-wrap"><textarea ref={editor} value={input} onChange={e => setInput(e.target.value)} placeholder={t.inputPlaceholder} aria-label={t.sourceMarkdown} spellCheck={false}/>{!input && <div className="empty-actions"><button className="secondary" onClick={() => void paste()}><Clipboard size={15}/>{t.pasteContent}</button><button className="text-button" onClick={() => setInput(scenario)}>{t.tryExample} <ArrowRight size={14}/></button></div>}</div>
      <div className="pane-footer"><span>{input.length.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en')} {t.charCount}<span className="separator">/</span>{input ? input.split('\n').length : 0} {t.lineCount}</span><span>{t.plainText}</span></div>
     </section>
     <section className="editor-pane result-pane"><div className="pane-header"><div className="tabs" role="tablist" aria-label={t.resultDisplay}><button role="tab" aria-selected={tab === 'source'} className={tab === 'source' ? 'selected' : ''} onClick={() => setTab('source')}><Code2 size={16}/>{t.markdownSource}</button><button role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'selected' : ''} onClick={() => setTab('preview')}>{t.renderedPreview}</button></div><span className="result-check"><Check size={14}/>{t.markdownCleaned}</span></div>
      <div className="output-wrap">{!input ? <div className="empty-output"><span className="empty-icon"><FileText size={29}/><Check size={14}/></span><h3>{t.emptyTitle}</h3><p>{t.emptyDescription}</p><span className="syntax-hint">\( x² \) <ArrowRight size={14}/> $x²$</span></div> : tab === 'source' ? <textarea value={result.content} readOnly aria-label={t.outputLabel} spellCheck={false}/> : <Preview content={result.content} locale={locale}/>}</div>
      <div className="pane-footer"><span>{result.content.length.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en')} {t.charCount}<span className="separator">/</span>{result.content ? result.content.split('\n').length : 0} {t.lineCount}</span><span>{busy ? t.processing : result.statistics.warnings ? t.warnings.replace('{count}', String(result.statistics.warnings)) : t.preserveMeaning}</span></div>
     </section>
    </div>
    <div className="action-bar"><span><ShieldCheck size={16}/>{t.protectContent}</span><div><button className="secondary" disabled={!ready} onClick={download}><ArrowDownToLine size={16}/><span className="desktop-only">{t.download} </span>.md</button><button className="primary" disabled={!ready} onClick={() => void copy()}><Clipboard size={16}/>{t.copyResult} <kbd>⌘ ⇧ C</kbd></button></div></div>
   </section>
   {error && <p role="alert" className="error">{locale === 'en' ? t.cleanFailed : error}</p>}
   <section className="summary"><div className="summary-heading"><h2>{t.summary}</h2><span>{options.mode === 'deep' ? t.deepMode : t.standardMode} · {busy ? t.processing : t.liveDetection}</span><button className="text-button" aria-expanded={logs} onClick={() => setLogs(!logs)}>{t.changeLog} <ChevronDown size={15} className={logs ? 'rotated' : ''}/></button></div><div className="stats">{stats.map((s, i) => <div className="stat" key={s.label}><span className={'stat-icon ' + s.color}>{i === 0 ? 'ƒ' : i === 1 ? 'Aa' : i === 2 ? '#' : '✧'}</span><div><strong>{s.value}</strong><span>{s.label}</span></div><Check size={14}/></div>)}</div>{logs && <div className="logs">{!result.changes.length ? <p>{t.noChanges}</p> : result.changes.map((c, i) => <p key={i} className={c.warning ? 'warning' : ''}><span>{c.warning ? t.needsReview : '✓'}</span>{localizeChange(c.message, locale)}{c.count > 1 && <b>×{c.count}</b>}</p>)}</div>}{!logs && result.statistics.warnings > 0 && <button className="warning warning-link" onClick={() => setLogs(true)}>{t.reviewItems.replace('{count}', String(result.statistics.warnings))}</button>}</section>
  </main>
  <footer className="site-footer"><div className="site-footer-inner"><span>© {new Date().getFullYear()} <a href="https://ryumako.top" target="_blank" rel="noreferrer">RyuMako</a></span><span className="footer-privacy">{t.footerPrivacy} <i/> {t.noUpload} <i/> {t.noApi}</span><a href="https://github.com/HonestLiu/AI_Markdown_Cleaner" target="_blank" rel="noreferrer"><GitFork size={14}/>{t.githubRepo}</a></div></footer>
  <input type="file" ref={file} hidden accept=".md,.txt,text/plain,text/markdown" onChange={async (e) => { const f = e.target.files?.[0]; if (!f)
        return; if (f.size > 4000000) {
        setNotice(t.fileTooLarge);
        e.target.value = '';
        return;
    } try {
        setInput(await f.text());
    }
    catch {
        setNotice(t.fileReadFailed);
    } e.target.value = ''; }}/>
  <dialog ref={dialog} onCancel={() => setSettings(false)} onClick={e => { if (e.target === dialog.current)
        setSettings(false); }}><div className="dialog-heading"><h2>{t.settings}</h2><button className="icon-button" aria-label={t.closeSettings} onClick={() => setSettings(false)}><X size={19}/></button></div><p>{t.settingsIntro}</p><label className="setting language-setting"><span><strong>{t.languagePreference}</strong><small>{t.languageHint}</small></span><select name="language" aria-label={t.languagePreference} value={languagePreference} onChange={event => setLanguagePreference(event.target.value as LanguagePreference)}><option value="auto">{t.autoLanguage.replace('{language}', locale === 'zh' ? '中文' : 'English')}</option><option value="zh">{t.languageChinese}</option><option value="en">{t.languageEnglish}</option></select></label>{settingGroupKeys.map(group => <section className="setting-group" key={group.title}><h3>{t[group.title]}</h3>{group.keys.map((key, index) => <label className="setting" key={key}><span><strong>{labels[key]}</strong><small>{t[group.descriptions[index]]}</small></span><input type="checkbox" checked={options[key]} onChange={e => setOptions({ ...options, [key]: e.target.checked })}/></label>)}</section>)}<p className="dialog-note">{t.settingsNote}</p><button className="primary" onClick={() => setSettings(false)}>{t.done}</button></dialog>
  <div className={'toast ' + (notice ? 'visible' : '')} role="status" aria-live="polite">{notice}</div>
 </div>;
}
