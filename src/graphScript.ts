import { getGraphCoreScript } from "./graphCoreScript";
import { getGraphInteractionScript } from "./graphInteractionScript";
import { getGraphUtilityScript } from "./graphUtilityScript";
import { webviewIconScript } from "./webviewIcons";

export function getGraphScript(): string {
  return `
    const vscode = acquireVsCodeApi();
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ${webviewIconScript()}
    const state = {
      workspacePath: '',
      indexUpdatedAt: 0,
      files: [],
      results: [],
      graph: { nodes: [], edges: [] },
      expandedCount: 0,
      network: null,
      nodeData: null,
      edgeData: null,
      selectedId: '',
      focusIds: new Set(),
      focusEdges: new Set(),
      hubIds: new Set(),
      expandedKeys: new Set(),
      activeClusterKey: '',
      activeClusterLabel: '',
      activeClusterNodeIds: new Set(),
      clusterGroups: new Map(),
      focusOnly: false,
      motion: !reduceMotion,
      orbit: false,
      detailsOpen: false,
      legendOpen: false,
      miniMapOpen: false,
      controlsOpen: true,
      clusterOverlayOpen: true,
      stabilizing: false,
      initialGraphApplied: false,
      initialGraphKey: '',
      previousLimitBeforeAll: 0,
      renderRevision: 0,
      activeGraphRequestId: 0,
      clusterOverlayRenderedAt: 0,
      clusterOverlayFrame: 0,
      clusterOverlayForce: false,
      activity: [],
      activityOpen: false,
      theme: null
    };
    const els = {
      workspace: document.getElementById('workspace'),
      summary: document.getElementById('summary'),
      indexFreshness: document.getElementById('indexFreshness'),
      graphActivity: document.getElementById('graphActivity'),
      refreshGraphActivity: document.getElementById('refreshGraphActivity'),
      activityPanel: document.getElementById('activityPanel'),
      refreshActivityPanel: document.getElementById('refreshActivityPanel'),
      activityList: document.getElementById('activityList'),
      form: document.getElementById('graphForm'),
      toggleControls: document.getElementById('toggleControls'),
      toggleDetailsTop: document.getElementById('toggleDetailsTop'),
      query: document.getElementById('query'),
      source: document.getElementById('source'),
      mode: document.getElementById('mode'),
      kind: document.getElementById('kind'),
      layout: document.getElementById('layout'),
      depthMode: document.getElementById('depthMode'),
      spacingMode: document.getElementById('spacingMode'),
      labelMode: document.getElementById('labelMode'),
      filePattern: document.getElementById('filePattern'),
      limit: document.getElementById('limit'),
      viewActions: document.getElementById('viewActions'),
      exportActions: document.getElementById('exportActions'),
      advancedControls: document.getElementById('advancedControls'),
      stepLimitDown: document.getElementById('stepLimitDown'),
      resetView: document.getElementById('resetView'),
      fitView: document.getElementById('fitView'),
      toggleMotion: document.getElementById('toggleMotion'),
      toggleOrbit: document.getElementById('toggleOrbit'),
      toggleFocus: document.getElementById('toggleFocus'),
      clearFocus: document.getElementById('clearFocus'),
      toggleDetails: document.getElementById('toggleDetails'),
      toggleHelp: document.getElementById('toggleHelp'),
      closeHelp: document.getElementById('closeHelp'),
      toggleLegend: document.getElementById('toggleLegend'),
      toggleMiniMap: document.getElementById('toggleMiniMap'),
      toggleClusters: document.getElementById('toggleClusters'),
      exportPng: document.getElementById('exportPng'),
      exportJson: document.getElementById('exportJson'),
      copyMarkdown: document.getElementById('copyMarkdown'),
      hoverTip: document.getElementById('hoverTip'),
      graphInsight: document.getElementById('graphInsight'),
      graphStats: document.getElementById('graphStats'),
      graphModeBar: document.getElementById('graphModeBar'),
      shortcutOverlay: document.getElementById('shortcutOverlay'),
      miniMap: document.getElementById('miniMap'),
      clusterOverlay: document.getElementById('clusterOverlay'),
      network: document.getElementById('graphNetwork'),
      details: document.getElementById('details')
    };

    [els.advancedControls, els.viewActions, els.exportActions].filter(Boolean).forEach((disclosure) => {
      syncDisclosureAria(disclosure);
      disclosure.addEventListener('toggle', () => syncDisclosureAria(disclosure));
    });

    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      resetSelection(true);
      requestGraphData();
    });
    els.source.addEventListener('change', () => {
      syncGraphControls();
      resetSelection(true);
      requestGraphData();
    });
    els.mode.addEventListener('change', syncGraphControls);
    els.layout.addEventListener('change', render);
    els.depthMode.addEventListener('change', updateNetworkOptions);
    els.spacingMode.addEventListener('change', updateNetworkOptions);
    els.labelMode.addEventListener('change', updateFocusStyles);
    els.filePattern.addEventListener('change', () => {
      if (els.source.value === 'files') {
        resetSelection(true);
        requestGraphData();
      }
    });
    els.limit.addEventListener('change', () => {
      state.previousLimitBeforeAll = 0;
      render();
    });
    els.stepLimitDown.addEventListener('click', collapseGraphLimit);
    els.resetView.addEventListener('click', () => {
      if (!state.network) { return; }
      state.network.moveTo({ position: { x: 0, y: 0 }, scale: 1, animation: animationOptions(280) });
      if (state.motion) { state.network.stabilize(90); }
    });
    els.fitView.addEventListener('click', () => fitNetwork());
    els.graphActivity.addEventListener('click', () => setActivityOpen(!state.activityOpen));
    els.refreshGraphActivity.addEventListener('click', refreshCurrentGraph);
    els.refreshActivityPanel.addEventListener('click', refreshCurrentGraph);
    els.toggleControls.addEventListener('click', () => setControlsOpen(!state.controlsOpen));
    els.toggleDetailsTop.addEventListener('click', () => setDetailsOpen(!state.detailsOpen));
    els.toggleMotion.addEventListener('click', () => {
      state.motion = !state.motion;
      updateMotionButton();
      if (state.network) {
        state.network.setOptions({ physics: physicsOptions() });
        if (state.motion) { state.network.stabilize(160); }
        else { state.network.stopSimulation(); }
      }
    });
    els.toggleOrbit.addEventListener('click', () => {
      state.orbit = !state.orbit;
      updateOrbitButton();
      updateNetworkOptions();
    });
    els.toggleFocus.addEventListener('click', () => {
      state.focusOnly = !state.focusOnly;
      updateFocusButton();
      updateFocusStyles();
    });
    els.clearFocus.addEventListener('click', () => {
      resetSelection(true);
      if (state.network) { state.network.unselectAll(); }
      updateFocusButton();
      updateFocusStyles();
      renderMiniMap();
      hideHoverTip();
      updateGraphStats();
      setDetailsOpen(false);
      els.details.innerHTML = '<h2>Node Details</h2><p>Select a node to inspect it. Drag nodes to rearrange, drag the canvas to pan, and use the mouse wheel to zoom.</p>';
    });
    els.toggleDetails.addEventListener('click', () => setDetailsOpen(!state.detailsOpen));
    els.toggleHelp.addEventListener('click', () => setHelpOpen(true));
    els.closeHelp.addEventListener('click', () => setHelpOpen(false));
    els.toggleLegend.addEventListener('click', () => setLegendOpen(!state.legendOpen));
    els.toggleMiniMap.addEventListener('click', () => setMiniMapOpen(!state.miniMapOpen));
    els.toggleClusters.addEventListener('click', () => setClusterOverlayOpen(!state.clusterOverlayOpen));
    els.exportPng.addEventListener('click', exportGraphPng);
    els.exportJson.addEventListener('click', exportGraphJson);
    els.copyMarkdown.addEventListener('click', copyGraphMarkdown);
    els.network.addEventListener('click', (event) => {
      const actionButton = event.target && event.target.closest ? event.target.closest('[data-state-action]') : null;
      if (!actionButton) { return; }
      handleStateAction(actionButton.dataset.stateAction || '');
    });
    els.graphInsight.addEventListener('click', (event) => {
      const actionButton = event.target && event.target.closest ? event.target.closest('[data-view-action]') : null;
      if (!actionButton) { return; }
      handleViewAction(actionButton.dataset.viewAction || '');
    });
    els.graphModeBar.addEventListener('click', (event) => {
      const actionButton = event.target && event.target.closest ? event.target.closest('[data-view-action]') : null;
      if (!actionButton) { return; }
      handleViewAction(actionButton.dataset.viewAction || '');
    });
    document.addEventListener('pointerdown', (event) => {
      const target = event.target;
      const openMenus = document.querySelectorAll ? [...document.querySelectorAll('.advanced-controls[open], .action-menu[open]')] : (els.advancedControls.open ? [els.advancedControls] : []);
      if (!target) { return; }
      if (openMenus.length && !openMenus.some((menu) => menu.contains(target))) {
        closeAdvancedControls();
      }
      if (state.activityOpen && els.activityPanel && !els.activityPanel.contains(target) && !els.graphActivity.contains(target) && !els.refreshGraphActivity.contains(target)) {
        setActivityOpen(false);
      }
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAdvancedControls();
        hideHoverTip();
        if (state.activityOpen) { setActivityOpen(false); return; }
        if (els.shortcutOverlay && !els.shortcutOverlay.hidden) { setHelpOpen(false); return; }
        if (state.detailsOpen) { setDetailsOpen(false); }
        return;
      }
      if (event.key === '?' && !isTypingTarget(event.target)) {
        event.preventDefault();
        setHelpOpen(!els.shortcutOverlay || els.shortcutOverlay.hidden);
        return;
      }
      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        if (!state.controlsOpen) { setControlsOpen(true); }
        setTimeout(() => els.query.focus(), 0);
        return;
      }
      if (event.key === 'Enter' && !isTypingTarget(event.target)) {
        const selected = findNode(state.selectedId);
        if (canOpenNode(selected)) {
          event.preventDefault();
          openNode(selected);
        }
      }
    });

    function handleStateAction(action) {
      if (action === 'focus-search') {
        els.query.focus();
        return;
      }
      if (action === 'show-shortcuts') {
        setHelpOpen(true);
        return;
      }
      if (action === 'file-structure') {
        els.source.value = 'files';
        els.query.value = '';
        resetSelection(true);
        requestGraphData();
        return;
      }
      if (action === 'refresh-graph') {
        refreshCurrentGraph();
        return;
      }
      if (action === 'clear-filters') {
        clearGraphFilters();
      }
    }

    function clearGraphFilters() {
      if (els.source.value === 'files') {
        els.query.value = '';
      }
      els.kind.value = '';
      els.filePattern.value = '';
      state.previousLimitBeforeAll = 0;
      resetSelection(true);
      requestGraphData();
    }
    window.addEventListener('resize', () => {
      document.body.classList.toggle('narrow-graph', window.innerWidth < 720);
      if (state.network) {
        state.network.redraw();
        renderMiniMap();
        renderClusterOverlay(true);
      }
    });
    document.body.classList.toggle('narrow-graph', window.innerWidth < 720);
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'state') {
        state.workspacePath = message.workspacePath || '';
        state.indexUpdatedAt = Number(message.indexUpdatedAt) || 0;
        els.workspace.textContent = message.workspaceName ? message.workspaceName + ' | ' + message.workspacePath : 'No Codegraph workspace';
        syncGraphControls();
        updateIndexFreshness();
        applyInitialGraph(message.initialGraph);
      }
      if (message.type === 'filesResults') {
        if (!acceptGraphMessage(message)) { return; }
        state.files = message.files || [];
        state.results = [];
        state.expandedKeys = new Set();
        state.expandedCount = 0;
        state.activeClusterKey = '';
        state.activeClusterLabel = '';
        state.activeClusterNodeIds = new Set();
        state.clusterGroups = new Map();
        recordActivity(message.cached ? 'cached' : 'fresh', (message.cached ? 'Cached' : 'Loaded') + ' indexed files | ' + state.files.length.toLocaleString() + ' files');
        if (message.cached) { els.graphStats.textContent = 'Using cached indexed files'; }
        render();
      }
      if (message.type === 'graphResults') {
        if (!acceptGraphMessage(message)) { return; }
        state.results = message.results || [];
        state.expandedKeys = new Set();
        state.expandedCount = 0;
        state.activeClusterKey = '';
        state.activeClusterLabel = '';
        state.activeClusterNodeIds = new Set();
        state.clusterGroups = new Map();
        recordActivity(message.cached ? 'cached' : 'fresh', (message.cached ? 'Cached' : 'Loaded') + ' graph results | ' + state.results.length.toLocaleString() + ' results');
        if (message.cached) { els.graphStats.textContent = 'Using cached graph results'; }
        render();
      }
      if (message.type === 'loading') {
        if (!acceptGraphMessage(message)) { return; }
        recordActivity('loading', message.message || 'Loading graph...');
        showLoading(message.message || 'Loading graph...');
      }
      if (message.type === 'expandedNode') {
        if (!acceptExpansionMessage(message)) { return; }
        mergeExpandedNode(message);
      }
      if (message.type === 'error') {
        if (!acceptGraphMessage(message)) { return; }
        recordActivity('error', message.message || 'Codegraph command failed.');
        showEmpty(message.message || 'Codegraph command failed.');
      }
      if (message.type === 'indexChanged') {
        state.indexUpdatedAt = Number(message.indexUpdatedAt) || Date.now();
        updateIndexFreshness();
        recordActivity('fresh', 'Codegraph index changed | cache cleared');
      }
      if (message.type === 'exportResult') {
        if (message.error) {
          els.graphStats.textContent = 'Export failed | ' + message.error;
        } else if (message.canceled) {
          els.graphStats.textContent = 'Export canceled';
        } else {
          els.graphStats.textContent = 'Exported ' + exportResultLabel(message.format) + ' | ' + (message.path || 'saved');
        }
      }
    });

    function acceptGraphMessage(message) {
      const requestId = Number(message.requestId) || 0;
      if (!requestId) { return true; }
      if (requestId < state.activeGraphRequestId) { return false; }
      state.activeGraphRequestId = requestId;
      return true;
    }

    function syncDisclosureAria(disclosure) {
      if (!disclosure) { return; }
      const open = Boolean(disclosure.open);
      disclosure.setAttribute('aria-expanded', String(open));
      const summary = disclosure.querySelector ? disclosure.querySelector('summary') : null;
      if (summary) {
        summary.setAttribute('aria-expanded', String(open));
      }
    }
    function acceptExpansionMessage(message) {
      const requestId = Number(message.graphRequestId) || 0;
      return !requestId || requestId === state.activeGraphRequestId;
    }

    function requestGraphData(trackActivity, force) {
      syncGraphControls();
      if (trackActivity !== false) { recordActivity('loading', 'Requesting ' + graphRequestLabel()); }
      if (els.source.value === 'files') {
        vscode.postMessage({ type: 'loadFiles', filter: els.query.value.trim(), pattern: els.filePattern.value.trim(), force: Boolean(force) });
        return;
      }
      const query = els.query.value.trim();
      if (!query) {
        showEmpty('Enter a symbol query, or switch to File structure.');
        return;
      }
      vscode.postMessage({
        type: 'search',
        query,
        mode: els.mode.value,
        kind: els.mode.value === 'symbols' ? els.kind.value : '',
        limit: Number(els.limit.value) || 80,
        depth: 2,
        force: Boolean(force)
      });
    }

    function syncGraphControls() {
      const fileSource = els.source.value === 'files';
      const mode = els.mode.value;
      const placeholders = {
        symbols: 'Search symbols...',
        text: 'Search text in indexed files...',
        files: 'Search file names or paths...',
        callers: 'Find callers for symbol...',
        callees: 'Find callees for symbol...',
        impact: 'Find impact for symbol...'
      };
      els.query.placeholder = fileSource ? 'Filter indexed file paths...' : (placeholders[mode] || 'Search graph...');
      els.mode.disabled = fileSource;
      els.mode.title = fileSource ? 'Search mode is used with Search graph' : 'Search graph mode';
      els.kind.disabled = fileSource || mode !== 'symbols';
      els.kind.title = !fileSource && mode === 'symbols' ? 'Filter symbol kind' : 'Kind filter only applies to Symbols';
      els.filePattern.disabled = !fileSource;
      els.filePattern.title = fileSource ? 'File pattern' : 'Pattern only applies to File structure';
    }

    function refreshCurrentGraph() {
      if (!state.workspacePath) { return; }
      recordActivity('loading', 'Refreshing ' + graphRequestLabel());
      resetSelection(true);
      requestGraphData(false, true);
    }

    function graphRequestLabel() {
      if (els.source.value === 'files') {
        const filter = els.query.value.trim() || els.filePattern.value.trim();
        return filter ? 'files matching ' + trimLabel(filter, 32) : 'indexed files';
      }
      const query = els.query.value.trim() || 'search graph';
      return els.mode.value + ' for ' + trimLabel(query, 32);
    }

    function recordActivity(kind, text) {
      const item = { kind, text, time: new Date() };
      state.activity.unshift(item);
      state.activity = state.activity.slice(0, 6);
      renderActivity();
    }

    function renderActivity() {
      if (!els.graphActivity) { return; }
      const latest = state.activity[0];
      if (!latest) {
        els.graphActivity.textContent = 'No graph loaded';
        els.graphActivity.className = 'activity-strip';
        renderActivityList();
        return;
      }
      const time = latest.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      els.graphActivity.textContent = time + ' | ' + latest.text;
      els.graphActivity.title = 'Show graph activity | Last activity: ' + latest.text;
      els.graphActivity.className = 'activity-strip ' + escapeHtml(latest.kind || '');
      renderActivityList();
    }

    function renderActivityList() {
      if (!els.activityList) { return; }
      if (!state.activity.length) {
        els.activityList.textContent = 'No activity yet.';
        return;
      }
      els.activityList.innerHTML = state.activity.map((item) => {
        const time = item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const kind = String(item.kind || 'fresh');
        return '<div class="activity-item"><time>' + escapeHtml(time) + '</time><span>' + escapeHtml(item.text) + '</span><b class="activity-kind ' + escapeHtml(kind) + '">' + escapeHtml(kind) + '</b></div>';
      }).join('');
    }

    function setActivityOpen(open) {
      state.activityOpen = Boolean(open);
      if (els.activityPanel) { els.activityPanel.hidden = !state.activityOpen; }
      if (els.graphActivity) { els.graphActivity.setAttribute('aria-expanded', String(state.activityOpen)); }
      renderActivityList();
    }

    function updateIndexFreshness() {
      if (!els.indexFreshness) { return; }
      if (!state.indexUpdatedAt) {
        els.indexFreshness.textContent = 'Index unknown';
        els.indexFreshness.className = 'index-freshness';
        els.indexFreshness.title = 'Codegraph index freshness is unknown';
        return;
      }
      const ageMs = Date.now() - state.indexUpdatedAt;
      const ageText = relativeTime(ageMs);
      const stale = ageMs > 6 * 60 * 60 * 1000;
      const updated = new Date(state.indexUpdatedAt).toLocaleString();
      els.indexFreshness.textContent = 'Index ' + ageText;
      els.indexFreshness.className = 'index-freshness ' + (stale ? 'stale' : 'fresh');
      els.indexFreshness.title = 'Codegraph index updated ' + ageText + ' | ' + updated;
    }

    function relativeTime(ageMs) {
      const seconds = Math.max(0, Math.round(ageMs / 1000));
      if (seconds < 60) { return 'just now'; }
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) { return minutes + 'm ago'; }
      const hours = Math.round(minutes / 60);
      if (hours < 48) { return hours + 'h ago'; }
      const days = Math.round(hours / 24);
      return days + 'd ago';
    }

    function render() {
      const revision = ++state.renderRevision;
      showLoading('Preparing graph...');
      requestAnimationFrame(() => renderGraphNow(revision));
    }

    function renderGraphNow(revision) {
      if (revision !== state.renderRevision) { return; }
      if (!isVisNetworkReady()) {
        showEmpty('Graph renderer failed to load. Reinstall the extension or rebuild the VSIX.');
        return;
      }
      const graph = buildGraph();
      state.expandedCount = 0;
      state.graph = graph;
      if (graph.nodes.length === 0) {
        showEmpty(els.source.value === 'files' ? 'No indexed files to render.' : 'Run a search to render a graph.');
        return;
      }
      state.theme = themeColors();
      state.hubIds = new Set(topConnectedNodes(graph, 4).map((node) => node.id));
      els.summary.textContent = 'Preparing ' + graph.nodes.length.toLocaleString() + ' nodes | ' + graph.edges.length.toLocaleString() + ' edges';
      els.graphStats.textContent = 'Building graph canvas...';
      const nodes = graph.nodes.map((node) => nodeView(node));
      const edges = graph.edges.map((edge) => edgeView(edge));
      state.nodeData = new vis.DataSet(nodes);
      state.edgeData = new vis.DataSet(edges);
      if (state.network) { state.network.destroy(); }
      state.network = new vis.Network(els.network, { nodes: state.nodeData, edges: state.edgeData }, networkOptions());
      wireNetworkEvents();
      updateMotionButton();
      updateOrbitButton();
      updateFocusButton();
      updateDetailsButton();
      updateLegendButton();
      updateMiniMapButton();
      updateClusterButton();
      updateLimitDownButton();
      els.summary.textContent = graphSummaryText(graph);
      renderGraphInsight(graph);
      state.network.once('afterDrawing', () => {
        fitNetwork();
        renderMiniMap();
        renderClusterOverlay(true);
        updateGraphStats();
      });
      if (state.motion) { state.network.stabilize(stabilizationIterations()); }
      else { state.network.stopSimulation(); }
      updateGraphStats();
      updateFocusStyles();
      updateLimitDownButton();
    }

    function applyInitialGraph(seed) {
      if (!seed) { return; }
      const seedKey = graphSeedKey(seed);
      if (state.initialGraphApplied && state.initialGraphKey === seedKey) { return; }
      state.initialGraphApplied = true;
      state.initialGraphKey = seedKey;
      resetSelection(true);
      els.source.value = seed.source === 'search' ? 'search' : 'files';
      els.query.value = seed.query || '';
      els.filePattern.value = seed.pattern || '';
      if (seed.mode) { setSelectValue(els.mode, seed.mode); }
      if (seed.kind) { setSelectValue(els.kind, seed.kind); }
      if (seed.limit) { setSelectValue(els.limit, String(seed.limit)); }
      syncGraphControls();
      announceGraphSeed(seed);
      requestGraphData();
    }

    function announceGraphSeed(seed) {
      const mode = seed.source === 'search' ? seed.mode || 'symbols' : 'files';
      const label = seed.source === 'search'
        ? mode + ': ' + (seed.query || 'Search graph')
        : 'files: ' + (seed.query || seed.pattern || 'Indexed files');
      els.summary.textContent = 'Loading ' + trimLabel(label, 46);
      els.graphStats.textContent = 'Switching graph context | ' + trimLabel(label, 54);
    }

    function graphSeedKey(seed) {
      return [
        seed.seedKey || '',
        seed.source || '',
        seed.query || '',
        seed.pattern || '',
        seed.kind || '',
        seed.mode || '',
        seed.limit || '',
        seed.depth || ''
      ].join('|');
    }

    function setSelectValue(select, value) {
      const text = String(value);
      if ([...select.options].some((option) => option.value === text)) {
        select.value = text;
      }
    }

    function findNode(id) {
      return state.graph.nodes.find((node) => node.id === id);
    }

    function fitNetwork() {
      if (!state.network) { return; }
      state.network.fit({ animation: animationOptions(330) });
    }

    function exportGraphPng() {
      if (!state.network || !state.graph.nodes.length) {
        els.graphStats.textContent = 'Nothing to export yet';
        return;
      }
      const canvas = els.network.querySelector('canvas');
      if (!canvas || !canvas.width || !canvas.height) {
        els.graphStats.textContent = 'Export failed | graph canvas unavailable';
        return;
      }
      const view = { position: state.network.getViewPosition(), scale: state.network.getScale() };
      state.network.fit({ animation: false });
      state.network.redraw();
      const dataUrl = graphPngDataUrl(canvas);
      state.network.moveTo({ position: view.position, scale: view.scale, animation: false });
      vscode.postMessage({ type: 'saveGraphPng', dataUrl, fileName: exportFileName() });
      els.graphStats.textContent = 'Preparing PNG export...';
    }

    function exportGraphJson() {
      if (!state.graph.nodes.length) {
        els.graphStats.textContent = 'Nothing to export yet';
        return;
      }
      vscode.postMessage({ type: 'saveGraphJson', data: graphExportData(), fileName: exportFileName('json') });
      els.graphStats.textContent = 'Preparing JSON export...';
    }

    async function copyGraphMarkdown() {
      if (!state.graph.nodes.length) {
        els.graphStats.textContent = 'Nothing to copy yet';
        return;
      }
      try {
        await navigator.clipboard.writeText(graphMarkdownSummary());
        els.graphStats.textContent = 'Copied graph summary as Markdown';
      } catch (error) {
        els.graphStats.textContent = 'Copy failed | clipboard unavailable';
      }
    }

    function exportResultLabel(format) {
      return format === 'json' ? 'JSON' : 'PNG';
    }

    function graphExportData() {
      const positions = state.network ? state.network.getPositions() : {};
      return {
        schema: 'codegraph.graph.export.v1',
        exportedAt: new Date().toISOString(),
        workspace: {
          name: state.workspacePath ? basename(state.workspacePath) : '',
          path: state.workspacePath
        },
        view: {
          source: els.source.value,
          mode: els.mode.value,
          query: els.query.value.trim(),
          pattern: els.filePattern.value.trim(),
          kind: els.kind.value,
          layout: els.layout.value,
          labels: els.labelMode.value,
          limit: Number(els.limit.value) || 80
        },
        summary: {
          nodes: state.graph.nodes.length,
          edges: state.graph.edges.length,
          total: state.graph.total || state.graph.nodes.length,
          rendered: state.graph.rendered || state.graph.nodes.length,
          omitted: state.graph.omitted || 0,
          expanded: state.graph.expanded || state.expandedCount || 0
        },
        nodes: state.graph.nodes.map((node) => ({
          id: node.id,
          label: node.label,
          type: node.type,
          level: node.level,
          position: positions[node.id] || null,
          raw: node.raw || {}
        })),
        edges: state.graph.edges.map((edge) => ({
          id: edge.id,
          from: edge.from,
          to: edge.to,
          relation: edge.relation || '',
          directed: Boolean(edge.directed),
          secondary: Boolean(edge.secondary)
        }))
      };
    }

    ${getGraphCoreScript()}

    ${getGraphInteractionScript()}

    function graphPngDataUrl(sourceCanvas) {
      const footerHeight = 54;
      const output = document.createElement('canvas');
      output.width = sourceCanvas.width;
      output.height = sourceCanvas.height + footerHeight;
      const context = output.getContext('2d');
      context.fillStyle = state.theme && state.theme.background || '#1f2329';
      context.fillRect(0, 0, output.width, output.height);
      context.drawImage(sourceCanvas, 0, 0);
      context.fillStyle = colorWithAlpha(state.theme && state.theme.background || '#1f2329', 0.92);
      context.fillRect(0, sourceCanvas.height, output.width, footerHeight);
      context.strokeStyle = state.theme && state.theme.mutedEdge || '#3a3f47';
      context.beginPath();
      context.moveTo(0, sourceCanvas.height + 0.5);
      context.lineTo(output.width, sourceCanvas.height + 0.5);
      context.stroke();
      context.fillStyle = state.theme && state.theme.foreground || '#d4d4d4';
      context.font = '600 14px ' + (state.theme && state.theme.font || 'sans-serif');
      context.fillText(exportTitle(), 16, sourceCanvas.height + 22);
      context.fillStyle = state.theme && state.theme.description || '#8f98a8';
      context.font = '12px ' + (state.theme && state.theme.font || 'sans-serif');
      context.fillText(exportSubtitle(), 16, sourceCanvas.height + 42);
      return output.toDataURL('image/png');
    }

    ${getGraphUtilityScript()}

    updateMotionButton();
    updateOrbitButton();
    updateFocusButton();
    updateControlsButton();
    updateDetailsButton();
    updateLegendButton();
    updateMiniMapButton();
    updateClusterButton();
    updateLimitDownButton();
    updateIndexFreshness();
    syncGraphControls();
    vscode.postMessage({ type: 'ready' });
  `;
}
