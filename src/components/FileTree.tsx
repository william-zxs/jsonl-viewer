import { useState } from "react";
import type { FileNode } from "../lib/viewer-api";

type FileTreeProps = {
  rootName: string;
  rootNodes: FileNode[];
  childNodes: Record<string, FileNode[]>;
  loadingPaths: Set<string>;
  selectedPath: string;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (path: string) => void;
};

function FolderIcon({ open }: { open: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.8a2 2 0 0 1 2-2h4l1.8 2h7.2a2 2 0 0 1 2 2v8.7a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z" className={open ? "folder-open" : ""} /></svg>;
}

function FileIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.8h7l4 4v12.4H6.5zM13.5 3.8v4h4" /><path d="M8.8 14h6.4M8.8 17h4.6" /></svg>;
}

function TreeBranch({ nodes, depth, childNodes, loadingPaths, selectedPath, onToggleDirectory, onSelectFile }: Omit<FileTreeProps, "rootName" | "rootNodes"> & { nodes: FileNode[]; depth: number }) {
  return <>
    {nodes.map((node) => {
      const isDirectory = node.kind === "directory";
      const isOpen = Boolean(childNodes[node.path]);
      const isLoading = loadingPaths.has(node.path);
      return <div key={node.path}>
        <button
          type="button"
          className={`tree-node ${selectedPath === node.path ? "selected" : ""}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => isDirectory ? onToggleDirectory(node.path) : onSelectFile(node.path)}
          aria-expanded={isDirectory ? isOpen : undefined}
        >
          {isDirectory ? <span className="tree-chevron">{isOpen ? "⌄" : "›"}</span> : <span className="tree-chevron spacer" />}
          <span className="tree-icon">{isDirectory ? <FolderIcon open={isOpen} /> : <FileIcon />}</span>
          <span className="tree-node-name">{node.name}</span>
          {isLoading && <span className="tree-loading" />}
        </button>
        {isDirectory && isOpen && <TreeBranch nodes={childNodes[node.path]} depth={depth + 1} childNodes={childNodes} loadingPaths={loadingPaths} selectedPath={selectedPath} onToggleDirectory={onToggleDirectory} onSelectFile={onSelectFile} />}
      </div>;
    })}
  </>;
}

export default function FileTree({ rootName, rootNodes, childNodes, loadingPaths, selectedPath, onToggleDirectory, onSelectFile }: FileTreeProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const displayedRoot = normalizedQuery ? rootNodes.filter((node) => node.name.toLowerCase().includes(normalizedQuery)) : rootNodes;
  return <aside className="file-sidebar">
    <div className="sidebar-header">
      <div>
        <div className="sidebar-title">文件</div>
        <div className="sidebar-root" title={rootName}>{rootName || "正在连接…"}</div>
      </div>
    </div>
    <div className="sidebar-search-wrap">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="5.7" /><path d="m15.2 15.2 4 4" /></svg>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛选文件" aria-label="筛选文件" />
    </div>
    <div className="file-tree" role="tree">
      {displayedRoot.length > 0 ? <TreeBranch nodes={displayedRoot} depth={0} childNodes={childNodes} loadingPaths={loadingPaths} selectedPath={selectedPath} onToggleDirectory={onToggleDirectory} onSelectFile={onSelectFile} /> : <p className="tree-empty">未找到 JSONL 文件</p>}
    </div>
  </aside>;
}
