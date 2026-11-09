export interface CleanOptions {
    normalizeMath: boolean;
    normalizeUnicode: boolean;
    normalizeMarkdown: boolean;
    cleanHtml: boolean;
    removeAiArtifacts: boolean;
    removeChinesePeriod: boolean;
    trimTrailingSpaces: boolean;
    collapseBlankLines: boolean;
    cleanBlankLineSpaces: boolean;
    numberHeadings?: boolean;
    highestHeadingLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    mode?: 'standard' | 'deep';
}
export type Category = 'math' | 'unicode' | 'markdown' | 'artifacts' | 'html';
export interface CleanChange {
    category: Category;
    message: string;
    count: number;
    warning?: boolean;
}
export interface CleanStatistics {
    math: number;
    unicode: number;
    markdown: number;
    artifacts: number;
    html: number;
    warnings: number;
}
export interface CleanResult {
    content: string;
    changes: CleanChange[];
    statistics: CleanStatistics;
}
export type Report = (category: Category, message: string, count?: number, warning?: boolean) => void;
export const defaultOptions: CleanOptions = { numberHeadings: true, normalizeMath: true, normalizeUnicode: true, normalizeMarkdown: true, cleanHtml: false, removeAiArtifacts: true, removeChinesePeriod: false, trimTrailingSpaces: false, collapseBlankLines: false, cleanBlankLineSpaces: false, mode: 'standard' };
