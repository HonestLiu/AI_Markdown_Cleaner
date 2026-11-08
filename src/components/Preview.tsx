import { useMemo } from 'react';
import { renderPreview } from '../lib/preview';
export function Preview({ content }: {
    content: string;
}) {
    const html = useMemo(() => { try {
        return content.length > 150000 ? '' : renderPreview(content);
    }
    catch {
        return '<p>预览失败，请查看 Markdown 源码。</p>';
    } }, [content]);
    if (content.length > 150000)
        return <div className="preview-note">文档较大，已暂停渲染预览以保持流畅。完整结果仍可复制和下载。</div>;
    return <article className="prose" dangerouslySetInnerHTML={{ __html: html }}/>;
}
