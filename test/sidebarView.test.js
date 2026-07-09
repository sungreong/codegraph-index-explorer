const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === "vscode") {
    return {
      Uri: { file: (fsPath) => ({ fsPath }) },
      commands: { executeCommand: async () => undefined },
      window: {},
      workspace: { getConfiguration: () => ({ get: (_key, fallback) => fallback }) },
      env: { clipboard: { writeText: async () => undefined } },
      Position: class {},
      Selection: class {},
      Range: class {},
      TextEditorRevealType: { InCenter: 1 },
    };
  }

  return originalLoad(request, parent, isMain);
};

const { CodegraphSidebarView } = require("../out/codegraphSidebarView");

let html = "";
const view = new CodegraphSidebarView({ subscriptions: [] }, () => undefined, () => undefined);
view.resolveWebviewView({
  webview: {
    set options(value) {},
    get options() { return {}; },
    set html(value) { html = value; },
    get html() { return html; },
    onDidReceiveMessage: () => ({ dispose() {} }),
    postMessage: () => true,
  },
});

assert.match(html, /id="commandPreview"/);
assert.match(html, /id="copyCommand"/);
assert.match(html, /Copy Codegraph command/);
assert.match(html, /Copy selected locations, or all results if none are selected/);
assert.match(html, /Copy agent prompt for selected results, or all results if none are selected/);
assert.match(html, /Select all visible results/);
assert.match(html, /Open dashboard/);
assert.match(html, /Open graph explorer/);
assert.doesNotMatch(html, /Show update history/);
assert.doesNotMatch(html, /id="changelog"/);
assert.doesNotMatch(html, /type: 'openChangelog'/);
assert.match(html, /Refresh Codegraph status/);
assert.match(html, /id="syncSkills"/);
assert.match(html, /Install bundled Codegraph skills into codegraph_skills, \.agents\/skills, \.claude\/skills, \.codex\/skills, \.gemini\/skills, \.cursor\/skills/);
assert.match(html, /result-actions/);
assert.match(html, /workspace-actions/);
assert.match(html, /Find code in seconds/);
assert.match(html, /Try search: extension/);
assert.match(html, /Open file structure graph/);
assert.match(html, /\[hidden\] \{ display: none !important; \}/);
assert.match(html, /--cg-control-height/);
assert.match(html, /--cg-focus-ring/);
assert.match(html, /Any kind/);
assert.doesNotMatch(html, />All<\/button>/);
assert.doesNotMatch(html, /<div class="nav">/);
assert.match(html, /Codegraph command:/);
assert.match(html, /selectedItemsOrAll/);
assert.match(html, /function commandPreview/);
assert.match(html, /loadingQuery/);
assert.match(html, /aria-label="Select ' \+ escapeHtml\(item\.name \|\| item\.file \|\| 'result'\) \+ '"/);
assert.match(html, /window\.setTimeout\(\(\) => postSearch\(query\), 120\)/);
assert.doesNotMatch(html, /Question for agent prompt/);

console.log("sidebarView tests passed");
