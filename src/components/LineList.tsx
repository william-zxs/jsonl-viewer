import LineItem from "./LineItem";
import type { ParsedLine } from "../lib/jsonl";
import type { TranslateFn } from "../lib/i18n";
import type { LineTagMap } from "../lib/openrouter";

type LineListProps = {
  t: TranslateFn;
  lines: ParsedLine[];
  lineTags: LineTagMap;
  pageSize: number;
  currentPage: number;
  expandedLineSet: Set<number>;
  onToggleLine: (lineNumber: number) => void;
  onPageChange: (page: number) => void;
  currentPageViewStage: 0 | 1 | 2;
  onCycleCurrentPageView: () => void;
  pageTreeControlVersion: number;
  pageTreeControlMode: "expand" | "collapse" | "reset" | null;
};

export default function LineList({
  t,
  lines,
  lineTags,
  pageSize,
  currentPage,
  expandedLineSet,
  onToggleLine,
  onPageChange,
  currentPageViewStage,
  onCycleCurrentPageView,
  pageTreeControlVersion,
  pageTreeControlMode
}: LineListProps) {
  const totalPages = Math.max(1, Math.ceil(lines.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = lines.slice(startIndex, startIndex + pageSize);
  const cycleBtnLabel =
    currentPageViewStage === 0
      ? t("pageViewToLevel1")
      : currentPageViewStage === 1
        ? t("pageViewToAll")
        : t("pageViewToCollapse");
  const cycleBtnClass = `ghost-btn page-cycle-btn stage-${currentPageViewStage}`;

  return (
    <section className="line-list">
      <div className="line-list-toolbar">
        <span>
          {t("showingCount", { pageCount: pageItems.length, total: lines.length })}
        </span>
        <div className="toolbar-actions">
          <button
            type="button"
            className={cycleBtnClass}
            onClick={onCycleCurrentPageView}
            disabled={pageItems.length === 0}
          >
            {cycleBtnLabel}
          </button>
        </div>
      </div>

      {pageItems.length === 0 && <div className="empty-state">{t("emptyState")}</div>}

      {pageItems.map((line) => (
        <LineItem
          key={line.lineNumber}
          t={t}
          line={line}
          aiTag={lineTags[line.lineNumber]}
          expanded={expandedLineSet.has(line.lineNumber)}
          onToggle={onToggleLine}
          pageControlVersion={pageTreeControlVersion}
          pageControlMode={pageTreeControlMode}
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
