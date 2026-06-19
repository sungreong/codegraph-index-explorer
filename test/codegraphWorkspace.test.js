const assert = require("node:assert/strict");
const { findCodegraphWorkspaceInfo } = require("../out/codegraphWorkspace");

const folders = [
  { name: "plain", fsPath: "C:\\repo\\plain" },
  { name: "indexed", fsPath: "C:\\repo\\indexed" },
];

const workspace = findCodegraphWorkspaceInfo(folders, (targetPath) => targetPath === "C:\\repo\\indexed\\.codegraph");

assert.deepEqual(workspace, {
  folder: { name: "indexed", fsPath: "C:\\repo\\indexed" },
  codegraphPath: "C:\\repo\\indexed\\.codegraph",
});

assert.equal(findCodegraphWorkspaceInfo(folders, () => false), undefined);

console.log("codegraphWorkspace tests passed");
