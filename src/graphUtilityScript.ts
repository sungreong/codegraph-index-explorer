export function getGraphUtilityScript(): string {
  return `
    function animationOptions(duration) {
      return reduceMotion ? false : { duration, easingFunction: 'easeInOutQuart' };
    }

    function labelSize() {
      if (els.labelMode.value === 'minimal') { return 10; }
      if (els.labelMode.value === 'all') { return 13; }
      return 12;
    }

    function spacing() {
      return Number(els.spacingMode.value) || 1;
    }

    function depthStrength() {
      return Number(els.depthMode.value) || 1;
    }

    function titleFor(node) {
      const raw = node.raw || {};
      if (raw.omitted) {
        return escapeHtml(node.label + '\\n' + (raw.description || 'Hidden by graph limit.'));
      }
      const location = raw.file ? raw.file + (raw.line ? ':' + raw.line : '') : raw.path || '';
      return escapeHtml(node.label + (location ? '\\n' + location : ''));
    }

    function showEmpty(message) {
      if (state.network) {
        state.network.destroy();
        state.network = null;
      }
      state.graph = { nodes: [], edges: [] };
      els.summary.textContent = '0 nodes | 0 edges';
      els.graphStats.textContent = message;
      if (els.graphInsight) { els.graphInsight.innerHTML = '<span class="insight-chip warning">' + escapeHtml(message) + '</span>'; }
      if (els.graphModeBar) { els.graphModeBar.hidden = true; els.graphModeBar.innerHTML = ''; }
      els.network.innerHTML = graphStateCardHtml('empty', emptyStateTitle(message), emptyStateBody(message), emptyStateActions());
      els.miniMap.innerHTML = '';
      if (els.clusterOverlay) { els.clusterOverlay.innerHTML = ''; }
      setDetailsOpen(false);
      els.details.innerHTML = '<h2>Node Details</h2><p>' + escapeHtml(message) + '</p>';
    }

    function showLoading(message) {
      if (state.network) {
        state.network.destroy();
        state.network = null;
      }
      els.summary.textContent = 'Loading...';
      els.graphStats.textContent = message;
      if (els.graphInsight) { els.graphInsight.innerHTML = '<span class="insight-chip strong">' + escapeHtml(message) + '</span>'; }
      if (els.graphModeBar) { els.graphModeBar.hidden = true; els.graphModeBar.innerHTML = ''; }
      els.network.innerHTML = graphStateCardHtml('loading', 'Building graph', message, []);
      els.miniMap.innerHTML = '';
      if (els.clusterOverlay) { els.clusterOverlay.innerHTML = ''; }
    }

    function graphStateCardHtml(kind, title, body, actions) {
      const actionHtml = actions.length
        ? '<div class="state-actions">' + actions.map((action) => '<button class="ghost" type="button" data-state-action="' + escapeHtml(action.action) + '">' + escapeHtml(action.label) + '</button>').join('') + '</div>'
        : '';
      return '<div class="state-card ' + escapeHtml(kind) + '"><div class="state-title">' + escapeHtml(title) + '</div><p>' + escapeHtml(body) + '</p>' + actionHtml + '</div>';
    }

    function emptyStateTitle(message) {
      if (/Enter a symbol query/i.test(message)) { return 'Search needs a query'; }
      if (/No indexed files/i.test(message)) { return 'No indexed files found'; }
      if (/Run a search/i.test(message)) { return 'Ready for a graph'; }
      return 'No graph nodes visible';
    }

    function emptyStateBody(message) {
      if (/Enter a symbol query/i.test(message)) {
        return 'Type a symbol, function, file, or route name, then render again.';
      }
      if (/No indexed files/i.test(message)) {
        return 'The current workspace returned no indexed files. Clear filters or check the Codegraph index.';
      }
      if (/Run a search/i.test(message)) {
        return 'Start with File structure, or search for a symbol to see callers, callees, and nearby files.';
      }
      return message || 'The current query, filters, or graph limit produced no visible nodes.';
    }

    function emptyStateActions() {
      const actions = [{ action: 'focus-search', label: 'Focus search' }];
      if (els.query.value || els.kind.value || els.filePattern.value) {
        actions.push({ action: 'clear-filters', label: 'Clear filters' });
      }
      actions.push({ action: 'show-shortcuts', label: 'Shortcuts' });
      return actions;
    }

    function isVisNetworkReady() {
      return typeof vis !== 'undefined' && typeof vis.Network === 'function' && typeof vis.DataSet === 'function';
    }

    function resetSelection(clearCluster) {
      state.selectedId = '';
      state.focusIds = new Set();
      state.focusEdges = new Set();
      state.focusOnly = false;
      if (clearCluster) {
        state.activeClusterKey = '';
        state.activeClusterLabel = '';
      }
    }

    function updateMotionButton() {
      document.body.classList.toggle('motion-on', state.motion);
      setButtonContent(els.toggleMotion, state.motion ? '⏸' : '⏵', 'Motion');
      els.toggleMotion.title = state.motion ? 'Pause physics' : 'Start physics';
      els.toggleMotion.setAttribute('aria-label', els.toggleMotion.title);
    }

    function updateOrbitButton() {
      setButtonContent(els.toggleOrbit, state.orbit ? '◍' : '◎', 'Orbit');
      els.toggleOrbit.title = state.orbit ? 'Curved layout on' : 'Curved layout off';
      els.toggleOrbit.setAttribute('aria-label', els.toggleOrbit.title);
    }

    function updateFocusButton() {
      els.toggleFocus.textContent = state.focusOnly ? '◐' : '◉';
      els.toggleFocus.title = state.focusOnly ? 'Show all nodes' : 'Focus only';
      els.toggleFocus.setAttribute('aria-label', els.toggleFocus.title);
    }

    function setControlsOpen(open) {
      state.controlsOpen = Boolean(open);
      document.body.classList.toggle('controls-collapsed', !state.controlsOpen);
      updateControlsButton();
      setTimeout(() => {
        if (state.network) {
          state.network.redraw();
          renderMiniMap();
          renderClusterOverlay(true);
        }
      }, 40);
    }

    function updateControlsButton() {
      els.toggleControls.textContent = state.controlsOpen ? 'Controls' : 'Controls +';
      els.toggleControls.title = state.controlsOpen ? 'Hide graph controls' : 'Show graph controls';
      els.toggleControls.setAttribute('aria-label', els.toggleControls.title);
      els.toggleControls.setAttribute('aria-expanded', String(state.controlsOpen));
    }

    function setDetailsOpen(open) {
      state.detailsOpen = Boolean(open);
      document.body.classList.toggle('details-open', state.detailsOpen);
      updateDetailsButton();
      setTimeout(() => {
        if (state.network) {
          state.network.redraw();
          renderMiniMap();
          renderClusterOverlay();
        }
      }, 40);
    }

    function updateDetailsButton() {
      els.toggleDetails.textContent = state.detailsOpen ? '▥' : '▤';
      els.toggleDetails.title = state.detailsOpen ? 'Hide details' : 'Show details';
      els.toggleDetails.setAttribute('aria-label', els.toggleDetails.title);
      els.toggleDetails.setAttribute('aria-expanded', String(state.detailsOpen));
      els.toggleDetailsTop.textContent = state.detailsOpen ? 'Details -' : 'Details +';
      els.toggleDetailsTop.title = state.detailsOpen ? 'Hide details' : 'Show details';
      els.toggleDetailsTop.setAttribute('aria-label', els.toggleDetailsTop.title);
      els.toggleDetailsTop.setAttribute('aria-expanded', String(state.detailsOpen));
    }

    function setLegendOpen(open) {
      state.legendOpen = Boolean(open);
      document.body.classList.toggle('legend-open', state.legendOpen);
      updateLegendButton();
    }

    function setMiniMapOpen(open) {
      state.miniMapOpen = Boolean(open);
      document.body.classList.toggle('mini-map-open', state.miniMapOpen);
      updateMiniMapButton();
      if (state.miniMapOpen) { renderMiniMap(); }
    }

    function updateLegendButton() {
      setButtonContent(els.toggleLegend, state.legendOpen ? '●' : '◌', 'Legend');
      els.toggleLegend.title = state.legendOpen ? 'Hide legend' : 'Show legend';
      els.toggleLegend.setAttribute('aria-label', els.toggleLegend.title);
    }

    function updateMiniMapButton() {
      setButtonContent(els.toggleMiniMap, state.miniMapOpen ? '▣' : '▧', 'Minimap');
      els.toggleMiniMap.title = state.miniMapOpen ? 'Hide minimap' : 'Show minimap';
      els.toggleMiniMap.setAttribute('aria-label', els.toggleMiniMap.title);
    }

    function setClusterOverlayOpen(open) {
      state.clusterOverlayOpen = Boolean(open);
      document.body.classList.toggle('clusters-off', !state.clusterOverlayOpen);
      updateClusterButton();
      if (state.clusterOverlayOpen) {
        renderClusterOverlay(true);
      } else if (els.clusterOverlay) {
        els.clusterOverlay.innerHTML = '';
      }
    }

    function updateClusterButton() {
      if (!els.toggleClusters) { return; }
      setButtonContent(els.toggleClusters, state.clusterOverlayOpen ? '▦' : '□', 'Clusters');
      els.toggleClusters.title = state.clusterOverlayOpen ? 'Hide cluster regions' : 'Show cluster regions';
      els.toggleClusters.setAttribute('aria-label', els.toggleClusters.title);
    }

    function setButtonContent(button, icon, label) {
      const isMenuAction = Boolean(button && button.classList && button.classList.contains && button.classList.contains('menu-action'));
      if (isMenuAction) {
        button.innerHTML = '<span>' + escapeHtml(icon) + '</span>' + escapeHtml(label);
        return;
      }
      button.textContent = icon;
    }

    function updateLimitDownButton() {
      if (!els.stepLimitDown) { return; }
      const current = Number(els.limit.value) || 0;
      const previous = previousLimitValue(current);
      const canStepDown = previous < current;
      els.stepLimitDown.disabled = !canStepDown;
      els.stepLimitDown.title = canStepDown ? 'Show fewer nodes: ' + previous.toLocaleString() : 'Already at the smallest graph limit';
      els.stepLimitDown.setAttribute('aria-label', els.stepLimitDown.title);
    }

    function setHelpOpen(open) {
      if (!els.shortcutOverlay) { return; }
      els.shortcutOverlay.hidden = !open;
      document.body.classList.toggle('help-open', Boolean(open));
      if (open) { closeAdvancedControls(); }
    }

    function renderGraphInsight(graph) {
      if (!els.graphInsight) { return; }
      const counts = nodeTypeCounts(graph);
      const hubs = topConnectedNodes(graph, 3).filter((node) => node.type !== 'root');
      const root = graph.nodes.find((node) => node.type === 'root');
      const coverage = graphCoverageText(graph);
      const filterCount = activeFilterCount();
      const chips = [
        ['strong', graphModeTitle()],
        ['', graphMeaningText(graph, counts)],
        state.activeClusterKey ? ['warning', 'cluster only: ' + trimLabel(state.activeClusterLabel || clusterLabel(state.activeClusterKey), 32)] : undefined,
        state.focusOnly && state.selectedId ? ['warning', 'focus only'] : undefined,
        filterCount ? ['', filterCount + ' filter' + (filterCount === 1 ? '' : 's') + ' active'] : undefined,
        root ? ['', 'root: ' + trimLabel(root.label, 28)] : undefined,
        coverage ? [graph.omitted ? 'warning' : '', coverage] : undefined,
        graph.expanded ? ['', graph.expanded.toLocaleString() + ' nodes added by exploration'] : undefined,
        hubs.length ? ['', 'hubs: ' + hubs.map((node) => trimLabel(node.label, 22) + ' (' + node.degree + ')').join(', ')] : undefined,
        graph.omitted ? ['warning', graph.omitted.toLocaleString() + ' hidden by limit'] : undefined
      ].filter(Boolean);
      const actions = viewStateActions(graph, filterCount);
      els.graphInsight.innerHTML = chips.map((chip) => '<span class="insight-chip ' + chip[0] + '">' + escapeHtml(chip[1]) + '</span>').join('') +
        actions.map((action) => '<button class="ghost insight-action" type="button" data-view-action="' + escapeHtml(action.action) + '">' + escapeHtml(action.label) + '</button>').join('');
      renderGraphModeBar(graph, actions);
    }

    function renderGraphModeBar(graph, actions) {
      if (!els.graphModeBar) { return; }
      const selected = findNode(state.selectedId);
      const active = [];
      if (state.activeClusterKey) { active.push('Cluster: ' + trimLabel(state.activeClusterLabel || clusterLabel(state.activeClusterKey), 26)); }
      if (selected) { active.push('Selected: ' + trimLabel(selected.label, 24)); }
      if (state.focusOnly && selected) { active.push('Focus only'); }
      if (activeFilterCount()) { active.push(activeFilterCount() + ' filters'); }
      if (graph && graph.omitted) { active.push(graph.omitted.toLocaleString() + ' hidden'); }
      const allBarActions = modeBarActions(actions);
      const barActions = allBarActions.slice(0, 3);
      const overflowCount = Math.max(0, allBarActions.length - barActions.length);
      if (!active.length) {
        els.graphModeBar.hidden = true;
        els.graphModeBar.innerHTML = '';
        return;
      }
      els.graphModeBar.hidden = false;
      els.graphModeBar.innerHTML = '<div class="mode-copy">' + active.map((item) => '<span>' + escapeHtml(item) + '</span>').join('') + '</div>' +
        '<div class="mode-actions">' + barActions.map((action) => '<button class="ghost" type="button" data-view-action="' + escapeHtml(action.action) + '">' + escapeHtml(action.label) + '</button>').join('') + (overflowCount ? '<span class="mode-overflow">+' + overflowCount.toLocaleString() + ' above</span>' : '') + '</div>';
    }

    function modeBarActions(actions) {
      const byAction = new Map((actions || []).map((action) => [action.action, action]));
      return ['show-full-graph', 'clear-focus', 'show-more', 'clear-filters', 'fit']
        .map((action) => byAction.get(action))
        .filter(Boolean);
    }

    function activeFilterCount() {
      let count = 0;
      if (els.source.value === 'search' && els.query.value.trim()) { count += 1; }
      if (els.source.value === 'search' && els.kind.value) { count += 1; }
      if (els.source.value === 'files' && els.filePattern.value.trim()) { count += 1; }
      return count;
    }

    function viewStateActions(graph, filterCount) {
      const actions = [];
      if (state.activeClusterKey) { actions.push({ action: 'show-full-graph', label: 'Show full graph' }); }
      if (state.focusOnly || state.selectedId) { actions.push({ action: 'clear-focus', label: 'Clear focus' }); }
      if (graph && graph.omitted) { actions.push({ action: 'show-more', label: 'Show more' }); }
      if (filterCount) { actions.push({ action: 'clear-filters', label: 'Clear filters' }); }
      if (state.network && graph && graph.nodes.length) { actions.push({ action: 'fit', label: 'Fit' }); }
      return actions.slice(0, 5);
    }

    function graphMeaningText(graph, counts) {
      if (els.source.value === 'files') {
        return counts.directory + ' dirs | ' + counts.file + ' files rendered';
      }
      const mode = els.mode.value;
      if (mode === 'callers') { return counts.symbol + ' caller symbols point into the query'; }
      if (mode === 'callees') { return 'query points to ' + counts.symbol + ' called symbols'; }
      if (mode === 'impact') { return counts.symbol + ' symbols in the impact radius'; }
      return counts.symbol + ' matching symbols mapped to ' + counts.file + ' files';
    }

    function graphCoverageText(graph) {
      if (!graph.total || !graph.rendered) { return ''; }
      const percent = Math.round((graph.rendered / Math.max(graph.total, 1)) * 100);
      if (graph.omitted) {
        return 'partial map: ' + graph.rendered.toLocaleString() + '/' + graph.total.toLocaleString() + ' rendered (' + percent + '%)';
      }
      return 'complete map: ' + graph.rendered.toLocaleString() + '/' + graph.total.toLocaleString() + ' rendered';
    }

    function graphModeTitle() {
      if (els.source.value === 'files') { return 'File structure map'; }
      const mode = els.mode.value;
      const query = els.query.value.trim() || 'query';
      if (mode === 'callers') { return 'Who calls ' + query; }
      if (mode === 'callees') { return 'What ' + query + ' calls'; }
      if (mode === 'impact') { return 'Impact radius for ' + query; }
      return 'Search matches for ' + query;
    }

    function nodeTypeCounts(graph) {
      return graph.nodes.reduce((counts, node) => {
        counts[node.type] = (counts[node.type] || 0) + 1;
        return counts;
      }, { root: 0, symbol: 0, file: 0, directory: 0, more: 0 });
    }

    function topConnectedNodes(graph, limit) {
      const degrees = graph.edges.reduce((items, edge) => {
        items[edge.from] = (items[edge.from] || 0) + 1;
        items[edge.to] = (items[edge.to] || 0) + 1;
        return items;
      }, {});
      return graph.nodes
        .filter((node) => !node.raw || !node.raw.omitted)
        .map((node) => ({ ...node, degree: degrees[node.id] || 0 }))
        .sort((left, right) => right.degree - left.degree)
        .slice(0, limit);
    }

    function nodeInsight(node, visibleNeighborCount) {
      const raw = node.raw || {};
      if (raw.omitted) {
        return raw.count.toLocaleString() + ' ' + raw.scope + ' are not drawn yet. Use Show more to judge the full area instead of trusting this partial map.';
      }
      if (node.type === 'root') {
        if (els.source.value === 'files') {
          return 'This is the indexed workspace root. Dense branches show directories with more indexed files; missing files may be outside the current limit or filter.';
        }
        if (els.mode.value === 'callers') {
          return 'Incoming arrows show symbols that call this query. High-degree callers are good starting points for tracing ownership and entry paths.';
        }
        if (els.mode.value === 'callees') {
          return 'Outgoing arrows show symbols called by this query. This helps find dependencies and implementation spread.';
        }
        if (els.mode.value === 'impact') {
          return 'This is the impact radius seed. Nearby nodes are the first places to inspect before changing the symbol.';
        }
        return 'This groups search matches. The useful answer is which symbols exist and which files they live in.';
      }
      if (node.type === 'symbol') {
        return 'This symbol has ' + visibleNeighborCount.toLocaleString() + ' visible neighbors. Add callers/callees/impact to turn this point into a local exploration map.';
      }
      if (node.type === 'file') {
        return 'This file anchors related symbols on disk. Open it when the graph shows this file as a hub or repeated destination.';
      }
      if (node.type === 'directory') {
        return 'This directory groups indexed files. A dense branch usually means a module area worth filtering or exporting.';
      }
      return 'This node gives local context for the current graph.';
    }

    function relationBreakdown(node) {
      const counts = {};
      state.graph.edges.forEach((edge) => {
        if (edge.from !== node.id && edge.to !== node.id) { return; }
        const direction = edge.from === node.id ? 'out' : 'in';
        const relation = edge.relation || 'linked';
        const label = direction === 'out' ? relation + ' out' : relation + ' in';
        counts[label] = (counts[label] || 0) + 1;
      });
      return Object.keys(counts).sort().map((label) => ({ label, count: counts[label].toLocaleString() }));
    }

    function updateGraphStats() {
      if (!state.network || !state.graph.nodes.length) {
        els.graphStats.textContent = 'Drag canvas | Wheel zoom | Click node';
        return;
      }
      if (state.stabilizing) { return; }
      if (state.activeClusterKey) {
        const count = state.graph.nodes.filter((node) => clusterNodeMatches(node, state.activeClusterKey)).length;
        els.graphStats.textContent = 'Cluster only: ' + state.activeClusterLabel + ' | ' + count.toLocaleString() + ' nodes | clear focus to show all';
        return;
      }
      const selected = findNode(state.selectedId);
      const scale = Math.round(state.network.getScale() * 100);
      const labels = els.labelMode.value === 'all' ? 'all labels' : els.labelMode.value === 'minimal' ? 'minimal labels' : 'focus labels';
      const physics = state.motion ? 'physics on' : 'physics paused';
      const omitted = graphOmissionText();
      const next = omitted ? ' | click +' + state.graph.omitted.toLocaleString() + ' more to expand' : '';
      els.graphStats.textContent = scale + '% zoom | ' + physics + ' | ' + labels + (omitted ? ' | ' + omitted + next : '') + ' | ' + (selected ? 'selected: ' + trimLabel(selected.label, 28) : 'click a labeled hub or node to inspect');
    }

    function showHoverTip(node) {
      if (!node) { return; }
      const raw = node.raw || {};
      const location = raw.omitted ? raw.description || 'Hidden by graph limit.' : raw.file ? raw.file + (raw.line ? ':' + raw.line : '') : raw.path || '';
      els.hoverTip.innerHTML = '<div class="tip-kind">' + escapeHtml(node.type) + '</div><div class="tip-title">' + escapeHtml(node.label) + '</div>' + (location ? '<div class="tip-path">' + escapeHtml(location) + '</div>' : '');
      els.hoverTip.hidden = false;
      els.hoverTip.classList.add('visible', 'static-tip');
    }

    function hideHoverTip() {
      els.hoverTip.hidden = true;
      els.hoverTip.classList.remove('visible', 'static-tip');
    }

    function openNode(node) {
      const raw = node.raw || {};
      if (raw.file) { vscode.postMessage({ type: 'openResult', item: raw }); return; }
      if (node.type === 'file' && raw.path) { vscode.postMessage({ type: 'openFile', item: raw }); }
    }

    function canOpenNode(node) {
      const raw = node && node.raw || {};
      return Boolean(raw.file || (node && node.type === 'file' && raw.path));
    }

    function expandGraphLimit(node, showAll) {
      const raw = node && node.raw || {};
      if (!raw.omitted) { return; }
      const current = Number(els.limit.value) || 80;
      const next = showAll ? graphTotalLimit() : nextLimitValue(current);
      if (!next || next === current) {
        els.graphStats.textContent = 'Graph is already at the highest limit | ' + graphOmissionText();
        updateLimitDownButton();
        return;
      }
      if (showAll) {
        state.previousLimitBeforeAll = current;
      }
      ensureLimitOption(next);
      setSelectValue(els.limit, String(next));
      resetSelection(true);
      els.summary.textContent = 'Loading up to ' + next.toLocaleString() + ' nodes';
      els.graphStats.textContent = (showAll ? 'Rendering all visible graph data' : 'Expanding graph limit') + ' from ' + current.toLocaleString() + ' to ' + next.toLocaleString();
      if (next > 260) {
        state.motion = false;
        els.labelMode.value = 'minimal';
        updateMotionButton();
      }
      if (els.source.value === 'files') {
        render();
      } else {
        requestGraphData();
      }
    }

    function collapseGraphLimit() {
      const current = Number(els.limit.value) || 80;
      const remembered = state.previousLimitBeforeAll && state.previousLimitBeforeAll < current ? state.previousLimitBeforeAll : 0;
      const next = remembered || previousLimitValue(current);
      if (!next || next >= current) {
        els.graphStats.textContent = 'Already at the smallest graph limit';
        updateLimitDownButton();
        return;
      }
      state.previousLimitBeforeAll = 0;
      setSelectValue(els.limit, String(next));
      resetSelection(true);
      els.summary.textContent = 'Reducing graph to ' + next.toLocaleString() + ' nodes';
      els.graphStats.textContent = 'Showing fewer nodes | ' + current.toLocaleString() + ' -> ' + next.toLocaleString();
      updateLimitDownButton();
      if (els.source.value === 'files') {
        render();
      } else {
        requestGraphData();
      }
    }

    function graphTotalLimit() {
      return Math.max(
        Number(state.graph && state.graph.total) || 0,
        els.source.value === 'files' ? (state.files || []).length : (state.results || []).length,
        Number(els.limit.value) || 0
      );
    }

    function ensureLimitOption(value) {
      const text = String(value);
      if ([...els.limit.options].some((option) => option.value === text)) { return; }
      const option = document.createElement('option');
      option.value = text;
      option.textContent = value.toLocaleString() + ' nodes';
      els.limit.appendChild(option);
    }

    function nextLimitValue(current) {
      const values = [...els.limit.options].map((option) => Number(option.value)).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
      return values.find((value) => value > current) || values[values.length - 1] || current;
    }

    function previousLimitValue(current) {
      const values = [...els.limit.options].map((option) => Number(option.value)).filter((value) => Number.isFinite(value) && value < current).sort((a, b) => a - b);
      return values[values.length - 1] || current;
    }

    function showMoreLabel(raw) {
      const next = nextLimitValue(Number(els.limit.value) || 80);
      return next > (Number(els.limit.value) || 80)
        ? 'Show more up to ' + next.toLocaleString()
        : 'Highest limit reached';
    }

    function themeColors() {
      const styles = getComputedStyle(document.body);
      const value = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
      return {
        foreground: value('--vscode-foreground', '#d4d4d4'),
        description: value('--vscode-descriptionForeground', '#8f98a8'),
        background: value('--vscode-editor-background', '#1f2329'),
        focus: value('--vscode-focusBorder', '#4d9cff'),
        font: value('--vscode-font-family', 'sans-serif'),
        root: colorMix(value('--vscode-focusBorder', '#4d9cff'), value('--vscode-editor-background', '#1f2329'), 0.32),
        symbol: readableNodeColor(value('--vscode-button-background', '#365f9d'), value('--vscode-editor-background', '#1f2329'), '#4f7fd8'),
        file: readableNodeColor(value('--vscode-badge-background', '#5a6d8c'), value('--vscode-editor-background', '#1f2329'), '#6f7f9f'),
        directory: value('--vscode-editorInfo-foreground', '#4aa3ff'),
        warning: value('--vscode-editorWarning-foreground', '#cca700'),
        flowCyan: readableNodeColor('#00d1ff', value('--vscode-editor-background', '#1f2329'), '#00d1ff'),
        flowGreen: readableNodeColor('#00e68a', value('--vscode-editor-background', '#1f2329'), '#00e68a'),
        flowAmber: readableNodeColor('#ffae42', value('--vscode-editor-background', '#1f2329'), '#ffae42'),
        flowPink: readableNodeColor('#ff4fb3', value('--vscode-editor-background', '#1f2329'), '#ff4fb3'),
        flowPurple: readableNodeColor('#a478ff', value('--vscode-editor-background', '#1f2329'), '#a478ff'),
        flowHot: readableNodeColor('#ff5d5d', value('--vscode-editor-background', '#1f2329'), '#ff5d5d'),
        edge: colorMix(value('--vscode-descriptionForeground', '#8f98a8'), value('--vscode-focusBorder', '#4d9cff'), 0.28),
        mutedEdge: value('--vscode-panel-border', '#3a3f47'),
        shadow: 'rgba(0,0,0,0.28)'
      };
    }

    function mutedColors() {
      const background = colorMix(state.theme.background, state.theme.description, 0.24);
      const border = colorMix(state.theme.mutedEdge, state.theme.focus, 0.34);
      return { background, border, highlight: { background, border } };
    }

    function secondaryColors(colors) {
      const background = colorMix(colors.background, state.theme.background, 0.38);
      const border = colorMix(colors.border || colors.background, state.theme.focus, 0.34);
      return {
        background,
        border,
        highlight: colors.highlight
      };
    }

    function colorMix(left, right, amount) {
      const leftRgb = parseCssColor(left);
      const rightRgb = parseCssColor(right);
      if (!leftRgb || !rightRgb) {
        return amount > 0.5 ? right : left;
      }
      const ratio = Math.min(Math.max(amount, 0), 1);
      const mixed = leftRgb.map((channel, index) => Math.round(channel * (1 - ratio) + rightRgb[index] * ratio));
      return '#' + mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('');
    }

    function readableNodeColor(color, background, fallback) {
      const colorRgb = parseCssColor(color);
      const backgroundRgb = parseCssColor(background);
      if (!colorRgb || !backgroundRgb) { return color || fallback; }
      const distance = Math.sqrt(colorRgb.reduce((sum, channel, index) => sum + Math.pow(channel - backgroundRgb[index], 2), 0));
      return distance < 54 ? colorMix(fallback, background, 0.18) : color;
    }

    function parseCssColor(value) {
      const color = String(value || '').trim();
      if (/^#[0-9a-f]{3}$/i.test(color)) {
        return color.slice(1).split('').map((char) => parseInt(char + char, 16));
      }
      if (/^#[0-9a-f]{6}$/i.test(color)) {
        return [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
      }
      const rgb = /^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i.exec(color);
      return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : undefined;
    }

    function colorWithAlpha(color, alpha) {
      if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
        const hex = color.length === 4 ? color.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') : color;
        const red = parseInt(hex.slice(1, 3), 16);
        const green = parseInt(hex.slice(3, 5), 16);
        const blue = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
      }
      return color;
    }

    function closeAdvancedControls() {
      if (els.advancedControls.open) { els.advancedControls.open = false; }
      if (document.querySelectorAll) {
        document.querySelectorAll('.action-menu[open]').forEach((menu) => {
          menu.open = false;
        });
      }
    }

    function isTypingTarget(target) {
      const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      return tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(target && target.isContentEditable);
    }

    function basename(value) {
      const parts = String(value || '').split(/[\\\\/]/).filter(Boolean);
      return parts[parts.length - 1] || value || 'file';
    }

    function graphSummaryText(graph) {
      const base = graph.nodes.length.toLocaleString() + ' nodes | ' + graph.edges.length.toLocaleString() + ' edges';
      const rendered = graph.omitted ? graph.rendered.toLocaleString() + '/' + graph.total.toLocaleString() + ' rendered' : '';
      const expanded = graph.expanded ? graph.expanded.toLocaleString() + ' expanded' : '';
      return [base, rendered, expanded].filter(Boolean).join(' | ');
    }

    function graphOmissionText() {
      return state.graph && state.graph.omitted ? state.graph.omitted.toLocaleString() + ' hidden by limit' : '';
    }

    function exportTitle() {
      return 'Codegraph ' + (els.source.value === 'files' ? 'file structure' : els.mode.value + ' graph');
    }

    function exportSubtitle() {
      const query = els.query.value.trim();
      return [
        query ? 'query: ' + query : 'workspace graph',
        graphSummaryText(state.graph),
        graphOmissionText()
      ].filter(Boolean).join(' | ');
    }

    function exportFileName(extension) {
      return [
        'codegraph',
        els.source.value,
        els.source.value === 'search' ? els.mode.value : 'files',
        slug(els.query.value.trim() || els.filePattern.value.trim() || 'graph')
      ].filter(Boolean).join('-') + '.' + (extension || 'png');
    }

    function graphMarkdownSummary() {
      const counts = nodeTypeCounts(state.graph);
      const hubs = topConnectedNodes(state.graph, 5).filter((node) => node.type !== 'root');
      const selected = findNode(state.selectedId);
      const lines = [
        '# ' + graphModeTitle(),
        '',
        '- Workspace: ' + (state.workspacePath || 'unknown'),
        '- Summary: ' + graphSummaryText(state.graph),
        '- Coverage: ' + (graphCoverageText(state.graph) || 'complete visible graph'),
        '- Nodes: ' + counts.symbol + ' symbols, ' + counts.file + ' files, ' + counts.directory + ' directories',
        selected ? '- Selected: ' + selected.label + ' (' + selected.type + ')' : '- Selected: none'
      ];
      if (hubs.length) {
        lines.push('', '## Top Hubs');
        hubs.forEach((node) => lines.push('- ' + node.label + ' (' + node.type + ', degree ' + node.degree + ')'));
      }
      if (state.graph.omitted) {
        lines.push('', '## Hidden Data', '- ' + state.graph.omitted.toLocaleString() + ' nodes are hidden by the current graph limit. Raise the limit before using this as a complete map.');
      }
      return lines.join('\\n');
    }

    function slug(value) {
      return String(value || 'graph').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'graph';
    }

    function trimLabel(value, length) {
      const text = String(value || '');
      return text.length > length ? text.slice(0, length - 1) + '...' : text;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }
  `;
}
