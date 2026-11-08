# AI Markdown Cleaner

将 AI 回答整理为整洁、易读 Markdown 的浏览器本地工具。React、TypeScript 严格模式、Vite、Tailwind CSS、Lucide、unified / remark、KaTeX、DOMPurify。无需登录、后端、数据库或 API Key。

## 开发与验证

需要 Node.js 22 与 npm。

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

开发地址以终端 Vite 输出为准。生产文件在 `dist/`。

可复制 `.env.example` 为 `.env.local`，设置 `VITE_GITHUB_URL`。未配置时隐藏 GitHub 入口，避免提供虚构项目地址。仅接受 HTTPS 地址。

## 使用

1. 粘贴 AI 回答，或者导入 UTF-8 的 .md / .txt 文件。
2. 默认标准模式保守清洗，220ms debounce 后在模块 Web Worker 处理。
3. 在右侧查看源码或预览，并检查清洗概览中的待确认提示。
4. 点击复制结果，粘贴到常用 Markdown 笔记应用；复制始终使用 Markdown 源码。
5. 支持下载 `cleaned-note.md`、清空、载入真实混合示例、切换浅色 / 深色 / 系统主题。

快捷键：⌘⇧C / Ctrl+Shift+C 复制清洗源码；⌘Enter / Ctrl+Enter 聚焦输入。浏览器拒绝剪贴板权限时，提示手动复制 / 粘贴。处理中禁用复制和下载，避免导出旧结果。

仅主题存储在 localStorage。刷新会清空输入和清洗选项，不保存用户文本。

## 清洗引擎

```ts
import { cleanMarkdown, defaultOptions } from './src/lib/cleaner';

const result = cleanMarkdown(input, defaultOptions);
// result.content / result.changes / result.statistics
```

引擎不依赖 React 或浏览器 DOM，可在 Worker 中使用：

- 使用 remark AST 的源位置保护围栏代码、行内代码、缩进代码和原始 HTML pre / code 容器；还保护双链、嵌入和高亮。
- 状态扫描匹配 LaTeX 定界符，尊重转义、已有 dollar 公式、数学环境堆栈。
- 转换行内 `\(...\)` 和块级 `\[...\]`；保留 LaTeX 命令。
- 独立 equation / align / gather 环境安全转换；aligned / cases 保留内层环境。带 label / tag / ref、错配环境和不闭合定界符保留并警告。
- 后续转换再次保护数学区，避免数学竖线和公式内容被结构或 HTML 处理破坏。
- 清理明确异常空白、零宽空格、BOM、控制字符和异常换行；保留 ZWJ、变体选择符、CJK、数学符号；双向控制字符仅警告。
- Markdown 结构采用保守的局部规范化：标题闭合标记、深度模式多余空行。通过 AST 解析但不全量重新序列化，避免改变代码、列表层级、表格转义和常见 Markdown 扩展语法。
- 使用 parse5 HTML AST 递归转换简单加粗、斜体、段落、换行、链接和列表；未知元素保留并警告。可执行区域删除并记录。
- 删除可明确识别的 ChatGPT 内部引用标记，不伪造 URL。未知 Claude / Gemini / 组件标记包含潜在信息时保留并提示。
- 未闭合代码围栏保留并提示，不擅自把正文猜成代码。
- 修改和警告分别统计，待确认内容不会被统计为已修复。

标准模式默认不转换 HTML；深度模式开启 HTML 转换和空行收敛。全部规则可以在设置中单独切换。

## 预览与安全

预览通过 remark-gfm、remark-math、remark-rehype、rehype-katex 生成 HTML，然后统一经过 DOMPurify。KaTeX 使用 `trust: false`，原始 HTML 不直接渲染。

预览不加载图片，包括外链图片，避免第三方资源请求暴露访问记录；源码中的合法图片路径保留。生产 CSP 进一步限制网络连接、远程图片、脚本、框架与对象。KaTeX 字体随 Vite 打包，不使用 CDN。

支持常规 Markdown、GFM 与数学预览。Mermaid 显示代码；常见扩展语法会保留源码，网页预览专注于标准 Markdown、GFM 与数学公式。

安全预览不代表输出可以插入其他网站的 innerHTML；本工具导出的原始 Markdown 仍可能包含保留的复杂 HTML。

## 性能边界

- 最大清洗长度 200 万 UTF-16 字符；超过后保留原文并警告。
- 文件导入限制 4 MB，按 UTF-8 读取。
- 大于 15 万字符不运行预览；清洗、源码、复制和下载可用。
- 输入计数为 JavaScript UTF-16 长度，并非 Unicode 字素数。
- 超长或畸形输入仍可能需要等待；Worker 防止清洗阻塞编辑器，序号校验避免旧结果覆盖新输入。

## 测试与当前验证状态

`src/tests/cleaner.test.ts` 包含 36 项 Vitest 测试，使用 jsdom 验证预览安全。真实场景数据 `src/tests/scenario.md` 包括考研数学、408 组成原理、数据结构 C 代码、GFM 表格、多行公式、Mermaid、AI 引用及中英混排。

本次开发环境验证：

- 10 项独立模块检查通过：行内 / 块级数学、数学幂等、已有公式、独立环境、Unicode、HTML 嵌套幂等、HTML 列表、脚本删除、AI 引用。
- `npm run typecheck`：已执行，未通过；本机没有 unified / remark / rehype / Vitest 依赖。
- `npm test`：已执行，Vitest 未安装，测试套件未运行。
- `npm run build`：已执行，被上述依赖缺失阻塞，尚无经过验证的生产产物。
- `npm install`：代理连接报 EPERM；无代理直连报 DNS ENOTFOUND。未生成 lockfile。
- 未完成真实浏览器交互、真实笔记应用粘贴验证或 Cloudflare 部署。不能把独立模块检查当作完整验收。

请在联网环境执行上述全部命令。依赖可用后，应提交生成的 package-lock.json，并改用 npm ci 获得可重复安装。

## Cloudflare Pages

静态输出无需 Functions、数据库、R2 或服务器。

1. 将项目上传至 Git 仓库，在 Cloudflare Pages 中连接仓库。
2. Framework preset 选择 Vite，根目录为本项目目录。
3. Build command：`npm run build`；Output directory：`dist`。
4. 设置环境变量 `NODE_VERSION=22`，按需设置 `VITE_GITHUB_URL`。
5. Cloudflare 安装依赖后构建；必须先确认本地类型检查、完整测试及构建通过，再发布。
6. `public/_headers` 会自动进入 dist 并应用安全响应头。

若使用 Pages 的 Git 集成，填写构建命令 `npm run build` 和产物目录 `dist`，让 Pages 在构建后自动发布；不要再配置 `npx wrangler deploy` 作为部署命令。若使用手动上传 / Wrangler 发布，构建后执行 `npm run deploy:pages`，该脚本会调用 `wrangler pages deploy dist --project-name ai-markdown-cleaner`。

`wrangler.toml` 配置 Pages 静态产物目录。开发服务器使用 Vite 自己的响应头，不应用 Pages 的生产 CSP。

## 目录

```text
src/
  App.tsx                    工作台、设置、主题、导入和导出
  main.tsx
  style.css
  components/Preview.tsx
  hooks/useCleaner.ts        debounce、Worker 生命周期和版本校验
  lib/
    cleaner.worker.ts
    preview.ts               GFM / KaTeX + DOMPurify
    cleaner/
      index.ts               纯清洗 API
      types.ts
      protect.ts             AST 源码保护
      math.ts
      unicode.ts
      markdown.ts
      html.ts
      references.ts
  tests/
    cleaner.test.ts
    scenario.md
    scenario.ts
public/_headers
vite.config.ts
tsconfig.json
wrangler.toml
```

## 兼容性限制

- 不恢复无 URL 的平台引用，未知平台格式保留提示；无法保证覆盖平台未来格式。
- 不补齐具有歧义的代码围栏或公式，不自动修正列表层级或损坏表格。
- 以通用 Markdown 阅读器为目标，不模拟各应用插件、公式宏和 Mermaid 版本。
- 不把正常货币 dollar 文本猜成数学；损坏的 dollar 公式不自动修复。
- HTML 仅转换能够确定语义的子集，复杂元素及其内容保留原文，标准预览忽略原始 HTML。
- 部分浏览器剪贴板 API 需要 HTTPS 或 localhost，并需要用户授权。
