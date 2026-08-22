import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import JsonTree from "./JsonTree";
import type { TranslateFn } from "../lib/i18n";

const t: TranslateFn = (key) => key;

describe("JsonTree", () => {
  it("JSON 内容区双击不再触发展开或折叠", () => {
    render(<JsonTree t={t} data={{ a: { b: { c: 1 } } }} />);

    expect(screen.queryByText(/b:/)).not.toBeInTheDocument();

    fireEvent.doubleClick(screen.getByText(/a:/));
    expect(screen.queryByText(/b:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "treeExpandNode" }));
    expect(screen.getByText(/b:/)).toBeInTheDocument();
    expect(screen.queryByText(/c:/)).not.toBeInTheDocument();

    fireEvent.doubleClick(screen.getByText(/b:/));
    expect(screen.queryByText(/c:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "treeExpandNode" }));
    expect(screen.getByText(/c:/)).toBeInTheDocument();

    fireEvent.doubleClick(screen.getByText("1", { selector: ".value-number" }));
    expect(screen.getByText(/c:/)).toBeInTheDocument();

    fireEvent.doubleClick(screen.getAllByText("}").at(-1)!);
    expect(screen.getByText(/c:/)).toBeInTheDocument();
  });

  it("JSON 内容区多击不阻止浏览器默认选中文本行为", () => {
    render(<JsonTree t={t} data={{ word: "hello" }} />);

    const value = screen.getByText("\"hello\"");
    const mouseDown = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      detail: 2
    });

    const prevented = !value.dispatchEvent(mouseDown);
    expect(prevented).toBe(false);
    expect(mouseDown.defaultPrevented).toBe(false);
  });
});
