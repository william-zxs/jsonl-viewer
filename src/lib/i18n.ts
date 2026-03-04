export type Locale = "zh" | "en";

export const LOCALE_STORAGE_KEY = "jsonl_viewer_locale";

export type MessageKey =
  | "appTitle"
  | "appSubtitle"
  | "languageSwitcherAria"
  | "languageZh"
  | "languageEn"
  | "statTotal"
  | "statSuccess"
  | "statFailed"
  | "statFile"
  | "fileNotSelected"
  | "filterAll"
  | "filterOk"
  | "filterError"
  | "searchPlaceholder"
  | "searchAria"
  | "readFileFailedUnknown"
  | "readFileFailedPrefix"
  | "loadingTip"
  | "dropZoneAria"
  | "pickFileAria"
  | "dropMain"
  | "dropSub"
  | "tryExample"
  | "showingCount"
  | "pageViewToLevel1"
  | "pageViewToAll"
  | "pageViewToCollapse"
  | "emptyState"
  | "prevPage"
  | "nextPage"
  | "lineTitle"
  | "lineSummaryParseFailed"
  | "lineSummaryArray"
  | "lineSummaryObject"
  | "expandLineAll"
  | "collapseLineAll"
  | "fullscreen"
  | "errorPrefix"
  | "fullscreenDialogLabel"
  | "fullscreenTitle"
  | "closeFullscreen"
  | "treeCollapseNode"
  | "treeExpandNode"
  | "treeCopyNode"
  | "treeCopied";

type Messages = Record<MessageKey, string>;
export type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>
) => string;

const messages: Record<Locale, Messages> = {
  zh: {
    appTitle: "JSONL Viewer",
    appSubtitle: "拖拽上传后按行展开 JSON，支持树形折叠分析",
    languageSwitcherAria: "切换语言",
    languageZh: "中",
    languageEn: "EN",
    statTotal: "总行数",
    statSuccess: "成功",
    statFailed: "失败",
    statFile: "文件",
    fileNotSelected: "未选择",
    filterAll: "All",
    filterOk: "OK",
    filterError: "ERROR",
    searchPlaceholder: "全文检索（按原始行匹配）",
    searchAria: "全文检索",
    readFileFailedUnknown: "读取文件失败",
    readFileFailedPrefix: "文件读取失败: {message}",
    loadingTip: "正在解析文件...",
    dropZoneAria: "上传 JSONL 文件",
    pickFileAria: "选择 JSONL 文件",
    dropMain: "拖拽 JSONL 文件到这里",
    dropSub: "或点击选择文件",
    tryExample: "试用示例",
    showingCount: "当前显示 {pageCount} / {total}",
    pageViewToLevel1: "当前页首层展开",
    pageViewToAll: "当前页全部展开",
    pageViewToCollapse: "当前页全部折叠",
    emptyState: "暂无数据",
    prevPage: "上一页",
    nextPage: "下一页",
    lineTitle: "第 {lineNumber} 行",
    lineSummaryParseFailed: "解析失败",
    lineSummaryArray: "数组({count})",
    lineSummaryObject: "对象({count}键)",
    expandLineAll: "展开该行全部",
    collapseLineAll: "折叠该行全部",
    fullscreen: "全屏",
    errorPrefix: "错误: {message}",
    fullscreenDialogLabel: "第 {lineNumber} 行 JSON 全屏",
    fullscreenTitle: "第 {lineNumber} 行 JSON",
    closeFullscreen: "关闭全屏",
    treeCollapseNode: "折叠节点",
    treeExpandNode: "展开节点",
    treeCopyNode: "复制",
    treeCopied: "已复制"
  },
  en: {
    appTitle: "JSONL Viewer",
    appSubtitle: "Upload a file and inspect JSON line by line with a collapsible tree",
    languageSwitcherAria: "Switch language",
    languageZh: "中",
    languageEn: "EN",
    statTotal: "Total",
    statSuccess: "Success",
    statFailed: "Failed",
    statFile: "File",
    fileNotSelected: "Not selected",
    filterAll: "All",
    filterOk: "OK",
    filterError: "ERROR",
    searchPlaceholder: "Search full text (matches raw lines)",
    searchAria: "Search full text",
    readFileFailedUnknown: "Failed to read file",
    readFileFailedPrefix: "File read failed: {message}",
    loadingTip: "Parsing file...",
    dropZoneAria: "Upload JSONL file",
    pickFileAria: "Select JSONL file",
    dropMain: "Drop your JSONL file here",
    dropSub: "or click to choose a file",
    tryExample: "Try Example",
    showingCount: "Showing {pageCount} / {total}",
    pageViewToLevel1: "Expand first level",
    pageViewToAll: "Expand all levels",
    pageViewToCollapse: "Collapse all",
    emptyState: "No data",
    prevPage: "Previous",
    nextPage: "Next",
    lineTitle: "Line {lineNumber}",
    lineSummaryParseFailed: "Parse failed",
    lineSummaryArray: "Array ({count})",
    lineSummaryObject: "Object ({count} keys)",
    expandLineAll: "Expand all in line",
    collapseLineAll: "Collapse all in line",
    fullscreen: "Fullscreen",
    errorPrefix: "Error: {message}",
    fullscreenDialogLabel: "Line {lineNumber} JSON Fullscreen",
    fullscreenTitle: "Line {lineNumber} JSON",
    closeFullscreen: "Close fullscreen",
    treeCollapseNode: "Collapse node",
    treeExpandNode: "Expand node",
    treeCopyNode: "Copy",
    treeCopied: "Copied"
  }
};

export function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en";
}

function detectBrowserLocale(): Locale {
  const browserLocales = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  return browserLocales.some((locale) => locale.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

export function resolveInitialLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(saved)) {
    return saved;
  }
  return detectBrowserLocale();
}

export function t(locale: Locale, key: MessageKey, params: Record<string, string | number> = {}): string {
  const template = messages[locale][key];
  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? ""));
}
