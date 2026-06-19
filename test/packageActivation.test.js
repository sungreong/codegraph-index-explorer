const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

assert.equal(manifest.name, "codegraph-index-explorer");
assert.equal(manifest.displayName, "Codegraph Explorer");
assert.equal(manifest.icon, "resources/codegraph-index-explorer.png");
assert.ok(fs.existsSync(path.join(__dirname, "..", manifest.icon)), "marketplace icon should exist");
assert.equal(manifest.contributes.viewsContainers.activitybar[0].icon, "resources/codegraph-activity.svg");
assert.ok(
  fs.existsSync(path.join(__dirname, "..", manifest.contributes.viewsContainers.activitybar[0].icon)),
  "activity bar icon should exist",
);
assert.ok(manifest.activationEvents.includes("workspaceContains:.codegraph"));
assert.ok(manifest.activationEvents.includes("onView:codegraph.actions"));
assert.ok(!manifest.activationEvents.includes("onStartupFinished"));
assert.equal(manifest.contributes.configuration.properties["codegraph.preloadOnActivation"].default, true);

const searchKeybinding = manifest.contributes.keybindings.find((item) => item.command === "codegraph.search");
assert.equal(searchKeybinding.key, "ctrl+alt+g");
assert.equal(searchKeybinding.mac, "cmd+alt+g");
assert.equal(searchKeybinding.when, "codegraph.active");

console.log("package activation tests passed");
