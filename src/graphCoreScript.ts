export function getGraphCoreScript(): string {
  return `
    function wireNetworkEvents() {
      state.network.on('selectNode', (params) => {
        const node = findNode(params.nodes[0]);
        if (node) { selectNode(node); }
      });
      state.network.on('deselectNode', () => {
        resetSelection();
        updateFocusButton();
        updateFocusStyles();
        renderMiniMap();
        updateGraphStats();
      });
      state.network.on('doubleClick', (params) => {
        const node = findNode(params.nodes[0]);
        if (node && node.raw && node.raw.omitted) { expandGraphLimit(node); return; }
        if (node) { openNode(node); }
      });
      state.network.on('hoverNode', (params) => {
        const node = findNode(params.node);
        if (node) { showHoverTip(node); }
      });
      state.network.on('blurNode', hideHoverTip);
      state.network.on('dragEnd', () => {
        renderMiniMap();
        scheduleClusterOverlayRender(true);
        updateGraphStats();
      });
      state.network.on('animationFinished', () => {
        renderMiniMap();
        renderClusterOverlay(true);
        updateGraphStats();
      });
      state.network.on('zoom', () => {
        scheduleClusterOverlayRender();
        updateGraphStats();
      });
      state.network.on('dragging', () => {
        scheduleClusterOverlayRender();
        updateGraphStats();
      });
      state.network.on('stabilizationProgress', (params) => {
        const total = Math.max(params.total || 1, 1);
        const percent = Math.min(100, Math.round(((params.iterations || 0) / total) * 100));
        state.stabilizing = percent < 100;
        if (!state.stabilizing) {
          updateGraphStats();
          return;
        }
        els.graphStats.textContent = 'stabilizing ' + percent + '% | drag nodes anytime';
      });
      state.network.on('stabilized', () => {
        state.stabilizing = false;
        if (!state.motion) { state.network.stopSimulation(); }
        renderMiniMap();
        scheduleClusterOverlayRender(true);
        updateGraphStats();
      });
      state.network.on('afterDrawing', () => {
        if (state.miniMapOpen) { renderMiniMap(); }
        scheduleClusterOverlayRender();
      });
    }

    function networkOptions() {
      return {
        autoResize: true,
        height: '100%',
        width: '100%',
        layout: layoutOptions(),
        physics: physicsOptions(),
        interaction: {
          dragNodes: true,
          dragView: true,
          hover: true,
          multiselect: false,
          navigationButtons: false,
          tooltipDelay: 120,
          zoomView: true
        },
        nodes: {
          borderWidth: 2,
          borderWidthSelected: 4,
          font: {
            color: state.theme.foreground,
            face: state.theme.font,
            size: labelSize(),
            strokeWidth: 5,
            strokeColor: state.theme.background
          },
          shape: 'dot',
          shadow: { enabled: true, color: state.theme.shadow, size: 9, x: 0, y: 3 }
        },
        edges: {
          arrows: { to: { enabled: false } },
          color: { color: state.theme.edge, highlight: state.theme.focus, hover: state.theme.focus },
          hoverWidth: 1.8,
          selectionWidth: 2.4,
          smooth: smoothOptions(),
          width: 1.1
        }
      };
    }

    function layoutOptions() {
      if (els.layout.value === 'layered') {
        return { hierarchical: { enabled: true, direction: 'UD', sortMethod: 'directed', levelSeparation: 110 * spacing() } };
      }
      if (els.layout.value === 'columns') {
        return { hierarchical: { enabled: true, direction: 'LR', sortMethod: 'directed', levelSeparation: 150 * spacing(), nodeSpacing: 90 * spacing() } };
      }
      if (els.layout.value === 'flow') {
        return { hierarchical: { enabled: true, direction: 'LR', sortMethod: 'hubsize', levelSeparation: 130 * spacing(), nodeSpacing: 72 * spacing(), treeSpacing: 150 * spacing(), blockShifting: true, edgeMinimization: true } };
      }
      return { improvedLayout: true, randomSeed: 11 };
    }

    function physicsOptions() {
      if (!state.motion || reduceMotion) { return { enabled: false }; }
      const solver = els.layout.value === 'bundle' ? 'forceAtlas2Based' : els.layout.value === 'radial' ? 'repulsion' : els.layout.value === 'flow' ? 'forceAtlas2Based' : 'barnesHut';
      return {
        enabled: true,
        solver,
        stabilization: { enabled: true, iterations: stabilizationIterations(), updateInterval: stabilizationUpdateInterval(), fit: false },
        timestep: 0.45,
        minVelocity: 0.45,
        maxVelocity: 22,
        barnesHut: {
          gravitationalConstant: -3200 * spacing() * depthStrength(),
          centralGravity: 0.18 * depthStrength(),
          springLength: 95 * spacing() * depthStrength(),
          springConstant: 0.035,
          damping: 0.32,
          avoidOverlap: 0.42
        },
        repulsion: {
          nodeDistance: 145 * spacing() * depthStrength(),
          centralGravity: 0.16 * depthStrength(),
          springLength: 105 * spacing() * depthStrength(),
          springConstant: 0.035,
          damping: 0.32
        },
        forceAtlas2Based: {
          gravitationalConstant: -58 * spacing() * depthStrength(),
          centralGravity: 0.018 * depthStrength(),
          springLength: 118 * spacing() * depthStrength(),
          springConstant: 0.05,
          damping: 0.38,
          avoidOverlap: 0.55
        }
      };
    }

    function graphComplexity() {
      return state.graph && state.graph.nodes ? state.graph.nodes.length + state.graph.edges.length : 0;
    }

    function stabilizationIterations() {
      const complexity = graphComplexity();
      if (complexity > 450) { return 80; }
      if (complexity > 260) { return 120; }
      return 180;
    }

    function stabilizationUpdateInterval() {
      return graphComplexity() > 260 ? 30 : 18;
    }

    function updateNetworkOptions() {
      if (!state.network) { return; }
      state.network.setOptions({
        layout: layoutOptions(),
        physics: physicsOptions(),
        edges: { smooth: smoothOptions() },
        nodes: { font: { size: labelSize() } }
      });
      if (state.motion) { state.network.stabilize(150); }
      updateFocusStyles();
      renderMiniMap();
      renderClusterOverlay();
    }

    function smoothOptions() {
      if (state.orbit) { return { enabled: true, type: 'curvedCW', roundness: 0.28 }; }
      if (els.layout.value === 'bundle') { return { enabled: true, type: 'dynamic', roundness: 0.55 }; }
      if (els.layout.value === 'flow') { return { enabled: true, type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.5 }; }
      if (els.layout.value === 'layered' || els.layout.value === 'columns') { return { enabled: true, type: 'cubicBezier', roundness: 0.35 }; }
      return { enabled: true, type: 'continuous', roundness: 0.25 };
    }

    function buildGraph() {
      const nodes = [];
      const edges = [];
      const byId = new Map();
      const edgeKeys = new Set();
      const limit = Number(els.limit.value) || 80;
      const addNode = (id, label, type, raw, level) => {
        if (!byId.has(id)) {
          const node = { id, label, type, raw, level: level || 0 };
          byId.set(id, node);
          nodes.push(node);
        }
        return byId.get(id);
      };
      const addEdge = (from, to, relation, directed, secondary) => {
        const key = from.id + '->' + to.id;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push({ id: 'edge:' + edges.length, from: from.id, to: to.id, relation: relation || '', directed: Boolean(directed), secondary: Boolean(secondary) });
        }
      };
      if (els.source.value === 'files') {
        const root = addNode('root:files', 'Indexed files', 'root', {}, 0);
        const files = state.files || [];
        const rendered = files.slice(0, limit);
        rendered.forEach((file) => addFilePath(root, file, addNode, addEdge));
        addOmittedNode(root, files.length - rendered.length, 'files', addNode, addEdge, 1);
        return { nodes, edges, total: files.length, rendered: rendered.length, omitted: Math.max(files.length - rendered.length, 0) };
      }
      if (els.mode.value !== 'symbols') {
        return buildRelationshipGraph(addNode, addEdge, nodes, edges, limit);
      }
      const root = addNode('root:search', els.query.value.trim() || 'Search', 'root', { mode: 'symbols' }, 0);
      const results = state.results || [];
      const rendered = results.slice(0, limit);
      rendered.forEach((item) => {
        const symbol = addNode('symbol:' + (item.name || item.file) + ':' + (item.line || ''), item.name || item.file, 'symbol', item, 1);
        const file = addNode('file:' + (item.file || item.path), basename(item.file || item.path), 'file', item, 2);
        addEdge(root, symbol);
        addEdge(symbol, file);
      });
      addOmittedNode(root, results.length - rendered.length, 'results', addNode, addEdge, 1);
      return { nodes, edges, total: results.length, rendered: rendered.length, omitted: Math.max(results.length - rendered.length, 0) };
    }

    function buildRelationshipGraph(addNode, addEdge, nodes, edges, limit) {
      const mode = els.mode.value;
      const query = els.query.value.trim() || 'Selected symbol';
      const root = addNode('root:relationship:' + mode + ':' + query, query, 'root', { name: query, mode }, 0);
      const results = state.results || [];
      const rendered = results.slice(0, limit);
      rendered.forEach((item) => {
        const symbol = addNode('symbol:' + mode + ':' + (item.name || item.file) + ':' + (item.line || ''), item.name || item.file, 'symbol', item, 1);
        const file = addNode('file:' + (item.file || item.path), basename(item.file || item.path), 'file', { ...item, secondary: true }, 2);
        if (mode === 'callers') {
          addEdge(symbol, root, mode, true);
        } else {
          addEdge(root, symbol, mode, true);
        }
        addEdge(symbol, file, 'defined in', false, true);
      });
      addOmittedNode(root, results.length - rendered.length, mode, addNode, addEdge, 1);
      return { nodes, edges, total: results.length, rendered: rendered.length, omitted: Math.max(results.length - rendered.length, 0) };
    }

    function addOmittedNode(parent, count, scope, addNode, addEdge, level) {
      if (count <= 0) { return; }
      const label = '+' + count.toLocaleString() + ' more';
      const node = addNode('more:' + parent.id + ':' + scope, label, 'more', {
        omitted: true,
        count,
        scope,
        description: count.toLocaleString() + ' ' + scope + ' hidden by the graph limit'
      }, level);
      addEdge(parent, node, 'hidden by limit', false, true);
    }

    function addFilePath(root, file, addNode, addEdge) {
      const parts = String(file.path || '').split(/[\\\\/]/).filter(Boolean);
      let parent = root;
      parts.slice(0, -1).forEach((part, index) => {
        const path = parts.slice(0, index + 1).join('/');
        const dir = addNode('dir:' + path, part, 'directory', { path }, index + 1);
        addEdge(parent, dir);
        parent = dir;
      });
      const fileNode = addNode('file:' + file.path, parts[parts.length - 1] || file.path, 'file', file, parts.length);
      addEdge(parent, fileNode);
    }

    function nodeView(node) {
      const colors = nodeColors(node);
      const secondary = Boolean(node.raw && node.raw.secondary);
      const hub = state.hubIds && state.hubIds.has(node.id);
      const baseSize = secondary ? 10 : node.type === 'root' ? 24 : node.type === 'directory' ? 18 : node.type === 'symbol' ? 16 : node.type === 'more' ? 16 : 13;
      return {
        id: node.id,
        label: trimLabel(node.label, 32),
        title: titleFor(node),
        group: node.type,
        level: node.level,
        mass: secondary ? 0.7 : node.type === 'root' ? 4.2 : node.type === 'directory' ? 2.4 : node.type === 'more' ? 0.9 : 1.3,
        size: hub && node.type !== 'root' ? baseSize + 3 : baseSize,
        color: secondary ? secondaryColors(colors) : colors,
        font: { color: state.theme.foreground, size: labelSize(), strokeColor: state.theme.background, strokeWidth: 5 },
        rawNode: node
      };
    }

    function edgeView(edge) {
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        title: edge.relation || '',
        arrows: { to: { enabled: Boolean(edge.directed), scaleFactor: 0.7 } },
        color: { color: state.theme.edge },
        width: edge.secondary ? 0.7 : edge.directed ? 1.35 : 1.1
      };
    }

    function nodeColors(node) {
      const type = node.type;
      const flowColor = flowPaletteColor(node);
      if (type === 'root') {
        return { background: state.theme.root, border: state.theme.flowHot, highlight: { background: state.theme.root, border: state.theme.flowHot } };
      }
      if (type === 'symbol') {
        return { background: flowColor || state.theme.symbol, border: state.theme.flowCyan, highlight: { background: flowColor || state.theme.symbol, border: state.theme.flowCyan } };
      }
      if (type === 'directory') {
        return { background: flowColor || state.theme.directory, border: state.theme.flowGreen, highlight: { background: flowColor || state.theme.directory, border: state.theme.flowGreen } };
      }
      if (type === 'more') {
        return { background: state.theme.root, border: state.theme.warning || state.theme.flowHot, highlight: { background: state.theme.root, border: state.theme.warning || state.theme.flowHot } };
      }
      return { background: flowColor || state.theme.file, border: state.theme.flowCyan, highlight: { background: flowColor || state.theme.file, border: state.theme.flowCyan } };
    }

    function selectNode(node) {
      if (!node) { return; }
      setDetailsOpen(true);
      state.selectedId = node.id;
      computeFocus(node);
      showDetails(node);
      updateFocusStyles();
      renderMiniMap();
      state.network.focus(node.id, { scale: Math.max(0.92, state.network.getScale()), animation: animationOptions(360) });
    }

    function computeFocus(node) {
      state.focusIds = new Set([node.id]);
      state.focusEdges = new Set();
      state.graph.edges.forEach((edge) => {
        if (edge.from === node.id || edge.to === node.id) {
          state.focusEdges.add(edge.id);
          state.focusIds.add(edge.from);
          state.focusIds.add(edge.to);
        }
      });
    }

    function updateFocusStyles() {
      if (!state.nodeData || !state.edgeData) { return; }
      const selected = Boolean(state.selectedId);
      const nodeUpdates = state.graph.nodes.map((node) => {
        const focused = state.focusIds.has(node.id);
        const hidden = isNodeHiddenByCluster(node) || (state.focusOnly && selected && !focused);
        const colors = nodeColors(node);
        return {
          id: node.id,
          hidden,
          label: shouldHideLabel(node, focused) ? '' : trimLabel(node.label, 32),
          color: focused || !selected ? colors : mutedColors(),
          opacity: focused || !selected ? 1 : 0.48
        };
      });
      const edgeUpdates = state.graph.edges.map((edge) => {
        const focused = state.focusEdges.has(edge.id);
        const hidden = isEdgeHiddenByCluster(edge) || (state.focusOnly && selected && !focused);
        return {
          id: edge.id,
          hidden,
          color: { color: focused ? state.theme.focus : selected ? state.theme.mutedEdge : state.theme.edge },
          width: focused ? 2.4 : 1.1
        };
      });
      state.nodeData.update(nodeUpdates);
      state.edgeData.update(edgeUpdates);
      renderClusterOverlay();
      renderGraphInsight(state.graph);
      updateGraphStats();
    }
  `;
}
