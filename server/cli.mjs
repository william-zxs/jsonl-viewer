#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { lstat, readdir, realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const distRoot = join(projectRoot, "dist");
const JSONL_EXTENSIONS = new Set([".jsonl", ".jsonlines", ".ndjson"]);
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;
const MAX_COLUMN_DEPTH = 4;

function printUsage() {
  console.log(`\nUsage: jsonl-viewer <directory> [options]\n\nOptions:\n  --host <host>    Bind address (default: 127.0.0.1)\n  --port <port>    Port (default: 8400)\n  --token <token>  Require this token for JSONL data API requests\n  --help           Show this help\n\nExample:\n  jsonl-viewer /var/log/agent --host 0.0.0.0 --port 8400 --token change-me\n`);
}

function parseArgs(argv) {
  const values = { directory: "", host: "127.0.0.1", port: 8400, token: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      values.help = true;
      continue;
    }
    if (arg === "--host" || arg === "--port" || arg === "--token") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      values[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (values.directory) {
      throw new Error("Only one directory can be provided");
    }
    values.directory = arg;
  }
  values.port = Number(values.port);
  if (!Number.isInteger(values.port) || values.port < 1 || values.port > 65535) {
    throw new Error("--port must be an integer between 1 and 65535");
  }
  return values;
}

function isJsonlFile(name) {
  return JSONL_EXTENSIONS.has(extname(name).toLowerCase());
}

function isPathInsideRoot(root, candidate) {
  const pathRelative = relative(root, candidate);
  return pathRelative === "" || (!pathRelative.startsWith(`..${sep}`) && pathRelative !== "..");
}

function getPathValue(value, path) {
  if (!path) return value;
  return path.split(".").filter(Boolean).reduce((current, segment) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    return current[segment];
  }, value);
}

function collectColumnPaths(value, depth, prefix, counts) {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > MAX_COLUMN_DEPTH) return;
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const levelCounts = counts.get(depth) || new Map();
    levelCounts.set(path, (levelCounts.get(path) || 0) + 1);
    counts.set(depth, levelCounts);
    collectColumnPaths(child, depth + 1, path, counts);
  }
}

function matchesFieldFilter(value, operator, expected) {
  if (!operator || !expected && operator !== "exists") return true;
  if (operator === "exists") return value !== undefined;
  if (operator === "contains") return JSON.stringify(value ?? "").toLowerCase().includes(expected.toLowerCase());
  const actualText = typeof value === "string" ? value : JSON.stringify(value);
  if (operator === "eq") return actualText === expected;
  if (operator === "neq") return actualText !== expected;
  const actualNumber = Number(value);
  const expectedNumber = Number(expected);
  if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) return false;
  if (operator === "gt") return actualNumber > expectedNumber;
  if (operator === "gte") return actualNumber >= expectedNumber;
  if (operator === "lt") return actualNumber < expectedNumber;
  if (operator === "lte") return actualNumber <= expectedNumber;
  return true;
}

function compactError(error) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function readDirectory(root, relativePath) {
  const absolutePath = await resolveRequestedPath(root, relativePath, true);
  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nodes = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    if (!entry.isDirectory() && !(entry.isFile() && isJsonlFile(entry.name))) continue;
    const nodePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    nodes.push({ name: entry.name, path: nodePath, kind: entry.isDirectory() ? "directory" : "file" });
  }
  return nodes.toSorted((left, right) => {
    if (left.kind !== right.kind) return left.kind === "directory" ? -1 : 1;
    return left.name.localeCompare(right.name, undefined, { numeric: true });
  });
}

async function resolveRequestedPath(root, relativePath, expectDirectory = false) {
  if (typeof relativePath !== "string" || relativePath.includes("\0")) {
    throw Object.assign(new Error("Invalid path"), { statusCode: 400 });
  }
  const candidate = resolve(root, normalize(relativePath));
  if (!isPathInsideRoot(root, candidate)) {
    throw Object.assign(new Error("The requested path is outside the shared directory"), { statusCode: 403 });
  }
  let resolved;
  try {
    resolved = await realpath(candidate);
  } catch {
    throw Object.assign(new Error("File or directory was not found"), { statusCode: 404 });
  }
  if (!isPathInsideRoot(root, resolved)) {
    throw Object.assign(new Error("Symbolic links outside the shared directory are not allowed"), { statusCode: 403 });
  }
  const info = await stat(resolved);
  if (expectDirectory && !info.isDirectory()) {
    throw Object.assign(new Error("The requested path is not a directory"), { statusCode: 400 });
  }
  if (!expectDirectory && (!info.isFile() || !isJsonlFile(resolved))) {
    throw Object.assign(new Error("Only JSONL files can be opened"), { statusCode: 400 });
  }
  return resolved;
}

async function inspectFile(root, relativePath, query) {
  const absolutePath = await resolveRequestedPath(root, relativePath);
  const fileInfo = await stat(absolutePath);
  const page = Math.max(1, Number.parseInt(query.get("page") || "1", 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(query.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
  const search = (query.get("search") || "").trim().toLowerCase();
  const status = query.get("status") || "all";
  const field = (query.get("field") || "").trim();
  const operator = query.get("operator") || "contains";
  const value = query.get("value") || "";
  const offset = (page - 1) * pageSize;
  const rows = [];
  const columnCounts = new Map();
  let lineNumber = 0;
  let total = 0;
  let valid = 0;
  let failed = 0;
  let matched = 0;
  const input = createReadStream(absolutePath, { encoding: "utf8" });
  const lines = createInterface({ input, crlfDelay: Infinity });
  for await (const rawLine of lines) {
    lineNumber += 1;
    if (!rawLine.trim()) continue;
    total += 1;
    let parsed = null;
    let error = null;
    try {
      parsed = JSON.parse(rawLine);
      valid += 1;
      collectColumnPaths(parsed, 1, "", columnCounts);
    } catch (parseError) {
      error = compactError(parseError);
      failed += 1;
    }
    if (status === "valid" && error) continue;
    if (status === "error" && !error) continue;
    if (search && !rawLine.toLowerCase().includes(search)) continue;
    if (field && !matchesFieldFilter(getPathValue(parsed, field), operator, value)) continue;
    matched += 1;
    if (matched > offset && rows.length < pageSize) {
      rows.push({ lineNumber, raw: rawLine, parsed, error });
    }
  }
  const columnsByDepth = Object.fromEntries([...columnCounts.entries()].map(([depth, counts]) => [
    depth,
    [...counts.entries()].toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).map(([name]) => name)
  ]));
  const columns = columnsByDepth[1] || [];
  return {
    file: { path: relativePath, name: relativePath.split("/").at(-1), size: fileInfo.size, updatedAt: fileInfo.mtime.toISOString() },
    rows,
    columns,
    columnsByDepth,
    pagination: { page, pageSize, total: matched, totalPages: Math.max(1, Math.ceil(matched / pageSize)) },
    stats: { total, valid, failed }
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function serveStatic(response, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const candidate = resolve(distRoot, `.${safePath}`);
  if (!isPathInsideRoot(distRoot, candidate)) {
    sendJson(response, 403, { message: "Invalid static asset path" });
    return;
  }
  try {
    const info = await lstat(candidate);
    if (!info.isFile()) throw new Error("not a file");
    const extension = extname(candidate).toLowerCase();
    const contentType = extension === ".js" ? "text/javascript" : extension === ".css" ? "text/css" : extension === ".svg" ? "image/svg+xml" : "text/html";
    response.writeHead(200, { "content-type": `${contentType}; charset=utf-8`, "cache-control": extension === ".html" ? "no-cache" : "public, max-age=3600" });
    createReadStream(candidate).pipe(response);
  } catch {
    if (extname(pathname)) {
      sendJson(response, 404, { message: "Static asset was not found" });
      return;
    }
    await serveStatic(response, "/index.html");
  }
}

async function start() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }
  if (!options.directory) {
    printUsage();
    process.exitCode = 1;
    return;
  }
  const root = await realpath(options.directory);
  if (!(await stat(root)).isDirectory()) {
    throw new Error("The first argument must be a directory");
  }
  try {
    const distInfo = await stat(distRoot);
    if (!distInfo.isDirectory()) throw new Error("missing dist");
  } catch {
    throw new Error("The web application has not been built. Run `npm run build` first.");
  }
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
      if (requestUrl.pathname.startsWith("/api/")) {
        const token = request.headers["x-jsonl-viewer-token"];
        if (options.token && token !== options.token) {
          sendJson(response, 401, { message: "A valid access token is required" });
          return;
        }
        if (request.method !== "GET") {
          sendJson(response, 405, { message: "Only GET requests are supported" });
          return;
        }
        if (requestUrl.pathname === "/api/tree") {
          const path = requestUrl.searchParams.get("path") || "";
          sendJson(response, 200, { rootName: root.split(sep).at(-1), path, nodes: await readDirectory(root, path) });
          return;
        }
        if (requestUrl.pathname === "/api/file") {
          const path = requestUrl.searchParams.get("path") || "";
          if (!path) {
            sendJson(response, 400, { message: "A file path is required" });
            return;
          }
          sendJson(response, 200, await inspectFile(root, path, requestUrl.searchParams));
          return;
        }
        sendJson(response, 404, { message: "API endpoint was not found" });
        return;
      }
      await serveStatic(response, requestUrl.pathname);
    } catch (error) {
      sendJson(response, error?.statusCode || 500, { message: compactError(error) });
    }
  });
  server.listen(options.port, options.host, () => {
    const tokenSuffix = options.token ? `?token=${encodeURIComponent(options.token)}` : "";
    console.log(`\nJSONL Viewer is serving: ${root}`);
    console.log(`Open http://${options.host}:${options.port}/${tokenSuffix}`);
    if (options.host === "0.0.0.0" && !options.token) {
      console.warn("Warning: this service is accessible on your network without a token.");
    }
  });
}

start().catch((error) => {
  console.error(`jsonl-viewer: ${compactError(error)}`);
  process.exitCode = 1;
});
