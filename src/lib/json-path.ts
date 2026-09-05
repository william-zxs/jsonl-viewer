export function getJsonPathValue(value: unknown, path: string): unknown {
  if (!path) return value;
  return path.split(".").filter(Boolean).reduce<unknown>((current, part) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, value);
}

export function formatCellValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).length}}`;
  return String(value);
}
