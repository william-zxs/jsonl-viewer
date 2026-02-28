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
            <JsonTree data={line.parsed} />
          )}
        </div>
      )}
    </article>
  );
}
