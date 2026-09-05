# JSONL Viewer

[中文](./README.zh-CN.md)

A self-hosted JSONL browser. Start it with a read-only directory, then inspect its JSONL files from a browser.

## Run

```bash
npm install
npm run build
npm run serve -- /path/to/jsonl-directory
```

For LAN access, bind explicitly and protect the data API with a token:

```bash
npm run serve -- /path/to/jsonl-directory --host 0.0.0.0 --port 8400 --token a-long-random-token
```

See the [CLI service plan](./docs/cli-service-plan.zh-CN.md) for the implemented scope and roadmap.
