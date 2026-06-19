import { getGraphScript } from "./graphScript";
import { getGraphStyles } from "./graphStyles";
import { getVisNetworkScript } from "./visNetworkAsset";

export function getGraphHtml(nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${escapeAttribute(nonce)}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codegraph Graph Explorer</title>
  <style>${getGraphStyles()}</style>
</head>
<body>
  <div class="graph-shell">
    <header class="topbar">
      <div class="title-row">
        <h1>Graph Explorer</h1>
        <div class="subtitle" id="workspace">Loading Codegraph workspace...</div>
      </div>
      <div class="topbar-meta">
        <div class="summary" id="summary">0 nodes | 0 edges</div>
        <div class="index-freshness" id="indexFreshness" title="Codegraph index freshness">Index unknown</div>
        <button class="panel-toggle" id="toggleControls" type="button" title="Hide graph controls" aria-label="Hide graph controls" aria-expanded="true">Controls</button>
        <button class="panel-toggle" id="toggleDetailsTop" type="button" title="Show details" aria-label="Show details" aria-expanded="false">Details</button>
        <button class="activity-strip" id="graphActivity" type="button" title="Show graph activity" aria-label="Show graph activity">No graph loaded</button>
        <button class="activity-refresh" id="refreshGraphActivity" type="button" title="Refresh graph data" aria-label="Refresh graph data">↻</button>
        <div class="activity-panel" id="activityPanel" hidden>
          <div class="activity-panel-head">
            <strong>Graph activity</strong>
            <button class="ghost" id="refreshActivityPanel" type="button">Refresh</button>
          </div>
          <div class="activity-list" id="activityList">No activity yet.</div>
        </div>
      </div>
    </header>
    <form class="controls" id="graphForm">
      <input id="query" type="search" placeholder="Search symbol or filter files..." autocomplete="off">
      <div class="quick-selects">
        <select id="source" title="Graph source">
          <option value="files" selected>File structure</option>
          <option value="search">Search graph</option>
        </select>
        <select id="mode" title="Search mode">
          <option value="symbols">Symbols</option>
          <option value="callers">Callers</option>
          <option value="callees">Callees</option>
          <option value="impact">Impact</option>
        </select>
      </div>
      <div class="icon-actions" aria-label="Graph actions">
        <button class="icon-button primary" type="submit" title="Render" aria-label="Render">▶</button>
        <button class="icon-button ghost" id="stepLimitDown" type="button" title="Show fewer nodes" aria-label="Show fewer nodes">−</button>
        <button class="icon-button ghost" id="resetView" type="button" title="Reset view" aria-label="Reset view">↺</button>
        <button class="icon-button ghost" id="fitView" type="button" title="Fit view" aria-label="Fit view">⌖</button>
        <button class="icon-button ghost" id="toggleFocus" type="button" title="Focus only" aria-label="Focus only">◉</button>
        <button class="icon-button ghost" id="clearFocus" type="button" title="Clear focus" aria-label="Clear focus">×</button>
        <button class="icon-button ghost" id="toggleDetails" type="button" title="Show details" aria-label="Show details">▤</button>
        <details class="action-menu" id="viewActions">
          <summary class="menu-button ghost" title="View actions" aria-label="View actions">View</summary>
          <div class="action-menu-panel">
            <button class="ghost menu-action" id="toggleMotion" type="button" title="Start motion" aria-label="Start motion"><span>⏵</span>Motion</button>
            <button class="ghost menu-action" id="toggleOrbit" type="button" title="Start orbit" aria-label="Start orbit"><span>◎</span>Orbit</button>
            <button class="ghost menu-action" id="toggleLegend" type="button" title="Show legend" aria-label="Show legend"><span>◌</span>Legend</button>
            <button class="ghost menu-action" id="toggleMiniMap" type="button" title="Show minimap" aria-label="Show minimap"><span>▧</span>Minimap</button>
            <button class="ghost menu-action" id="toggleClusters" type="button" title="Hide cluster regions" aria-label="Hide cluster regions"><span>▦</span>Clusters</button>
            <button class="ghost menu-action" id="toggleHelp" type="button" title="Show shortcuts and gestures" aria-label="Show shortcuts and gestures"><span>?</span>Shortcuts</button>
          </div>
        </details>
        <details class="action-menu" id="exportActions">
          <summary class="menu-button ghost" title="Export and copy" aria-label="Export and copy">Export</summary>
          <div class="action-menu-panel">
            <button class="ghost menu-action" id="exportPng" type="button" title="Export PNG" aria-label="Export PNG"><span>⇩</span>PNG</button>
            <button class="ghost menu-action" id="exportJson" type="button" title="Export graph JSON" aria-label="Export graph JSON"><span>{}</span>JSON</button>
            <button class="ghost menu-action" id="copyMarkdown" type="button" title="Copy graph summary as Markdown" aria-label="Copy graph summary as Markdown"><span>MD</span>Markdown</button>
          </div>
        </details>
        <details class="advanced-controls" id="advancedControls">
          <summary class="icon-button ghost" title="Graph options" aria-label="Graph options">⚙</summary>
          <div class="advanced-panel">
            <label><span>Kind</span>
        <select id="kind" title="Symbol kind">
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
            </label>
            <label><span>Layout</span>
        <select id="layout" title="Layout">
          <option value="radial">Radial</option>
          <option value="flow">Flow</option>
          <option value="layered">Layered</option>
          <option value="bundle">Bundle</option>
          <option value="columns">Columns</option>
          <option value="force" selected>Spread</option>
        </select>
            </label>
            <label><span>Depth</span>
        <select id="depthMode" title="Depth">
          <option value="0.65">Soft depth</option>
          <option value="1" selected>Medium depth</option>
          <option value="1.45">Deep space</option>
        </select>
            </label>
            <label><span>Spacing</span>
        <select id="spacingMode" title="Spacing">
          <option value="0.82">Compact spacing</option>
          <option value="1" selected>Balanced spacing</option>
          <option value="1.25">Airy spacing</option>
        </select>
            </label>
            <label><span>Labels</span>
        <select id="labelMode" title="Labels">
          <option value="focus" selected>Focus labels</option>
          <option value="all">All labels</option>
          <option value="minimal">Minimal labels</option>
        </select>
            </label>
            <label><span>Pattern</span>
        <input id="filePattern" type="search" placeholder="**/*.py" title="File pattern">
            </label>
            <label><span>Limit</span>
        <select id="limit" title="Node limit">
          <option value="20">20 nodes</option>
          <option value="40">40 nodes</option>
          <option value="80" selected>80 nodes</option>
          <option value="120">120 nodes</option>
          <option value="200">200 nodes</option>
        </select>
            </label>
          </div>
        </details>
      </div>
    </form>
    <main class="graph-stage">
      <section class="canvas-wrap">
        <div class="graph-insight" id="graphInsight">Render a graph to see structure hints.</div>
        <div class="legend">
          <span><i class="dot root"></i>Root</span>
          <span><i class="dot symbol"></i>Symbol</span>
          <span><i class="dot file"></i>File</span>
          <span><i class="dot directory"></i>Directory</span>
        </div>
        <div class="graph-hud" id="graphStats">Drag canvas | Wheel zoom | Click node</div>
        <div class="graph-mode-bar" id="graphModeBar" hidden></div>
        <div id="hoverTip" class="hover-tip" hidden></div>
        <svg id="miniMap" class="mini-map" role="img" aria-label="Graph minimap"></svg>
        <svg id="clusterOverlay" class="cluster-overlay" aria-hidden="true"></svg>
        <div class="shortcut-overlay" id="shortcutOverlay" role="dialog" aria-label="Shortcuts and gestures" hidden>
          <div class="shortcut-head">
            <strong>Shortcuts & gestures</strong>
            <button class="icon-button ghost" id="closeHelp" type="button" title="Close help" aria-label="Close help">×</button>
          </div>
          <div class="shortcut-grid">
            <span>/</span><p>Focus search</p>
            <span>Enter</span><p>Open selected source</p>
            <span>Esc</span><p>Close panels or help</p>
            <span>Drag</span><p>Pan canvas or move nodes</p>
            <span>Wheel</span><p>Zoom graph</p>
            <span>Click box</span><p>Filter to a cluster</p>
          </div>
        </div>
        <div id="graphNetwork" class="graph-network" role="img" aria-label="Codegraph graph explorer">
          <div class="state-card loading">
            <div class="state-title">Loading Graph Explorer</div>
            <p>Reading Codegraph workspace state...</p>
          </div>
        </div>
      </section>
      <aside class="details" id="details">
        <h2>Node Details</h2>
        <p>Select a node to inspect it. Drag nodes to rearrange, drag the canvas to pan, and use the mouse wheel to zoom.</p>
      </aside>
    </main>
  </div>
  <script nonce="${escapeAttribute(nonce)}">${escapeScriptContent(getVisNetworkScript())}</script>
  <script nonce="${escapeAttribute(nonce)}">${escapeScriptContent(getGraphScript())}</script>
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

function escapeScriptContent(value: string): string {
  return value
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}
