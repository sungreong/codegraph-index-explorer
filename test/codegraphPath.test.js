const assert = require("node:assert/strict");
const {
  expandHomePath,
  inferCodegraphPathPlatform,
  isAbsoluteCodegraphPath,
  joinCodegraphPath,
  resolveCodegraphPath,
} = require("../out/codegraphPath");

assert.equal(inferCodegraphPathPlatform("C:\\repo\\project", "linux"), "win32");
assert.equal(inferCodegraphPathPlatform("/repo/project", "win32"), "posix");
assert.equal(inferCodegraphPathPlatform("/repo/project", "linux"), "posix");

assert.equal(joinCodegraphPath("C:\\repo\\indexed", ".codegraph"), "C:\\repo\\indexed\\.codegraph");
assert.equal(joinCodegraphPath("/repo/indexed", ".codegraph"), "/repo/indexed/.codegraph");

assert.equal(resolveCodegraphPath("C:\\repo\\indexed", "src/extension.ts"), "C:\\repo\\indexed\\src\\extension.ts");
assert.equal(resolveCodegraphPath("/repo/indexed", "src/extension.ts"), "/repo/indexed/src/extension.ts");
assert.equal(resolveCodegraphPath("/repo/indexed", "C:\\repo\\other\\file.ts"), "C:\\repo\\other\\file.ts");
assert.equal(resolveCodegraphPath("C:\\repo\\indexed", "/repo/other/file.ts"), "/repo/other/file.ts");

assert.equal(isAbsoluteCodegraphPath("C:\\repo\\file.ts"), true);
assert.equal(isAbsoluteCodegraphPath("/repo/file.ts"), true);
assert.equal(isAbsoluteCodegraphPath("src/file.ts"), false);

assert.equal(expandHomePath("~/bin/codegraph", "linux", { HOME: "/home/tester" }), "/home/tester/bin/codegraph");
assert.equal(expandHomePath("~\\bin\\codegraph.cmd", "win32", { USERPROFILE: "C:\\Users\\tester" }), "C:\\Users\\tester\\bin\\codegraph.cmd");
assert.equal(expandHomePath("~/bin/codegraph", "linux", {}), "~/bin/codegraph");

console.log("codegraphPath tests passed");
