import * as vscode from "vscode";
import {
  CodegraphSearchResult,
  CodegraphWorkspace,
  clearCodegraphCache,
  findCodegraphWorkspace,
  getCodegraphCallers,
  getCodegraphCallees,
  getCodegraphImpact,
  getCodegraphStatus,
  queryCodegraph,
  resolveResultUri,
} from "./codegraphCli";

interface SidebarState {
  active: boolean;
  workspaceName?: string;
  workspacePath?: string;
  statusLabel: string;
  results: CodegraphSearchResult[];
  query: string;
  commandPreview?: string;
  error?: string;
}

type SidebarMessage =
  | { type: "ready" }
  | { type: "search"; query?: string; mode?: SearchMode; kind?: string; limit?: number; depth?: number }
  | { type: "openDashboard" }
  | { type: "openGraph" }
  | { type: "openChangelog" }
  | { type: "syncBundledSkills" }
  | { type: "refresh" }
  | { type: "openResult"; item?: CodegraphSearchResult }
  | { type: "copy"; text?: string; label?: string };

type SearchMode = "symbols" | "callers" | "callees" | "impact";

export class CodegraphSidebarView implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private searchRequestId = 0;
  private state: SidebarState = {
    active: false,
    statusLabel: "Checking Codegraph...",
    results: [],
    query: "",
  };

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly onOpenDashboard: () => void,
    private readonly onOpenGraph: () => void,
    private readonly onOpenChangelog: () => void,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = sidebarHtml(getNonce());
    webviewView.webview.onDidReceiveMessage((message: SidebarMessage) => {
      void this.handleMessage(message);
    }, null, this.context.subscriptions);
    this.postState();
  }

  async refresh(refreshCaches = false): Promise<void> {
    if (refreshCaches) {
      clearCodegraphCache();
    }

    this.state = { ...this.state, active: false, statusLabel: "Checking Codegraph...", error: undefined };
    this.postState();

    const workspace = await findCodegraphWorkspace();
    if (!workspace) {
      this.state = {
        ...this.state,
        active: false,
        workspaceName: undefined,
        workspacePath: undefined,
        statusLabel: "No .codegraph found",
        results: [],
        error: "Open a Codegraph-initialized workspace or run codegraph init.",
      };
      this.postState();
      return;
    }

    await this.loadWorkspace(workspace);
  }

  setSearchResults(query: string, workspacePath: string, results: CodegraphSearchResult[], commandPreview?: string): void {
    this.state = {
      ...this.state,
      query,
      workspacePath,
      results,
      commandPreview,
      error: undefined,
    };
    this.postState();
  }

  private async loadWorkspace(workspace: CodegraphWorkspace): Promise<void> {
    try {
      const status = await getCodegraphStatus(workspace.folder.uri.fsPath);
      this.state = {
        ...this.state,
        active: true,
        workspaceName: workspace.folder.name,
        workspacePath: workspace.folder.uri.fsPath,
        statusLabel: summarizeStatus(status),
        error: undefined,
      };
    } catch (error) {
      this.state = {
        ...this.state,
        active: false,
        workspaceName: workspace.folder.name,
        workspacePath: workspace.folder.uri.fsPath,
        statusLabel: ".codegraph status failed",
        error: getErrorMessage(error),
      };
    }

    this.postState();
  }

  private async handleMessage(message: SidebarMessage): Promise<void> {
    if (message.type === "ready") {
      this.postState();
      return;
    }

    if (message.type === "refresh") {
      await this.refresh(true);
      return;
    }

    if (message.type === "openDashboard") {
      this.onOpenDashboard();
      return;
    }

    if (message.type === "openGraph") {
      this.onOpenGraph();
      return;
    }

    if (message.type === "openChangelog") {
      this.onOpenChangelog();
      return;
    }

    if (message.type === "syncBundledSkills") {
      await vscode.commands.executeCommand("codegraph.syncBundledSkills");
      return;
    }

    if (message.type === "search") {
      await this.search(message);
      return;
    }

    if (message.type === "openResult" && message.item?.file) {
      await this.openResult(message.item);
      return;
    }

    if (message.type === "copy" && message.text?.trim()) {
      await vscode.env.clipboard.writeText(message.text);
      vscode.window.showInformationMessage(message.label ? `Copied ${message.label}.` : "Copied Codegraph context.");
    }
  }

  private async search(message: Extract<SidebarMessage, { type: "search" }>): Promise<void> {
    const query = message.query?.trim();
    if (!query || !this.state.workspacePath) {
      return;
    }

    const requestId = ++this.searchRequestId;
    const previousCount = this.state.results.length;
    this.view?.webview.postMessage({ type: "loading", query, requestId, previousCount });

    try {
      const limit = normalizePositiveNumber(message.limit, vscode.workspace.getConfiguration("codegraph").get<number>("searchLimit") ?? 20);
      const depth = normalizePositiveNumber(message.depth, 2);
      const mode = message.mode ?? "symbols";
      const commandPreview = commandPreviewFor(this.state.workspacePath, query, mode, message.kind, limit, depth);
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

      this.setSearchResults(query, this.state.workspacePath, results, commandPreview);
    } catch (error) {
      if (requestId !== this.searchRequestId) {
        return;
      }

      this.state = { ...this.state, query, results: [], error: getErrorMessage(error) };
      this.postState();
    }
  }

  private async openResult(result: CodegraphSearchResult): Promise<void> {
    if (!this.state.workspacePath) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(resolveResultUri(this.state.workspacePath, result.file));
    const editor = await vscode.window.showTextDocument(document, { preview: false });
    const line = Math.max((result.line ?? 1) - 1, 0);
    const column = Math.max((result.column ?? 1) - 1, 0);
    const position = new vscode.Position(line, column);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }

  private postState(): void {
    this.view?.webview.postMessage({ type: "state", ...this.state });
  }
}

function sidebarHtml(nonce: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${sidebarStyles()}</style></head><body>
  <main class="sidebar">
    <div class="status">
      <strong id="statusText">Checking Codegraph...</strong>
      <span id="workspaceText"></span>
    </div>
    <form id="searchForm" class="search">
      <input id="query" type="search" placeholder="Search Codegraph..." autocomplete="off">
      <button type="submit">Search</button>
    </form>
    <div class="filters">
      <select id="mode"><option value="symbols">Symbols</option><option value="callers">Callers</option><option value="callees">Callees</option><option value="impact">Impact</option></select>
      <select id="kind"><option value="">Any kind</option><option value="function">function</option><option value="method">method</option><option value="class">class</option><option value="interface">interface</option><option value="type">type</option><option value="variable">variable</option><option value="route">route</option><option value="component">component</option></select>
      <input id="limit" type="number" min="1" max="100" value="20" title="Limit">
    </div>
    <div class="actions" aria-label="Result actions">
      <button id="selectAll" type="button" title="Select all visible results">☑</button>
      <button id="copyLocations" type="button" title="Copy selected locations, or all results if none are selected">📍</button>
      <button id="copyPrompt" type="button" title="Copy agent prompt for selected results, or all results if none are selected">AI</button>
      <button id="syncSkills" type="button" title="Sync bundled Codegraph agent skill into this workspace">⇩</button>
      <button id="dashboard" type="button" title="Open dashboard">▦</button>
      <button id="graph" type="button" title="Open graph explorer">◎</button>
      <button id="changelog" type="button" title="Show update history">≡</button>
      <button id="refresh" type="button" title="Refresh Codegraph status">↻</button>
    </div>
    <div id="error" class="error" hidden></div>
    <div id="commandRow" class="command-row" hidden>
      <div id="commandPreview" class="command-preview"></div>
      <button id="copyCommand" type="button" title="Copy Codegraph command">⧉</button>
    </div>
    <div id="meta" class="meta">0 results · 0 selected</div>
    <div id="results" class="results"><div class="empty">Search here to show Codegraph results in this side tab.</div></div>
  </main>
  <script nonce="${nonce}">${sidebarScript()}</script></body></html>`;
}

function sidebarStyles(): string {
  return `
    body { margin: 0; color: var(--vscode-sideBar-foreground); background: var(--vscode-sideBar-background); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
    [hidden] { display: none !important; }
    .sidebar { display: grid; gap: 8px; padding: 10px; }
    .status { display: grid; gap: 3px; color: var(--vscode-descriptionForeground); }
    .status strong { color: var(--vscode-foreground); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .status span { font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .search { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px; }
    .filters { display: grid; grid-template-columns: 1fr 1fr 58px; gap: 6px; }
    input, select, button { box-sizing: border-box; min-width: 0; min-height: 28px; border-radius: 4px; }
    input, select { width: 100%; border: 1px solid var(--vscode-input-border); color: var(--vscode-input-foreground); background: var(--vscode-input-background); padding: 5px 7px; }
    select { border-color: var(--vscode-dropdown-border); color: var(--vscode-dropdown-foreground); background: var(--vscode-dropdown-background); }
    button { border: 1px solid var(--vscode-button-border, transparent); color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); padding: 4px 7px; font-weight: 600; cursor: pointer; }
    button:hover { background: var(--vscode-button-secondaryHoverBackground); }
    .actions { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; }
    .actions button { font-size: 12px; padding-inline: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #copyPrompt { font-weight: 800; letter-spacing: 0; }
    .command-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 34px;
      gap: 6px;
      align-items: center;
    }
    .command-preview {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 4px 7px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 70%, transparent);
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta { color: var(--vscode-descriptionForeground); font-size: 11px; }
    .error { color: var(--vscode-errorForeground); font-size: 12px; line-height: 1.35; }
    .results { display: grid; gap: 1px; }
    .empty { color: var(--vscode-descriptionForeground); line-height: 1.45; padding: 12px 2px; }
    .row { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 7px; padding: 7px 4px; border-radius: 4px; cursor: pointer; }
    .row:hover, .row.selected { background: var(--vscode-list-hoverBackground); }
    .row input { width: 14px; height: 14px; min-height: 0; margin-top: 2px; padding: 0; }
    .title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
    .detail, .sig { margin-top: 2px; color: var(--vscode-descriptionForeground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
    .kind { color: var(--vscode-badge-foreground); background: var(--vscode-badge-background); border-radius: 999px; padding: 1px 6px; font-size: 10px; margin-right: 4px; }
  `;
}

function sidebarScript(): string {
  return `
    const vscode = acquireVsCodeApi();
    let state = { results: [], selected: {}, workspacePath: '', query: '', loading: false, loadingQuery: '' };
    let searchTimer = 0;
    const els = {
      statusText: document.getElementById('statusText'), workspaceText: document.getElementById('workspaceText'), query: document.getElementById('query'),
      searchForm: document.getElementById('searchForm'), mode: document.getElementById('mode'), kind: document.getElementById('kind'), limit: document.getElementById('limit'),
      selectAll: document.getElementById('selectAll'), copyLocations: document.getElementById('copyLocations'),
      copyPrompt: document.getElementById('copyPrompt'), syncSkills: document.getElementById('syncSkills'), dashboard: document.getElementById('dashboard'), graph: document.getElementById('graph'), refresh: document.getElementById('refresh'),
      changelog: document.getElementById('changelog'),
      error: document.getElementById('error'), commandRow: document.getElementById('commandRow'), commandPreview: document.getElementById('commandPreview'), copyCommand: document.getElementById('copyCommand'), meta: document.getElementById('meta'), results: document.getElementById('results')
    };
    els.searchForm.addEventListener('submit', (event) => { event.preventDefault(); search(); });
    els.selectAll.addEventListener('click', toggleAll);
    els.copyLocations.addEventListener('click', () => copy('locations'));
    els.copyPrompt.addEventListener('click', () => copy('prompt'));
    els.copyCommand.addEventListener('click', () => {
      const text = state.commandPreview || commandPreview();
      vscode.postMessage({ type: 'copy', text, label: 'Codegraph command' });
    });
    els.syncSkills.addEventListener('click', () => vscode.postMessage({ type: 'syncBundledSkills' }));
    els.dashboard.addEventListener('click', () => vscode.postMessage({ type: 'openDashboard' }));
    els.graph.addEventListener('click', () => vscode.postMessage({ type: 'openGraph' }));
    els.changelog.addEventListener('click', () => vscode.postMessage({ type: 'openChangelog' }));
    els.refresh.addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'loading') {
        state.loading = true;
        state.loadingQuery = message.query || '';
        render();
      }
      if (message.type === 'state') { state = { ...state, ...message, selected: state.selected || {}, loading: false, loadingQuery: '' }; render(); }
    });
    function search() {
      const query = els.query.value.trim();
      if (!query) { return; }
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => postSearch(query), 120);
    }
    function postSearch(query) {
      state.selected = {};
      state.loading = true;
      state.loadingQuery = query;
      render();
      vscode.postMessage({ type: 'search', query, mode: els.mode.value, kind: els.mode.value === 'symbols' ? els.kind.value : '', limit: Number(els.limit.value) || 20, depth: 2 });
    }
    function render() {
      els.statusText.textContent = state.statusLabel || 'Codegraph';
      els.workspaceText.textContent = state.workspaceName ? state.workspaceName : (state.workspacePath || '');
      if (state.query && els.query.value !== state.query) { els.query.value = state.query; }
      els.error.hidden = !state.error;
      els.error.textContent = state.error || '';
      els.commandRow.hidden = !state.commandPreview;
      els.commandPreview.textContent = state.commandPreview || '';
      els.commandPreview.title = state.commandPreview || '';
      const selectedCount = selectedItems().length;
      const loadingText = state.loading ? 'Searching "' + state.loadingQuery + '" · ' : '';
      els.meta.textContent = loadingText + (state.results || []).length.toLocaleString() + ' results · ' + selectedCount.toLocaleString() + ' selected';
      els.copyLocations.disabled = !state.results || state.results.length === 0;
      els.copyPrompt.disabled = !state.results || state.results.length === 0;
      if (!state.results || state.results.length === 0) {
        els.results.innerHTML = state.loading
          ? '<div class="empty">Searching "' + escapeHtml(state.loadingQuery) + '"...</div>'
          : '<div class="empty">Search here to show Codegraph results in this side tab.</div>';
        return;
      }
      els.results.innerHTML = state.results.map((item, index) => rowHtml(item, index)).join('');
      els.results.querySelectorAll('.row').forEach((row) => {
        const item = state.results[Number(row.dataset.index)];
        row.addEventListener('click', (event) => {
          if (event.target && event.target.matches('input')) { return; }
          vscode.postMessage({ type: 'openResult', item });
        });
      });
      els.results.querySelectorAll('[data-check]').forEach((check) => check.addEventListener('change', () => {
        state.selected[resultKey(state.results[Number(check.dataset.check)])] = check.checked;
        render();
      }));
    }
    function rowHtml(item, index) {
      const key = resultKey(item);
      const location = item.file + (item.line ? ':' + item.line : '') + (item.column ? ':' + item.column : '');
      const sig = item.signature || item.detail || '';
      return '<div class="row" data-index="' + index + '"><input type="checkbox" data-check="' + index + '"' + (state.selected[key] ? ' checked' : '') + '><div><div class="title"><span class="kind">' + escapeHtml(item.kind || 'symbol') + '</span>' + escapeHtml(item.name || item.file) + '</div><div class="detail">' + escapeHtml(location) + '</div>' + (sig ? '<div class="sig">' + escapeHtml(sig) + '</div>' : '') + '</div></div>';
    }
    function toggleAll() {
      const results = state.results || [];
      const all = results.length > 0 && results.every((item) => state.selected[resultKey(item)]);
      results.forEach((item) => { state.selected[resultKey(item)] = !all; });
      render();
    }
    function selectedItems() {
      return (state.results || []).filter((item) => state.selected[resultKey(item)]);
    }
    function copy(kind) {
      const items = selectedItemsOrAll();
      if (!items.length) { return; }
      const text = kind === 'prompt' ? promptText(items) : items.map(locationLine).join('\\n');
      vscode.postMessage({ type: 'copy', text, label: kind === 'prompt' ? 'agent prompt' : items.length + ' Codegraph location' + (items.length === 1 ? '' : 's') });
    }
    function selectedItemsOrAll() {
      const selected = selectedItems();
      return selected.length ? selected : (state.results || []);
    }
    function promptText(items) {
      const question = els.query.value.trim() || '<write your question here>';
      return ['You are helping navigate a Codegraph-indexed codebase.', '', 'Question:', question, '', 'Codegraph command:', state.commandPreview || commandPreview(), '', 'Before answering, judge whether this question is structurally appropriate for the codebase context below. If it is too broad, ambiguous, or points at the wrong part of the structure, explain that briefly and rewrite it into a better Codegraph-oriented question. Then use the locations below as the first places to inspect.', '', 'Codegraph search context:', ...items.map((item, index) => String(index + 1) + '. ' + locationLine(item))].join('\\n');
    }
    function commandPreview() {
      const query = els.query.value.trim() || '<query>';
      const limit = Number(els.limit.value) || 20;
      const mode = els.mode.value;
      if (mode === 'symbols') {
        return ['codegraph', 'query', '--json', '--path', '<workspace>', '--limit', limit, els.kind.value ? '--kind ' + els.kind.value : '', query].filter(Boolean).join(' ');
      }
      if (mode === 'impact') {
        return ['codegraph', 'impact', '--json', '--path', '<workspace>', '--depth', 2, query].join(' ');
      }
      return ['codegraph', mode, '--json', '--path', '<workspace>', '--limit', limit, query].join(' ');
    }
    function locationLine(item) {
      return [absoluteLocation(item), [item.kind, item.name].filter(Boolean).join(' ')].filter(Boolean).join(' | ');
    }
    function absoluteLocation(item) {
      const file = String(item.file || '');
      const suffix = (item.line ? ':' + item.line : '') + (item.column ? ':' + item.column : '');
      if (!state.workspacePath || /^[a-zA-Z]:[\\\\/]/.test(file) || file.startsWith('/')) { return file + suffix; }
      const sep = state.workspacePath.includes('\\\\') ? '\\\\' : '/';
      return state.workspacePath.replace(/[\\\\/]+$/, '') + sep + file.replace(/^[\\\\/]+/, '') + suffix;
    }
    function resultKey(item) { return [item.file || '', item.line || '', item.column || '', item.kind || '', item.name || ''].join('|'); }
    function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
    vscode.postMessage({ type: 'ready' });
  `;
}

function normalizePositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function commandPreviewFor(
  workspacePath: string,
  query: string,
  mode: SearchMode,
  kind: string | undefined,
  limit: number,
  depth: number,
): string {
  if (mode === "symbols") {
    return [
      "codegraph",
      "query",
      "--json",
      "--path",
      workspacePath,
      "--limit",
      String(limit),
      kind ? `--kind ${kind}` : "",
      query,
    ].filter(Boolean).join(" ");
  }

  if (mode === "impact") {
    return ["codegraph", "impact", "--json", "--path", workspacePath, "--depth", String(depth), query].join(" ");
  }

  return ["codegraph", mode, "--json", "--path", workspacePath, "--limit", String(limit), query].join(" ");
}

function summarizeStatus(status: unknown): string {
  if (typeof status !== "object" || status === null) {
    return "Codegraph active";
  }

  const record = status as Record<string, unknown>;
  return [
    typeof record.fileCount === "number" ? `${record.fileCount.toLocaleString()} files` : undefined,
    typeof record.nodeCount === "number" ? `${record.nodeCount.toLocaleString()} nodes` : undefined,
    typeof record.edgeCount === "number" ? `${record.edgeCount.toLocaleString()} edges` : undefined,
  ].filter(Boolean).join(" | ") || "Codegraph active";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getNonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";
  for (let index = 0; index < 32; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}
