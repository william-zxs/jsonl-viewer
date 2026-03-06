import { useEffect, useMemo, useRef, useState } from "react";
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
import { summarizeJsonLineTags, type LineTagMap } from "./lib/openrouter";

const PAGE_SIZE = 200;
const OPENROUTER_API_KEY_STORAGE_KEY = "jsonl_viewer_openrouter_api_key";
const OPENROUTER_MODEL_STORAGE_KEY = "jsonl_viewer_openrouter_model";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-5-nano";

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
  const [openRouterApiKey, setOpenRouterApiKey] = useState(() => localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY) ?? "");
  const [openRouterModel, setOpenRouterModel] = useState(() => localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY) ?? DEFAULT_OPENROUTER_MODEL);
  const [lineTags, setLineTags] = useState<LineTagMap>({});
  const [isTagging, setIsTagging] = useState(false);
  const [taggingErrorMessage, setTaggingErrorMessage] = useState("");
  const [taggingRequestVersion, setTaggingRequestVersion] = useState(0);
  const lastCompletedTaggingVersionRef = useRef(0);
  const t: TranslateFn = (key, params) => translateMessage(locale, key, params);

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, openRouterApiKey);
  }, [openRouterApiKey]);

  useEffect(() => {
    localStorage.setItem(OPENROUTER_MODEL_STORAGE_KEY, openRouterModel);
  }, [openRouterModel]);

  useEffect(() => {
    if (taggingRequestVersion === 0 || taggingRequestVersion === lastCompletedTaggingVersionRef.current) {
      return;
    }
    if (!openRouterApiKey.trim() || lines.length === 0) {
      return;
    }

    const abortController = new AbortController();
    setIsTagging(true);
    setTaggingErrorMessage("");

    void summarizeJsonLineTags({
      apiKey: openRouterApiKey.trim(),
      model: openRouterModel.trim() || DEFAULT_OPENROUTER_MODEL,
      locale,
      lines,
      signal: abortController.signal
    })
      .then((nextLineTags) => {
        setLineTags(nextLineTags);
        lastCompletedTaggingVersionRef.current = taggingRequestVersion;
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        setTaggingErrorMessage(message);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsTagging(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [lines, locale, openRouterApiKey, openRouterModel, taggingRequestVersion]);

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

  const resetViewer = () => {
    setFileName("");
    setLines([]);
    setErrorMessage("");
    setFilter("all");
    setKeyword("");
    setCurrentPage(1);
    setExpandedLineSet(new Set());
    setCurrentPageViewStage(0);
    setPageTreeControlMode(null);
    setPageTreeControlVersion(0);
    setLineTags({});
    setTaggingErrorMessage("");
    setIsTagging(false);
    lastCompletedTaggingVersionRef.current = 0;
  };

  const loadJsonlText = (name: string, text: string) => {
    resetViewer();
    setFileName(name);
    setLines(parseJsonl(text));
    if (openRouterApiKey.trim()) {
      setTaggingRequestVersion((version) => version + 1);
    }
  };

  const handleFile = async (file: File) => {
    setIsParsing(true);
    try {
      const text = await file.text();
      loadJsonlText(file.name, text);
    } catch (error) {
      resetViewer();
      const message = error instanceof Error ? error.message : t("readFileFailedUnknown");
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

  const handleGenerateLineTags = () => {
    setTaggingErrorMessage("");
    setLineTags({});
    lastCompletedTaggingVersionRef.current = 0;
    setTaggingRequestVersion((version) => version + 1);
  };

  const taggedLineCount = Object.keys(lineTags).length;

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
        <button type="button" className="ghost-btn example-btn" onClick={resetViewer} disabled={isParsing}>
          {t("clearAll")}
        </button>
      </div>

      <section className="ai-panel">
        <div className="ai-panel-head">
          <div>
            <strong>{t("aiPanelTitle")}</strong>
            <p>{t("aiPanelHint")}</p>
          </div>
          <span className={`ai-panel-status ${openRouterApiKey.trim() ? "is-ready" : ""}`}>
            {openRouterApiKey.trim() ? t("aiReadyAuto") : t("aiStatusIdle")}
          </span>
        </div>
        <div className="ai-panel-grid">
          <label className="field">
            <span>{t("aiKeyLabel")}</span>
            <input
              type="password"
              className="text-input"
              placeholder={t("aiKeyPlaceholder")}
              value={openRouterApiKey}
              onChange={(event) => setOpenRouterApiKey(event.target.value)}
            />
          </label>
          <label className="field">
            <span>{t("aiModelLabel")}</span>
            <input
              type="text"
              className="text-input"
              placeholder={t("aiModelPlaceholder")}
              value={openRouterModel}
              onChange={(event) => setOpenRouterModel(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="ghost-btn ai-generate-btn"
            onClick={handleGenerateLineTags}
            disabled={isParsing || isTagging || lines.length === 0 || !openRouterApiKey.trim()}
          >
            {isTagging ? t("aiGenerating") : t("aiGenerate")}
          </button>
        </div>
        {taggingErrorMessage && <div className="error-banner">{t("aiErrorPrefix", { message: taggingErrorMessage })}</div>}
        {!taggingErrorMessage && taggedLineCount > 0 && (
          <div className="loading-tip ai-done-tip">{t("aiStatusDone", { count: taggedLineCount })}</div>
        )}
      </section>

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
        lineTags={lineTags}
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
