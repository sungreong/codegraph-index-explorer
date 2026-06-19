import * as vscode from "vscode";

const CHANGELOG_FILES = ["CHANGELOG.md", "changelog.md"];

export async function openCodegraphChangelog(context: vscode.ExtensionContext): Promise<void> {
  const uri = await findChangelogUri(context);
  if (!uri) {
    vscode.window.showWarningMessage("Codegraph changelog was not found in this VSIX.");
    return;
  }

  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document, { preview: true, viewColumn: vscode.ViewColumn.Beside });
}

export async function notifyCodegraphUpdate(context: vscode.ExtensionContext): Promise<void> {
  const version = extensionVersion(context);
  if (!version) {
    return;
  }

  const key = "codegraph.lastSeenVersion";
  const previous = context.globalState.get<string>(key);
  if (previous === version) {
    return;
  }

  await context.globalState.update(key, version);
  if (!previous) {
    return;
  }

  const action = "View changes";
  const selected = await vscode.window.showInformationMessage(`Codegraph updated to ${version}.`, action);
  if (selected === action) {
    await openCodegraphChangelog(context);
  }
}

async function findChangelogUri(context: vscode.ExtensionContext): Promise<vscode.Uri | undefined> {
  for (const fileName of CHANGELOG_FILES) {
    const uri = vscode.Uri.joinPath(context.extensionUri, fileName);
    try {
      await vscode.workspace.fs.stat(uri);
      return uri;
    } catch {
      // Try the next packaged filename.
    }
  }

  return undefined;
}

function extensionVersion(context: vscode.ExtensionContext): string | undefined {
  const packageJson = (context as vscode.ExtensionContext & { extension?: { packageJSON?: { version?: unknown } } }).extension?.packageJSON;
  const version = packageJson?.version;
  return typeof version === "string" && version.length > 0 ? version : undefined;
}
