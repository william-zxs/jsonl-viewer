import { useEffect, useMemo, useRef, useState } from "react";

type JsonTreeProps = {
  data: unknown;
  name?: string;
  depth?: number;
  defaultExpandedDepth?: number;
  controlVersion?: number;
  controlMode?: "expand" | "collapse" | null;
};

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
  data,
  name,
  depth = 0,
  defaultExpandedDepth = 1,
  controlVersion = 0,
  controlMode = null
}: JsonTreeProps) {
  const isObject = typeof data === "object" && data !== null;
  const initialOpen =
    controlMode === "expand" ? true : controlMode === "collapse" ? false : depth < defaultExpandedDepth;
  const [isOpen, setIsOpen] = useState(initialOpen);
  const prevControlVersion = useRef(controlVersion);

  useEffect(() => {
    if (controlVersion !== prevControlVersion.current) {
      if (controlMode === "expand") {
        setIsOpen(true);
      } else if (controlMode === "collapse") {
        setIsOpen(false);
      }
      prevControlVersion.current = controlVersion;
    }
  }, [controlMode, controlVersion]);

  const entries = useMemo(() => {
    if (!isObject) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map((value, index) => [String(index), value] as const);
    }
    return Object.entries(data as Record<string, unknown>);
  }, [data, isObject]);

  if (!isObject) {
    return (
      <div className="tree-line" style={{ paddingLeft: `${depth * 14}px` }}>
        {name !== undefined && <span className="tree-key">{name}: </span>}
        <span className={typeClass(data)}>{formatPrimitive(data)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const openSymbol = isArray ? "[" : "{";
  const closeSymbol = isArray ? "]" : "}";
  const preview = isArray ? `[${entries.length}]` : `{${entries.length}}`;

  return (
    <div className="tree-block">
      <div className="tree-line" style={{ paddingLeft: `${depth * 14}px` }}>
        <button
          type="button"
          className="tree-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "折叠节点" : "展开节点"}
        >
          {isOpen ? "▾" : "▸"}
        </button>
        {name !== undefined && <span className="tree-key">{name}: </span>}
        {!isOpen && <span className="tree-preview">{preview}</span>}
        {isOpen && <span className="tree-bracket">{openSymbol}</span>}
      </div>

      {isOpen &&
        entries.map(([key, value]) => (
          <JsonTree
            key={`${depth}-${key}`}
            data={value}
            name={key}
            depth={depth + 1}
            defaultExpandedDepth={defaultExpandedDepth}
            controlVersion={controlVersion}
            controlMode={controlMode}
          />
        ))}

      {isOpen && (
        <div className="tree-line" style={{ paddingLeft: `${depth * 14}px` }}>
          <span className="tree-bracket">{closeSymbol}</span>
        </div>
      )}
    </div>
  );
}
