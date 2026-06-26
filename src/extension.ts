import * as path from "node:path";
import * as vscode from "vscode";
import {
  CodegraphFileResult,
  CodegraphSearchResult,
  clearCodegraphCache,
  findCodegraphWorkspace,
  getCodegraphStatus,
  listCodegraphFiles,
  preloadCodegraphWorkspace,
  queryCodegraph,
  resolveResultUri,
} from "./codegraphCli";
import { notifyCodegraphUpdate, openCodegraphChangelog } from "./codegraphChangelog";
import { CodegraphDashboardPanel } from "./codegraphPanel";
import { CodegraphGraphPanel } from "./codegraphGraphPanel";
import { CODEGRAPH_SKILL_TARGET_ROOTS, syncBundledCodegraphSkills } from "./codegraphSkills";
import { CodegraphSidebarView } from "./codegraphSidebarView";

export function activate(context: vscode.ExtensionContext): void {
  let sidebarView: CodegraphSidebarView;
  sidebarView = new CodegraphSidebarView(
    context,
    () => openDashboard(context, sidebarView),
    () => openGraph(context),
    () => openCodegraphChangelog(context),
  );
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(sync~spin) Codegraph";
  statusBarItem.tooltip = "Checking Codegraph workspace";
  statusBarItem.command = "codegraph.openDashboard";
  statusBarItem.show();
  void vscode.commands.executeCommand("setContext", "codegraph.active", false);
  const refreshStatus = (refreshCaches = false) => refreshCodegraphStatus(sidebarView, statusBarItem, refreshCaches);

  context.subscriptions.push(
    vscode.commands.registerCommand("codegraph.openDashboard", () => openDashboard(context, sidebarView)),
    vscode.commands.registerCommand("codegraph.openGraph", () => openGraph(context)),
    vscode.commands.registerCommand("codegraph.search", () => searchSymbols(sidebarView)),
    vscode.commands.registerCommand("codegraph.showStatus", showStatus),
    vscode.commands.registerCommand("codegraph.listFiles", listIndexedFiles),
    vscode.commands.registerCommand("codegraph.refresh", () => refreshStatus(true)),
    vscode.commands.registerCommand("codegraph.syncBundledSkills", () => syncBundledSkills(context)),
    vscode.commands.registerCommand("codegraph.showUpdateHistory", () => openCodegraphChangelog(context)),
    vscode.window.registerWebviewViewProvider("codegraph.actions", sidebarView, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => refreshStatus(true)),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("codegraph.cliPath")) {
        clearCodegraphCache();
        void refreshStatus(false);
      }
    }),
    statusBarItem,
  );

  void refreshStatus();
  void notifyCodegraphUpdate(context);
}

export function deactivate(): void {
  // VS Code calls this when the extension host unloads.
}

async function openDashboard(context: vscode.ExtensionContext, sidebarView?: CodegraphSidebarView): Promise<void> {
  const workspace = await findCodegraphWorkspace();
  CodegraphDashboardPanel.open(context, workspace, (search) => {
    sidebarView?.setSearchResults(search.query, search.workspacePath, search.results, search.commandPreview);
  });
}

async function openGraph(context: vscode.ExtensionContext): Promise<void> {
  const workspace = await findCodegraphWorkspace();
  CodegraphGraphPanel.open(context, workspace);
}

async function searchSymbols(sidebarView?: CodegraphSidebarView): Promise<void> {
  const workspace = await requireCodegraphWorkspace();
  if (!workspace) {
    return;
  }

  const query = await vscode.window.showInputBox({
    title: "Codegraph Search",
    prompt: "Search symbols indexed by Codegraph",
    placeHolder: "function, class, component, or symbol name",
  });

  if (!query) {
    return;
  }

  const results = await runCommand("search Codegraph", async () => {
    const limit = vscode.workspace.getConfiguration("codegraph").get<number>("searchLimit") ?? 20;
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Searching Codegraph for "${query}"`,
        cancellable: false,
      },
      () => queryCodegraph(workspace.folder.uri.fsPath, query, limit),
    );
  });

  if (!results) {
    return;
  }

  const limit = vscode.workspace.getConfiguration("codegraph").get<number>("searchLimit") ?? 20;
  sidebarView?.setSearchResults(
    query,
    workspace.folder.uri.fsPath,
    results,
    ["codegraph", "query", "--json", "--path", workspace.folder.uri.fsPath, "--limit", String(limit), query].join(" "),
  );

  if (results.length === 0) {
    vscode.window.showInformationMessage(`No Codegraph results for "${query}".`);
    return;
  }

  const selected = await vscode.window.showQuickPick(
    results.map((result) => toSearchPickItem(workspace.folder.uri.fsPath, result)),
    {
      title: "Codegraph Results",
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: "Select a result to open its file",
    },
  );

  if (selected) {
    await runCommand("open Codegraph result", () => openResult(workspace.folder.uri.fsPath, selected.result));
  }
}

async function showStatus(): Promise<void> {
  const workspace = await requireCodegraphWorkspace();
  if (!workspace) {
    return;
  }

  const status = await runCommand("read Codegraph status", () => vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Reading Codegraph status",
      cancellable: false,
    },
    () => getCodegraphStatus(workspace.folder.uri.fsPath),
  ));

  if (!status) {
    return;
  }

  const document = await vscode.workspace.openTextDocument({
    language: "json",
    content: JSON.stringify(status, null, 2),
  });
  await vscode.window.showTextDocument(document, { preview: true });
}

async function listIndexedFiles(): Promise<void> {
  const workspace = await requireCodegraphWorkspace();
  if (!workspace) {
    return;
  }

  const files = await runCommand("read Codegraph files", () => vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Reading Codegraph files",
      cancellable: false,
    },
    () => listCodegraphFiles(workspace.folder.uri.fsPath),
  ));

  if (!files) {
    return;
  }

  if (files.length === 0) {
    vscode.window.showInformationMessage("Codegraph has no indexed files to show.");
    return;
  }

  const selected = await vscode.window.showQuickPick(
    files.map((file) => toFilePickItem(workspace.folder.uri.fsPath, file)),
    {
      title: "Codegraph Indexed Files",
      matchOnDescription: true,
      placeHolder: "Select a file to open",
    },
  );

  if (selected) {
    await runCommand("open Codegraph file", async () => {
      const document = await vscode.workspace.openTextDocument(resolveResultUri(workspace.folder.uri.fsPath, selected.file.path));
      await vscode.window.showTextDocument(document, { preview: false });
    });
  }
}

async function syncBundledSkills(context: vscode.ExtensionContext): Promise<void> {
  const folder = await selectWorkspaceFolderForSkills();
  if (!folder) {
    vscode.window.showWarningMessage("Open a workspace folder before syncing bundled Codegraph skills.");
    return;
  }

  const report = await runCommand("sync bundled Codegraph skills", () => vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Syncing bundled Codegraph skills",
      cancellable: false,
    },
    () => syncBundledCodegraphSkills({
      extensionPath: context.extensionPath,
      workspacePath: folder.uri.fsPath,
    }),
  ));

  if (!report) {
    return;
  }

  const changed = report.copied + report.updated;
  const targetSummary = summarizeSkillTargetRoots(folder.uri.fsPath, report.targetRoots);
  vscode.window.showInformationMessage(
    `Synced ${report.skills.length} Codegraph skills to ${targetSummary}: ${changed} changed, ${report.unchanged} unchanged, ${report.skipped} skipped.`,
  );
}

function summarizeSkillTargetRoots(workspacePath: string, targetRoots: string[]): string {
  const labels = targetRoots.map((target) => path.relative(workspacePath, target) || ".").sort();
  const normalized = labels.map((label) => label.split(path.sep).join("/"));
  const knownOrder = CODEGRAPH_SKILL_TARGET_ROOTS.map((target) => target.relativePath);
  const ordered = [
    ...knownOrder.filter((label) => normalized.includes(label)),
    ...normalized.filter((label) => !knownOrder.includes(label)),
  ];

  return ordered.length > 0 ? ordered.join(", ") : `${targetRoots.length} target roots`;
}

async function selectWorkspaceFolderForSkills(): Promise<vscode.WorkspaceFolder | undefined> {
  const codegraphWorkspace = await findCodegraphWorkspace();
  if (codegraphWorkspace) {
    return codegraphWorkspace.folder;
  }

  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length <= 1) {
    return folders[0];
  }

  return vscode.window.showWorkspaceFolderPick({
    placeHolder: "Select the workspace to receive bundled Codegraph skills",
  });
}

async function requireCodegraphWorkspace() {
  const workspace = await findCodegraphWorkspace();
  if (!workspace) {
    vscode.window.showWarningMessage("No .codegraph directory found in the current VS Code workspace.");
  }

  return workspace;
}

async function refreshCodegraphStatus(
  sidebarView: CodegraphSidebarView,
  statusBarItem: vscode.StatusBarItem,
  refreshCaches = false,
): Promise<void> {
  if (refreshCaches) {
    clearCodegraphCache();
  }

  void sidebarView.refresh(refreshCaches);
  statusBarItem.text = "$(sync~spin) Codegraph";
  statusBarItem.tooltip = "Checking Codegraph workspace";

  const workspace = await findCodegraphWorkspace();
  if (!workspace) {
    await vscode.commands.executeCommand("setContext", "codegraph.active", false);
    statusBarItem.text = "$(warning) Codegraph";
    statusBarItem.tooltip = "No .codegraph directory found in this workspace";
    return;
  }

  await vscode.commands.executeCommand("setContext", "codegraph.active", true);
  try {
    const status = await getCodegraphStatus(workspace.folder.uri.fsPath);
    const summary = summarizeStatus(status);
    statusBarItem.text = "$(pass-filled) Codegraph";
    statusBarItem.tooltip = `Codegraph active: ${summary}`;
    if (vscode.workspace.getConfiguration("codegraph").get<boolean>("preloadOnActivation") ?? true) {
      preloadCodegraphWorkspace(workspace.folder.uri.fsPath);
    }
  } catch (error) {
    statusBarItem.text = "$(error) Codegraph";
    statusBarItem.tooltip = `.codegraph found, but status failed: ${getErrorMessage(error)}`;
  }
}

async function runCommand<T>(label: string, command: () => Thenable<T>): Promise<T | undefined> {
  try {
    return await command();
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to ${label}: ${getErrorMessage(error)}`);
    return undefined;
  }
}

async function openResult(workspacePath: string, result: CodegraphSearchResult): Promise<void> {
  const document = await vscode.workspace.openTextDocument(resolveResultUri(workspacePath, result.file));
  const editor = await vscode.window.showTextDocument(document, { preview: false });
  const line = Math.max((result.line ?? 1) - 1, 0);
  const column = Math.max((result.column ?? 1) - 1, 0);
  const position = new vscode.Position(line, column);

  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function summarizeStatus(status: unknown): string {
  if (!isRecord(status)) {
    return "status loaded";
  }

  const fileCount = getNumber(status, "fileCount");
  const nodeCount = getNumber(status, "nodeCount");
  const edgeCount = getNumber(status, "edgeCount");
  const parts = [
    typeof fileCount === "number" ? `${fileCount} files` : undefined,
    typeof nodeCount === "number" ? `${nodeCount} nodes` : undefined,
    typeof edgeCount === "number" ? `${edgeCount} edges` : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "status loaded";
}

function getNumber(value: Record<string, unknown>, key: string): number | undefined {
  const item = value[key];
  return typeof item === "number" && Number.isFinite(item) ? item : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toSearchPickItem(workspacePath: string, result: CodegraphSearchResult): vscode.QuickPickItem & { result: CodegraphSearchResult } {
  const relativePath = path.relative(workspacePath, resolveResultUri(workspacePath, result.file).fsPath);
  const location = result.line ? `${relativePath}:${result.line}` : relativePath;
  const detail = [result.signature ?? result.detail, location].filter(Boolean).join(" | ");

  return {
    label: result.name,
    description: result.kind ? `${result.kind} | ${location}` : location,
    detail,
    result,
  };
}

function toFilePickItem(workspacePath: string, file: CodegraphFileResult): vscode.QuickPickItem & { file: CodegraphFileResult } {
  const relativePath = path.relative(workspacePath, resolveResultUri(workspacePath, file.path).fsPath);
  const metadata = [
    file.language,
    typeof file.symbols === "number" ? `${file.symbols} symbols` : undefined,
  ].filter(Boolean).join(" | ");

  return {
    label: relativePath,
    description: metadata,
    file,
  };
}
