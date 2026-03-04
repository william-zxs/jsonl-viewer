import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { TranslateFn } from "../lib/i18n";

type JsonTreeProps = {
  t: TranslateFn;
  data: unknown;
  name?: string;
  depth?: number;
  defaultExpandedDepth?: number;
  controlVersion?: number;
  controlMode?: "expand" | "collapse" | "reset" | null;
  onLeafDoubleClick?: () => void;
};

function fallbackCopyText(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
  return copied;
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopyText(text);
    }
  }
  return fallbackCopyText(text);
}

function stringifyNode(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatPrimitive(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return String(value);
}

function typeClass(value: unknown): string {
  if (value === null) {
    return "value-null";
  }
  if (typeof value === "string") {
    return "value-string";
  }
  if (typeof value === "number") {
    return "value-number";
  }
  if (typeof value === "boolean") {
    return "value-boolean";
  }
  return "value-generic";
}

export default function JsonTree({
  t,
  data,
  name,
  depth = 0,
  defaultExpandedDepth = 1,
  controlVersion = 0,
  controlMode = null,
  onLeafDoubleClick
}: JsonTreeProps) {
  const safeDepth = Math.min(depth, 5);
  const lineDepthClass = `line-depth-${safeDepth}`;
  const blockDepthClass = `block-depth-${safeDepth}`;
  const leftPadding = depth * 14;
  const blockLeftOffset = Math.max(0, leftPadding - 6);
  const lineStyle = { paddingLeft: `${leftPadding}px` } as CSSProperties;
  const blockStyle = {
    "--tree-offset": `${blockLeftOffset}px`,
    "--active-left": `${blockLeftOffset}px`
  } as CSSProperties;
  const isObject = typeof data === "object" && data !== null;
  const initialOpen =
    controlMode === "expand"
      ? true
      : controlMode === "collapse"
        ? false
        : depth < defaultExpandedDepth;
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const prevControlVersion = useRef(controlVersion);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);
  const focusOnCloseRef = useRef(false);

  useEffect(() => {
    if (controlVersion !== prevControlVersion.current) {
      if (controlMode === "expand") {
        setIsOpen(true);
      } else if (controlMode === "collapse") {
        setIsOpen(false);
      } else if (controlMode === "reset") {
        setIsOpen(depth < defaultExpandedDepth);
      }
      prevControlVersion.current = controlVersion;
    }
  }, [controlMode, controlVersion, defaultExpandedDepth, depth]);

  useEffect(() => {
    if (!isOpen && focusOnCloseRef.current) {
      toggleButtonRef.current?.focus();
      focusOnCloseRef.current = false;
    }
  }, [isOpen]);

  useEffect(
    () => () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    },
    []
  );

  const entries = useMemo(() => {
    if (!isObject) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map((value, index) => [String(index), value] as const);
    }
    return Object.entries(data as Record<string, unknown>);
  }, [data, isObject]);

  const handleLineMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.detail > 1) {
      event.preventDefault();
    }
  };

  if (!isObject) {
    const handleLeafDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      onLeafDoubleClick?.();
    };
    return (
      <div
        className={`tree-line ${lineDepthClass}`}
        style={lineStyle}
        data-depth={depth}
        onMouseDown={handleLineMouseDown}
        onDoubleClick={handleLeafDoubleClick}
      >
        {name !== undefined && <span className="tree-key">{name}: </span>}
        <span className={typeClass(data)}>{formatPrimitive(data)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const copyPayload = useMemo(() => stringifyNode(data), [data]);
  const openSymbol = isArray ? "[" : "{";
  const closeSymbol = isArray ? "]" : "}";
  const preview = isArray ? `[${entries.length}]` : `{${entries.length}}`;
  const toggleOpen = () => setIsOpen((prev) => !prev);
  const closeCurrentBlockAndFocus = () => {
    focusOnCloseRef.current = true;
    setIsOpen(false);
  };
  const handleHeadDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    toggleOpen();
  };
  const handleTailDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    closeCurrentBlockAndFocus();
  };
  const handleCopyClick = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const copied = await copyText(copyPayload);
    if (!copied) {
      return;
    }
    setCopyState("copied");
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }
    copyResetTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
      copyResetTimerRef.current = null;
    }, 2000);
  };

  return (
    <div
      className={`tree-block ${blockDepthClass} ${isOpen ? "is-open" : "is-closed"}`}
      data-depth={depth}
      style={blockStyle}
    >
      <div
        className={`tree-line ${lineDepthClass} tree-block-head`}
        style={lineStyle}
        data-depth={depth}
        onMouseDown={handleLineMouseDown}
        onDoubleClick={handleHeadDoubleClick}
      >
        <button
          ref={toggleButtonRef}
          type="button"
          className="tree-level-toggle"
          onClick={toggleOpen}
          aria-label={isOpen ? t("treeCollapseNode") : t("treeExpandNode")}
          aria-expanded={isOpen}
        >
          {depth}
        </button>
        <div className="tree-head-main">
          {name !== undefined && <span className="tree-key">{name}: </span>}
          {!isOpen && <span className="tree-preview">{preview}</span>}
          {isOpen && <span className="tree-bracket">{openSymbol}</span>}
        </div>
        <div className="tree-head-actions">
          <button
            type="button"
            className="tree-copy-btn"
            onClick={handleCopyClick}
            aria-label={copyState === "copied" ? t("treeCopied") : t("treeCopyNode")}
          >
            {copyState === "copied" ? t("treeCopied") : t("treeCopyNode")}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="tree-children">
          {entries.map(([key, value]) => (
            <JsonTree
              key={`${depth}-${key}`}
              t={t}
              data={value}
              name={key}
              depth={depth + 1}
              defaultExpandedDepth={defaultExpandedDepth}
              controlVersion={controlVersion}
              controlMode={controlMode}
              onLeafDoubleClick={closeCurrentBlockAndFocus}
            />
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className={`tree-line ${lineDepthClass} tree-block-tail`}
          style={lineStyle}
          data-depth={depth}
          onMouseDown={handleLineMouseDown}
          onDoubleClick={handleTailDoubleClick}
        >
          <span className="tree-bracket">{closeSymbol}</span>
          {name !== undefined && <span className="tree-end-hint">end: {name}</span>}
        </div>
      )}
    </div>
  );
}
