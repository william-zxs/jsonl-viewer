# JSONL Viewer

[English](./README.md)

一个基于 React + Vite 的浏览器端 JSONL 查看器，用于方便分析 Agent 生成的 JSONL 日志。

## 功能

- 支持拖拽上传 `jsonl` 文件（也支持点击选择）
- 按行解析并展示结果，区分 `OK` / `ERROR`
- 单行展开后以可折叠 JSON 树查看内容
- 支持“当前页全部展开/折叠”
- 支持“单行内 JSON 树全部展开/折叠”
- 提供总行数、成功行数、失败行数统计
- 支持 `All / OK / ERROR` 快速筛选
- 支持分页（每页 200 行）

## 本地运行

```bash
npm install
npm run dev
```

## 测试

```bash
npm test
```
