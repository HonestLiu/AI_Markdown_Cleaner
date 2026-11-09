export type Locale = 'zh' | 'en';
export type LanguagePreference = 'auto' | Locale;

export function detectLocale(): Locale {
    return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function readLanguagePreference(): LanguagePreference {
    try {
        const preference = localStorage.getItem('cleaner-language');
        return preference === 'zh' || preference === 'en' || preference === 'auto' ? preference : 'auto';
    } catch {
        return 'auto';
    }
}

export function resolveLocale(preference: LanguagePreference): Locale {
    return preference === 'auto' ? detectLocale() : preference;
}

const messages = {
    zh: {
        pageTitle: 'AI Markdown Cleaner - AI 笔记整理工具', pageDescription: '清理 AI 生成的 Markdown 笔记，保留公式、代码与原始语义。', languagePreference: '界面语言', languageHint: '默认跟随浏览器语言，也可手动选择。', autoLanguage: '自动（{language}）', languageChinese: '简体中文', languageEnglish: '英语',
        brandTag: 'AI 笔记整理工具', navTools: '工具', themeToggle: '切换主题，当前 {theme}', themeSystem: '跟随系统', themeLight: '浅色', themeDark: '深色', githubProject: 'GitHub 项目', openSettings: '打开设置',
        introBadge: '你的内容，只留在你的浏览器', heroTitle: '让 AI 回答，成为好笔记。', heroDescription: '清理公式、特殊字符与格式杂音，整理后保存为 Markdown 笔记。', introSide: '从灵感到知识库', introSideStrong: '少一点整理，多一点思考。',
        workspace: 'Markdown 清洗工作台', cleaningModes: '清洗模式', standardMode: '标准模式', deepMode: '深度清洗', cleaning: '正在清洗…', autoCleaning: '自动清洗已开启', localProcessing: '本地处理',
        deepIntro: '按需组合，结果即时更新', enabledCount: '{count} 项已启用',
        ruleMath: '数学公式规范化', ruleUnicode: 'Unicode 特殊字符清洗', ruleMarkdown: '安全 Markdown 规范化', ruleHtml: '简单 HTML 转 Markdown', ruleArtifacts: 'AI 平台引用清理', rulePeriod: '移除中文句号“。”', ruleTrailing: '移除行尾空格', ruleBlankLines: '压缩连续空行', ruleBlankSpaces: '清理空白行空格',
        descMath: '统一 LaTeX 公式定界符', descUnicode: '整理不可见字符和异常空白', descMarkdown: '规范标题标记与多余空行', descHtml: '转换可识别的简单 HTML', descArtifacts: '移除已识别的平台内部引用', descPeriod: '删除中文句号“。”', descBlankSpaces: '清理空白行里的空格', descCollapse: '多个空行压缩为一个', descTrailing: '可能取消 Markdown 硬换行',
        highestHeading: '最高标题', keepHierarchy: '保持原层级', level: '{count} 级标题', headingNumbering: '统一标题序号', headingHint: '下级标题同步移动；超出 H6 时转为表情序号加粗文字并提示。',
        importFile: '导入 .md / .txt 文件', import: '导入文件', clearInput: '清空输入', sourceMarkdown: '原始 Markdown', inputPlaceholder: '在这里粘贴 AI 生成的 Markdown…\n\n支持 ChatGPT、Claude、Gemini、DeepSeek\n\n公式、代码和笔记结构，我们来整理。', pasteContent: '粘贴内容', tryExample: '试试示例', charCount: '字符', lineCount: '行', plainText: '纯文本输入',
        resultDisplay: '结果显示方式', markdownSource: 'Markdown 源码', renderedPreview: '渲染预览', markdownCleaned: 'Markdown 已整理', emptyTitle: '干净的 Markdown，从这里开始', emptyDescription: '粘贴内容后，清洗结果会自动出现在这里。', outputLabel: '清洗后的 Markdown 源码', processing: '处理中', warnings: '{count} 条待确认提示', preserveMeaning: '保留代码与原始语义',
        protectContent: '为你的知识库，保留每一份内容', download: '下载', copyResult: '复制结果', copyShortcut: '已复制 Markdown 源码，可以粘贴到 Markdown 笔记应用', copyFailed: '复制失败，请选中右侧源码并手动复制', pasteDenied: '浏览器未允许读取剪贴板，请在输入框使用 ⌘V / Ctrl+V',
        summary: '清洗概览', liveDetection: '实时检测', changeLog: '修改记录', noChanges: '暂无修改记录。粘贴一段 Markdown 开始检查。', needsReview: '待确认', reviewItems: '有 {count} 条内容需要人工确认，展开查看提示',
        statMath: '数学公式', statUnicode: '特殊字符', statMarkdown: 'Markdown 结构', statArtifacts: 'AI 专有标记',
        settings: '清洗设置', closeSettings: '关闭设置', settingsIntro: '勾选规则会即时应用。输入内容只在本地处理，不会保存。', groupNormalize: '内容规范化', groupConvert: '内容转换与清理', groupWhitespace: '空白整理', settingsNote: '深度清洗面板提供同一组规则的快捷调整。行尾空格可能表示 Markdown 硬换行，开启移除前请确认需要删除。', done: '完成',
        fileTooLarge: '文件超过 4 MB，请拆分后导入', fileReadFailed: '文件读取失败，请重新导入', cleanFailed: '清洗失败。请打开控制台查看详细错误，原文仍保留在输入框中。',
        footerPrivacy: '100% 浏览器本地处理', noUpload: '不上传内容', noApi: '不调用 AI API', githubRepo: 'GitHub 仓库',
        previewFailed: '预览失败，请查看 Markdown 源码。', diagramFailed: '图表语法无法解析，已保留 Mermaid 源码。', previewTooLong: '文档超过 15 万字符，已暂停渲染预览以保持流畅。完整结果仍可复制和下载。',
        changeMessages: {} as Record<string, string>
    },
    en: {
        pageTitle: 'AI Markdown Cleaner - AI Note Cleaner', pageDescription: 'Clean AI-generated Markdown notes while preserving math, code, and original meaning.', languagePreference: 'Interface language', languageHint: 'Follow your browser language or choose manually.', autoLanguage: 'Auto ({language})', languageChinese: 'Chinese', languageEnglish: 'English',
        brandTag: 'AI note cleaner', navTools: 'Tools', themeToggle: 'Switch theme, currently {theme}', themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark', githubProject: 'GitHub project', openSettings: 'Open settings',
        introBadge: 'Your content stays in your browser', heroTitle: 'Turn AI answers into useful notes.', heroDescription: 'Clean up formulas, special characters, and formatting noise, then save as Markdown.', introSide: 'From ideas to a knowledge base', introSideStrong: 'Less cleanup. More thinking.',
        workspace: 'Markdown cleaning workspace', cleaningModes: 'Cleaning mode', standardMode: 'Standard', deepMode: 'Deep clean', cleaning: 'Cleaning…', autoCleaning: 'Auto-clean is on', localProcessing: 'Processed locally',
        deepIntro: 'Choose what to clean; results update instantly', enabledCount: '{count} enabled',
        ruleMath: 'Normalize math formulas', ruleUnicode: 'Clean special Unicode characters', ruleMarkdown: 'Normalize Markdown safely', ruleHtml: 'Convert simple HTML to Markdown', ruleArtifacts: 'Remove AI platform references', rulePeriod: 'Remove Chinese full stops', ruleTrailing: 'Remove trailing spaces', ruleBlankLines: 'Collapse consecutive blank lines', ruleBlankSpaces: 'Clean whitespace on blank lines',
        descMath: 'Standardize LaTeX math delimiters', descUnicode: 'Clean invisible characters and unusual whitespace', descMarkdown: 'Normalize heading markers and extra blank lines', descHtml: 'Convert recognized simple HTML', descArtifacts: 'Remove recognized internal platform references', descPeriod: 'Remove Chinese full stops', descBlankSpaces: 'Clean spaces on blank lines', descCollapse: 'Collapse multiple blank lines into one', descTrailing: 'May remove Markdown hard line breaks',
        highestHeading: 'Highest heading', keepHierarchy: 'Keep current levels', level: 'heading level {count}', headingNumbering: 'Normalize heading numbers', headingHint: 'Lower headings shift with the selected level. Headings beyond H6 become bold text with emoji numbering and a warning.',
        importFile: 'Import .md / .txt file', import: 'Import file', clearInput: 'Clear input', sourceMarkdown: 'Source Markdown', inputPlaceholder: 'Paste AI-generated Markdown here…\n\nSupports ChatGPT, Claude, Gemini, and DeepSeek\n\nWe’ll clean up formulas, code, and note structure.', pasteContent: 'Paste content', tryExample: 'Try an example', charCount: 'characters', lineCount: 'lines', plainText: 'Plain text input',
        resultDisplay: 'Result display', markdownSource: 'Markdown source', renderedPreview: 'Preview', markdownCleaned: 'Markdown cleaned', emptyTitle: 'Your clean Markdown starts here', emptyDescription: 'Paste content to see the cleaned result here.', outputLabel: 'Cleaned Markdown source', processing: 'Processing', warnings: '{count} items to review', preserveMeaning: 'Code and original meaning are preserved',
        protectContent: 'Keep every part of your notes intact', download: 'Download', copyResult: 'Copy result', copyShortcut: 'Markdown source copied. Paste it into your notes app.', copyFailed: 'Could not copy. Select the source on the right and copy it manually.', pasteDenied: 'Clipboard access was denied. Use ⌘V / Ctrl+V in the input field.',
        summary: 'Cleaning summary', liveDetection: 'Live checks', changeLog: 'Change log', noChanges: 'No changes yet. Paste Markdown to start checking.', needsReview: 'Needs review', reviewItems: '{count} items need review. Expand to see details.',
        statMath: 'Math formulas', statUnicode: 'Special characters', statMarkdown: 'Markdown structure', statArtifacts: 'AI artifacts',
        settings: 'Cleaning settings', closeSettings: 'Close settings', settingsIntro: 'Selected rules apply instantly. Your input is processed locally and is not saved.', groupNormalize: 'Normalization', groupConvert: 'Conversion and cleanup', groupWhitespace: 'Whitespace', settingsNote: 'The deep-clean panel offers quick access to the same rules. Trailing spaces can create Markdown hard line breaks; check before removing them.', done: 'Done',
        fileTooLarge: 'File exceeds 4 MB. Split it into smaller files and try again.', fileReadFailed: 'Could not read the file. Please import it again.', cleanFailed: 'Cleaning failed. Check the console for details. Your original text is still in the input.',
        footerPrivacy: '100% processed in your browser', noUpload: 'No content uploads', noApi: 'No AI API calls', githubRepo: 'GitHub repository',
        previewFailed: 'Preview failed. Check the Markdown source.', diagramFailed: 'Could not parse this diagram. Mermaid source was preserved.', previewTooLong: 'Preview paused because this document exceeds 150,000 characters. You can still copy or download the full result.',
        changeMessages: {
            '统一标题序号与层级': 'Standardized heading numbering and levels', '同步调整标题层级': 'Adjusted heading levels', '超出 H6 的标题已降级为加粗文字和表情序号，不再属于标题大纲': 'Headings beyond H6 were converted to bold text with emoji numbering and removed from the outline.',
            '文本超过 200 万字符，请拆分后清洗；当前保留原文': 'Text exceeds 2 million characters. Split it into smaller parts; the original text was preserved.', '移除中文句号“。”': 'Removed Chinese full stops.', '移除行尾空格（会取消 Markdown 硬换行）': 'Removed trailing spaces (this can remove Markdown hard line breaks).', '压缩连续空行为一个空行': 'Collapsed consecutive blank lines.', '移除无法还原 URL 的平台内部引用': 'Removed internal platform references whose URLs could not be recovered.', '规范化异常空白或不可见控制字符': 'Normalized unusual whitespace or invisible control characters.', '发现双向文本控制字符，可能承载语言方向信息，已保留': 'Found bidirectional text control characters that may carry language direction information; preserved them.', '数学定界符未闭合，已保留原文': 'Unclosed math delimiters; preserved the original text.', '容器或表格内的块公式需要人工确认，已保留原文': 'Block math inside a container or table needs review; preserved the original text.', '公式存在错配环境、括号或歧义定界符，已保留原文': 'Mismatched environments, parentheses, or ambiguous delimiters; preserved the original formula.', '转换块级数学定界符': 'Converted block math delimiters', '转换行内数学定界符': 'Converted inline math delimiters', '公式包含编号或引用，保留环境供人工确认': 'Formula contains a number or reference; preserved the environment for review.', '独立数学环境转换为标准数学块': 'Converted standalone math environment to a standard math block.', '无法可靠转换数学环境，已保留原文': 'Could not safely convert the math environment; preserved the original text.', '规范化标题闭合标记或多余空行': 'Normalized heading closing markers or extra blank lines.', '移除可执行 HTML 区域': 'Removed executable HTML content.', '复杂或未知 HTML 已保留；预览不执行原始 HTML': 'Preserved complex or unknown HTML; raw HTML is not executed in preview.', 'HTML 转换为 Markdown': 'Converted HTML to Markdown.', '代码围栏未闭合：保留原文，请确认代码结束位置': 'Unclosed code fence; preserved the original text. Check where the code block should end.', '未知平台标记包含潜在信息，已保留：': 'Unknown platform marker may contain useful information and was preserved: '
        } as Record<string, string>
    }
} as const;

export type MessageKey = keyof typeof messages.zh;
export type Messages = Record<Exclude<MessageKey, 'changeMessages'>, string> & { changeMessages: Record<string, string> };
export const getMessages = (locale: Locale): Messages => messages[locale] as unknown as Messages;
