# JSONL Viewer

[English](./README.md)

一个自托管的 JSONL 浏览器。通过 CLI 指定一个只读目录，然后在浏览器中查看其中的 JSONL 文件。

## 功能

- 右侧目录树，按需展开文件夹并打开 `.jsonl`、`.jsonlines`、`.ndjson` 文件。
- 一行 JSONL 对应一行表格；显示层级可选，默认显示 JSON 的第一层字段。
- 可从“显示字段”增加嵌套字段列，例如 `request.id`。
- 支持全文搜索、解析状态与字段筛选。
- 每一行都可进入全屏 JSON 树详情。
- 服务端按页读取，不把整个 JSONL 文件加载到浏览器。

## 运行

```bash
npm install
npm run build
npm run serve -- /path/to/jsonl-directory
```

默认仅监听 `127.0.0.1:8400`。局域网使用时，请显式设置监听地址并使用 token：

```bash
npm run serve -- /path/to/jsonl-directory --host 0.0.0.0 --port 8400 --token a-long-random-token
```

打开 CLI 输出的地址即可。完整范围、接口和后续计划见 [CLI 服务版规划](./docs/cli-service-plan.zh-CN.md)。

## 安装为全局命令

开发当前仓库时，推荐使用 `npm link`。它会把当前目录软链接为全局的 `jsonl-viewer` 命令；修改代码后只需要重新构建，不需要重复链接：

```bash
npm run build
npm link

jsonl-viewer /path/to/jsonl-directory
```

如需验证正式安装流程，可以先打包再全局安装：

```bash
npm pack
npm install -g ./jsonl-viewer-0.0.1.tgz
```

`npm install` 仅安装项目依赖，不会注册全局命令。当前包标记为私有，不能误发布到 npm 公共仓库，但仍可本机链接或安装。

## 开发与测试

```bash
npm run build
npm test
```
