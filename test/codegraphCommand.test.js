const assert = require("node:assert/strict");
const {
  getCodegraphCommandCandidates,
  getCodegraphInvocation,
} = require("../out/codegraphCommand");

const windowsCandidates = getCodegraphCommandCandidates("codegraph", "win32", {
  APPDATA: "C:\\Users\\tester\\AppData\\Roaming",
  USERPROFILE: "C:\\Users\\tester",
});

assert.equal(windowsCandidates[0], "codegraph.cmd");
assert.ok(windowsCandidates.includes("codegraph.exe"));
assert.ok(windowsCandidates.includes("C:\\Users\\tester\\AppData\\Roaming\\npm\\codegraph.cmd"));

assert.deepEqual(
  getCodegraphCommandCandidates("C:\\tools\\codegraph.cmd", "win32", {}),
  ["C:\\tools\\codegraph.cmd"],
);

assert.deepEqual(getCodegraphCommandCandidates("codegraph", "linux", {}), ["codegraph"]);

assert.deepEqual(
  getCodegraphInvocation("codegraph.cmd", ["status", "--json", "."], "win32", { ComSpec: "C:\\Windows\\System32\\cmd.exe" }),
  {
    command: "C:\\Windows\\System32\\cmd.exe",
    args: ["/d", "/c", "codegraph.cmd", "status", "--json", "."],
  },
);

assert.deepEqual(
  getCodegraphInvocation("codegraph.exe", ["status"], "win32", {}),
  {
    command: "codegraph.exe",
    args: ["status"],
  },
);

console.log("codegraphCommand tests passed");
