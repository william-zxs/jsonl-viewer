import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import ColumnPicker from "./components/ColumnPicker";
import FileTree from "./components/FileTree";
import JsonTable from "./components/JsonTable";
import JsonTree from "./components/JsonTree";
import ViewerToolbar from "./components/ViewerToolbar";
import { t } from "./lib/i18n";
import { fetchFile, fetchTree, type FileNode, type FilePayload, type QueryFilters, type ViewerRow } from "./lib/viewer-api";

const PAGE_SIZE = 100;
const EMPTY_FILTERS: QueryFilters = { page: 1, pageSize: PAGE_SIZE, search: "", status: "all", field: "", operator: "contains", value: "" };
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 480;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

export default function App() {
  const [rootName, setRootName] = useState("");
  const [rootNodes, setRootNodes] = useState<FileNode[]>([]);
  const [childNodes, setChildNodes] = useState<Record<string, FileNode[]>>({});
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState("");
  const [draftFilters, setDraftFilters] = useState<QueryFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<QueryFilters>(EMPTY_FILTERS);
  const [payload, setPayload] = useState<FilePayload | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [displayDepth, setDisplayDepth] = useState(1);
  const [showColumns, setShowColumns] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ViewerRow | null>(null);
  const [structuralAid, setStructuralAid] = useState<"off" | "compact" | "full">("compact");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(282);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const loadRoot = useCallback(async () => {
    try {
      const tree = await fetchTree();
      setRootName(tree.rootName);
      setRootNodes(tree.nodes);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "无法连接到 JSONL 服务");
    }
  }, []);

  useEffect(() => { void loadRoot(); }, [loadRoot]);

  const toggleDirectory = useCallback(async (path: string) => {
    if (childNodes[path]) {
      setChildNodes((previous) => {
        const next = { ...previous };
        delete next[path];
        return next;
      });
      return;
    }
    setLoadingPaths((previous) => new Set(previous).add(path));
    try {
      const tree = await fetchTree(path);
      setChildNodes((previous) => ({ ...previous, [path]: tree.nodes }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "无法读取目录");
    } finally {
      setLoadingPaths((previous) => {
        const next = new Set(previous);
        next.delete(path);
        return next;
      });
    }
  }, [childNodes]);

  useEffect(() => {
    if (!selectedPath) return;
    const controller = new AbortController();
    setIsLoadingFile(true);
    setError("");
    fetchFile(selectedPath, appliedFilters)
      .then((nextPayload) => {
        if (controller.signal.aborted) return;
        setPayload(nextPayload);
        setVisibleColumns((previous) => previous.length ? previous : (nextPayload.columnsByDepth["1"] || nextPayload.columns).slice(0, 6));
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "无法读取 JSONL 文件");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingFile(false);
      });
    return () => controller.abort();
  }, [appliedFilters, selectedPath]);

  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(selectedRow));
    return () => document.body.classList.remove("modal-open");
  }, [selectedRow]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setSelectedRow(null);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) return;
    const updateWidth = (event: PointerEvent) => {
      const maxWidth = Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth * 0.5);
      setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(maxWidth, window.innerWidth - event.clientX)));
    };
    const finishResize = () => setIsResizingSidebar(false);
    window.addEventListener("pointermove", updateWidth);
    window.addEventListener("pointerup", finishResize, { once: true });
    return () => {
      window.removeEventListener("pointermove", updateWidth);
      window.removeEventListener("pointerup", finishResize);
    };
  }, [isResizingSidebar]);

  const pageDescription = useMemo(() => {
    if (!payload) return "";
    const { page, pageSize, total } = payload.pagination;
    const start = total ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, total);
    return `${start}–${end} / ${total}`;
  }, [payload]);

  const openFile = (path: string) => {
    setSelectedPath(path);
    setPayload(null);
    setSelectedRow(null);
    setShowColumns(false);
    setVisibleColumns([]);
    setDisplayDepth(1);
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const applyFilters = () => setAppliedFilters({ ...draftFilters, page: 1 });
  const resetFilters = () => { setDraftFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); };
  const changePage = (page: number) => {
    const next = { ...appliedFilters, page };
    setAppliedFilters(next);
    setDraftFilters((previous) => ({ ...previous, page }));
  };
  const changeDisplayDepth = (depth: number) => {
    setDisplayDepth(depth);
    setVisibleColumns((payload?.columnsByDepth[String(depth)] || []).slice(0, 6));
    setShowColumns(false);
  };
  const shellStyle = { "--sidebar-width": isSidebarCollapsed ? "0px" : `${sidebarWidth}px` } as CSSProperties;

  return <div className={`viewer-shell ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${isResizingSidebar ? "sidebar-resizing" : ""}`} style={shellStyle}>
    <main className="viewer-main">
      <header className="app-header">
        <div className="brand"><span className="brand-mark">{`{}`}</span><span>JSONL Viewer</span></div>
        <div className="file-context">
          {payload ? <><span className="path-label">{rootName}</span><span className="path-separator">/</span><strong>{payload.file.path}</strong><span className="file-meta">{formatFileSize(payload.file.size)} · 更新于 {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(payload.file.updatedAt))}</span></> : <span>从右侧选择一个 JSONL 文件</span>}
        </div>
        <button type="button" className="button refresh-button" onClick={() => { void loadRoot(); if (selectedPath) setAppliedFilters({ ...appliedFilters }); }} aria-label="刷新">↻ <span>刷新</span></button>
      </header>

      {selectedPath ? <>
        <div className="toolbar-wrap"><ViewerToolbar draft={draftFilters} onChange={setDraftFilters} onApply={applyFilters} onReset={resetFilters} onOpenColumns={() => setShowColumns((previous) => !previous)} displayDepth={displayDepth} onDisplayDepthChange={changeDisplayDepth} />{showColumns && payload && <ColumnPicker columns={payload.columnsByDepth[String(displayDepth)] || []} visibleColumns={visibleColumns} onChange={setVisibleColumns} onClose={() => setShowColumns(false)} />}</div>
        {error && <div className="notice notice-error">{error}</div>}
        {isLoadingFile && <div className="loading-line">正在读取文件…</div>}
        {payload && <>
          <div className="data-summary"><span>{pageDescription} 条匹配记录</span><span>共 {payload.stats.total} 行 · 有效 {payload.stats.valid} · 错误 {payload.stats.failed}</span></div>
          <JsonTable rows={payload.rows} columns={visibleColumns} onOpenRow={setSelectedRow} />
          <nav className="pagination" aria-label="分页">
            <button type="button" className="button" disabled={payload.pagination.page <= 1 || isLoadingFile} onClick={() => changePage(payload.pagination.page - 1)}>上一页</button>
            <span>第 {payload.pagination.page} / {payload.pagination.totalPages} 页</span>
            <button type="button" className="button" disabled={payload.pagination.page >= payload.pagination.totalPages || isLoadingFile} onClick={() => changePage(payload.pagination.page + 1)}>下一页</button>
          </nav>
        </>}
      </> : <div className="welcome-state"><div className="welcome-symbol">{`{ }`}</div><h1>选择一个 JSONL 文件</h1><p>目录中的 JSONL 文件会显示在右侧。每一行对应一条 JSON 记录，可筛选字段并全屏查看详情。</p></div>}
    </main>
    {!isSidebarCollapsed && <div className="sidebar-resizer" role="separator" aria-label="调整文件栏宽度" aria-orientation="vertical" onPointerDown={(event) => { event.preventDefault(); setIsResizingSidebar(true); }} />}
    <FileTree rootName={rootName} rootNodes={rootNodes} childNodes={childNodes} loadingPaths={loadingPaths} selectedPath={selectedPath} onToggleDirectory={toggleDirectory} onSelectFile={openFile} />
    <button type="button" className="sidebar-toggle" onClick={() => setIsSidebarCollapsed((previous) => !previous)} aria-label={isSidebarCollapsed ? "展开文件栏" : "收起文件栏"} title={isSidebarCollapsed ? "展开文件栏" : "收起文件栏"}>{isSidebarCollapsed ? "‹" : "›"}</button>
    {selectedRow && <div className="json-dialog-backdrop" role="presentation" onMouseDown={() => setSelectedRow(null)}><section className="json-dialog" role="dialog" aria-modal="true" aria-label={`第 ${selectedRow.lineNumber} 行 JSON`} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="dialog-kicker">第 {selectedRow.lineNumber} 行</span><h2>{selectedRow.error ? "无法解析此行 JSON" : "完整 JSON"}</h2></div><div className="dialog-header-actions"><label className="structural-aid-control">结构辅助<select value={structuralAid} onChange={(event) => setStructuralAid(event.target.value as "off" | "compact" | "full")} aria-label="结构辅助"><option value="off">关闭</option><option value="compact">简洁</option><option value="full">完整</option></select></label><button type="button" className="dialog-close" onClick={() => setSelectedRow(null)} aria-label="关闭全屏"><CloseIcon /></button></div></header><div className="json-dialog-content">{selectedRow.error ? <><p className="dialog-error">{selectedRow.error}</p><pre>{selectedRow.raw}</pre></> : <JsonTree t={(key, params) => t("zh", key, params)} data={selectedRow.parsed} defaultExpandedDepth={2} structuralAid={structuralAid} />}</div></section></div>}
  </div>;
}
