# JSONL Viewer CLI 服务版规划

## 首版目标

首版只交付自托管的 CLI Web 服务，用于在 Linux 或本机启动一个只读 JSONL 浏览器。用户在同一台机器或局域网浏览器中访问页面，浏览启动时指定目录中的 `.jsonl`、`.jsonlines` 与 `.ndjson` 文件。

```bash
jsonl-viewer /var/log/agent --host 0.0.0.0 --port 8400 --token change-me
```

服务仅允许读取这个根目录及其子目录；路径穿越和指向根目录外的符号链接会被拒绝。

## 已实现范围

- 右侧目录树，按需展开目录并选择 JSONL 文件。
- 每条 JSONL 记录在表格中显示为一行；默认列是出现频率最高的第一层字段。
- “显示字段”支持隐藏默认列，以及增加 `request.id` 这类嵌套路径为自定义列。
- 工具栏支持原始 JSON 全文搜索、解析状态、字段路径比较（包含、等于、存在、数值比较）。
- 行按钮或双击行可全屏查看完整 JSON；解析失败行显示原始文本与错误信息。
- 服务端用流逐行扫描 JSONL，只把当前页记录发送到浏览器；单页默认 100 行，最大 500 行。
- `--token` 会保护数据 API。通过 CLI 输出的带 `?token=` 地址打开页面即可使用该 token。

## 运行方式

安装依赖并构建：

```bash
npm install
npm run build
```

本机仅自己访问：

```bash
npm run serve -- /path/to/jsonl-directory
```

局域网访问：

```bash
npm run serve -- /path/to/jsonl-directory --host 0.0.0.0 --port 8400 --token a-long-random-token
```

浏览器打开 CLI 打印出的地址。不要在不可信网络中省略 `--token`；首版没有 HTTPS 和用户体系，跨网段使用时应置于反向代理、VPN 或 SSH 隧道之后。

## API 边界

- `GET /api/tree?path=<relative-directory>`：惰性读取一个目录，只返回目录与 JSONL 文件。
- `GET /api/file?path=<relative-file>&page=1&pageSize=100`：逐行扫描并返回当前页、统计、可用第一层字段。
- `search`、`status`、`field`、`operator`、`value` 是文件查询参数，筛选在服务端执行。

前端与服务端绑定为同一来源部署；开发阶段可先运行 `npm run build` 后再使用 `npm run serve`。

## 后续版本（不在首版）

1. 为超大文件增加持久的行偏移索引、取消扫描和虚拟滚动。
2. 文件变动提醒、自动刷新和 tail 模式。
3. 保存筛选/列配置为命名视图，支持导出筛选后的 JSONL。
4. Chrome 扩展：复用 Viewer 页面，把服务端数据源替换成用户授权的 File System Access API 目录句柄。

