import { OpenRouter } from "@openrouter/sdk";
import type { Locale } from "./i18n";
import type { ParsedLine } from "./jsonl";

export type LineTagMap = Record<number, string>;

type SummarizeJsonLineTagsParams = {
  apiKey: string;
  model: string;
  locale: Locale;
  lines: ParsedLine[];
  signal?: AbortSignal;
};

const FALLBACK_LABEL: Record<Locale, string> = {
  zh: "未分类",
  en: "Uncategorized"
};

function buildInstructions(locale: Locale): string {
  if (locale === "zh") {
    return [
      "你是一个 JSON 行分类助手。",
      "我会给你一行 JSON，请输出最贴切的 1 到 3 个中文短标签。",
      "只输出标签文本，用顿号分隔，不要解释，不要输出 JSON，不要换行。",
      "标签要概括这行数据表达的事件、主题或数据类型，总长度不超过 16 个中文字符。",
      "如果无法判断，就输出“未分类”。"
    ].join("");
  }

  return [
    "You classify one JSON line into 1 to 3 short English tags.",
    "Return tags only, separated by commas.",
    "Do not explain, do not output JSON, and do not add extra lines.",
    "Keep the total length under 24 characters.",
    "If unsure, return 'Uncategorized'."
  ].join(" ");
}

function normalizeLabel(text: string, locale: Locale): string {
  const fallback = FALLBACK_LABEL[locale];
  const firstLine = text.trim().split(/\r?\n/)[0] ?? "";
  const normalized = firstLine
    .replace(/^["'`\s]+|["'`\s]+$/g, "")
    .replace(/^(标签|tags?)\s*[:：]\s*/i, "")
    .trim();

  return normalized || fallback;
}

async function summarizeSingleLine(
  client: OpenRouter,
  model: string,
  locale: Locale,
  line: ParsedLine,
  signal?: AbortSignal
): Promise<string> {
  const result = client.callModel(
    {
      model,
      instructions: buildInstructions(locale),
      input: `Line ${line.lineNumber}\n${line.raw}`,
      temperature: 0,
      maxOutputTokens: 32
    },
    { signal }
  );

  const text = await result.getText();
  return normalizeLabel(text, locale);
}

export async function summarizeJsonLineTags({
  apiKey,
  model,
  locale,
  lines,
  signal
}: SummarizeJsonLineTagsParams): Promise<LineTagMap> {
  const client = new OpenRouter({
    apiKey,
    httpReferer: typeof window === "undefined" ? undefined : window.location.origin,
    xTitle: "JSONL Viewer"
  });
  const validLines = lines.filter((line) => !line.error);
  const tags: LineTagMap = {};
  const concurrency = 3;
  let cursor = 0;

  async function worker() {
    while (cursor < validLines.length) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const currentIndex = cursor;
      cursor += 1;
      const line = validLines[currentIndex];
      tags[line.lineNumber] = await summarizeSingleLine(client, model, locale, line, signal);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, validLines.length) }, () => worker())
  );

  return tags;
}
