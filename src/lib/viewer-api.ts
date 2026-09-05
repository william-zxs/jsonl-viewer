export type FileNode = {
  name: string;
  path: string;
  kind: "directory" | "file";
};

export type ViewerRow = {
  lineNumber: number;
  raw: string;
  parsed: unknown | null;
  error: string | null;
};

export type FilePayload = {
  file: { path: string; name: string; size: number; updatedAt: string };
  rows: ViewerRow[];
  columns: string[];
  columnsByDepth: Record<string, string[]>;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  stats: { total: number; valid: number; failed: number };
};

export type QueryFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: "all" | "valid" | "error";
  field: string;
  operator: string;
  value: string;
};

function getToken(): string {
  return new URLSearchParams(window.location.search).get("token") || "";
}

async function request<T>(pathname: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(pathname, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== "") url.searchParams.set(key, String(value));
  }
  const token = getToken();
  const response = await fetch(url, { headers: token ? { "x-jsonl-viewer-token": token } : undefined });
  const data = await response.json() as T & { message?: string };
  if (!response.ok) throw new Error(data.message || "请求失败");
  return data;
}

export async function fetchTree(path = ""): Promise<{ rootName: string; path: string; nodes: FileNode[] }> {
  return request("/api/tree", { path });
}

export async function fetchFile(path: string, filters: QueryFilters): Promise<FilePayload> {
  return request("/api/file", { path, ...filters });
}
