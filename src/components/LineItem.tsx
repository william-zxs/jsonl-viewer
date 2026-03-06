import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import JsonTree from "./JsonTree";
import type { ParsedLine } from "../lib/jsonl";
import type { TranslateFn } from "../lib/i18n";

type LineItemProps = {
  t: TranslateFn;
  line: ParsedLine;
  aiTag?: string;
  expanded: boolean;
  onToggle: (lineNumber: number) => void;
  pageControlVersion?: number;
  pageControlMode?: "expand" | "collapse" | "reset" | null;
};

function summarize(t: TranslateFn, raw: string, parsed: unknown | null, error: string | null): string {
  const charCount = Array.from(raw).length;
  const charCountText = t("lineCharCount", { count: charCount });
  if (error) {
    return `${t("lineSummaryParseFailed")} · ${charCountText}`;
  }
  if (parsed === null) {
    return `null · ${charCountText}`;
  }
  if (Array.isArray(parsed)) {
    return `${t("lineSummaryArray", { count: parsed.length })} · ${charCountText}`;
  }
  if (typeof parsed === "object") {
    return `${t("lineSummaryObject", { count: Object.keys(parsed as Record<string, unknown>).length })} · ${charCountText}`;
  }
  return `${typeof parsed} · ${charCountText}`;
}

export default function LineItem({
  t,
  line,
  aiTag,
  expanded,
  onToggle,
  pageControlVersion = 0,
  pageControlMode = null
}: LineItemProps) {
  const status = line.error ? "ERROR" : "OK";
  const summary = summarize(t, line.raw, line.parsed, line.error);
  const [controlVersion, setControlVersion] = useState(0);
  const [controlMode, setControlMode] = useState<"expand" | "collapse" | "reset" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevPageControlVersion = useRef(pageControlVersion);
  const suppressSingleClickRef = useRef(false);
  const singleClickTimerRef = useRef<number | null>(null);
  const triggerExpandAll = () => {
    setControlMode("expand");
    setControlVersion((v) => v + 1);
  };
  const openFullscreen = () => {
    triggerExpandAll();
    setIsFullscreen(true);
  };
  const handleLineHeadClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail > 1) {
      return;
    }
    if (singleClickTimerRef.current !== null) {
      window.clearTimeout(singleClickTimerRef.current);
    }
    singleClickTimerRef.current = window.setTimeout(() => {
      if (suppressSingleClickRef.current) {
        suppressSingleClickRef.current = false;
        singleClickTimerRef.current = null;
        return;
      }
      if (expanded) {
        onToggle(line.lineNumber);
      } else {
        triggerExpandAll();
        onToggle(line.lineNumber);
      }
      singleClickTimerRef.current = null;
    }, 0);
  };
  const handleLineHeadDoubleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    suppressSingleClickRef.current = true;
    if (singleClickTimerRef.current !== null) {
      window.clearTimeout(singleClickTimerRef.current);
      singleClickTimerRef.current = null;
    }
    if (line.error) {
      return;
    }
    openFullscreen();
  };

  useEffect(() => {
    if (pageControlVersion !== prevPageControlVersion.current && pageControlMode) {
      setControlMode(pageControlMode);
      setControlVersion((v) => v + 1);
      prevPageControlVersion.current = pageControlVersion;
    }
  }, [pageControlMode, pageControlVersion]);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    document.body.classList.add("modal-open");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [isFullscreen]);

  useEffect(
    () => () => {
      if (singleClickTimerRef.current !== null) {
        window.clearTimeout(singleClickTimerRef.current);
      }
    },
    []
  );

  return (
    <article className={`line-item ${line.error ? "line-error" : ""} ${expanded ? "is-expanded" : ""}`}>
      <div className="line-head">
        <button
          type="button"
          className="line-head-main"
          onClick={handleLineHeadClick}
          onDoubleClick={handleLineHeadDoubleClick}
          aria-expanded={expanded}
        >
          <span className="line-title">{t("lineTitle", { lineNumber: line.lineNumber })}</span>
          <span className={`line-status ${status === "OK" ? "status-ok" : "status-error"}`}>{status}</span>
          {aiTag && <span className="line-ai-tag">{aiTag}</span>}
          <span className="line-summary">{summary}</span>
        </button>
        {!line.error && (
          <div className="line-head-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={openFullscreen}
              aria-label={t("fullscreen")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="line-body">
          {line.error ? (
            <>
              <p className="error-text">{t("errorPrefix", { message: line.error })}</p>
              <pre className="raw-line">{line.raw}</pre>
            </>
          ) : (
            <JsonTree data={line.parsed} controlVersion={controlVersion} controlMode={controlMode} t={t} />
          )}
        </div>
      )}
      {!line.error && isFullscreen && (
        <div
          className="line-fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("fullscreenDialogLabel", { lineNumber: line.lineNumber })}
          onClick={() => setIsFullscreen(false)}
        >
          <div className="line-fullscreen-panel" onClick={(event) => event.stopPropagation()}>
            <div className="line-fullscreen-header">
              <strong>{t("fullscreenTitle", { lineNumber: line.lineNumber })}</strong>
              <div className="line-fullscreen-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsFullscreen(false)}
                  aria-label={t("closeFullscreen")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="line-fullscreen-content">
              <JsonTree data={line.parsed} controlVersion={controlVersion} controlMode={controlMode} t={t} />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
