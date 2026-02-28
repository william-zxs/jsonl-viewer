import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("上传后可展示统计、展开行、按错误过滤", async () => {
    render(<App />);

    const input = screen.getByLabelText("选择 JSONL 文件");
    const file = new File([`{"a":1}\nnot-json\n{"b":2}\n`], "sample.jsonl", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("3");
    });

    expect(screen.getByTestId("stat-success")).toHaveTextContent("2");
    expect(screen.getByTestId("stat-failed")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: /第 1 行/i }));
    expect(screen.getByText("a:")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ERROR" }));
    expect(screen.getByText(/第 2 行/)).toBeInTheDocument();
    expect(screen.queryByText(/第 1 行/)).not.toBeInTheDocument();
  });
});
