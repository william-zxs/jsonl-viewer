import LineItem from "./LineItem";
import type { ParsedLine } from "../lib/jsonl";
import type { TranslateFn } from "../lib/i18n";

type LineListProps = {
  t: TranslateFn;
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
  t,
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
          {t("showingCount", { pageCount: pageItems.length, total: lines.length })}
        </span>
        <div className="toolbar-actions">
          <button type="button" className="ghost-btn" onClick={onExpandCurrentPage}>
            {t("expandCurrentPage")}
          </button>
          <button type="button" className="ghost-btn" onClick={onCollapseCurrentPage}>
            {t("collapseCurrentPage")}
          </button>
        </div>
      </div>

      {pageItems.length === 0 && <div className="empty-state">{t("emptyState")}</div>}

      {pageItems.map((line) => (
        <LineItem
          key={line.lineNumber}
          t={t}
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
          {t("prevPage")}
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
          {t("nextPage")}
        </button>
      </div>
    </section>
  );
}
