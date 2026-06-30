import * as path from "path";
import * as vscode from "vscode";
import {
  CodegraphFileResult,
  CodegraphRelatedResult,
  CodegraphSearchResult,
  CodegraphWorkspace,
  clearCodegraphCache,
  getCodegraphCallees,
  getCodegraphCallers,
  getCodegraphImpact,
  listCodegraphFiles,
  resolveResultUri,
  searchCodegraphIndex,
  CodegraphSearchMode,
} from "./codegraphCli";
import { getGraphHtml } from "./graphHtml";

interface GraphState {
  workspaceName?: string;
  workspacePath?: string;
  codegraphPath?: string;
  indexUpdatedAt?: number;
  initialGraph?: GraphSeed;
}

interface CachedPayload {
  value: unknown[];
  createdAt: number;
}

export interface GraphSeed {
  source?: "files" | "search";
  seedKey?: string;
  query?: string;
  pattern?: string;
  kind?: string;
  mode?: CodegraphSearchMode;
  limit?: number;
  depth?: number;
}

type GraphMessage =
  | { type: "ready" }
  | { type: "loadFiles"; filter?: string; pattern?: string; force?: boolean }
  | { type: "search"; query?: string; kind?: string; mode?: CodegraphSearchMode; limit?: number; depth?: number; force?: boolean }
  | { type: "expandNode"; query?: string; mode?: "callers" | "callees" | "impact"; sourceId?: string; graphRequestId?: number; limit?: number; depth?: number }
  | { type: "saveGraphPng"; dataUrl?: string; fileName?: string }
  | { type: "saveGraphJson"; data?: unknown; fileName?: string }
  | { type: "openFile"; item?: CodegraphFileResult }
  | { type: "openResult"; item?: CodegraphSearchResult | CodegraphRelatedResult };

export class CodegraphGraphPanel {
  private static current: CodegraphGraphPanel | undefined;
  private state: GraphState = {};
  private readonly cache = new Map<string, CachedPayload>();
  private indexWatcher: vscode.FileSystemWatcher | undefined;
  private indexChangeTimer: ReturnType<typeof setTimeout> | undefined;
  private watchedCodegraphPath = "";
  private webviewReady = false;
  private lastAutoLoadKey = "";
  private graphRequestId = 0;

  static open(context: vscode.ExtensionContext, workspace: CodegraphWorkspace | undefined, initialGraph?: GraphSeed): CodegraphGraphPanel {
    if (CodegraphGraphPanel.current) {
      CodegraphGraphPanel.current.panel.reveal(vscode.ViewColumn.One);
      void CodegraphGraphPanel.current.load(workspace, initialGraph);
      return CodegraphGraphPanel.current;
    }

    const panel = vscode.window.createWebviewPanel(
      "codegraph.graph",
      "Codegraph Graph Explorer",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );
    CodegraphGraphPanel.current = new CodegraphGraphPanel(context, panel);
    void CodegraphGraphPanel.current.load(workspace, initialGraph);
    return CodegraphGraphPanel.current;
  }

  private constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly panel: vscode.WebviewPanel,
  ) {
    this.panel.onDidDispose(() => {
      this.disposeIndexWatcher();
      CodegraphGraphPanel.current = undefined;
    }, null, this.context.subscriptions);
    this.panel.webview.onDidReceiveMessage((message: GraphMessage) => {
      void this.handleMessage(message);
    }, null, this.context.subscriptions);
    this.panel.webview.html = getGraphHtml(getNonce());
  }

  private async load(workspace: CodegraphWorkspace | undefined, initialGraph?: GraphSeed): Promise<void> {
    if (!workspace) {
      this.state = {};
      this.lastAutoLoadKey = "";
      this.panel.webview.postMessage({ type: "error", message: "No .codegraph directory found in this workspace." });
      return;
    }

    const workspacePath = workspace.folder.uri.fsPath;
    if (this.state.workspacePath !== workspacePath) {
      this.lastAutoLoadKey = "";
    }

    this.state = {
      workspaceName: workspace.folder.name,
      workspacePath,
      codegraphPath: workspace.codegraphPath.fsPath,
      indexUpdatedAt: await getCodegraphIndexUpdatedAt(workspace.codegraphPath),
      initialGraph: normalizeGraphSeed(initialGraph),
    };
    this.watchCodegraphIndex(workspace);
    this.postState();
    await this.autoLoadInitialFiles();
  }

  private async handleMessage(message: GraphMessage): Promise<void> {
    if (message.type === "ready") {
      this.webviewReady = true;
      this.postState();
      await this.autoLoadInitialFiles();
      return;
    }

    if (message.type === "loadFiles") {
      await this.loadFiles(message.filter, message.pattern, message.force);
      return;
    }

    if (message.type === "search") {
      await this.search(message);
      return;
    }

    if (message.type === "expandNode") {
      await this.expandNode(message);
      return;
    }

    if (message.type === "saveGraphPng") {
      await this.saveGraphPng(message);
      return;
    }

    if (message.type === "saveGraphJson") {
      await this.saveGraphJson(message);
      return;
    }

    if (message.type === "openFile" && message.item?.path) {
      await this.openFile(message.item.path);
      return;
    }

    if (message.type === "openResult" && message.item?.file) {
      await this.openResult(message.item);
    }
  }

  private async loadFiles(filter?: string, pattern?: string, force?: boolean): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const requestId = ++this.graphRequestId;

    try {
      const cacheKey = graphCacheKey("files", this.state.workspacePath, filter?.trim() ?? "", pattern?.trim() ?? "");
      if (force) {
        clearCodegraphCache();
        this.cache.delete(cacheKey);
      }
      const cached = this.cache.get(cacheKey);
      if (cached && !force) {
        this.panel.webview.postMessage({ type: "filesResults", files: cached.value, cached: true, requestId });
        return;
      }

      this.panel.webview.postMessage({ type: "loading", requestId, message: force ? "Refreshing indexed files..." : "Loading indexed files..." });
      const files = await listCodegraphFiles(this.state.workspacePath, filter?.trim(), pattern?.trim());
      if (requestId !== this.graphRequestId) {
        return;
      }

      this.cache.set(cacheKey, { value: files, createdAt: Date.now() });
      if (force) { await this.refreshIndexMetadata(); }
      this.panel.webview.postMessage({ type: "filesResults", files, requestId });
    } catch (error) {
      if (requestId !== this.graphRequestId) {
        return;
      }

      this.panel.webview.postMessage({ type: "error", requestId, message: getErrorMessage(error) });
    }
  }

  private async search(message: Extract<GraphMessage, { type: "search" }>): Promise<void> {
    const query = message.query?.trim();
    if (!query || !this.state.workspacePath) {
      return;
    }

    const requestId = ++this.graphRequestId;

    try {
      const limit = normalizePositiveNumber(message.limit, vscode.workspace.getConfiguration("codegraph").get<number>("searchLimit") ?? 20);
      const depth = normalizePositiveNumber(message.depth, 2);
      const mode = message.mode ?? "symbols";
      const cacheKey = graphCacheKey("search", this.state.workspacePath, query, message.kind?.trim() ?? "", mode, String(limit), String(depth));
      if (message.force) {
        clearCodegraphCache();
        this.cache.delete(cacheKey);
      }
      const cached = this.cache.get(cacheKey);
      if (cached && !message.force) {
        this.panel.webview.postMessage({ type: "graphResults", results: cached.value, cached: true, requestId });
        return;
      }

      this.panel.webview.postMessage({ type: "loading", requestId, message: `${message.force ? "Refreshing" : "Loading"} ${mode} graph for "${query}"...` });
      const results = await searchCodegraphIndex(this.state.workspacePath, query, mode, limit, message.kind, depth);
      if (requestId !== this.graphRequestId) {
        return;
      }

      this.cache.set(cacheKey, { value: results, createdAt: Date.now() });
      if (message.force) { await this.refreshIndexMetadata(); }
      this.panel.webview.postMessage({ type: "graphResults", results, requestId });
    } catch (error) {
      if (requestId !== this.graphRequestId) {
        return;
      }

      this.panel.webview.postMessage({ type: "error", requestId, message: getErrorMessage(error) });
    }
  }

  private async expandNode(message: Extract<GraphMessage, { type: "expandNode" }>): Promise<void> {
    const query = message.query?.trim();
    if (!query || !this.state.workspacePath) {
      return;
    }

    try {
      const limit = normalizePositiveNumber(message.limit, 12);
      const depth = normalizePositiveNumber(message.depth, 2);
      const mode = message.mode ?? "callees";
      const graphRequestId = message.graphRequestId;
      const results = mode === "callers"
        ? await getCodegraphCallers(this.state.workspacePath, query, limit)
        : mode === "callees"
          ? await getCodegraphCallees(this.state.workspacePath, query, limit)
          : await getCodegraphImpact(this.state.workspacePath, query, depth);
      this.panel.webview.postMessage({ type: "expandedNode", query, mode, sourceId: message.sourceId, graphRequestId, results });
    } catch (error) {
      this.panel.webview.postMessage({ type: "expandedNode", query, mode: message.mode, sourceId: message.sourceId, graphRequestId: message.graphRequestId, results: [], error: getErrorMessage(error) });
    }
  }

  private async openFile(filePath: string): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(resolveResultUri(this.state.workspacePath, filePath));
    await showCodegraphDocument(document);
  }

  private async openResult(result: CodegraphSearchResult | CodegraphRelatedResult): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(resolveResultUri(this.state.workspacePath, result.file));
    const editor = await showCodegraphDocument(document);
    const line = Math.max((result.line ?? 1) - 1, 0);
    const column = Math.max(("column" in result ? result.column ?? 1 : 1) - 1, 0);
    const position = new vscode.Position(line, column);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }

  private async saveGraphPng(message: Extract<GraphMessage, { type: "saveGraphPng" }>): Promise<void> {
    const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(message.dataUrl ?? "");
    if (!match) {
      this.panel.webview.postMessage({ type: "exportResult", error: "Graph export failed: invalid PNG data." });
      return;
    }

    const fileName = toSafePngFileName(message.fileName);
    const target = await vscode.window.showSaveDialog({
      defaultUri: this.state.workspacePath ? vscode.Uri.file(path.join(this.state.workspacePath, fileName)) : undefined,
      filters: { "PNG image": ["png"] },
      saveLabel: "Export PNG",
      title: "Export Codegraph graph as PNG",
    });
    if (!target) {
      this.panel.webview.postMessage({ type: "exportResult", canceled: true });
      return;
    }

    try {
      await vscode.workspace.fs.writeFile(target, Buffer.from(match[1], "base64"));
      this.panel.webview.postMessage({ type: "exportResult", format: "png", path: target.fsPath });
      await vscode.window.showInformationMessage(`Exported Codegraph graph to ${target.fsPath}`);
    } catch (error) {
      this.panel.webview.postMessage({ type: "exportResult", error: getErrorMessage(error) });
    }
  }

  private async saveGraphJson(message: Extract<GraphMessage, { type: "saveGraphJson" }>): Promise<void> {
    if (!message.data || typeof message.data !== "object") {
      this.panel.webview.postMessage({ type: "exportResult", error: "Graph export failed: invalid JSON data." });
      return;
    }

    const fileName = toSafeFileName(message.fileName, "codegraph-graph.json", ".json");
    const target = await vscode.window.showSaveDialog({
      defaultUri: this.state.workspacePath ? vscode.Uri.file(path.join(this.state.workspacePath, fileName)) : undefined,
      filters: { "JSON": ["json"] },
      saveLabel: "Export JSON",
      title: "Export Codegraph graph data as JSON",
    });
    if (!target) {
      this.panel.webview.postMessage({ type: "exportResult", canceled: true });
      return;
    }

    try {
      const content = JSON.stringify(message.data, null, 2);
      await vscode.workspace.fs.writeFile(target, Buffer.from(content, "utf8"));
      this.panel.webview.postMessage({ type: "exportResult", format: "json", path: target.fsPath });
      await vscode.window.showInformationMessage(`Exported Codegraph graph data to ${target.fsPath}`);
    } catch (error) {
      this.panel.webview.postMessage({ type: "exportResult", error: getErrorMessage(error) });
    }
  }

  private postState(): void {
    this.panel.webview.postMessage({ type: "state", ...this.state });
  }

  private async refreshIndexMetadata(): Promise<void> {
    if (!this.state.codegraphPath) {
      return;
    }

    this.state.indexUpdatedAt = await getCodegraphIndexUpdatedAt(vscode.Uri.file(this.state.codegraphPath));
    this.postState();
  }

  private watchCodegraphIndex(workspace: CodegraphWorkspace): void {
    if (this.watchedCodegraphPath === workspace.codegraphPath.fsPath && this.indexWatcher) {
      return;
    }

    this.disposeIndexWatcher();
    this.watchedCodegraphPath = workspace.codegraphPath.fsPath;
    const pattern = new vscode.RelativePattern(workspace.folder, ".codegraph/**");
    this.indexWatcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);
    this.indexWatcher.onDidChange(() => this.scheduleIndexChanged(), null, this.context.subscriptions);
    this.indexWatcher.onDidCreate(() => this.scheduleIndexChanged(), null, this.context.subscriptions);
    this.indexWatcher.onDidDelete(() => this.scheduleIndexChanged(), null, this.context.subscriptions);
  }

  private scheduleIndexChanged(): void {
    if (this.indexChangeTimer) {
      clearTimeout(this.indexChangeTimer);
    }
    this.indexChangeTimer = setTimeout(() => {
      this.indexChangeTimer = undefined;
      void this.handleIndexChanged();
    }, 250);
  }

  private async handleIndexChanged(): Promise<void> {
    clearCodegraphCache();
    this.cache.clear();
    await this.refreshIndexMetadata();
    this.panel.webview.postMessage({ type: "indexChanged", indexUpdatedAt: this.state.indexUpdatedAt });
  }

  private disposeIndexWatcher(): void {
    if (this.indexChangeTimer) {
      clearTimeout(this.indexChangeTimer);
      this.indexChangeTimer = undefined;
    }
    this.indexWatcher?.dispose();
    this.indexWatcher = undefined;
    this.watchedCodegraphPath = "";
  }

  private async autoLoadInitialFiles(): Promise<void> {
    if (!this.webviewReady || !this.state.workspacePath || this.state.initialGraph) {
      return;
    }

    const cacheKey = graphCacheKey("initial-files", this.state.workspacePath);
    if (this.lastAutoLoadKey === cacheKey) {
      return;
    }

    this.lastAutoLoadKey = cacheKey;
    await this.loadFiles();
  }
}

function graphCacheKey(...parts: string[]): string {
  return parts.map((part) => part.replace(/\|/g, "%7C")).join("|");
}

function normalizePositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function normalizeGraphSeed(seed: GraphSeed | undefined): GraphSeed | undefined {
  if (!seed) {
    return undefined;
  }
  const query = seed.query?.trim();
  return {
    source: seed.source === "search" ? "search" : "files",
    seedKey: seed.seedKey?.trim(),
    query,
    pattern: seed.pattern?.trim(),
    kind: seed.kind?.trim(),
    mode: seed.mode,
    limit: normalizePositiveNumber(seed.limit, 20),
    depth: normalizePositiveNumber(seed.depth, 2),
  };
}

function getNonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";
  for (let index = 0; index < 32; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function getCodegraphIndexUpdatedAt(codegraphPath: vscode.Uri): Promise<number | undefined> {
  const candidates = [
    codegraphPath,
    vscode.Uri.joinPath(codegraphPath, "codegraph.db"),
    vscode.Uri.joinPath(codegraphPath, "index.db"),
    vscode.Uri.joinPath(codegraphPath, "graph.db"),
  ];
  const times = await Promise.all(candidates.map(async (uri) => {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      return stat.mtime;
    } catch {
      return 0;
    }
  }));
  const latest = Math.max(...times);
  return latest > 0 ? latest : undefined;
}

async function showCodegraphDocument(document: vscode.TextDocument): Promise<vscode.TextEditor> {
  return vscode.window.showTextDocument(document, {
    preview: false,
    viewColumn: vscode.ViewColumn.Beside,
  });
}

function toSafePngFileName(value: string | undefined): string {
  return toSafeFileName(value, "codegraph-graph.png", ".png");
}

function toSafeFileName(value: string | undefined, fallback: string, extension: string): string {
  const base = (value?.trim() || fallback).replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, "-");
  return base.toLowerCase().endsWith(extension) ? base : `${base}${extension}`;
}
