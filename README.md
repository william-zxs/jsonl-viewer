# JSONL Viewer

[中文文档 (Chinese)](./README.zh-CN.md)

A browser-based JSONL viewer built with React + Vite, designed to help analyze agent-generated JSONL logs.

## Features

- Drag and drop a `jsonl` file (or click to choose one)
- Parse and render entries line by line with `OK` / `ERROR` status
- Expand a line to inspect JSON as a collapsible tree
- Expand/collapse all lines on the current page
- Expand/collapse all JSON tree nodes within a single line
- Summary stats for total / success / failed lines
- Quick filters: `All / OK / ERROR`
- Pagination (200 lines per page)

## Run Locally

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```
