const assert = require("node:assert/strict");
const vscode = require("vscode");

async function run() {
  const extension = vscode.extensions.getExtension("datanewbie-labs.codegraph-index-explorer");
  assert.ok(extension, "extension should be discoverable by publisher.name");

  await extension.activate();
  assert.equal(extension.isActive, true, "extension should activate");

  const commands = await vscode.commands.getCommands(true);
  assert.ok(commands.includes("codegraph.openDashboard"), "dashboard command should be registered");
  assert.ok(commands.includes("codegraph.openGraph"), "graph command should be registered");
  assert.ok(commands.includes("codegraph.search"), "search command should be registered");
  assert.ok(commands.includes("codegraph.showStatus"), "status command should be registered");
  assert.ok(commands.includes("codegraph.listFiles"), "files command should be registered");
  assert.ok(commands.includes("codegraph.refresh"), "refresh command should be registered");

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  assert.ok(workspaceFolder, "smoke test should open a workspace folder");

  const codegraphUri = vscode.Uri.joinPath(workspaceFolder.uri, ".codegraph");
  const codegraphStat = await vscode.workspace.fs.stat(codegraphUri);
  assert.ok(codegraphStat.type & vscode.FileType.Directory, ".codegraph should exist in the test workspace");

  await vscode.commands.executeCommand("codegraph.refresh");
  await vscode.commands.executeCommand("codegraph.openGraph");
}

module.exports = { run };
