export function getGraphInteractionScript(): string {
  return `
    function handleViewAction(action) {
      if (action === 'show-full-graph') {
        clearClusterFilter();
        return;
      }
      if (action === 'clear-focus') {
        resetSelection(false);
        if (state.network) { state.network.unselectAll(); }
        updateFocusButton();
        updateFocusStyles();
        renderMiniMap();
        hideHoverTip();
        if (!state.activeClusterKey) { setDetailsOpen(false); }
        return;
      }
      if (action === 'show-more') {
        const node = state.graph.nodes.find((item) => item && item.raw && item.raw.omitted);
        if (node) { expandGraphLimit(node); }
        return;
      }
      if (action === 'clear-filters') {
        clearGraphFilters();
        return;
      }
      if (action === 'fit') {
        fitNetwork();
        renderClusterOverlay(true);
        updateGraphStats();
      }
    }

    function isNodeHiddenByCluster(node) {
      return Boolean(state.activeClusterKey && !clusterNodeMatches(node, state.activeClusterKey));
    }

    function isEdgeHiddenByCluster(edge) {
      if (!state.activeClusterKey) { return false; }
      const from = findNode(edge.from);
      const to = findNode(edge.to);
      return !from || !to || !clusterNodeMatches(from, state.activeClusterKey) || !clusterNodeMatches(to, state.activeClusterKey);
    }

    function shouldHideLabel(node, focused) {
      if (node.type === 'root' || node.id === state.selectedId) { return false; }
      if (state.hubIds && state.hubIds.has(node.id)) { return false; }
      if (els.labelMode.value === 'all') { return false; }
      if (node.raw && node.raw.omitted) { return false; }
      const secondary = Boolean(node.raw && node.raw.secondary);
      if (secondary && !focused) { return true; }
      if (els.labelMode.value === 'minimal') { return !focused; }
      return Boolean(state.selectedId && !focused) || (!state.selectedId && node.type === 'file' && state.graph.nodes.length > 70);
    }

    function showDetails(node, neighborPage) {
      const raw = node.raw || {};
      const location = raw.omitted ? raw.description || 'Hidden by graph limit.' : raw.file ? raw.file + (raw.line ? ':' + raw.line : '') : raw.path || '-';
      const allNeighbors = connectedNodes(node);
      const pageSize = 6;
      const page = Math.max(0, Math.min(neighborPage || 0, Math.max(Math.ceil(allNeighbors.length / pageSize) - 1, 0)));
      const neighbors = allNeighbors.slice(page * pageSize, page * pageSize + pageSize);
      const expandable = canExpandNode(node);
      const selectedInsight = nodeInsight(node, allNeighbors.length);
      const relationRows = relationBreakdown(node);
      const meta = [
        ['Type', node.type],
        ['Kind', raw.kind || raw.language || '-'],
        ['Location', location],
        ['Connected', allNeighbors.length],
        ['Symbols', typeof raw.symbols === 'number' ? raw.symbols : '-'],
        ['Level', node.level]
      ];
      if (raw.omitted) {
        meta.splice(3, 0, ['Hidden', raw.count.toLocaleString() + ' ' + raw.scope]);
      }
      const currentLimit = Number(els.limit.value) || 80;
      const canStepLimit = raw.omitted && nextLimitValue(currentLimit) > currentLimit;
      const canStepDown = previousLimitValue(currentLimit) < currentLimit;
      const clusterActive = Boolean(state.activeClusterKey);
      const nodeClusterKey = !clusterActive && node.type === 'directory' ? clusterKeyForNode(node) : '';
      const nodeClusterLabel = nodeClusterKey ? clusterLabel(nodeClusterKey) : '';
      const renderedNode = Boolean(findNode(node.id));
      const hiddenNeighborCount = allNeighbors.filter((item) => item.raw && item.raw.virtual).length;
      const neighborCountLabel = (page * pageSize + 1).toLocaleString() + '-' + Math.min((page + 1) * pageSize, allNeighbors.length).toLocaleString() + ' / ' + allNeighbors.length.toLocaleString() + (hiddenNeighborCount ? ' | ' + hiddenNeighborCount.toLocaleString() + ' not rendered' : '');
      els.details.innerHTML = '<div class="detail-head ' + escapeHtml(node.type) + '"><div class="node-orb"></div><div><h2>' + escapeHtml(node.label) + '</h2><div class="detail-kind">' + escapeHtml(node.type) + ' | ' + escapeHtml(raw.kind || raw.language || 'node') + '</div></div></div>' +
        (clusterActive ? '<div class="cluster-return"><div><strong>Cluster only</strong><span>' + escapeHtml(state.activeClusterLabel || clusterLabel(state.activeClusterKey)) + '</span></div><div class="cluster-return-actions"><button class="ghost" id="showClusterList" type="button">Group list</button><button class="ghost" id="showFullGraph" type="button">Show full graph</button></div></div>' : '') +
        '<p class="detail-insight">' + escapeHtml(selectedInsight) + '</p>' +
        '<div class="detail-primary-actions">' +
        (canOpenNode(node) ? '<button class="primary-action" id="openSource" type="button">' + webviewIcon('external', 'graph-icon') + '<span>Open</span></button>' : '') +
        '<button class="ghost" id="copyNodeLocation" type="button">' + webviewIcon('copy', 'graph-icon') + '<span>Copy location</span></button>' +
        (renderedNode ? '<button class="ghost" id="centerNode" type="button">' + webviewIcon('fit', 'graph-icon') + '<span>Center</span></button>' : '') +
        '</div>' +
        '<table class="detail-table"><tbody>' + meta.map((item) => '<tr><th>' + escapeHtml(item[0]) + '</th><td>' + escapeHtml(item[1]) + '</td></tr>').join('') + '</tbody></table>' +
        (relationRows.length ? '<div class="compact-section"><div class="section-title">Relations</div><table class="detail-table relation-table"><tbody>' + relationRows.map((item) => '<tr><th>' + escapeHtml(item.label) + '</th><td>' + escapeHtml(item.count) + '</td></tr>').join('') + '</tbody></table></div>' : '') +
        '<div class="detail-actions">' +
        (canStepDown ? '<button class="ghost group-action" id="showLess" type="button" title="Show fewer nodes" aria-label="Show fewer nodes">' + webviewIcon('minus', 'graph-icon') + '<span>Fewer</span></button>' : '') +
        (raw.omitted ? '<button class="ghost group-action" id="showMore" type="button" title="' + escapeHtml(showMoreLabel(raw)) + '" aria-label="' + escapeHtml(showMoreLabel(raw)) + '" ' + (canStepLimit ? '' : 'disabled') + '>' + webviewIcon('plus', 'graph-icon') + '<span>More</span></button><button class="ghost group-action" id="showAll" type="button" title="Render all hidden items" aria-label="Render all hidden items">' + webviewIcon('spark', 'graph-icon') + '<span>All</span></button>' : '') +
        (nodeClusterKey ? '<button class="ghost group-action" id="showOnlyGroup" type="button" title="Show only this group" aria-label="Show only this group">Group</button>' : '') +
        (expandable ? '<button class="ghost group-action" type="button" data-expand-mode="callers" title="Add callers" aria-label="Add callers">Callers</button><button class="ghost group-action" type="button" data-expand-mode="callees" title="Add callees" aria-label="Add callees">Callees</button><button class="ghost group-action" type="button" data-expand-mode="impact" title="Add impact" aria-label="Add impact">Impact</button><button class="ghost group-action" type="button" data-expand-mode="all" title="Add callers, callees, and impact" aria-label="Add all relationships">All relationships</button>' : '') +
        (renderedNode ? '<button class="ghost group-action" id="stabilizeNode" type="button" title="Stabilize graph layout" aria-label="Stabilize graph layout">' + webviewIcon('refresh', 'graph-icon') + '<span>Stabilize</span></button>' : '') + '</div>' +
        (neighbors.length > 0 ? '<div class="neighbor-list"><div class="section-row"><h3>Connected</h3><span>' + escapeHtml(neighborCountLabel) + '</span></div><table class="neighbor-table"><tbody>' + neighbors.map((item, index) => '<tr data-node-id="' + escapeHtml(item.id) + '" data-neighbor-index="' + index + '" class="' + (item.raw && item.raw.virtual ? 'not-rendered' : '') + '"><th>' + escapeHtml(item.type) + '</th><td>' + escapeHtml(item.label) + (item.raw && item.raw.virtual ? '<span class="neighbor-status">not rendered</span>' : '') + '</td></tr>').join('') + '</tbody></table>' + (allNeighbors.length > pageSize ? '<div class="pager"><button class="ghost" id="prevNeighbors" type="button" ' + (page === 0 ? 'disabled' : '') + '>Prev</button><button class="ghost" id="nextNeighbors" type="button" ' + ((page + 1) * pageSize >= allNeighbors.length ? 'disabled' : '') + '>Next</button></div>' : '') + '</div>' : '') +
        '<details class="raw-payload"><summary>Raw Codegraph payload</summary><pre>' + escapeHtml(JSON.stringify(raw, null, 2)) + '</pre></details>';
      const showLessButton = document.getElementById('showLess');
      if (showLessButton) { showLessButton.addEventListener('click', collapseGraphLimit); }
      const showMoreButton = document.getElementById('showMore');
      if (showMoreButton) { showMoreButton.addEventListener('click', () => expandGraphLimit(node)); }
      const showAllButton = document.getElementById('showAll');
      if (showAllButton) { showAllButton.addEventListener('click', () => expandGraphLimit(node, true)); }
      const openButton = document.getElementById('openSource');
      if (openButton) { openButton.addEventListener('click', () => openNode(node)); }
      const copyNodeLocationButton = document.getElementById('copyNodeLocation');
      if (copyNodeLocationButton) { copyNodeLocationButton.addEventListener('click', () => copyNodeLocation(node)); }
      const showFullGraphButton = document.getElementById('showFullGraph');
      if (showFullGraphButton) { showFullGraphButton.addEventListener('click', clearClusterFilter); }
      const showClusterListButton = document.getElementById('showClusterList');
      if (showClusterListButton) { showClusterListButton.addEventListener('click', () => showClusterDetails()); }
      const showOnlyGroupButton = document.getElementById('showOnlyGroup');
      if (showOnlyGroupButton) { showOnlyGroupButton.addEventListener('click', () => selectCluster(nodeClusterKey, nodeClusterLabel)); }
      const centerButton = document.getElementById('centerNode');
      if (centerButton) { centerButton.addEventListener('click', () => state.network.focus(node.id, { scale: 1.12, animation: animationOptions(360) })); }
      const stabilizeButton = document.getElementById('stabilizeNode');
      if (stabilizeButton) { stabilizeButton.addEventListener('click', () => state.network.stabilize(120)); }
      els.details.querySelectorAll('[data-expand-mode]').forEach((button) => {
        button.addEventListener('click', () => button.dataset.expandMode === 'all' ? expandAllFromNode(node) : expandFromNode(node, button.dataset.expandMode));
      });
      const prevNeighbors = document.getElementById('prevNeighbors');
      if (prevNeighbors) { prevNeighbors.addEventListener('click', () => showDetails(node, page - 1)); }
      const nextNeighbors = document.getElementById('nextNeighbors');
      if (nextNeighbors) { nextNeighbors.addEventListener('click', () => showDetails(node, page + 1)); }
      els.details.querySelectorAll('[data-node-id]').forEach((neighbor) => {
        neighbor.addEventListener('click', () => {
          const next = findNode(neighbor.dataset.nodeId) || neighbors[Number(neighbor.dataset.neighborIndex)];
          if (next) {
            if (findNode(next.id)) {
              state.network.selectNodes([next.id]);
              selectNode(next);
              return;
            }
            if (canOpenNode(next)) {
              openNode(next);
              return;
            }
            showDetails(next);
          }
        });
      });
    }

    function showClusterDetails(pageInput) {
      if (!state.activeClusterKey || !state.detailsOpen) { return; }
      const clusterNodes = state.graph.nodes
        .filter((node) => clusterNodeMatches(node, state.activeClusterKey))
        .sort((left, right) => nodeTypeRank(left) - nodeTypeRank(right) || left.label.localeCompare(right.label));
      const count = clusterNodes.length;
      const label = state.activeClusterLabel || clusterLabel(state.activeClusterKey);
      const visibleEdges = state.graph.edges.filter((edge) => !isEdgeHiddenByCluster(edge)).length;
      const pageSize = 8;
      const page = Math.max(0, Math.min(pageInput || 0, Math.max(Math.ceil(clusterNodes.length / pageSize) - 1, 0)));
      const shownNodes = clusterNodes.slice(page * pageSize, page * pageSize + pageSize);
      els.details.innerHTML = '<div class="detail-head directory"><div class="node-orb"></div><div><h2>' + escapeHtml(label) + '</h2><div class="detail-kind">Cluster only</div></div></div>' +
        '<div class="cluster-return"><div><strong>Filtered graph</strong><span>' + count.toLocaleString() + ' nodes | ' + visibleEdges.toLocaleString() + ' edges</span></div><button class="ghost" id="showFullGraph" type="button">Show full graph</button></div>' +
        '<p class="detail-insight">This view is filtered to one module region. Use Show full graph to restore every visible node and edge.</p>' +
        '<table class="detail-table"><tbody><tr><th>Cluster</th><td>' + escapeHtml(label) + '</td></tr><tr><th>Nodes</th><td>' + count.toLocaleString() + '</td></tr><tr><th>Edges</th><td>' + visibleEdges.toLocaleString() + '</td></tr></tbody></table>' +
        (shownNodes.length ? '<div class="neighbor-list"><div class="section-row"><h3>Inside group</h3><span>' + (page * pageSize + 1).toLocaleString() + '-' + Math.min((page + 1) * pageSize, clusterNodes.length).toLocaleString() + ' / ' + clusterNodes.length.toLocaleString() + '</span></div><table class="neighbor-table"><tbody>' + shownNodes.map((node) => '<tr data-node-id="' + escapeHtml(node.id) + '"><th>' + escapeHtml(node.type) + '</th><td>' + escapeHtml(node.label) + '</td></tr>').join('') + '</tbody></table>' + (clusterNodes.length > pageSize ? '<div class="pager"><button class="ghost" id="prevClusterNodes" type="button" ' + (page === 0 ? 'disabled' : '') + '>Prev</button><button class="ghost" id="nextClusterNodes" type="button" ' + ((page + 1) * pageSize >= clusterNodes.length ? 'disabled' : '') + '>Next</button></div>' : '') + '</div>' : '');
      const showFullGraphButton = document.getElementById('showFullGraph');
      if (showFullGraphButton) { showFullGraphButton.addEventListener('click', clearClusterFilter); }
      const prevClusterNodes = document.getElementById('prevClusterNodes');
      if (prevClusterNodes) { prevClusterNodes.addEventListener('click', () => showClusterDetails(page - 1)); }
      const nextClusterNodes = document.getElementById('nextClusterNodes');
      if (nextClusterNodes) { nextClusterNodes.addEventListener('click', () => showClusterDetails(page + 1)); }
      els.details.querySelectorAll('[data-node-id]').forEach((row) => {
        row.addEventListener('click', () => {
          const next = findNode(row.dataset.nodeId);
          if (next) {
            state.network.selectNodes([next.id]);
            selectNode(next);
          }
        });
      });
    }

    function nodeTypeRank(node) {
      if (node.type === 'directory') { return 0; }
      if (node.type === 'file') { return 1; }
      if (node.type === 'symbol') { return 2; }
      return 3;
    }

    function renderMiniMap() {
      if (!state.network || !state.graph.nodes.length) {
        els.miniMap.innerHTML = '';
        return;
      }
      const positions = state.network.getPositions();
      const visibleNodes = state.graph.nodes.filter((node) => positions[node.id] && !isNodeHiddenByCluster(node));
      if (!visibleNodes.length) { return; }
      const width = 170;
      const height = 108;
      els.miniMap.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      const xs = visibleNodes.map((node) => positions[node.id].x);
      const ys = visibleNodes.map((node) => positions[node.id].y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const scaleX = (width - 18) / Math.max(1, maxX - minX);
      const scaleY = (height - 18) / Math.max(1, maxY - minY);
      const scale = Math.min(scaleX, scaleY);
      const point = (id) => ({
        x: 9 + (positions[id].x - minX) * scale,
        y: 9 + (positions[id].y - minY) * scale
      });
      els.miniMap.innerHTML = state.graph.edges.filter((edge) => positions[edge.from] && positions[edge.to] && !isEdgeHiddenByCluster(edge)).map((edge) => {
        const from = point(edge.from);
        const to = point(edge.to);
        return '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + to.x + '" y2="' + to.y + '"></line>';
      }).join('') + visibleNodes.map((node) => {
        const p = point(node.id);
        return '<circle class="' + escapeHtml(node.type) + (node.id === state.selectedId ? ' selected' : '') + '" cx="' + p.x + '" cy="' + p.y + '" r="' + (node.type === 'root' ? 3.7 : 2.3) + '"></circle>';
      }).join('');
    }

    function renderClusterOverlay(force) {
      if (!els.clusterOverlay) { return; }
      if (!state.clusterOverlayOpen) {
        els.clusterOverlay.innerHTML = '';
        return;
      }
      if (!state.network || !state.graph.nodes.length || !state.network.getPositions || !state.network.canvasToDOM) {
        els.clusterOverlay.innerHTML = '';
        return;
      }
      const now = Date.now();
      const throttleMs = state.stabilizing ? 32 : 48;
      if (!force && now - state.clusterOverlayRenderedAt < throttleMs) { return; }
      state.clusterOverlayRenderedAt = now;
      const width = Math.max(1, els.network.clientWidth || els.clusterOverlay.clientWidth || 1);
      const height = Math.max(1, els.network.clientHeight || els.clusterOverlay.clientHeight || 1);
      els.clusterOverlay.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      const positions = state.network.getPositions();
      if (state.activeClusterKey && state.activeClusterNodeIds && state.activeClusterNodeIds.size) {
        const activeGroup = clusterGroupFromNodeIds(
          state.activeClusterKey,
          state.activeClusterLabel || clusterLabel(state.activeClusterKey),
          [...state.activeClusterNodeIds],
          positions,
          width,
          height
        );
        if (!activeGroup) {
          els.clusterOverlay.innerHTML = '';
          return;
        }
        state.clusterGroups = new Map([[activeGroup.key, activeGroup]]);
        els.clusterOverlay.innerHTML = renderClusterHulls([activeGroup], width, height);
        attachClusterOverlayHandlers();
        return;
      }
      const groups = new Map();
      state.graph.nodes.forEach((node) => {
        if (node.type === 'root' || node.type === 'more' || !positions[node.id]) { return; }
        const key = clusterKeyForNode(node);
        if (!key) { return; }
        const point = state.network.canvasToDOM(positions[node.id]);
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) { return; }
        const group = groups.get(key) || {
          key,
          label: clusterLabel(key),
          color: flowPaletteColor(node) || state.theme.flowCyan,
          points: [],
          nodeIds: []
        };
        group.points.push(point);
        group.nodeIds.push(node.id);
        groups.set(key, group);
      });
      const clusters = [...groups.values()]
        .filter((group) => group.points.length >= 3)
        .sort((left, right) => right.points.length - left.points.length)
        .slice(0, 7)
        .map((group) => clusterGroupWithBounds(group, positions, width, height))
        .filter(Boolean)
        .filter((group) => group.width > 44 && group.height > 34);
      state.clusterGroups = new Map(clusters.map((group) => [group.key, group]));
      els.clusterOverlay.innerHTML = renderClusterHulls(clusters, width, height);
      attachClusterOverlayHandlers();
    }

    function renderClusterHulls(clusters, width, height) {
      return clusters.map((group) => {
        const labelX = Math.min(width - 24, Math.max(10, group.x + 16));
        const labelY = Math.min(height - 10, Math.max(18, group.y + 18));
        const active = state.activeClusterKey === group.key;
        return '<g class="cluster-hull' + (active ? ' active' : '') + '" data-cluster-key="' + escapeHtml(group.key) + '" data-cluster-label="' + escapeHtml(group.label) + '" style="--cluster:' + escapeHtml(group.color) + '" role="button" tabindex="0" aria-label="Show only ' + escapeHtml(group.label) + '">' +
          '<rect class="cluster-fill" x="' + roundNumber(group.x) + '" y="' + roundNumber(group.y) + '" width="' + roundNumber(group.width) + '" height="' + roundNumber(group.height) + '" rx="28" ry="28"></rect>' +
          '<text class="cluster-label" x="' + roundNumber(labelX) + '" y="' + roundNumber(labelY) + '">' + escapeHtml(trimLabel(group.label, 42)) + '</text>' +
        '</g>';
      }).join('');
    }

    function clusterGroupWithBounds(group, positions, width, height) {
      const bounds = clusterBounds(group.points, width, height);
      if (!bounds) { return undefined; }
      return {
        ...group,
        ...bounds,
        bounds,
        nodeIds: nodeIdsInsideBounds(bounds, positions)
      };
    }

    function clusterGroupFromNodeIds(key, label, nodeIds, positions, width, height) {
      const idSet = new Set(nodeIds || []);
      const nodes = state.graph.nodes.filter((node) => idSet.has(node.id) && positions[node.id]);
      const points = nodes.map((node) => state.network.canvasToDOM(positions[node.id])).filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
      const bounds = clusterBounds(points, width, height);
      if (!bounds) { return undefined; }
      const firstNode = nodes[0];
      return {
        key,
        label,
        color: firstNode ? flowPaletteColor(firstNode) || state.theme.flowCyan : state.theme.flowCyan,
        points,
        nodeIds: [...idSet],
        ...bounds,
        bounds
      };
    }

    function clusterBounds(points, width, height) {
      if (!points || !points.length) { return undefined; }
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      const pad = Math.min(42, Math.max(24, 18 + points.length * 0.45));
      const x = Math.max(-pad, Math.min(...xs) - pad);
      const y = Math.max(-pad, Math.min(...ys) - pad);
      return {
        x,
        y,
        width: Math.min(width + pad * 2, Math.max(...xs) - Math.min(...xs) + pad * 2),
        height: Math.min(height + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2)
      };
    }

    function nodeIdsInsideBounds(bounds, positions) {
      return state.graph.nodes
        .filter((node) => node.type !== 'more' && positions[node.id])
        .filter((node) => {
          const point = state.network.canvasToDOM(positions[node.id]);
          return point &&
            Number.isFinite(point.x) &&
            Number.isFinite(point.y) &&
            point.x >= bounds.x &&
            point.x <= bounds.x + bounds.width &&
            point.y >= bounds.y &&
            point.y <= bounds.y + bounds.height;
        })
        .map((node) => node.id);
    }

    function scheduleClusterOverlayRender(force) {
      if (force) { state.clusterOverlayForce = true; }
      if (state.clusterOverlayFrame) { return; }
      const frame = window.requestAnimationFrame || requestAnimationFrame || ((callback) => setTimeout(callback, 16));
      state.clusterOverlayFrame = frame(() => {
        const shouldForce = state.clusterOverlayForce;
        state.clusterOverlayFrame = 0;
        state.clusterOverlayForce = false;
        renderClusterOverlay(shouldForce);
      });
    }

    function attachClusterOverlayHandlers() {
      if (!els.clusterOverlay) { return; }
      els.clusterOverlay.querySelectorAll('.cluster-hull').forEach((group) => {
        const activate = (event) => {
          if (event && event.stopPropagation) { event.stopPropagation(); }
          if (event && event.preventDefault) { event.preventDefault(); }
          selectCluster(group.dataset.clusterKey || '', group.dataset.clusterLabel || '');
        };
        group.addEventListener('click', activate);
        group.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            activate(event);
          }
        });
      });
    }

    function selectCluster(key, label) {
      if (!key) { return; }
      const group = state.clusterGroups && state.clusterGroups.get ? state.clusterGroups.get(key) : undefined;
      const activeNodeIds = group && group.nodeIds && group.nodeIds.length
        ? group.nodeIds
        : state.graph.nodes.filter((node) => clusterKeyForNode(node) === key).map((node) => node.id);
      if (state.activeClusterKey === key) {
        if (activeNodeIds.length) { state.activeClusterNodeIds = new Set(activeNodeIds); }
        pauseGraphMotionForCluster();
        setDetailsOpen(true);
        showClusterDetails();
        renderClusterOverlay(true);
        return;
      }
      state.activeClusterKey = key;
      state.activeClusterLabel = label || clusterLabel(key);
      state.activeClusterNodeIds = new Set(activeNodeIds);
      state.focusOnly = false;
      state.selectedId = '';
      state.focusIds = new Set();
      state.focusEdges = new Set();
      pauseGraphMotionForCluster();
      updateFocusButton();
      updateFocusStyles();
      renderMiniMap();
      renderClusterOverlay(true);
      setDetailsOpen(true);
      showClusterDetails();
      const count = state.graph.nodes.filter((node) => clusterNodeMatches(node, key)).length;
      els.graphStats.textContent = 'Cluster only: ' + state.activeClusterLabel + ' | ' + count.toLocaleString() + ' nodes | clear focus to show all';
    }

    function pauseGraphMotionForCluster() {
      state.motion = false;
      updateMotionButton();
      if (!state.network) { return; }
      state.network.setOptions({ physics: { enabled: false } });
      state.network.stopSimulation();
    }

    function clearClusterFilter() {
      if (!state.activeClusterKey) { return; }
      state.activeClusterKey = '';
      state.activeClusterLabel = '';
      state.activeClusterNodeIds = new Set();
      state.clusterGroups = new Map();
      updateFocusStyles();
      renderMiniMap();
      renderClusterOverlay(true);
      if (state.detailsOpen) {
        els.details.innerHTML = '<h2>Node Details</h2><p>Select a node to inspect it. Drag nodes to rearrange, drag the canvas to pan, and use the mouse wheel to zoom.</p>';
      }
      updateGraphStats();
    }

    function clusterNodeMatches(node, key) {
      if (!key) { return false; }
      if (state.activeClusterKey === key && state.activeClusterNodeIds && state.activeClusterNodeIds.size) {
        return state.activeClusterNodeIds.has(node.id);
      }
      return clusterKeyForNode(node) === key;
    }

    function clusterKeyForNode(node) {
      const path = nodePath(node);
      if (!path) { return ''; }
      const parts = path.split(/[\\\\/]/).filter(Boolean);
      if (!parts.length) { return ''; }
      if (parts[0] === 'src' && parts.length > 3) { return parts.slice(0, 4).join('/'); }
      if (parts[0] === 'tests' && parts.length > 2) { return parts.slice(0, 3).join('/'); }
      return parts.slice(0, Math.min(3, Math.max(1, parts.length - 1))).join('/');
    }

    function clusterLabel(key) {
      const parts = String(key || '').split(/[\\\\/]/).filter(Boolean);
      return parts.length > 2 ? parts.slice(-2).join('/') : parts.join('/');
    }

    function flowPaletteColor(node) {
      if (!state.theme) { return ''; }
      const key = flowPaletteKey(node);
      if (!key) { return ''; }
      const palette = [
        state.theme.flowCyan,
        state.theme.flowGreen,
        state.theme.flowAmber,
        state.theme.flowPink,
        state.theme.flowPurple,
        state.theme.flowHot
      ].filter(Boolean);
      return palette[hashString(key) % palette.length] || state.theme.focus;
    }

    function flowPaletteKey(node) {
      const path = nodePath(node);
      if (!path) { return node && node.type ? node.type : ''; }
      const parts = path.split(/[\\\\/]/).filter(Boolean);
      if (!parts.length) { return ''; }
      if (parts[0] === 'src' && parts.length > 2) { return parts.slice(0, 3).join('/'); }
      return parts.slice(0, Math.min(2, parts.length)).join('/');
    }

    function nodePath(node) {
      const raw = node && node.raw || {};
      return String(raw.file || raw.path || raw.filePath || raw.relativePath || '').trim();
    }

    function hashString(value) {
      const text = String(value || '');
      let hash = 0;
      for (let index = 0; index < text.length; index += 1) {
        hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
      }
      return Math.abs(hash);
    }

    function roundNumber(value) {
      return Math.round(Number(value) * 10) / 10;
    }

    function connectedNodes(node) {
      const rendered = state.graph.edges.reduce((items, edge) => {
        if (edge.from === node.id) {
          const next = findNode(edge.to);
          if (next) { items.push(next); }
        }
        if (edge.to === node.id) {
          const next = findNode(edge.from);
          if (next) { items.push(next); }
        }
        return items;
      }, []);
      return mergeVirtualFileNeighbors(node, rendered);
    }

    function mergeVirtualFileNeighbors(node, rendered) {
      if (els.source.value !== 'files') { return rendered; }
      if (node.type !== 'root' && node.type !== 'directory') { return rendered; }
      return fileChildrenForDirectory(node.type === 'root' ? '' : node.raw && node.raw.path);
    }

    function fileChildrenForDirectory(directoryPath) {
      const prefix = normalizeGraphPath(directoryPath);
      const baseParts = prefix ? prefix.split('/') : [];
      const children = new Map();
      (state.files || []).forEach((file) => {
        const path = normalizeGraphPath(file.path);
        if (!path || (prefix && !path.startsWith(prefix + '/'))) { return; }
        const rest = prefix ? path.slice(prefix.length + 1) : path;
        const parts = rest.split('/').filter(Boolean);
        if (!parts.length) { return; }
        if (parts.length === 1) {
          const id = 'file:' + path;
          children.set(id, findNode(id) || { id, label: parts[0], type: 'file', raw: { ...file, path, virtual: true }, level: baseParts.length + 1 });
          return;
        }
        const childPath = baseParts.concat(parts[0]).join('/');
        const id = 'dir:' + childPath;
        children.set(id, findNode(id) || { id, label: parts[0], type: 'directory', raw: { path: childPath, virtual: true }, level: baseParts.length + 1 });
      });
      return [...children.values()].sort((left, right) => nodeTypeRank(left) - nodeTypeRank(right) || left.label.localeCompare(right.label));
    }

    function normalizeGraphPath(value) {
      return String(value || '').replace(/\\\\/g, '/').replace(/^\\.\\//, '').replace(/\\/+/g, '/').replace(/\\/$/, '');
    }

    function canExpandNode(node) {
      const raw = node && node.raw || {};
      const expandableRoot = node && node.type === 'root' && Boolean(raw.name || raw.mode);
      return Boolean(node && !raw.omitted && (node.type === 'symbol' || expandableRoot) && expansionQueryFor(node));
    }

    function expansionQueryFor(node) {
      const raw = node && node.raw || {};
      return String(raw.name || node.label || '').trim();
    }

    function expandFromNode(node, mode) {
      if (!canExpandNode(node)) { return; }
      const query = expansionQueryFor(node);
      const graphMode = mode === 'callers' || mode === 'impact' ? mode : 'callees';
      const key = node.id + '|' + graphMode + '|' + query;
      if (state.expandedKeys.has(key)) {
        els.graphStats.textContent = graphMode + ' already added for ' + trimLabel(query, 34);
        return;
      }
      state.expandedKeys.add(key);
      els.graphStats.textContent = 'Expanding ' + graphMode + ' for ' + trimLabel(query, 42);
      vscode.postMessage({ type: 'expandNode', query, mode: graphMode, sourceId: node.id, graphRequestId: state.activeGraphRequestId, limit: 12, depth: 2 });
    }

    function expandAllFromNode(node) {
      if (!canExpandNode(node)) { return; }
      ['callers', 'callees', 'impact'].forEach((mode) => expandFromNode(node, mode));
    }

    function mergeExpandedNode(message) {
      const source = findNode(message.sourceId);
      if (!source) {
        els.graphStats.textContent = 'Expansion skipped | source node no longer exists';
        return;
      }
      if (message.error) {
        els.graphStats.textContent = 'Expansion failed | ' + message.error;
        state.expandedKeys.delete(source.id + '|' + message.mode + '|' + message.query);
        return;
      }
      const results = message.results || [];
      const before = state.graph.nodes.length;
      results.forEach((item) => mergeExpansionResult(source, item, message.mode));
      refreshGraphDataSets();
      selectNode(source);
      const added = state.graph.nodes.length - before;
      state.expandedCount = (state.expandedCount || 0) + Math.max(added, 0);
      state.graph.expanded = state.expandedCount;
      els.summary.textContent = graphSummaryText(state.graph);
      renderGraphInsight(state.graph);
      recordActivity('fresh', 'Expanded ' + message.mode + ' | +' + added.toLocaleString() + ' nodes');
      els.graphStats.textContent = 'Added ' + added.toLocaleString() + ' nodes from ' + message.mode + ' | ' + trimLabel(message.query, 36);
    }

    function mergeExpansionResult(source, item, mode) {
      const symbol = ensureGraphNode(
        expansionSymbolId(mode, item),
        item.name || item.file || 'related',
        'symbol',
        { ...item, expanded: true },
        Math.max(source.level + 1, 1)
      );
      const file = ensureGraphNode(
        'file:' + (item.file || item.path),
        basename(item.file || item.path),
        'file',
        { ...item, secondary: true, expanded: true },
        Math.max(source.level + 2, 2)
      );
      if (mode === 'callers') {
        ensureGraphEdge(symbol, source, mode, true);
      } else {
        ensureGraphEdge(source, symbol, mode, true);
      }
      ensureGraphEdge(symbol, file, 'defined in', false, true);
    }

    function ensureGraphNode(id, label, type, raw, level) {
      const existing = findNode(id);
      if (existing) { return existing; }
      const node = { id, label, type, raw, level: level || 0 };
      state.graph.nodes.push(node);
      return node;
    }

    function ensureGraphEdge(from, to, relation, directed, secondary) {
      if (state.graph.edges.some((edge) => edge.from === from.id && edge.to === to.id && edge.relation === (relation || ''))) { return; }
      state.graph.edges.push({
        id: 'edge:' + Date.now() + ':' + state.graph.edges.length,
        from: from.id,
        to: to.id,
        relation: relation || '',
        directed: Boolean(directed),
        secondary: Boolean(secondary)
      });
    }

    function expansionSymbolId(mode, item) {
      return 'symbol:expanded:' + mode + ':' + (item.name || item.file || '') + ':' + (item.file || item.path || '') + ':' + (item.line || '');
    }

    function refreshGraphDataSets() {
      state.hubIds = new Set(topConnectedNodes(state.graph, 4).map((node) => node.id));
      state.nodeData.update(state.graph.nodes.map((node) => nodeView(node)));
      state.edgeData.update(state.graph.edges.map((edge) => edgeView(edge)));
      els.summary.textContent = graphSummaryText(state.graph);
      renderGraphInsight(state.graph);
      updateFocusStyles();
      renderMiniMap();
      renderClusterOverlay();
      if (state.motion) { state.network.stabilize(90); }
    }
  `;
}
