# JSONL Viewer

一个基于 React + Vite 的前端 JSONL 查看器，支持按行展开和树形折叠，方便分析日志与结构化数据。

## 功能

- 拖拽上传 `jsonl` 文件（也支持点击选择）
- 按行展示解析结果（`OK` / `ERROR`）
- 单行展开后树形浏览 JSON，节点可折叠/展开
- 统计总行数、成功行数、失败行数
- `All / OK / ERROR` 快速筛选
- 分页展示（每页 200 行）与“折叠当前页全部”

## 本地运行

```bash
npm install
npm run dev
```

## 测试

```bash
npm test
```
