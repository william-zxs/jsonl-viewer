import { useEffect, useState } from "react";
import JsonTree from "./JsonTree";
import type { ParsedLine } from "../lib/jsonl";
import type { TranslateFn } from "../lib/i18n";

type LineItemProps = {
  t: TranslateFn;
  line: ParsedLine;
  expanded: boolean;
  onToggle: (lineNumber: number) => void;
};

function summarize(t: TranslateFn, parsed: unknown | null, error: string | null): string {
  if (error) {
    return t("lineSummaryParseFailed");
  }
  if (parsed === null) {
    return "null";
  }
  if (Array.isArray(parsed)) {
    return t("lineSummaryArray", { count: parsed.length });
  }
  if (typeof parsed === "object") {
    return t("lineSummaryObject", { count: Object.keys(parsed as Record<string, unknown>).length });
  }
  return typeof parsed;
}

export default function LineItem({ t, line, expanded, onToggle }: LineItemProps) {
  const status = line.error ? "ERROR" : "OK";
  const summary = summarize(t, line.parsed, line.error);
  const [controlVersion, setControlVersion] = useState(0);
  const [controlMode, setControlMode] = useState<"expand" | "collapse" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const triggerExpandAll = () => {
    setControlMode("expand");
    setControlVersion((v) => v + 1);
  };
  const triggerCollapseAll = () => {
    setControlMode("collapse");
    setControlVersion((v) => v + 1);
  };

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

  return (
    <article className={`line-item ${line.error ? "line-error" : ""}`}>
      <div className="line-head">
        <button
          type="button"
          className="line-head-main"
          onClick={() => onToggle(line.lineNumber)}
          aria-expanded={expanded}
        >
          <span className="line-title">{t("lineTitle", { lineNumber: line.lineNumber })}</span>
          <span className={`line-status ${status === "OK" ? "status-ok" : "status-error"}`}>{status}</span>
          <span className="line-summary">{summary}</span>
        </button>
        {expanded && !line.error && (
          <div className="line-head-actions">
            <button type="button" className="ghost-btn" onClick={triggerExpandAll}>
              {t("expandLineAll")}
            </button>
            <button type="button" className="ghost-btn" onClick={triggerCollapseAll}>
              {t("collapseLineAll")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => setIsFullscreen(true)}>
              {t("fullscreen")}
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
            <>
              <JsonTree data={line.parsed} controlVersion={controlVersion} controlMode={controlMode} t={t} />
              {isFullscreen && (
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
                          className="ghost-btn"
                          onClick={triggerExpandAll}
                        >
                          {t("expandLineAll")}
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={triggerCollapseAll}
                        >
                          {t("collapseLineAll")}
                        </button>
                        <button type="button" className="ghost-btn" onClick={() => setIsFullscreen(false)}>
                          {t("closeFullscreen")}
                        </button>
                      </div>
                    </div>
                    <div className="line-fullscreen-content">
                      <JsonTree data={line.parsed} controlVersion={controlVersion} controlMode={controlMode} t={t} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}
