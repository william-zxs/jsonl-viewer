import LineItem from "./LineItem";
import type { ParsedLine } from "../lib/jsonl";

type LineListProps = {
  lines: ParsedLine[];
  pageSize: number;
  currentPage: number;
  expandedLineSet: Set<number>;
  onToggleLine: (lineNumber: number) => void;
  onPageChange: (page: number) => void;
  onExpandCurrentPage: () => void;
  onCollapseCurrentPage: () => void;
};

export default function LineList({
  lines,
  pageSize,
  currentPage,
  expandedLineSet,
  onToggleLine,
  onPageChange,
  onExpandCurrentPage,
  onCollapseCurrentPage
}: LineListProps) {
  const totalPages = Math.max(1, Math.ceil(lines.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = lines.slice(startIndex, startIndex + pageSize);

  return (
    <section className="line-list">
      <div className="line-list-toolbar">
        <span>
          当前显示 {pageItems.length} / {lines.length}
        </span>
        <div className="toolbar-actions">
          <button type="button" className="ghost-btn" onClick={onExpandCurrentPage}>
            展开当前页全部
          </button>
          <button type="button" className="ghost-btn" onClick={onCollapseCurrentPage}>
            折叠当前页全部
          </button>
        </div>
      </div>

      {pageItems.length === 0 && <div className="empty-state">暂无数据</div>}

      {pageItems.map((line) => (
        <LineItem
          key={line.lineNumber}
          line={line}
          expanded={expandedLineSet.has(line.lineNumber)}
          onToggle={onToggleLine}
        />
      ))}

      <div className="pagination">
        <button
          type="button"
          className="ghost-btn"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          上一页
        </button>
        <span data-testid="pagination-text">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          className="ghost-btn"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          下一页
        </button>
      </div>
    </section>
  );
}
