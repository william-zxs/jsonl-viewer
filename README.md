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

## Install as a global command

For development in this repository, use `npm link` to symlink the current checkout as the global `jsonl-viewer` command:

```bash
npm run build
npm link

jsonl-viewer /path/to/jsonl-directory
```

To verify an installable package instead:

```bash
npm pack
npm install -g ./jsonl-viewer-0.0.1.tgz
```

`npm install` only installs dependencies; it does not register a global command. The package is currently private, so it can be linked or installed locally but cannot be accidentally published to the public npm registry.
