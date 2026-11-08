import type { Report } from './types';
export function cleanReferences(s: string, report: Report) {
    s = s.replace(/\uE200(?:cite|filecite|image_group)\uE202[^\uE201\n]*\uE201/g, () => { report('artifacts', '移除无法还原 URL 的平台内部引用'); return ''; });
    s = s.replace(/\uE200[^\uE201\n]*\uE201|<\/?(?:antArtifact|antThinking|artifact|citation)\b[^>]*>/gi, m => {
        report('artifacts', '未知平台标记包含潜在信息，已保留：' + m.slice(0, 60), 1, true);
        return m;
    });
    return s;
}
