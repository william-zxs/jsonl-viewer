import type { QueryFilters } from "../lib/viewer-api";

type ViewerToolbarProps = {
  draft: QueryFilters;
  onChange: (next: QueryFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onOpenColumns: () => void;
  displayDepth: number;
  onDisplayDepthChange: (depth: number) => void;
};

export default function ViewerToolbar({ draft, onChange, onApply, onReset, onOpenColumns, displayDepth, onDisplayDepthChange }: ViewerToolbarProps) {
  const update = (key: keyof QueryFilters, value: string) => onChange({ ...draft, [key]: value, page: 1 });
  return <div className="viewer-toolbar">
    <label className="search-control">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="5.7" /><path d="m15.2 15.2 4 4" /></svg>
      <input value={draft.search} onChange={(event) => update("search", event.target.value)} onKeyDown={(event) => event.key === "Enter" && onApply()} placeholder="搜索原始 JSON" aria-label="搜索原始 JSON" />
    </label>
    <div className="filter-group">
      <input value={draft.field} onChange={(event) => update("field", event.target.value)} placeholder="字段路径，如 response.code" aria-label="筛选字段路径" />
      <select value={draft.operator} onChange={(event) => update("operator", event.target.value)} aria-label="筛选条件">
        <option value="contains">包含</option><option value="eq">等于</option><option value="neq">不等于</option><option value="exists">存在</option><option value="gt">大于</option><option value="gte">大于等于</option><option value="lt">小于</option><option value="lte">小于等于</option>
      </select>
      <input value={draft.value} onChange={(event) => update("value", event.target.value)} onKeyDown={(event) => event.key === "Enter" && onApply()} placeholder="筛选值" aria-label="筛选值" disabled={draft.operator === "exists"} />
    </div>
    <select className="status-select" value={draft.status} onChange={(event) => update("status", event.target.value)} aria-label="解析状态">
      <option value="all">全部记录</option><option value="valid">仅有效 JSON</option><option value="error">仅解析错误</option>
    </select>
    <select className="depth-select" value={displayDepth} onChange={(event) => onDisplayDepthChange(Number(event.target.value))} aria-label="显示层级">
      <option value="1">第 1 层</option><option value="2">第 2 层</option><option value="3">第 3 层</option><option value="4">第 4 层</option>
    </select>
    <button type="button" className="button button-primary" onClick={onApply}>应用</button>
    <button type="button" className="button" onClick={onOpenColumns}>显示字段</button>
    <button type="button" className="button button-quiet" onClick={onReset}>重置</button>
  </div>;
}
