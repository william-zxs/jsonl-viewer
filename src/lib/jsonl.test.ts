import { describe, expect, it } from "vitest";
import { parseJsonl } from "./jsonl";

describe("parseJsonl", () => {
  it("解析正常 JSONL", () => {
    const input = `{"a":1}\n{"b":"x"}`;
    const result = parseJsonl(input);

    expect(result).toHaveLength(2);
    expect(result[0].parsed).toEqual({ a: 1 });
    expect(result[1].parsed).toEqual({ b: "x" });
    expect(result[0].error).toBeNull();
  });

  it("忽略空行并保持原始行号", () => {
    const input = `{"a":1}\n\n{"b":2}`;
    const result = parseJsonl(input);

    expect(result).toHaveLength(2);
    expect(result[0].lineNumber).toBe(1);
    expect(result[1].lineNumber).toBe(3);
  });

  it("局部坏行不影响其它行", () => {
    const input = `{"ok":1}\nbad json\n{"ok":2}`;
    const result = parseJsonl(input);

    expect(result).toHaveLength(3);
    expect(result[1].error).toBeTruthy();
    expect(result[2].parsed).toEqual({ ok: 2 });
  });

  it("保留坏行原始文本", () => {
    const input = `oops`;
    const result = parseJsonl(input);

    expect(result[0].raw).toBe("oops");
    expect(result[0].parsed).toBeNull();
    expect(result[0].error).toBeTruthy();
  });
});
