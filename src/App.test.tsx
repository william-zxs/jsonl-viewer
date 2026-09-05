import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const treeResponse = { rootName: "logs", path: "", nodes: [{ name: "agent", path: "agent", kind: "directory" }, { name: "session.jsonl", path: "session.jsonl", kind: "file" }] };
const fileResponse = {
  file: { path: "session.jsonl", name: "session.jsonl", size: 1024, updatedAt: "2026-01-01T00:00:00.000Z" },
  columns: ["request", "status", "message"],
  columnsByDepth: { "1": ["request", "status", "message"], "2": ["request.id"] },
  rows: [{ lineNumber: 1, raw: '{"request":{"id":"abc"},"status":200,"message":"ok"}', parsed: { request: { id: "abc" }, status: 200, message: "ok" }, error: null }],
  pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
  stats: { total: 1, valid: 1, failed: 0 }
};

function jsonResponse(data: unknown) {
  return { ok: true, json: () => Promise.resolve(data) } as Response;
}

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn((url: URL) => Promise.resolve(jsonResponse(url.pathname === "/api/tree" ? treeResponse : fileResponse))));
  });

  it("从右侧文件树打开 JSONL 并按第一层字段显示表格", async () => {
    render(<App />);
    expect(await screen.findByText("session.jsonl")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /session\.jsonl/i }));
    await waitFor(() => expect(screen.getByText("message")).toBeInTheDocument());
    expect(screen.getByText("ok")).toBeInTheDocument();
    expect(screen.getByText("{1}")).toBeInTheDocument();
  });

  it("可添加嵌套字段并全屏查看一行 JSON", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /session\.jsonl/i }));
    await screen.findByText("message");
    fireEvent.click(screen.getByRole("button", { name: "显示字段" }));
    const dialog = screen.getByRole("dialog", { name: "显示字段" });
    fireEvent.change(within(dialog).getByLabelText("自定义字段路径"), { target: { value: "request.id" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "添加" }));
    expect(screen.getAllByText("request.id").length).toBeGreaterThan(1);
    expect(screen.getByText("abc")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "全屏查看第 1 行" }));
    expect(screen.getByRole("dialog", { name: "第 1 行 JSON" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "结构辅助" })).toHaveValue("compact");
    fireEvent.change(screen.getByRole("combobox", { name: "结构辅助" }), { target: { value: "full" } });
    expect(screen.getByRole("combobox", { name: "结构辅助" })).toHaveValue("full");
  });

  it("默认显示第一层字段，可切换层级并收起文件栏", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /session\.jsonl/i }));
    await screen.findByText("message");
    expect(screen.getByText("request")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "显示层级" }), { target: { value: "2" } });
    expect(screen.getByText("request.id")).toBeInTheDocument();
    expect(screen.getByText("abc")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "收起文件栏" }));
    expect(screen.getByRole("button", { name: "展开文件栏" })).toBeInTheDocument();
  });
});
