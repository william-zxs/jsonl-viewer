export type ParsedLine = {
  lineNumber: number;
  raw: string;
  parsed: unknown | null;
  error: string | null;
};

export function parseJsonl(text: string): ParsedLine[] {
  const lines = text.split(/\r?\n/);
  const parsed: ParsedLine[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (raw.trim() === "") {
      continue;
    }

    try {
      parsed.push({
        lineNumber: i + 1,
        raw,
        parsed: JSON.parse(raw),
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse error";
      parsed.push({
        lineNumber: i + 1,
        raw,
        parsed: null,
        error: message
      });
    }
  }

  return parsed;
}
