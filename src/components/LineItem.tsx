import { useEffect, useState } from "react";
import JsonTree from "./JsonTree";
import type { ParsedLine } from "../lib/jsonl";

type LineItemProps = {
  line: ParsedLine;
  expanded: boolean;
  onToggle: (lineNumber: number) => void;
};

function summarize(parsed: unknown | null, error: string | null): string {
  if (error) {
    return "解析失败";
  }
  if (parsed === null) {
    return "null";
  }
  if (Array.isArray(parsed)) {
    return `数组(${parsed.length})`;
  }
  if (typeof parsed === "object") {
    return `对象(${Object.keys(parsed as Record<string, unknown>).length}键)`;
  }
  return typeof parsed;
}

export default function LineItem({ line, expanded, onToggle }: LineItemProps) {
  const status = line.error ? "ERROR" : "OK";
  const summary = summarize(line.parsed, line.error);
  const [controlVersion, setControlVersion] = useState(0);
  const [controlMode, setControlMode] = useState<"expand" | "collapse" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      <button
        type="button"
        className="line-head"
        onClick={() => onToggle(line.lineNumber)}
        aria-expanded={expanded}
      >
        <span className="line-title">第 {line.lineNumber} 行</span>
        <span className={`line-status ${status === "OK" ? "status-ok" : "status-error"}`}>{status}</span>
        <span className="line-summary">{summary}</span>
      </button>

      {expanded && (
        <div className="line-body">
          {line.error ? (
            <>
              <p className="error-text">错误: {line.error}</p>
              <pre className="raw-line">{line.raw}</pre>
            </>
          ) : (
            <>
              <div className="line-body-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setControlMode("expand");
                    setControlVersion((v) => v + 1);
                  }}
                >
                  展开该行全部
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setControlMode("collapse");
                    setControlVersion((v) => v + 1);
                  }}
                >
                  折叠该行全部
                </button>
                <button type="button" className="ghost-btn" onClick={() => setIsFullscreen(true)}>
                  全屏
                </button>
              </div>
              <JsonTree data={line.parsed} controlVersion={controlVersion} controlMode={controlMode} />
              {isFullscreen && (
                <div
                  className="line-fullscreen-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`第 ${line.lineNumber} 行 JSON 全屏`}
                  onClick={() => setIsFullscreen(false)}
                >
                  <div className="line-fullscreen-panel" onClick={(event) => event.stopPropagation()}>
                    <div className="line-fullscreen-header">
                      <strong>第 {line.lineNumber} 行 JSON</strong>
                      <div className="line-fullscreen-actions">
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => {
                            setControlMode("expand");
                            setControlVersion((v) => v + 1);
                          }}
                        >
                          展开该行全部
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => {
                            setControlMode("collapse");
                            setControlVersion((v) => v + 1);
                          }}
                        >
                          折叠该行全部
                        </button>
                        <button type="button" className="ghost-btn" onClick={() => setIsFullscreen(false)}>
                          关闭全屏
                        </button>
                      </div>
                    </div>
                    <div className="line-fullscreen-content">
                      <JsonTree data={line.parsed} controlVersion={controlVersion} controlMode={controlMode} />
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
