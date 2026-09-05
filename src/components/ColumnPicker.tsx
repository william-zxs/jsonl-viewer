import { useState } from "react";

type ColumnPickerProps = {
  columns: string[];
  visibleColumns: string[];
  onChange: (columns: string[]) => void;
  onClose: () => void;
};

export default function ColumnPicker({ columns, visibleColumns, onChange, onClose }: ColumnPickerProps) {
  const [customPath, setCustomPath] = useState("");
  const toggle = (column: string) => onChange(visibleColumns.includes(column) ? visibleColumns.filter((item) => item !== column) : [...visibleColumns, column]);
  const addCustomColumn = () => {
    const path = customPath.trim();
    if (path && !visibleColumns.includes(path)) onChange([...visibleColumns, path]);
    setCustomPath("");
  };
  return <div className="column-popover" role="dialog" aria-label="显示字段">
    <div className="popover-header"><strong>显示字段</strong><button type="button" className="close-button" onClick={onClose} aria-label="关闭">×</button></div>
    <p>默认显示 JSON 的第一层字段。也可输入嵌套字段路径。</p>
    <div className="column-options">
      {columns.map((column) => <label key={column}><input type="checkbox" checked={visibleColumns.includes(column)} onChange={() => toggle(column)} /> {column}</label>)}
    </div>
    <div className="custom-column"><input value={customPath} onChange={(event) => setCustomPath(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addCustomColumn()} placeholder="例如 request.id" aria-label="自定义字段路径" /><button type="button" className="button" onClick={addCustomColumn}>添加</button></div>
    {visibleColumns.filter((column) => !columns.includes(column)).map((column) => <div className="custom-column-item" key={column}><code>{column}</code><button type="button" onClick={() => toggle(column)} aria-label={`移除 ${column}`}>×</button></div>)}
  </div>;
}
