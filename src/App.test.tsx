import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { LOCALE_STORAGE_KEY } from "./lib/i18n";

const pickFileLabel = /选择 JSONL 文件|Select JSONL file/i;
const line1Label = /第 1 行|Line 1/i;
const line2Label = /第 2 行|Line 2/i;
const line3Label = /第 3 行|Line 3/i;
const cycleToLevel1Label = /当前页首层展开|Expand first level/i;
const cycleToAllLabel = /当前页全部展开|Expand all levels/i;
const cycleToCollapseLabel = /当前页全部折叠|Collapse all/i;
const expandLineAllLabel = /展开该行全部|Expand all in line/i;
const collapseLineAllLabel = /折叠该行全部|Collapse all in line/i;
const fullscreenLabel = /全屏|Fullscreen/i;
const fullscreenCloseLabel = /关闭全屏|Close fullscreen/i;
const treeCopyLabel = /复制|Copy/i;
const treeCopiedLabel = /已复制|Copied/i;
const searchLabel = /全文检索|Search full text/i;
const tryExampleLabel = /试用示例|Try Example/i;
const emptyLabel = /暂无数据|No data/i;
const errorPrefix = /错误:|Error:/i;

function makeJsonlFile(text: string): File {
  const file = new File([text], "sample.jsonl", { type: "text/plain" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(text)
  });
  return file;
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LOCALE_STORAGE_KEY, "zh");
  });

  it("上传后可展示统计、展开行、按错误过滤", async () => {
    render(<App />);

    const input = screen.getByLabelText(pickFileLabel);
    const file = makeJsonlFile(`{"a":1}\nnot-json\n{"b":2}\n`);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("3");
    });

    expect(screen.getByTestId("stat-success")).toHaveTextContent("2");
    expect(screen.getByTestId("stat-failed")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: line1Label }));
    await waitFor(() => {
      expect(screen.getByText(/a:/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: line1Label }));
    await waitFor(() => {
      expect(screen.queryByText(/a:/)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "ERROR" }));
    expect(screen.getByText(line2Label)).toBeInTheDocument();
    expect(screen.queryByText(line1Label)).not.toBeInTheDocument();
  });

  it("支持双击行头直接进入该行全屏", async () => {
    render(<App />);

    const input = screen.getByLabelText(pickFileLabel);
    const file = makeJsonlFile(`{"a":{"b":{"c":1}}}\n{"x":2}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("2");
    });

    fireEvent.doubleClick(screen.getByRole("button", { name: line1Label }));

    const dialog = screen.getByRole("dialog", { name: /第 1 行 JSON 全屏|Line 1 JSON Fullscreen/i });
    expect(dialog).toBeInTheDocument();
    expect(document.body).toHaveClass("modal-open");
    expect(within(dialog).getByText(/c:/)).toBeInTheDocument();
  });

  it("支持当前页三态循环：首层展开、全部展开、全部折叠", async () => {
    render(<App />);

    const input = screen.getByLabelText(pickFileLabel);
    const file = makeJsonlFile(`{"a":{"b":{"c":1}}}\n{"x":{"y":2}}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("2");
    });

    fireEvent.click(screen.getByRole("button", { name: cycleToLevel1Label }));
    expect(screen.getByText(/a:/)).toBeInTheDocument();
    expect(screen.queryByText(/c:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: cycleToAllLabel })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: cycleToAllLabel }));
    expect(screen.getByText(/c:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: cycleToCollapseLabel })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: cycleToCollapseLabel }));
    expect(screen.queryByText(/a:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/x:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: cycleToLevel1Label })).toBeInTheDocument();
  });

  it("支持单行内 JSON 树全部展开和全部折叠", async () => {
    render(<App />);

    const input = screen.getByLabelText(pickFileLabel);
    const file = makeJsonlFile(`{"a":{"b":{"c":1}}}\n{"x":2}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("2");
    });

    fireEvent.click(screen.getByRole("button", { name: line1Label }));
    await waitFor(() => {
      expect(screen.getByText(/c:/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: expandLineAllLabel }));
    expect(screen.getByText(/c:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: collapseLineAllLabel }));
    expect(screen.queryByText(/a:/)).not.toBeInTheDocument();
  });

  it("支持单行 JSON 块全屏展示并可关闭", async () => {
    render(<App />);

    const input = screen.getByLabelText(pickFileLabel);
    const file = makeJsonlFile(`{"a":{"b":{"c":1}}}\n{"x":2}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("2");
    });

    fireEvent.click(screen.getByRole("button", { name: line1Label }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: fullscreenLabel })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: fullscreenLabel }));

    const dialog = screen.getByRole("dialog", { name: /第 1 行 JSON 全屏|Line 1 JSON Fullscreen/i });
    expect(dialog).toBeInTheDocument();
    expect(document.body).toHaveClass("modal-open");
    expect(within(dialog).getByRole("button", { name: expandLineAllLabel })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: collapseLineAllLabel })).toBeInTheDocument();
    expect(within(dialog).getByText(/a:/)).toBeInTheDocument();
    expect(within(dialog).getByText(/c:/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: collapseLineAllLabel }));
    expect(within(dialog).queryByText(/a:/)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: fullscreenCloseLabel }));
    expect(screen.queryByRole("dialog", { name: /第 1 行 JSON 全屏|Line 1 JSON Fullscreen/i })).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass("modal-open");

    fireEvent.click(screen.getByRole("button", { name: fullscreenLabel }));
    expect(screen.getByRole("dialog", { name: /第 1 行 JSON 全屏|Line 1 JSON Fullscreen/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /第 1 行 JSON 全屏|Line 1 JSON Fullscreen/i })).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass("modal-open");
  });

  it("支持全文检索并可与状态过滤组合", async () => {
    render(<App />);

    const input = screen.getByLabelText(pickFileLabel);
    const file = makeJsonlFile(`{"event":"login","user":"alice"}\nnot-json-line\n{"event":"logout","user":"bob"}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("3");
    });

    const searchInput = screen.getByRole("searchbox", { name: searchLabel });
    fireEvent.change(searchInput, { target: { value: "logout" } });
    expect(screen.getByText(line3Label)).toBeInTheDocument();
    expect(screen.queryByText(line1Label)).not.toBeInTheDocument();
    expect(screen.queryByText(line2Label)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ERROR" }));
    expect(screen.queryByText(line3Label)).not.toBeInTheDocument();
    expect(screen.getByText(emptyLabel)).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "json" } });
    expect(screen.getByText(line2Label)).toBeInTheDocument();
    expect(screen.queryByText(line1Label)).not.toBeInTheDocument();
  });

  it("支持右上角切换语言并持久化", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /Search full text/i })).toBeInTheDocument();
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");

    const input = screen.getByLabelText(pickFileLabel);
    const file = makeJsonlFile(`{"a":1}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Line 1/i })).toBeInTheDocument();
    });
  });

  it("支持点击 Try Example 加载示例文件", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: tryExampleLabel }));

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("5");
    });

    expect(screen.getByText("example_agent_session.jsonl")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: line1Label })).toBeInTheDocument();
  });

  it("支持在 JSON 树块头复制当前节点 JSON，并显示已复制反馈", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    const input = screen.getByLabelText(pickFileLabel);
    const file = makeJsonlFile(`{"a":{"b":1}}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("1");
    });

    fireEvent.click(screen.getByRole("button", { name: line1Label }));
    const copyButton = await waitFor(() => screen.getAllByRole("button", { name: treeCopyLabel })[0]);

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('{\n  "a": {\n    "b": 1\n  }\n}');
      expect(screen.getAllByRole("button", { name: treeCopiedLabel })).toHaveLength(1);
    });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: treeCopiedLabel })).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: treeCopyLabel }).length).toBeGreaterThanOrEqual(2);
    }, { timeout: 3000 });
  });

  it("每行 header 展示字符数，中文按单字符计数", async () => {
    render(<App />);

    const input = screen.getByLabelText(pickFileLabel);
    const rawLine = `{"msg":"你好abc"}`;
    const file = makeJsonlFile(`${rawLine}\n`);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("1");
    });

    const expectedCount = Array.from(rawLine).length;
    expect(screen.getByText(new RegExp(`字符\\s*${expectedCount}|${expectedCount}\\s*字符`))).toBeInTheDocument();
  });
});
