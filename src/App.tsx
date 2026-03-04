import { useEffect, useMemo, useState } from "react";
import DropZone from "./components/DropZone";
import LineList from "./components/LineList";
import { parseJsonl, type ParsedLine } from "./lib/jsonl";
import exampleAgentSession from "../examples/example_agent_session.jsonl?raw";
import {
  LOCALE_STORAGE_KEY,
  resolveInitialLocale,
  t as translateMessage,
  type Locale,
  type TranslateFn
} from "./lib/i18n";

const PAGE_SIZE = 200;

type FilterType = "all" | "ok" | "error";
type PageViewStage = 0 | 1 | 2;

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale());
  const [fileName, setFileName] = useState("");
  const [lines, setLines] = useState<ParsedLine[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLineSet, setExpandedLineSet] = useState<Set<number>>(new Set());
  const [currentPageViewStage, setCurrentPageViewStage] = useState<PageViewStage>(0);
  const [pageTreeControlVersion, setPageTreeControlVersion] = useState(0);
  const [pageTreeControlMode, setPageTreeControlMode] = useState<"expand" | "collapse" | "reset" | null>(null);
  const t: TranslateFn = (key, params) => translateMessage(locale, key, params);

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

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

  const loadJsonlText = (name: string, text: string) => {
    setErrorMessage("");
    setFileName(name);
    setCurrentPage(1);
    setExpandedLineSet(new Set());
    setCurrentPageViewStage(0);
    setPageTreeControlMode(null);
    setPageTreeControlVersion(0);
    setLines(parseJsonl(text));
  };

  const handleFile = async (file: File) => {
    setIsParsing(true);
    try {
      const text = await file.text();
      loadJsonlText(file.name, text);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("readFileFailedUnknown");
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

  const setCurrentPageExpanded = (expanded: boolean) => {
    const start = (safePage - 1) * PAGE_SIZE;
    const pageLineNumbers = filteredLineNumbers.slice(start, start + PAGE_SIZE);
    setExpandedLineSet((prev) => {
      const next = new Set(prev);
      pageLineNumbers.forEach((lineNumber) => {
        if (expanded) {
          next.add(lineNumber);
        } else {
          next.delete(lineNumber);
        }
      });
      return next;
    });
  };

  const triggerPageTreeControl = (mode: "expand" | "collapse" | "reset") => {
    setPageTreeControlMode(mode);
    setPageTreeControlVersion((version) => version + 1);
  };

  const cycleCurrentPageView = () => {
    if (currentPageViewStage === 0) {
      setCurrentPageExpanded(true);
      triggerPageTreeControl("reset");
      setCurrentPageViewStage(1);
      return;
    }
    if (currentPageViewStage === 1) {
      setCurrentPageExpanded(true);
      triggerPageTreeControl("expand");
      setCurrentPageViewStage(2);
      return;
    }
    setCurrentPageExpanded(false);
    triggerPageTreeControl("collapse");
    setCurrentPageViewStage(0);
  };

  const handleTryExample = () => {
    loadJsonlText("example_agent_session.jsonl", exampleAgentSession);
  };

  return (
    <div className="app-shell">
      <header className="top-panel">
        <div className="top-panel-main">
          <h1>{t("appTitle")}</h1>
          <p>{t("appSubtitle")}</p>
        </div>
        <div className="lang-switch" role="group" aria-label={t("languageSwitcherAria")}>
          <button
            type="button"
            className={`lang-btn ${locale === "zh" ? "active" : ""}`}
            onClick={() => setLocale("zh")}
            aria-pressed={locale === "zh"}
          >
            {t("languageZh")}
          </button>
          <span className="lang-sep">/</span>
          <button
            type="button"
            className={`lang-btn ${locale === "en" ? "active" : ""}`}
            onClick={() => setLocale("en")}
            aria-pressed={locale === "en"}
          >
            {t("languageEn")}
          </button>
        </div>
      </header>

      <DropZone onFile={handleFile} disabled={isParsing} t={t} />
      <div className="example-row">
        <button type="button" className="ghost-btn example-btn" onClick={handleTryExample} disabled={isParsing}>
          {t("tryExample")}
        </button>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <span>{t("statTotal")}</span>
          <strong data-testid="stat-total">{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>{t("statSuccess")}</span>
          <strong data-testid="stat-success">{stats.success}</strong>
        </div>
        <div className="stat-card">
          <span>{t("statFailed")}</span>
          <strong data-testid="stat-failed">{stats.failed}</strong>
        </div>
        <div className="stat-card">
          <span>{t("statFile")}</span>
          <strong className="truncate">{fileName || t("fileNotSelected")}</strong>
        </div>
      </section>

      <section className="filter-row">
        <button
          type="button"
          className={`chip ${filter === "all" ? "active" : ""}`}
          onClick={() => {
            setFilter("all");
            setCurrentPage(1);
            setCurrentPageViewStage(0);
          }}
        >
          {t("filterAll")}
        </button>
        <button
          type="button"
          className={`chip ${filter === "ok" ? "active" : ""}`}
          onClick={() => {
            setFilter("ok");
            setCurrentPage(1);
            setCurrentPageViewStage(0);
          }}
        >
          {t("filterOk")}
        </button>
        <button
          type="button"
          className={`chip ${filter === "error" ? "active" : ""}`}
          onClick={() => {
            setFilter("error");
            setCurrentPage(1);
            setCurrentPageViewStage(0);
          }}
        >
          {t("filterError")}
        </button>
        <input
          type="search"
          className="search-input"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setCurrentPage(1);
            setCurrentPageViewStage(0);
          }}
        />
      </section>

      {errorMessage && <div className="error-banner">{t("readFileFailedPrefix", { message: errorMessage })}</div>}
      {isParsing && <div className="loading-tip">{t("loadingTip")}</div>}

      <LineList
        t={t}
        lines={filteredLines}
        pageSize={PAGE_SIZE}
        currentPage={safePage}
        expandedLineSet={expandedLineSet}
        onToggleLine={toggleLine}
        onPageChange={(page) => {
          setCurrentPage(page);
          setCurrentPageViewStage(0);
        }}
        currentPageViewStage={currentPageViewStage}
        onCycleCurrentPageView={cycleCurrentPageView}
        pageTreeControlVersion={pageTreeControlVersion}
        pageTreeControlMode={pageTreeControlMode}
      />
    </div>
  );
}
