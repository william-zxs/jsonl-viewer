import { useMemo, useState } from "react";
import DropZone from "./components/DropZone";
import LineList from "./components/LineList";
import { parseJsonl, type ParsedLine } from "./lib/jsonl";

const PAGE_SIZE = 200;

type FilterType = "all" | "ok" | "error";

export default function App() {
  const [fileName, setFileName] = useState("");
  const [lines, setLines] = useState<ParsedLine[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLineSet, setExpandedLineSet] = useState<Set<number>>(new Set());

  const stats = useMemo(() => {
    const total = lines.length;
    const failed = lines.filter((line) => line.error).length;
    const success = total - failed;
    return { total, success, failed };
  }, [lines]);

  const filteredLines = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return lines
      .filter((line) => {
        if (filter === "ok") {
          if (line.error) {
            return false;
          }
        }
        if (filter === "error") {
          if (!line.error) {
            return false;
          }
        }
        if (!normalizedKeyword) {
          return true;
        }
        return line.raw.toLowerCase().includes(normalizedKeyword);
      });
  }, [filter, keyword, lines]);

  const filteredLineNumbers = useMemo(
    () => filteredLines.map((line) => line.lineNumber),
    [filteredLines]
  );

  const totalPages = Math.max(1, Math.ceil(filteredLineNumbers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setErrorMessage("");
    setFileName(file.name);
    setCurrentPage(1);
    setExpandedLineSet(new Set());
    try {
      const text = await file.text();
      setLines(parseJsonl(text));
    } catch (error) {
      const message = error instanceof Error ? error.message : "读取文件失败";
      setLines([]);
      setErrorMessage(message);
    } finally {
      setIsParsing(false);
    }
  };

  const toggleLine = (lineNumber: number) => {
    setExpandedLineSet((prev) => {
      const next = new Set(prev);
      if (next.has(lineNumber)) {
        next.delete(lineNumber);
      } else {
        next.add(lineNumber);
      }
      return next;
    });
  };

  const collapseCurrentPage = () => {
    const start = (safePage - 1) * PAGE_SIZE;
    const pageLineNumbers = filteredLineNumbers.slice(start, start + PAGE_SIZE);
    setExpandedLineSet((prev) => {
      const next = new Set(prev);
      pageLineNumbers.forEach((lineNumber) => next.delete(lineNumber));
      return next;
    });
  };

  const expandCurrentPage = () => {
    const start = (safePage - 1) * PAGE_SIZE;
    const pageLineNumbers = filteredLineNumbers.slice(start, start + PAGE_SIZE);
    setExpandedLineSet((prev) => {
      const next = new Set(prev);
      pageLineNumbers.forEach((lineNumber) => next.add(lineNumber));
      return next;
    });
  };

  return (
    <div className="app-shell">
      <header className="top-panel">
        <h1>JSONL Viewer</h1>
        <p>拖拽上传后按行展开 JSON，支持树形折叠分析</p>
      </header>

      <DropZone onFile={handleFile} disabled={isParsing} />

      <section className="stats-grid">
        <div className="stat-card">
          <span>总行数</span>
          <strong data-testid="stat-total">{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>成功</span>
          <strong data-testid="stat-success">{stats.success}</strong>
        </div>
        <div className="stat-card">
          <span>失败</span>
          <strong data-testid="stat-failed">{stats.failed}</strong>
        </div>
        <div className="stat-card">
          <span>文件</span>
          <strong className="truncate">{fileName || "未选择"}</strong>
        </div>
      </section>

      <section className="filter-row">
        <button
          type="button"
          className={`chip ${filter === "all" ? "active" : ""}`}
          onClick={() => {
            setFilter("all");
            setCurrentPage(1);
          }}
        >
          All
        </button>
        <button
          type="button"
          className={`chip ${filter === "ok" ? "active" : ""}`}
          onClick={() => {
            setFilter("ok");
            setCurrentPage(1);
          }}
        >
          OK
        </button>
        <button
          type="button"
          className={`chip ${filter === "error" ? "active" : ""}`}
          onClick={() => {
            setFilter("error");
            setCurrentPage(1);
          }}
        >
          ERROR
        </button>
        <input
          type="search"
          className="search-input"
          placeholder="全文检索（按原始行匹配）"
          aria-label="全文检索"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setCurrentPage(1);
          }}
        />
      </section>

      {errorMessage && <div className="error-banner">文件读取失败: {errorMessage}</div>}
      {isParsing && <div className="loading-tip">正在解析文件...</div>}

      <LineList
        lines={filteredLines}
        pageSize={PAGE_SIZE}
        currentPage={safePage}
        expandedLineSet={expandedLineSet}
        onToggleLine={toggleLine}
        onPageChange={setCurrentPage}
        onExpandCurrentPage={expandCurrentPage}
        onCollapseCurrentPage={collapseCurrentPage}
      />
    </div>
  );
}
