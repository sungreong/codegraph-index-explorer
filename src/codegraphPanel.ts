import * as vscode from "vscode";
import {
  CodegraphFileResult,
  CodegraphRelatedResult,
  CodegraphSearchResult,
  CodegraphWorkspace,
  getCodegraphCallees,
  getCodegraphCallers,
  getCodegraphImpact,
  getCodegraphStatus,
  listCodegraphFiles,
  queryCodegraph,
  resolveResultUri,
} from "./codegraphCli";
import { getDashboardHtml } from "./dashboardHtml";
import { CodegraphGraphPanel, GraphSeed } from "./codegraphGraphPanel";

export interface DashboardSearchResults {
  query: string;
  workspacePath: string;
  results: CodegraphSearchResult[];
  commandPreview?: string;
}

interface DashboardState {
  active: boolean;
  workspaceName?: string;
  workspacePath?: string;
  status?: unknown;
  files: CodegraphFileResult[];
  error?: string;
}

type DashboardMessage =
  | { type: "ready" }
  | { type: "search"; query?: string; kind?: string; mode?: "symbols" | "callers" | "callees" | "impact"; limit?: number; depth?: number; requestId?: number }
  | { type: "relationshipSummary"; symbol?: string; cacheKey?: string; limit?: number; depth?: number }
  | { type: "loadFiles"; filter?: string; pattern?: string; requestId?: number }
  | { type: "copyText"; text?: string; label?: string }
  | ({ type: "openGraph" } & GraphSeed)
  | { type: "openFile"; item?: CodegraphFileResult }
  | { type: "openRelated"; item?: CodegraphRelatedResult }
  | { type: "openResult"; item?: CodegraphSearchResult }
  | { type: "related"; mode?: "callers" | "callees" | "impact"; symbol?: string; requestId?: number };

export class CodegraphDashboardPanel {
  private static current: CodegraphDashboardPanel | undefined;
  private state: DashboardState = { active: false, files: [] };
  private workspace: CodegraphWorkspace | undefined;
  private searchRequestId = 0;
  private filesRequestId = 0;
  private relatedRequestId = 0;

  static open(
    context: vscode.ExtensionContext,
    workspace: CodegraphWorkspace | undefined,
    onSearchResults?: (search: DashboardSearchResults) => void,
  ): CodegraphDashboardPanel {
    if (CodegraphDashboardPanel.current) {
      CodegraphDashboardPanel.current.panel.reveal(vscode.ViewColumn.One);
      CodegraphDashboardPanel.current.onSearchResults = onSearchResults;
      void CodegraphDashboardPanel.current.load(workspace);
      return CodegraphDashboardPanel.current;
    }

    const panel = vscode.window.createWebviewPanel(
      "codegraph.dashboard",
      "Codegraph",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );
    CodegraphDashboardPanel.current = new CodegraphDashboardPanel(context, panel, onSearchResults);
    void CodegraphDashboardPanel.current.load(workspace);
    return CodegraphDashboardPanel.current;
  }

  private constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly panel: vscode.WebviewPanel,
    private onSearchResults: ((search: DashboardSearchResults) => void) | undefined,
  ) {
    this.panel.webview.html = getDashboardHtml(getNonce());
    this.panel.onDidDispose(() => {
      CodegraphDashboardPanel.current = undefined;
    }, null, this.context.subscriptions);
    this.panel.webview.onDidReceiveMessage((message: DashboardMessage) => {
      void this.handleMessage(message);
    }, null, this.context.subscriptions);
  }

  private async load(workspace: CodegraphWorkspace | undefined): Promise<void> {
    this.workspace = workspace;
    if (!workspace) {
      this.state = {
        active: false,
        files: [],
        error: "No .codegraph directory found in this workspace.",
      };
      this.postState();
      return;
    }

    this.state = {
      active: true,
      workspaceName: workspace.folder.name,
      workspacePath: workspace.folder.uri.fsPath,
      files: [],
    };
    this.postState();

    try {
      const [status, files] = await Promise.all([
        getCodegraphStatus(workspace.folder.uri.fsPath),
        listCodegraphFiles(workspace.folder.uri.fsPath),
      ]);
      this.state = {
        active: true,
        workspaceName: workspace.folder.name,
        workspacePath: workspace.folder.uri.fsPath,
        status,
        files,
      };
    } catch (error) {
      this.state = {
        ...this.state,
        active: false,
        error: getErrorMessage(error),
      };
    }

    this.postState();
  }

  private async handleMessage(message: DashboardMessage): Promise<void> {
    if (message.type === "ready") {
      this.postState();
      return;
    }

    if (message.type === "search") {
      await this.search(message);
      return;
    }

    if (message.type === "loadFiles") {
      await this.loadFiles(message.filter, message.pattern);
      return;
    }

    if (message.type === "copyText") {
      await this.copyText(message.text, message.label);
      return;
    }

    if (message.type === "relationshipSummary" && message.symbol) {
      await this.relationshipSummary(message.symbol, message.cacheKey, message.limit, message.depth);
      return;
    }

    if (message.type === "openGraph") {
      CodegraphGraphPanel.open(this.context, this.workspace, message);
      return;
    }

    if (message.type === "openFile" && message.item?.path) {
      await this.openFile(message.item.path);
      return;
    }

    if (message.type === "openResult" && message.item?.file) {
      await this.openResult(message.item);
      return;
    }

    if (message.type === "openRelated" && message.item?.file) {
      await this.openRelated(message.item);
      return;
    }

    if (message.type === "related" && message.mode && message.symbol) {
      await this.related(message.mode, message.symbol);
    }
  }

  private async search(message: Extract<DashboardMessage, { type: "search" }>): Promise<void> {
    const query = message.query?.trim();
    if (!query || !this.state.workspacePath) {
      return;
    }

    const requestId = ++this.searchRequestId;
    this.panel.webview.postMessage({ type: "loading", target: "search", requestId, message: `Searching "${query}"...` });

    try {
      const limit = normalizePositiveNumber(message.limit, vscode.workspace.getConfiguration("codegraph").get<number>("searchLimit") ?? 20);
      const depth = normalizePositiveNumber(message.depth, 2);
      const mode = message.mode ?? "symbols";
      const results = mode === "symbols"
        ? await queryCodegraph(this.state.workspacePath, query, limit, message.kind)
        : mode === "callers"
          ? await getCodegraphCallers(this.state.workspacePath, query, limit)
          : mode === "callees"
            ? await getCodegraphCallees(this.state.workspacePath, query, limit)
            : await getCodegraphImpact(this.state.workspacePath, query, depth);
      if (requestId !== this.searchRequestId) {
        return;
      }

      this.onSearchResults?.({
        query,
        workspacePath: this.state.workspacePath,
        results,
        commandPreview: dashboardCommandPreview(this.state.workspacePath, query, mode, message.kind, limit, depth),
      });
      this.panel.webview.postMessage({ type: "searchResults", results, requestId });
    } catch (error) {
      if (requestId !== this.searchRequestId) {
        return;
      }

      this.panel.webview.postMessage({
        type: "searchResults",
        results: [],
        requestId,
        error: getErrorMessage(error),
      });
    }
  }

  private async loadFiles(filter: string | undefined, pattern: string | undefined): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const requestId = ++this.filesRequestId;
    this.panel.webview.postMessage({ type: "loading", target: "files", requestId, message: "Loading files from Codegraph..." });

    try {
      const files = await listCodegraphFiles(this.state.workspacePath, filter?.trim(), pattern?.trim());
      if (requestId !== this.filesRequestId) {
        return;
      }

      this.state = { ...this.state, files, error: undefined };
      this.panel.webview.postMessage({ type: "filesResults", files, requestId });
    } catch (error) {
      if (requestId !== this.filesRequestId) {
        return;
      }

      this.panel.webview.postMessage({
        type: "filesResults",
        files: [],
        requestId,
        error: getErrorMessage(error),
      });
    }
  }

  private async openFile(filePath: string): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(resolveResultUri(this.state.workspacePath, filePath));
    await showCodegraphDocument(document);
  }

  private async copyText(text: string | undefined, label: string | undefined): Promise<void> {
    const value = text?.trim();
    if (!value) {
      return;
    }

    await vscode.env.clipboard.writeText(value);
    vscode.window.showInformationMessage(label ? `Copied ${label}.` : "Copied Codegraph context.");
  }

  private async openResult(result: CodegraphSearchResult): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(resolveResultUri(this.state.workspacePath, result.file));
    const editor = await showCodegraphDocument(document);
    const line = Math.max((result.line ?? 1) - 1, 0);
    const column = Math.max((result.column ?? 1) - 1, 0);
    const position = new vscode.Position(line, column);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }

  private async openRelated(result: CodegraphRelatedResult): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(resolveResultUri(this.state.workspacePath, result.file));
    const editor = await showCodegraphDocument(document);
    const line = Math.max((result.line ?? 1) - 1, 0);
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }

  private async related(mode: "callers" | "callees" | "impact", symbol: string): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const requestId = ++this.relatedRequestId;
    this.panel.webview.postMessage({ type: "loading", target: "related", requestId, message: `Loading ${mode} for "${symbol}"...` });

    try {
      const limit = vscode.workspace.getConfiguration("codegraph").get<number>("searchLimit") ?? 20;
      const results = mode === "callers"
        ? await getCodegraphCallers(this.state.workspacePath, symbol, limit)
        : mode === "callees"
          ? await getCodegraphCallees(this.state.workspacePath, symbol, limit)
          : await getCodegraphImpact(this.state.workspacePath, symbol, 2);
      if (requestId !== this.relatedRequestId) {
        return;
      }

      this.panel.webview.postMessage({ type: "relatedResults", mode, symbol, results, requestId });
    } catch (error) {
      if (requestId !== this.relatedRequestId) {
        return;
      }

      this.panel.webview.postMessage({
        type: "relatedResults",
        mode,
        symbol,
        results: [],
        requestId,
        error: getErrorMessage(error),
      });
    }
  }

  private async relationshipSummary(
    symbol: string,
    cacheKey: string | undefined,
    limitValue: number | undefined,
    depthValue: number | undefined,
  ): Promise<void> {
    const query = symbol.trim();
    if (!query || !this.state.workspacePath) {
      return;
    }

    const limit = normalizePositiveNumber(limitValue, 5);
    const depth = normalizePositiveNumber(depthValue, 2);
    const [callers, callees, impact] = await Promise.all([
      summarizeRelated(() => getCodegraphCallers(this.state.workspacePath ?? "", query, limit), limit),
      summarizeRelated(() => getCodegraphCallees(this.state.workspacePath ?? "", query, limit), limit),
      summarizeRelated(() => getCodegraphImpact(this.state.workspacePath ?? "", query, depth), limit),
    ]);

    this.panel.webview.postMessage({
      type: "relationshipSummary",
      symbol: query,
      cacheKey: cacheKey?.trim() || query,
      callers,
      callees,
      impact,
    });
  }

  private postState(): void {
    this.panel.webview.postMessage({ type: "state", ...this.state });
  }
}

function normalizePositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function dashboardCommandPreview(
  workspacePath: string,
  query: string,
  mode: "symbols" | "callers" | "callees" | "impact",
  kind: string | undefined,
  limit: number,
  depth: number,
): string {
  if (mode === "symbols") {
    return ["codegraph", "query", "--json", "--path", workspacePath, "--limit", String(limit), kind ? `--kind ${kind}` : "", query].filter(Boolean).join(" ");
  }

  if (mode === "impact") {
    return ["codegraph", "impact", "--json", "--path", workspacePath, "--depth", String(depth), query].join(" ");
  }

  return ["codegraph", mode, "--json", "--path", workspacePath, "--limit", String(limit), query].join(" ");
}

function getNonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";
  for (let index = 0; index < 32; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

async function showCodegraphDocument(document: vscode.TextDocument): Promise<vscode.TextEditor> {
  return vscode.window.showTextDocument(document, {
    preview: false,
    viewColumn: vscode.ViewColumn.Beside,
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function summarizeRelated(
  load: () => Promise<CodegraphRelatedResult[]>,
  limit: number,
): Promise<{ count: number; hasMore: boolean; items: CodegraphRelatedResult[]; error?: string }> {
  try {
    const items = await load();
    const previewCount = Math.min(items.length, limit);
    return {
      count: previewCount,
      hasMore: items.length >= limit,
      items: items.slice(0, previewCount),
    };
  } catch (error) {
    return {
      count: 0,
      hasMore: false,
      items: [],
      error: getErrorMessage(error),
    };
  }
}
