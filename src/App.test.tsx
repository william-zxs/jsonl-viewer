import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

function makeJsonlFile(text: string): File {
  const file = new File([text], "sample.jsonl", { type: "text/plain" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(text)
  });
  return file;
}

describe("App", () => {
  it("上传后可展示统计、展开行、按错误过滤", async () => {
    render(<App />);

    const input = screen.getByLabelText("选择 JSONL 文件");
    const file = makeJsonlFile(`{"a":1}\nnot-json\n{"b":2}\n`);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("3");
    });

    expect(screen.getByTestId("stat-success")).toHaveTextContent("2");
    expect(screen.getByTestId("stat-failed")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: /第 1 行/i }));
    expect(screen.getByText(/a:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ERROR" }));
    expect(screen.getByText(/第 2 行/)).toBeInTheDocument();
    expect(screen.queryByText(/第 1 行/)).not.toBeInTheDocument();
  });

  it("支持展开当前页全部和折叠当前页全部", async () => {
    render(<App />);

    const input = screen.getByLabelText("选择 JSONL 文件");
    const file = makeJsonlFile(`{"a":1}\nnot-json\n{"b":2}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("3");
    });

    fireEvent.click(screen.getByRole("button", { name: "展开当前页全部" }));
    expect(screen.getByText(/a:/)).toBeInTheDocument();
    expect(screen.getByText(/b:/)).toBeInTheDocument();
    expect(screen.getByText(/错误:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "折叠当前页全部" }));
    expect(screen.queryByText(/a:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/b:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/错误:/)).not.toBeInTheDocument();
  });

  it("支持单行内 JSON 树全部展开和全部折叠", async () => {
    render(<App />);

    const input = screen.getByLabelText("选择 JSONL 文件");
    const file = makeJsonlFile(`{"a":{"b":{"c":1}}}\n{"x":2}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("2");
    });

    fireEvent.click(screen.getByRole("button", { name: /第 1 行/i }));
    expect(screen.queryByText(/c:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "展开该行全部" }));
    expect(screen.getByText(/c:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "折叠该行全部" }));
    expect(screen.queryByText(/a:/)).not.toBeInTheDocument();
  });

  it("支持单行 JSON 块全屏展示并可关闭", async () => {
    render(<App />);

    const input = screen.getByLabelText("选择 JSONL 文件");
    const file = makeJsonlFile(`{"a":{"b":1}}\n{"x":2}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("2");
    });

    fireEvent.click(screen.getByRole("button", { name: /第 1 行/i }));
    fireEvent.click(screen.getByRole("button", { name: "全屏" }));

    const dialog = screen.getByRole("dialog", { name: "第 1 行 JSON 全屏" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/a:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭全屏" }));
    expect(screen.queryByRole("dialog", { name: "第 1 行 JSON 全屏" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "全屏" }));
    expect(screen.getByRole("dialog", { name: "第 1 行 JSON 全屏" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "第 1 行 JSON 全屏" })).not.toBeInTheDocument();
  });
});
