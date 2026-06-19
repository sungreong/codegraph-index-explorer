import { getDashboardScript } from "./dashboardScript";
import { getDashboardStyles } from "./dashboardStyles";

export function getDashboardHtml(nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${escapeAttribute(nonce)}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codegraph</title>
  <style>${getDashboardStyles()}</style>
</head>
<body>
  <div class="shell">
    <header>
      <h1>Codegraph</h1>
      <div class="subtitle" id="workspace">Loading workspace...</div>
    </header>
    <div class="status-row">
      <div class="metric"><div class="metric-label">Status</div><div class="metric-value" id="status">Loading</div></div>
      <div class="metric"><div class="metric-label">Files</div><div class="metric-value" id="filesMetric">-</div></div>
      <div class="metric"><div class="metric-label">Nodes</div><div class="metric-value" id="nodesMetric">-</div></div>
      <div class="metric"><div class="metric-label">Edges</div><div class="metric-value" id="edgesMetric">-</div></div>
    </div>
    <main>
      <div class="tabs" role="tablist">
        <button class="tab active" type="button" data-tab="search">Search</button>
        <button class="tab" type="button" data-tab="files">Indexed Files</button>
        <button class="tab" type="button" data-tab="context">Context</button>
        <button class="tab action-tab" id="openGraph" type="button">Graph Explorer</button>
      </div>
      <div class="tab-panels">
        <section class="tab-panel active" id="tab-search">
          <div class="section-head">
            <h2 class="section-title">Search</h2>
            <form class="search-box" id="searchForm">
              <input id="query" type="search" placeholder="Symbol, function, class, component..." autocomplete="off">
              <select id="modeFilter" title="Search mode">
                <option value="symbols">Symbols</option>
                <option value="callers">Callers</option>
                <option value="callees">Callees</option>
                <option value="impact">Impact</option>
              </select>
              <button type="submit">Search</button>
            </form>
            <div class="option-grid">
              <select id="kindFilter" title="Codegraph kind filter">
                <option value="">All kinds</option>
                <option value="function">function</option>
                <option value="method">method</option>
                <option value="class">class</option>
                <option value="interface">interface</option>
                <option value="type">type</option>
                <option value="variable">variable</option>
                <option value="route">route</option>
                <option value="component">component</option>
              </select>
              <select id="detailMode" title="Details display mode">
                <option value="compact">Compact details</option>
                <option value="detail">Detailed JSON</option>
              </select>
              <input id="limitInput" type="number" min="1" max="100" value="20" title="Limit">
              <input id="depthInput" type="number" min="1" max="5" value="2" title="Impact depth">
            </div>
            <details class="command-details">
              <summary>CLI</summary>
              <div class="preview-box" id="commandPreview">codegraph query --json ...</div>
            </details>
            <div class="agent-copy-panel" aria-label="Agent handoff">
              <input id="agentQuestion" type="search" placeholder="Question to include when copying an agent prompt" autocomplete="off">
              <div class="agent-copy-actions">
                <button class="ghost" id="selectVisibleResults" type="button">Select Page</button>
                <button class="ghost" id="copySelectedLocations" type="button">Copy Locations</button>
                <button class="ghost" id="copyAgentPrompt" type="button">Copy Prompt</button>
              </div>
            </div>
          </div>
          <div class="search-workbench">
            <div class="results-pane">
              <div id="searchError" class="error" hidden></div>
              <div class="list" id="results"><div class="empty">Search Codegraph symbols, inspect matches, and open exact locations.</div></div>
              <div class="toolbar">
                <span id="resultsCount">0 results</span>
                <span id="selectionCount">0 selected</span>
                <div class="pager">
                  <button class="ghost" id="resultsPrev" type="button">Prev</button>
                  <span id="resultsPage">1 / 1</span>
                  <span class="page-numbers" id="resultsNumbers"></span>
                  <select id="resultsPageSize" title="Results per page">
                    <option value="10">10</option>
                    <option value="25" selected>25</option>
                    <option value="50">50</option>
                  </select>
                  <button class="ghost" id="resultsNext" type="button">Next</button>
                </div>
              </div>
            </div>
            <aside class="search-inspector" id="selectionPanel" aria-label="Selected result">
              <div class="empty">Run a search, then hover a result to inspect it without leaving the dashboard.</div>
            </aside>
          </div>
        </section>
        <section class="tab-panel" id="tab-files">
          <div class="section-head">
            <h2 class="section-title">Indexed Files</h2>
            <div class="head-tools">
              <input id="fileFilter" type="search" placeholder="Codegraph --filter directory, e.g. src/components" autocomplete="off">
              <input id="filePattern" type="search" placeholder="--pattern, e.g. **/*.py" autocomplete="off">
              <select id="filesPageSize" title="Files per page">
                <option value="10">10</option>
                <option value="25" selected>25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <div id="fileError" class="error" hidden></div>
          <div class="list" id="files"><div class="empty">Loading indexed files...</div></div>
          <div class="toolbar">
            <span id="filesCount">0 files</span>
            <div class="pager">
              <button class="ghost" id="filesPrev" type="button">Prev</button>
              <span id="filesPage">1 / 1</span>
              <span class="page-numbers" id="filesNumbers"></span>
              <input class="jump" id="filesJump" type="number" min="1" title="Jump to page">
              <button class="ghost" id="filesNext" type="button">Next</button>
            </div>
          </div>
        </section>
        <section class="tab-panel" id="tab-context">
          <div class="section-head">
            <h2 class="section-title">Codegraph Context</h2>
          </div>
          <div class="context" id="context"><div class="empty">Use Callers, Callees, or Impact on a result to inspect Codegraph context.</div></div>
        </section>
      </div>
    </main>
  </div>
  <script nonce="${escapeAttribute(nonce)}">${getDashboardScript()}</script>
</body>
</html>`;
}

function escapeAttribute(value: string): string {
  return value.replace(/["&<>]/g, (char) => ({
    "\"": "&quot;",
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
  }[char] ?? char));
}
