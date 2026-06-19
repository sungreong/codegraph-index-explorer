const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { getVisNetworkScript } = require("../out/visNetworkAsset");

const script = getVisNetworkScript();
const manifest = readFileSync("package.json", "utf8");

assert.ok(script.length > 100000);
assert.match(script, /vis-network/);
assert.match(script, /Network/);
assert.match(script, /DataSet/);
assert.match(script, /globalThis/);
assert.match(manifest, /sync:vis-network/);
assert.match(manifest, /vscode:prepublish.*sync:vis-network/);

console.log("visNetworkAsset tests passed");
