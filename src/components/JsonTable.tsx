import type { ViewerRow } from "../lib/viewer-api";
import { formatCellValue, getJsonPathValue } from "../lib/json-path";

type JsonTableProps = {
  rows: ViewerRow[];
  columns: string[];
  onOpenRow: (row: ViewerRow) => void;
};

function ExpandIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4H4v4.5M15.5 4H20v4.5M8.5 20H4v-4.5M20 15.5V20h-4.5" /></svg>;
}

export default function JsonTable({ rows, columns, onOpenRow }: JsonTableProps) {
  if (!rows.length) return <div className="empty-table">没有符合当前条件的记录。</div>;
  return <div className="table-scroll"><table className="json-table">
    <thead><tr><th className="line-number">#</th>{columns.map((column) => <th key={column}>{column}</th>)}<th className="actions-column"><span className="sr-only">详情</span></th></tr></thead>
    <tbody>{rows.map((row) => <tr key={row.lineNumber} className={row.error ? "row-error" : ""} onDoubleClick={() => onOpenRow(row)}>
      <td className="line-number">{row.lineNumber}</td>
      {columns.map((column) => <td key={column} title={row.error ? row.raw : formatCellValue(getJsonPathValue(row.parsed, column))}>{row.error ? (column === columns[0] ? "解析错误" : "—") : formatCellValue(getJsonPathValue(row.parsed, column))}</td>)}
      <td className="actions-column"><button type="button" className="row-action" onClick={() => onOpenRow(row)} aria-label={`全屏查看第 ${row.lineNumber} 行`}><ExpandIcon /></button></td>
    </tr>)}</tbody>
  </table></div>;
}
