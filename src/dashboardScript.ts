export function getDashboardScript(): string {
  return `
    const vscode = acquireVsCodeApi();
    const savedState = vscode.getState && vscode.getState();
    let state = {
      files: [],
      results: [],
      related: [],
      relationshipSummaries: {},
      relationshipSummaryContext: '',
      selectedResultKeys: {},
      relationshipTimer: 0,
      searchRequestId: 0,
      filesRequestId: 0,
      relatedRequestId: 0,
      searchLoading: false,
      filesLoading: false,
      relatedLoading: false,
      filePage: 1,
      resultPage: 1,
      filePageSize: 25,
      resultPageSize: 25,
      ...(savedState && savedState.dashboard ? savedState.dashboard : {})
    };
    const els = {
      workspace: document.getElementById('workspace'), status: document.getElementById('status'),
      filesMetric: document.getElementById('filesMetric'), nodesMetric: document.getElementById('nodesMetric'), edgesMetric: document.getElementById('edgesMetric'),
      results: document.getElementById('results'), files: document.getElementById('files'), query: document.getElementById('query'),
      modeFilter: document.getElementById('modeFilter'), kindFilter: document.getElementById('kindFilter'), detailMode: document.getElementById('detailMode'),
      limitInput: document.getElementById('limitInput'), depthInput: document.getElementById('depthInput'), commandPreview: document.getElementById('commandPreview'),
      fileFilter: document.getElementById('fileFilter'), filePattern: document.getElementById('filePattern'),
      searchError: document.getElementById('searchError'), fileError: document.getElementById('fileError'), context: document.getElementById('context'),
      filesCount: document.getElementById('filesCount'), filesPage: document.getElementById('filesPage'), filesPrev: document.getElementById('filesPrev'),
      filesNext: document.getElementById('filesNext'), filesNumbers: document.getElementById('filesNumbers'), filesJump: document.getElementById('filesJump'),
      filesPageSize: document.getElementById('filesPageSize'), resultsCount: document.getElementById('resultsCount'), resultsPage: document.getElementById('resultsPage'),
      resultsPrev: document.getElementById('resultsPrev'), resultsNext: document.getElementById('resultsNext'), resultsNumbers: document.getElementById('resultsNumbers'),
      resultsPageSize: document.getElementById('resultsPageSize'), openGraph: document.getElementById('openGraph'),
      selectionPanel: document.getElementById('selectionPanel'), selectionCount: document.getElementById('selectionCount'),
      selectVisibleResults: document.getElementById('selectVisibleResults'), copySelectedLocations: document.getElementById('copySelectedLocations'),
      copyAgentPrompt: document.getElementById('copyAgentPrompt'), agentQuestion: document.getElementById('agentQuestion')
    };
    document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
    document.getElementById('searchForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const query = els.query.value.trim();
      if (query) {
        const requestId = ++state.searchRequestId;
        setSearchLoading(query);
        vscode.postMessage(searchPayload(query, requestId));
      }
    });
    [els.query, els.modeFilter, els.kindFilter, els.limitInput, els.depthInput].forEach((element) => {
      element.addEventListener('input', () => { renderCommandPreview(); persistDashboardState(); });
      element.addEventListener('change', () => { renderCommandPreview(); persistDashboardState(); });
    });
    els.modeFilter.addEventListener('change', syncSearchControls);
    els.fileFilter.addEventListener('change', () => { state.filePage = 1; loadFilesFromCodegraph(); });
    els.filePattern.addEventListener('change', () => { state.filePage = 1; loadFilesFromCodegraph(); });
    els.filesPrev.addEventListener('click', () => { state.filePage = Math.max(1, state.filePage - 1); renderFiles(); });
    els.filesNext.addEventListener('click', () => { state.filePage += 1; renderFiles(); });
    els.resultsPrev.addEventListener('click', () => { state.resultPage = Math.max(1, state.resultPage - 1); renderResults('last'); });
    els.resultsNext.addEventListener('click', () => { state.resultPage += 1; renderResults('first'); });
    els.filesJump.addEventListener('change', () => { state.filePage = Number(els.filesJump.value) || 1; renderFiles(); });
    els.filesPageSize.addEventListener('change', () => { state.filePageSize = Number(els.filesPageSize.value); state.filePage = 1; renderFiles(); });
    els.resultsPageSize.addEventListener('change', () => { state.resultPageSize = Number(els.resultsPageSize.value); state.resultPage = 1; renderResults('first'); });
    els.openGraph.addEventListener('click', () => vscode.postMessage(graphPayload()));
    els.selectVisibleResults.addEventListener('click', toggleVisibleResultSelection);
    els.copySelectedLocations.addEventListener('click', () => copySelectedResults('locations'));
    els.copyAgentPrompt.addEventListener('click', () => copySelectedResults('prompt'));
    els.agentQuestion.addEventListener('input', persistDashboardState);
    document.addEventListener('click', (event) => {
      const actionButton = event.target && event.target.closest ? event.target.closest('[data-dashboard-action]') : null;
      if (!actionButton) { return; }
      const action = actionButton.dataset.dashboardAction || '';
      if (action === 'sample-search') {
        els.query.value = actionButton.dataset.query || 'Codegraph';
        renderCommandPreview();
        const requestId = ++state.searchRequestId;
        setSearchLoading(els.query.value.trim());
        vscode.postMessage(searchPayload(els.query.value.trim(), requestId));
      }
      if (action === 'file-graph') {
        vscode.postMessage({ type: 'openGraph', source: 'files', query: els.fileFilter.value.trim(), pattern: els.filePattern.value.trim(), limit: Number(els.limitInput.value) || 80 });
      }
      if (action === 'load-files') {
        state.filePage = 1;
        loadFilesFromCodegraph();
        activateTab('files');
      }
    });
    restoreDashboardInputs();
    persistDashboardState();
    els.query.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && focusSelectedResult()) {
        event.preventDefault();
      }
    });
    window.addEventListener('keydown', handleDashboardShortcut);
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'state') {
        state = { ...state, ...message };
        resetRelationshipSummariesIfContextChanged();
        renderState();
        persistDashboardState();
      }
      if (message.type === 'loading') { handleLoadingMessage(message); }
      if (message.type === 'searchResults') {
        if (message.requestId && message.requestId !== state.searchRequestId) { return; }
        state.searchLoading = false;
        state.results = message.results || [];
        state.selectedResultKeys = {};
        state.resultPage = 1;
        setError(els.searchError, message.error);
        activateTab('search');
        renderResults();
        persistDashboardState();
      }
      if (message.type === 'filesResults') {
        if (message.requestId && message.requestId !== state.filesRequestId) { return; }
        state.filesLoading = false;
        state.files = message.files || [];
        state.filePage = 1;
        setError(els.fileError, message.error);
        renderFiles();
        persistDashboardState();
      }
      if (message.type === 'relatedResults') {
        if (message.requestId && message.requestId !== state.relatedRequestId) { return; }
        state.relatedLoading = false;
        state.related = message.results || [];
        state.relatedMode = message.mode;
        state.relatedSymbol = message.symbol;
        state.relatedError = message.error;
        activateTab('context');
        renderContext();
        persistDashboardState();
      }
      if (message.type === 'relationshipSummary') {
        const cacheKey = message.cacheKey || message.symbol;
        state.relationshipSummaries[cacheKey] = message;
        updateRowRelationshipBadges(cacheKey);
        if (state.selectedResult && relationshipKey(state.selectedResult) === cacheKey) { renderSelection(); }
        persistDashboardState();
      }
      if (message.type === 'error') { setError(els.searchError, message.message); }
    });
    function renderState() {
      els.workspace.textContent = state.workspaceName ? state.workspaceName + ' | ' + state.workspacePath : 'No Codegraph workspace';
      els.status.textContent = state.active ? 'Active' : 'Unavailable';
      els.filesMetric.textContent = formatNumber(state.status && state.status.fileCount);
      els.nodesMetric.textContent = formatNumber(state.status && state.status.nodeCount);
      els.edgesMetric.textContent = formatNumber(state.status && state.status.edgeCount);
      setError(els.fileError, state.error); renderFiles(); renderResults(); renderContext(); renderCommandPreview(); syncSearchControls();
      if (state.activeTab) { activateTab(state.activeTab); }
    }
    function activateTab(name) {
      document.querySelectorAll('.tab[data-tab]').forEach((tab) => {
        const active = tab.dataset.tab === name;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === 'tab-' + name));
      state.activeTab = name;
      persistDashboardState();
    }
    function loadFilesFromCodegraph() {
      const requestId = ++state.filesRequestId;
      state.filesLoading = true;
      renderFiles();
      vscode.postMessage({ type: 'loadFiles', filter: els.fileFilter.value.trim(), pattern: els.filePattern.value.trim(), requestId });
    }
    function searchPayload(query, requestId) {
      return { type: 'search', query, mode: els.modeFilter.value, kind: els.modeFilter.value === 'symbols' ? els.kindFilter.value : '', limit: Number(els.limitInput.value) || 20, depth: Number(els.depthInput.value) || 2, requestId };
    }
    function graphPayload() {
      const query = els.query.value.trim();
      if (query) {
        return { ...searchPayload(query), type: 'openGraph', source: 'search' };
      }
      return { type: 'openGraph', source: 'files', query: els.fileFilter.value.trim(), pattern: els.filePattern.value.trim(), limit: Number(els.limitInput.value) || 80 };
    }
    function renderCommandPreview() {
      syncSearchControls();
      const query = els.query.value.trim() || '<query>';
      const mode = els.modeFilter.value;
      const limit = Number(els.limitInput.value) || 20;
      const depth = Number(els.depthInput.value) || 2;
      const kind = els.kindFilter.value;
      const command = mode === 'symbols'
        ? ['codegraph', 'query', '--json', '--path', '<workspace>', '--limit', limit, kind ? '--kind ' + kind : '', query].filter(Boolean).join(' ')
        : mode === 'text'
          ? ['Codegraph indexed text search', '--workspace', '<workspace>', '--limit', limit, query].join(' ')
          : mode === 'files'
            ? ['codegraph', 'files', '--json', '--path', '<workspace>', '--format', 'flat', '--filter', query, '--limit', limit].join(' ')
        : mode === 'impact'
          ? ['codegraph', 'impact', '--json', '--path', '<workspace>', '--depth', depth, query].join(' ')
          : ['codegraph', mode, '--json', '--path', '<workspace>', '--limit', limit, query].join(' ');
      els.commandPreview.textContent = command;
    }
    function syncSearchControls() {
      const mode = els.modeFilter.value;
      const placeholders = {
        symbols: 'Search symbols...',
        text: 'Search text in indexed files...',
        files: 'Search file names or paths...',
        callers: 'Find callers for symbol...',
        callees: 'Find callees for symbol...',
        impact: 'Find impact for symbol...'
      };
      els.query.placeholder = placeholders[mode] || 'Search Codegraph...';
      els.kindFilter.disabled = mode !== 'symbols';
      els.kindFilter.title = mode === 'symbols' ? 'Filter symbol kind' : 'Kind filter only applies to Symbols';
      els.depthInput.disabled = mode !== 'impact';
      els.depthInput.title = mode === 'impact' ? 'Impact depth' : 'Depth only applies to Impact';
    }
    function renderFiles() {
      const files = state.files || [];
      const page = paginate(files, state.filePage, state.filePageSize);
      state.filePage = page.page; els.filesCount.textContent = (state.filesLoading ? 'Loading... | ' : '') + files.length.toLocaleString() + ' files'; els.filesPage.textContent = page.page + ' / ' + page.totalPages;
      els.filesJump.max = String(page.totalPages); els.filesJump.value = String(page.page); els.filesPrev.disabled = page.page <= 1; els.filesNext.disabled = page.page >= page.totalPages;
      renderPageNumbers(els.filesNumbers, page.page, page.totalPages, (nextPage) => { state.filePage = nextPage; renderFiles(); });
      if (files.length === 0) {
        els.files.innerHTML = state.filesLoading
          ? '<div class="empty"><strong>Loading indexed files...</strong><p>Reading Codegraph file metadata for this workspace.</p></div>'
          : '<div class="empty"><strong>No indexed files match this filter.</strong><p>Clear the directory or pattern filter, or open the full file graph to inspect the current index.</p><div class="empty-actions"><button class="ghost" type="button" data-dashboard-action="file-graph">Open file structure graph</button></div></div>';
        return;
      }
      els.files.innerHTML = page.items.map((file, index) => rowHtml({ title: file.path, detail: [file.language, typeof file.symbols === 'number' ? file.symbols + ' symbols' : undefined].filter(Boolean).join(' | '), badge: file.language || 'file', action: 'openFile', index, preview: true })).join('');
      wireRows(els.files, page.items, 'openFile');
      persistDashboardState();
    }
    function renderResults(selectionHint) {
      const results = state.results || [];
      const page = paginate(results, state.resultPage, state.resultPageSize);
      state.visibleResults = page.items;
      state.resultPage = page.page; els.resultsCount.textContent = (state.searchLoading ? 'Searching... | ' : '') + results.length.toLocaleString() + ' results'; els.resultsPage.textContent = page.page + ' / ' + page.totalPages;
      els.resultsPrev.disabled = page.page <= 1; els.resultsNext.disabled = page.page >= page.totalPages;
      renderPageNumbers(els.resultsNumbers, page.page, page.totalPages, (nextPage) => {
        const hint = nextPage < state.resultPage ? 'last' : 'first';
        state.resultPage = nextPage;
        renderResults(hint);
      });
      if (!state.results || state.results.length === 0) {
        state.visibleResults = [];
        els.results.innerHTML = state.searchLoading
          ? '<div class="empty"><strong>Searching Codegraph...</strong><p>Matches will appear with exact file, line, and relationship actions.</p></div>'
          : '<div class="empty"><strong>Search, inspect, hand off.</strong><p>Find a symbol, inspect callers/callees/impact, then open the exact location or copy an agent-ready prompt.</p><div class="empty-actions"><button class="ghost" type="button" data-dashboard-action="sample-search" data-query="extension">Try search: extension</button><button class="ghost" type="button" data-dashboard-action="load-files">Browse indexed files</button><button class="ghost" type="button" data-dashboard-action="file-graph">Open file graph</button></div></div>';
        renderSelection();
        renderCopyControls();
        return;
      }
      els.results.innerHTML = page.items.map((result, index) => rowHtml({ title: result.name, detail: [result.file + (result.line ? ':' + result.line : ''), result.signature || result.detail].filter(Boolean).join(' | '), relations: relationshipBadgesHtml(result), relationKey: supportsRelationships(result) ? relationshipKey(result) : '', badge: result.kind || 'symbol', action: 'openResult', index, symbol: result.name, actions: true, preview: true, selectable: true, checked: isResultSelected(result) })).join('');
      wireRows(els.results, page.items, 'openResult');
      ensureVisibleResultSelection(page.items, selectionHint);
      renderSelection();
      const selectedIndex = page.items.indexOf(state.selectedResult);
      if (selectedIndex >= 0) {
        const selectedRow = els.results.querySelector('[data-index="' + selectedIndex + '"]');
        if (selectedRow) {
          selectedRow.classList.add('selected');
          selectedRow.setAttribute('aria-selected', 'true');
        }
      }
      renderCopyControls();
      persistDashboardState();
    }
    function rowHtml(item) {
      const role = item.action === 'openResult' ? 'option' : 'button';
      const selected = role === 'option' ? ' aria-selected="false"' : '';
      return '<div class="row" role="' + role + '"' + selected + ' tabindex="0" data-action="' + item.action + '" data-index="' + item.index + '">' +
        selectionCheckboxHtml(item) +
        '<div><div class="row-title">' + escapeHtml(item.title) + '</div><div class="row-detail">' + escapeHtml(item.detail || '') + '</div>' + relationshipRowHtml(item) + '</div>' +
        '<div class="row-side"><div class="badge">' + escapeHtml(item.badge) + '</div>' + actionButtons(item) + previewButton(item) + '</div>' +
        '<div class="inline-detail" hidden></div></div>';
    }
    function selectionCheckboxHtml(item) {
      return item.selectable ? '<label class="result-check" title="Select for copy"><input type="checkbox" data-select-result="true"' + (item.checked ? ' checked' : '') + '><span>Select</span></label>' : '';
    }
    function relationshipRowHtml(item) {
      return item.relationKey ? '<div class="row-relations" data-relation-key="' + escapeHtml(item.relationKey) + '">' + item.relations + '</div>' : '';
    }
    function previewButton(item) { return item.preview ? '<button class="ghost" type="button" data-preview="true">Details</button>' : ''; }
    function actionButtons(item) {
      if (!item.actions) { return ''; }
      return '<div class="row-actions" data-symbol="' + escapeHtml(item.symbol) + '">' +
        '<button class="ghost" type="button" data-open="true">Open</button><button class="ghost" type="button" data-graph="true">Graph</button></div>';
    }
    function wireRows(container, items, action) {
      container.querySelectorAll('.row').forEach((row) => {
        const item = () => items[Number(row.dataset.index)];
        const inspect = () => {
          if (action === 'openResult') {
            selectResultRow(container, row, item());
          }
        };
        const send = () => {
          inspect();
          if (action !== 'openResult') {
            vscode.postMessage({ type: action, item: item() });
          }
        };
        row.addEventListener('mouseenter', inspect);
        row.addEventListener('focus', inspect);
        row.addEventListener('click', (event) => {
          if (event.target && event.target.closest && event.target.closest('[data-select-result]')) { return; }
          send();
        });
        if (action === 'openResult') {
          row.addEventListener('dblclick', () => vscode.postMessage({ type: action, item: item() }));
        }
        row.addEventListener('keydown', (event) => {
          if (isInteractiveTarget(event.target) && event.target !== row) { return; }
          if (action === 'openResult') {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              focusSiblingResultRow(container, row, event.key === 'ArrowDown' ? 1 : -1);
              return;
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              selectResultRow(container, row, item());
              vscode.postMessage({ type: action, item: item() });
            }
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); send(); }
        });
      });
      container.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', (event) => {
        event.stopPropagation();
        const row = button.closest('.row');
        const item = items[Number(row.dataset.index)];
        selectResultRow(container, row, item);
        vscode.postMessage({ type: action, item });
      }));
      container.querySelectorAll('[data-graph]').forEach((button) => button.addEventListener('click', (event) => {
        event.stopPropagation();
        const row = button.closest('.row');
        const item = items[Number(row.dataset.index)];
        selectResultRow(container, row, item);
        openGraphForResult(item);
      }));
      container.querySelectorAll('[data-preview]').forEach((button) => button.addEventListener('click', (event) => {
        event.stopPropagation();
        const row = button.closest('.row');
        showInlineDetail(row, items[Number(row.dataset.index)], action);
      }));
      container.querySelectorAll('[data-select-result]').forEach((checkbox) => checkbox.addEventListener('click', (event) => {
        event.stopPropagation();
      }));
      container.querySelectorAll('[data-select-result]').forEach((checkbox) => checkbox.addEventListener('change', () => {
        const row = checkbox.closest('.row');
        const item = items[Number(row.dataset.index)];
        setResultSelected(item, checkbox.checked);
        selectResultRow(container, row, item);
        renderCopyControls();
        persistDashboardState();
      }));
    }
    function selectResultRow(container, row, item) {
      state.selectedResult = item;
      state.selectedResultKey = relationshipKey(item);
      container.querySelectorAll('.row.selected').forEach((element) => element.classList.remove('selected'));
      container.querySelectorAll('.row[aria-selected="true"]').forEach((element) => element.setAttribute('aria-selected', 'false'));
      row.classList.add('selected');
      row.setAttribute('aria-selected', 'true');
      renderSelection();
      persistDashboardState();
    }
    function ensureVisibleResultSelection(items, hint) {
      if (!items.length) { state.selectedResult = undefined; state.selectedResultKey = undefined; return; }
      const selectedKey = state.selectedResultKey || (state.selectedResult && relationshipKey(state.selectedResult));
      const matchingItem = selectedKey ? items.find((item) => relationshipKey(item) === selectedKey) : undefined;
      if (matchingItem) { state.selectedResult = matchingItem; state.selectedResultKey = selectedKey; return; }
      if (state.selectedResult && items.includes(state.selectedResult)) { state.selectedResultKey = relationshipKey(state.selectedResult); return; }
      state.selectedResult = hint === 'last' ? items[items.length - 1] : items[0];
      state.selectedResultKey = relationshipKey(state.selectedResult);
    }
    function focusSiblingResultRow(container, row, delta) {
      const rows = [...container.querySelectorAll('.row[data-action="openResult"]')];
      const index = rows.indexOf(row);
      const nextIndex = index + delta;
      if (nextIndex >= rows.length && state.resultPage < Math.ceil((state.results || []).length / state.resultPageSize)) {
        state.resultPage += 1;
        renderResults('first');
        focusSelectedResult();
        return;
      }
      if (nextIndex < 0 && state.resultPage > 1) {
        state.resultPage -= 1;
        renderResults('last');
        focusSelectedResult();
        return;
      }
      const next = rows[Math.min(Math.max(nextIndex, 0), rows.length - 1)];
      if (next) {
        next.focus();
        next.scrollIntoView({ block: 'nearest' });
      }
    }
    function focusSelectedResult() {
      const row = els.results.querySelector('.row.selected') || els.results.querySelector('.row[data-action="openResult"]');
      if (!row) { return false; }
      row.focus();
      row.scrollIntoView({ block: 'nearest' });
      return true;
    }
    function handleDashboardShortcut(event) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) { return; }
      const key = event.key.toLowerCase();
      if (key === 'enter' && openSelectedResult()) {
        event.preventDefault();
        return;
      }
      if (key === 'g' && graphSelectedResult()) {
        event.preventDefault();
      }
    }
    function selectedResultItem() {
      if (state.selectedResult) { return state.selectedResult; }
      const row = els.results.querySelector('.row[data-action="openResult"]');
      return row ? (state.visibleResults || [])[Number(row.dataset.index)] : undefined;
    }
    function openSelectedResult() {
      const item = selectedResultItem();
      if (!item) { return false; }
      vscode.postMessage({ type: 'openResult', item });
      return true;
    }
    function graphSelectedResult() {
      const item = selectedResultItem();
      if (!item) { return false; }
      openGraphForResult(item);
      return true;
    }
    function selectedResultItems() {
      const keys = state.selectedResultKeys || {};
      const selected = (state.results || []).filter((item) => keys[relationshipKey(item)]);
      if (selected.length) { return selected; }
      const fallback = selectedResultItem();
      return fallback ? [fallback] : [];
    }
    function isResultSelected(item) {
      return Boolean(item && state.selectedResultKeys && state.selectedResultKeys[relationshipKey(item)]);
    }
    function setResultSelected(item, selected) {
      if (!item) { return; }
      state.selectedResultKeys = state.selectedResultKeys || {};
      const key = relationshipKey(item);
      if (selected) {
        state.selectedResultKeys[key] = true;
      } else {
        delete state.selectedResultKeys[key];
      }
    }
    function toggleVisibleResultSelection() {
      const visible = state.visibleResults || [];
      if (!visible.length) { return; }
      const allSelected = visible.every((item) => isResultSelected(item));
      visible.forEach((item) => setResultSelected(item, !allSelected));
      renderResults();
    }
    function renderCopyControls() {
      const selectedCount = selectedResultItems().length;
      const visible = state.visibleResults || [];
      const allVisibleSelected = visible.length > 0 && visible.every((item) => isResultSelected(item));
      els.selectionCount.textContent = selectedCount.toLocaleString() + ' selected';
      els.copySelectedLocations.disabled = selectedCount === 0;
      els.copyAgentPrompt.disabled = selectedCount === 0;
      els.selectVisibleResults.disabled = visible.length === 0;
      els.selectVisibleResults.textContent = allVisibleSelected ? 'Clear Page' : 'Select Page';
    }
    function copySelectedResults(kind) {
      const items = selectedResultItems();
      if (!items.length) { return; }
      const text = kind === 'prompt' ? agentPromptText(items) : items.map(locationCopyLine).join('\\n');
      vscode.postMessage({ type: 'copyText', text, label: kind === 'prompt' ? 'agent prompt' : items.length + ' Codegraph location' + (items.length === 1 ? '' : 's') });
    }
    function locationCopyLine(item) {
      const location = absoluteLocation(item);
      const label = [item.kind, item.name].filter(Boolean).join(' ');
      return [location, label].filter(Boolean).join(' | ');
    }
    function agentPromptText(items) {
      const question = els.agentQuestion.value.trim() || els.query.value.trim() || '<write your question here>';
      return [
        'You are helping navigate a Codegraph-indexed codebase.',
        '',
        'Question:',
        question,
        '',
        'Before answering, judge whether this question is structurally appropriate for the codebase context below. If it is too broad, ambiguous, or points at the wrong part of the structure, explain that briefly and rewrite it into a better Codegraph-oriented question. Then use the locations below as the first places to inspect.',
        '',
        'Codegraph search context:',
        ...items.map((item, index) => String(index + 1) + '. ' + locationCopyLine(item))
      ].join('\\n');
    }
    function absoluteLocation(item) {
      const file = String(item.file || item.path || '');
      const line = item.line ? ':' + item.line : '';
      const column = item.column ? ':' + item.column : '';
      if (!state.workspacePath || /^[a-zA-Z]:[\\\\/]/.test(file) || file.startsWith('/')) {
        return file + line + column;
      }
      const separator = state.workspacePath.includes('\\\\') ? '\\\\' : '/';
      return state.workspacePath.replace(/[\\\\/]+$/, '') + separator + file.replace(/^[\\\\/]+/, '') + line + column;
    }
    function isInteractiveTarget(target) {
      const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      return tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || Boolean(target && target.isContentEditable);
    }
    function showInlineDetail(row, item, action) {
      const panel = row.querySelector('.inline-detail');
      if (!panel || !panel.hidden) { if (panel) { panel.hidden = true; row.classList.remove('expanded'); } return; }
      const detail = action === 'openFile' ? [item.language, typeof item.symbols === 'number' ? item.symbols + ' symbols' : undefined].filter(Boolean).join(' | ') : [item.file + (item.line ? ':' + item.line : ''), item.signature || item.detail].filter(Boolean).join(' | ');
      const badge = item.kind || item.language || (action === 'openFile' ? 'file' : 'symbol');
      const title = item.name || item.path;
      const command = action === 'openFile' ? 'Open file: ' + item.path : 'Open result: ' + item.file + (item.line ? ':' + item.line : '');
      row.parentElement.querySelectorAll('.inline-detail').forEach((item) => { item.hidden = true; });
      row.parentElement.querySelectorAll('.row.expanded').forEach((item) => item.classList.remove('expanded'));
      panel.hidden = false;
      row.classList.add('expanded');
      panel.innerHTML = '<div class="detail-grid"><div><span>Action</span><strong>' + escapeHtml(command) + '</strong></div><div><span>Kind</span><strong>' + escapeHtml(badge) + '</strong></div><div><span>Name</span><strong>' + escapeHtml(title) + '</strong></div><div><span>Location</span><strong>' + escapeHtml(detail || '-') + '</strong></div></div>' +
        (els.detailMode.value === 'detail' ? '<pre>' + escapeHtml(JSON.stringify(item, null, 2)) + '</pre>' : '');
    }
    function renderSelection() {
      const item = state.selectedResult;
      if (!item) {
        els.selectionPanel.innerHTML = '<div class="index-note">' + escapeHtml(indexSummary()) + '</div><div class="empty">Run a search, then select a result to inspect it without leaving the dashboard.</div>';
        return;
      }
      const location = item.file + (item.line ? ':' + item.line : '');
      const detail = item.signature || item.detail || 'No signature returned.';
      const canInspectRelationships = supportsRelationships(item);
      const summary = canInspectRelationships ? relationshipSummaryFor(item) : undefined;
      els.selectionPanel.innerHTML = '<div class="index-note">' + escapeHtml(indexSummary()) + '</div><div class="inspector-head"><div><span>' + escapeHtml(item.kind || 'symbol') + '</span><strong>' + escapeHtml(item.name || location) + '</strong></div><div class="badge">' + escapeHtml(item.kind || 'symbol') + '</div></div>' +
        '<div class="inspector-location">' + escapeHtml(location) + '</div>' +
        '<div class="inspector-detail">' + escapeHtml(detail) + '</div>' +
        relationshipSummaryHtml(item, summary) +
        '<div class="inspector-actions"><button class="ghost primary-action" id="inspectOpen" type="button">Open</button><button class="ghost" id="inspectGraph" type="button">Graph</button>' + (canInspectRelationships ? '<button class="ghost" id="inspectCallers" type="button">' + escapeHtml(relationshipActionLabel('List callers', summary && summary.callers)) + '</button><button class="ghost" id="inspectCallees" type="button">' + escapeHtml(relationshipActionLabel('List callees', summary && summary.callees)) + '</button><button class="ghost" id="inspectImpact" type="button">' + escapeHtml(relationshipActionLabel('List impact', summary && summary.impact)) + '</button>' : '') + '</div>';
      document.getElementById('inspectOpen').addEventListener('click', () => vscode.postMessage({ type: 'openResult', item }));
      document.getElementById('inspectGraph').addEventListener('click', () => openGraphForResult(item));
      if (canInspectRelationships) {
        document.getElementById('inspectCallers').addEventListener('click', () => loadRelatedFromInspector('callers', item));
        document.getElementById('inspectCallees').addEventListener('click', () => loadRelatedFromInspector('callees', item));
        document.getElementById('inspectImpact').addEventListener('click', () => loadRelatedFromInspector('impact', item));
      }
      els.selectionPanel.querySelectorAll('[data-graph-mode]').forEach((button) => {
        button.addEventListener('click', () => openGraphForResult(item, button.dataset.graphMode));
      });
      if (canInspectRelationships) { requestRelationshipSummary(item); }
    }
    function relationshipSummaryFor(item) {
      return item ? state.relationshipSummaries[relationshipKey(item)] : undefined;
    }
    function resetRelationshipSummariesIfContextChanged() {
      const context = relationshipSummaryFreshnessKey();
      if (state.relationshipSummaryContext !== context) {
        state.relationshipSummaries = {};
        state.relationshipSummaryContext = context;
      }
    }
    function relationshipSummaryFreshnessKey() {
      const status = state.status || {};
      return [
        state.workspacePath || '',
        state.codegraphPath || '',
        status.fileCount || 0,
        status.nodeCount || 0,
        status.edgeCount || 0
      ].join('|');
    }
    function requestRelationshipSummary(item) {
      if (!supportsRelationships(item) || !item.name || state.relationshipSummaries[relationshipKey(item)]) { return; }
      clearTimeout(state.relationshipTimer);
      state.relationshipTimer = setTimeout(() => {
        if (state.selectedResult && relationshipKey(state.selectedResult) === relationshipKey(item)) {
          postRelationshipSummaryRequest(item);
        }
      }, 240);
    }
    function postRelationshipSummaryRequest(item) {
      const cacheKey = relationshipKey(item);
      if (!item || !item.name || state.relationshipSummaries[cacheKey]) { return; }
      state.relationshipSummaries[cacheKey] = { loading: true };
      updateRowRelationshipBadges(cacheKey);
      vscode.postMessage({ type: 'relationshipSummary', symbol: item.name, cacheKey, limit: 5, depth: Number(els.depthInput.value) || 2 });
    }
    function relationshipKey(item) {
      const path = String(item.file || item.path || '').replace(/\\\\/g, '/').toLowerCase();
      return [path, item.line || '', item.column || '', item.kind || '', item.name || ''].join('|');
    }
    function relationshipSummaryHtml(item, summary) {
      if (!supportsRelationships(item) || !item.name) { return ''; }
      if (!summary || summary.loading) {
        return '<div class="relationship-summary"><div class="relationship-title">Graph previews</div><div class="relationship-loading">Previewing callers, callees, and impact...</div></div>';
      }
      return '<div class="relationship-summary"><div class="relationship-title">Graph previews</div><div class="relationship-grid">' +
        relationshipGroupHtml('Callers', 'callers', summary.callers) +
        relationshipGroupHtml('Callees', 'callees', summary.callees) +
        relationshipGroupHtml('Impact', 'impact', summary.impact) +
        '</div></div>';
    }
    function relationshipGroupHtml(label, mode, group) {
      const count = group ? relationshipCountLabel(group) : '-';
      const items = group && group.items ? group.items.slice(0, 2) : [];
      const preview = group && group.error
        ? '<span class="relationship-error">' + escapeHtml(group.error) + '</span>'
        : items.length
          ? items.map((item) => {
            const label = item.name || item.file || '';
            return '<span title="' + escapeHtml(label) + '">' + escapeHtml(label) + '</span>';
          }).join('')
          : '<span class="muted">No matches</span>';
      return '<button class="relationship-group" type="button" data-graph-mode="' + escapeHtml(mode) + '" title="Open ' + escapeHtml(label.toLowerCase()) + ' graph"><div><strong>' + escapeHtml(count) + '</strong><span>' + escapeHtml(label) + '</span></div><p>' + preview + '</p><span class="graph-cue">Graph</span></button>';
    }
    function relationshipActionLabel(label, group) {
      return group ? label + ' ' + relationshipCountLabel(group) : label;
    }
    function relationshipCountLabel(group) {
      return String(group.count || 0) + (group.hasMore ? '+' : '');
    }
    function relationshipBadgesHtml(item) {
      if (!supportsRelationships(item)) { return ''; }
      const summary = relationshipSummaryFor(item);
      if (!summary || summary.loading) { return ''; }
      return [
        ['Callers', summary.callers],
        ['Callees', summary.callees],
        ['Impact', summary.impact]
      ].map((entry) => '<span>' + escapeHtml(entry[0] + ' ' + relationshipCountLabel(entry[1])) + '</span>').join('');
    }
    function updateRowRelationshipBadges(cacheKey) {
      els.results.querySelectorAll('[data-relation-key="' + cssEscape(cacheKey) + '"]').forEach((element) => {
        const item = (state.results || []).find((result) => relationshipKey(result) === cacheKey);
        element.innerHTML = item ? relationshipBadgesHtml(item) : '';
      });
    }
    function openGraphForResult(item, mode) {
      const graphMode = mode || searchModeForResult(item);
      const query = graphMode === 'text' ? (els.query.value.trim() || (item && item.name) || '') : (item && (item.kind === 'file' ? item.file : item.name || item.file)) || els.query.value.trim();
      const seedKey = item ? relationshipKey(item) : query;
      vscode.postMessage({ type: 'openGraph', source: 'search', seedKey, query, mode: graphMode, kind: graphMode === 'symbols' && item && item.kind || '', limit: Number(els.limitInput.value) || 80, depth: Number(els.depthInput.value) || 2 });
    }
    function loadRelatedFromInspector(mode, item) {
      const symbol = item.name || els.query.value.trim();
      const requestId = ++state.relatedRequestId;
      state.relatedLoading = true;
      els.context.innerHTML = '<div class="empty">Loading ' + escapeHtml(mode) + ' for "' + escapeHtml(symbol) + '"...</div>';
      activateTab('context');
      vscode.postMessage({ type: 'related', mode, symbol, requestId });
    }
    function indexSummary() {
      const status = state.status || {};
      return [
        state.active ? 'Index active' : 'Index unavailable',
        formatNumber(status.fileCount) + ' files',
        formatNumber(status.nodeCount) + ' nodes',
        formatNumber(status.edgeCount) + ' edges'
      ].join(' | ');
    }
    function renderContext() {
      if (state.relatedError) { els.context.innerHTML = '<div class="error">' + escapeHtml(state.relatedError) + '</div>'; return; }
      if (!state.relatedMode || !state.relatedSymbol) {
        renderContextEmptyState();
        return;
      }
      const related = state.related || [];
      const title = state.relatedMode.charAt(0).toUpperCase() + state.relatedMode.slice(1) + ' | ' + state.relatedSymbol;
      if (related.length === 0) { els.context.innerHTML = '<div class="context-head"><div class="context-title">' + escapeHtml(title) + '</div><div class="context-note">0 matches</div></div><div class="context-empty"><strong>No related entries returned.</strong><p>Codegraph did not return matches for this relationship mode. Try another mode, broaden the symbol query, or open the graph to inspect nearby file and symbol structure.</p>' + contextActionButtonsHtml(selectedResultItem()) + '</div>'; wireContextActions(selectedResultItem()); return; }
      els.context.innerHTML = '<div class="context-head"><div class="context-title">' + escapeHtml(title) + '</div><div class="context-note">' + related.length.toLocaleString() + ' matches</div></div>' +
        related.map((item, index) => rowHtml({ title: item.name, detail: item.file + (item.line ? ':' + item.line : ''), badge: item.kind || 'related', action: 'openRelated', index, preview: true })).join('');
      wireRows(els.context, related, 'openRelated');
    }
    function renderContextEmptyState() {
      const item = selectedResultItem();
      const location = item ? item.file + (item.line ? ':' + item.line : '') : '';
      els.context.innerHTML = '<div class="context-intro"><div><span>What Context Is For</span><strong>Relationship lookup for a selected Codegraph result</strong><p>Use this tab when you want to see what calls a symbol, what it calls, or what may be affected by changing it. It stays empty until you run one of those relationship lookups.</p></div>' +
        '<div><span>How To Use It</span><strong>' + escapeHtml(item ? item.name : 'Select a search result first') + '</strong><p>' + escapeHtml(item ? location : 'Search in the Search tab, choose a result, then come back here or use the buttons in the inspector.') + '</p></div></div>' +
        contextActionButtonsHtml(item);
      wireContextActions(item);
    }
    function contextActionButtonsHtml(item) {
      const disabled = supportsRelationships(item) ? '' : ' disabled';
      return '<div class="context-actions"><button class="ghost" type="button" data-context-mode="callers"' + disabled + '>Callers</button><button class="ghost" type="button" data-context-mode="callees"' + disabled + '>Callees</button><button class="ghost" type="button" data-context-mode="impact"' + disabled + '>Impact</button></div>';
    }
    function wireContextActions(item) {
      els.context.querySelectorAll('[data-context-mode]').forEach((button) => {
        button.addEventListener('click', () => {
          if (!item) { return; }
          loadRelatedFromInspector(button.dataset.contextMode, item);
        });
      });
    }
    function supportsRelationships(item) {
      return Boolean(item && item.kind !== 'file' && item.kind !== 'text');
    }
    function searchModeForResult(item) {
      if (item && item.kind === 'file') { return 'files'; }
      if (item && item.kind === 'text') { return 'text'; }
      return 'symbols';
    }
    function restoreDashboardInputs() {
      const inputs = state.inputs || {};
      if (typeof inputs.query === 'string') { els.query.value = inputs.query; }
      if (typeof inputs.mode === 'string') { els.modeFilter.value = inputs.mode; }
      if (typeof inputs.kind === 'string') { els.kindFilter.value = inputs.kind; }
      if (typeof inputs.detailMode === 'string') { els.detailMode.value = inputs.detailMode; }
      if (typeof inputs.limit === 'string') { els.limitInput.value = inputs.limit; }
      if (typeof inputs.depth === 'string') { els.depthInput.value = inputs.depth; }
      if (typeof inputs.fileFilter === 'string') { els.fileFilter.value = inputs.fileFilter; }
      if (typeof inputs.filePattern === 'string') { els.filePattern.value = inputs.filePattern; }
      if (typeof inputs.agentQuestion === 'string') { els.agentQuestion.value = inputs.agentQuestion; }
      if (state.resultPageSize) { els.resultsPageSize.value = String(state.resultPageSize); }
      if (state.filePageSize) { els.filesPageSize.value = String(state.filePageSize); }
      syncSearchControls();
    }
    function persistDashboardState() {
      if (!vscode.setState) { return; }
      const selectedResultKey = state.selectedResult ? relationshipKey(state.selectedResult) : state.selectedResultKey;
      const inputs = {
        query: els.query.value,
        mode: els.modeFilter.value,
        kind: els.kindFilter.value,
        detailMode: els.detailMode.value,
        limit: els.limitInput.value,
        depth: els.depthInput.value,
        fileFilter: els.fileFilter.value,
        filePattern: els.filePattern.value,
        agentQuestion: els.agentQuestion.value
      };
      state.inputs = inputs;
      state.selectedResultKey = selectedResultKey;
      vscode.setState({
        dashboard: {
          activeTab: state.activeTab,
          inputs,
          results: state.results || [],
          related: state.related || [],
          relatedMode: state.relatedMode,
          relatedSymbol: state.relatedSymbol,
          relatedError: state.relatedError,
          relationshipSummaries: state.relationshipSummaries || {},
          relationshipSummaryContext: state.relationshipSummaryContext || '',
          selectedResult: state.selectedResult,
          selectedResultKey,
          selectedResultKeys: state.selectedResultKeys || {},
          filePage: state.filePage,
          resultPage: state.resultPage,
          filePageSize: state.filePageSize,
          resultPageSize: state.resultPageSize
        }
      });
    }
    function paginate(items, page, pageSize) {
      const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const start = (safePage - 1) * pageSize;
      return { page: safePage, totalPages, items: items.slice(start, start + pageSize) };
    }
    function renderPageNumbers(container, page, totalPages, onSelect) {
      const pages = compactPages(page, totalPages);
      container.innerHTML = pages.map((item) => item === 'gap' ? '<span>...</span>' : '<button class="ghost page-number' + (item === page ? ' active' : '') + '" type="button" data-page="' + item + '">' + item + '</button>').join('');
      container.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => onSelect(Number(button.dataset.page))));
    }
    function compactPages(page, totalPages) {
      const pages = new Set([1, totalPages, page - 1, page, page + 1]);
      const sorted = [...pages].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
      const result = [];
      for (const item of sorted) { if (result.length && item - result[result.length - 1] > 1) { result.push('gap'); } result.push(item); }
      return result;
    }
    function handleLoadingMessage(message) {
      if (message.target === 'search' && message.requestId === state.searchRequestId) {
        state.searchLoading = true;
        renderResults();
      }
      if (message.target === 'files' && message.requestId === state.filesRequestId) {
        state.filesLoading = true;
        renderFiles();
      }
      if (message.target === 'related' && message.requestId === state.relatedRequestId) {
        state.relatedLoading = true;
        els.context.innerHTML = '<div class="empty">' + escapeHtml(message.message || 'Loading Codegraph context...') + '</div>';
      }
    }
    function setSearchLoading(query) { state.searchLoading = true; setError(els.searchError, undefined); renderResults(); }
    function setError(element, message) { element.hidden = !message; element.textContent = message || ''; }
    function formatNumber(value) { return typeof value === 'number' ? value.toLocaleString() : '-'; }
    function trimLabel(value, length) { const text = String(value || ''); return text.length > length ? text.slice(0, length - 1) + '...' : text; }
    function cssEscape(value) {
      if (window.CSS && typeof window.CSS.escape === 'function') { return window.CSS.escape(String(value)); }
      return String(value).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');
    }
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }
    vscode.postMessage({ type: 'ready' });
  `;
}
