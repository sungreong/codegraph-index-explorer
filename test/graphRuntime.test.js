const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const vm = require("node:vm");
const { getCodegraphCommandCandidates, getCodegraphInvocation } = require("../out/codegraphCommand");
const { getGraphScript } = require("../out/graphScript");

function runCodegraph(args) {
  const candidates = getCodegraphCommandCandidates("codegraph");
  let lastError;
  for (const command of candidates) {
    try {
      const invocation = getCodegraphInvocation(command, args);
      return execFileSync(invocation.command, invocation.args, {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (error) {
      lastError = error;
      if (error && error.code !== "ENOENT") {
        throw error;
      }
    }
  }
  throw lastError;
}

function createElement(id, value = "") {
  return {
    id,
    value,
    textContent: "",
    innerHTML: "",
    hidden: false,
    disabled: false,
    open: false,
    dataset: {},
    options: [],
    listeners: {},
    clientWidth: 1600,
    clientHeight: 1000,
    classList: {
      values: new Set(),
      add(...names) {
        names.forEach((name) => this.values.add(name));
      },
      remove(...names) {
        names.forEach((name) => this.values.delete(name));
      },
      toggle(name, enabled) {
        if (enabled) {
          this.values.add(name);
        } else {
          this.values.delete(name);
        }
      },
    },
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    contains() {
      return false;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function createSelect(id, value, options) {
  const element = createElement(id, value);
  element.options = options.map((item) => ({ value: String(item) }));
  return element;
}

function createRuntime() {
  const posted = [];
  const networks = [];
  const messageHandlers = [];
  const elements = new Map();
  const defaults = {
    query: "",
    source: "files",
    mode: "symbols",
    kind: "",
    layout: "force",
    depthMode: "1",
    spacingMode: "1",
    labelMode: "focus",
    filePattern: "",
    limit: "80",
  };
  const selectOptions = {
    source: ["files", "search"],
    mode: ["symbols", "callers", "callees", "impact"],
    kind: ["", "function", "method", "class", "variable", "route"],
    layout: ["radial", "flow", "layered", "bundle", "columns", "force"],
    depthMode: ["0.65", "1", "1.45"],
    spacingMode: ["0.82", "1", "1.25"],
    labelMode: ["focus", "all", "minimal"],
    limit: ["20", "40", "80", "120", "200"],
  };

  const ids = [
    "workspace",
    "summary",
    "indexFreshness",
    "graphActivity",
    "refreshGraphActivity",
    "activityPanel",
    "refreshActivityPanel",
    "activityList",
    "graphModeBar",
    "graphForm",
    "toggleControls",
    "toggleDetailsTop",
    "query",
    "source",
    "mode",
    "kind",
    "layout",
    "depthMode",
    "spacingMode",
    "labelMode",
    "filePattern",
    "limit",
    "advancedControls",
    "stepLimitDown",
    "resetView",
    "fitView",
    "toggleMotion",
    "toggleOrbit",
    "toggleFocus",
    "clearFocus",
    "toggleDetails",
    "toggleHelp",
    "closeHelp",
    "toggleLegend",
    "toggleMiniMap",
    "toggleClusters",
    "exportPng",
    "exportJson",
    "copyMarkdown",
    "hoverTip",
    "graphInsight",
    "graphStats",
    "shortcutOverlay",
    "miniMap",
    "clusterOverlay",
    "graphNetwork",
    "details",
    "showLess",
    "showMore",
    "showAll",
    "openSource",
    "showFullGraph",
    "showClusterList",
    "showOnlyGroup",
    "centerNode",
    "stabilizeNode",
    "prevNeighbors",
    "nextNeighbors",
  ];

  ids.forEach((id) => {
    elements.set(
      id,
      selectOptions[id]
        ? createSelect(id, defaults[id], selectOptions[id])
        : createElement(id, defaults[id] || ""),
    );
  });

  class FakeDataSet {
    constructor(items) {
      this.items = items;
    }

    update(items) {
      this.items = items;
    }
  }

  class FakeNetwork {
    constructor(container, data, options) {
      this.container = container;
      this.data = data;
      this.options = options;
      this.handlers = {};
      this.destroyed = false;
      networks.push(this);
    }

    on(type, handler) {
      this.handlers[type] = handler;
    }

    once(type, handler) {
      this.handlers[type] = handler;
      if (type === "afterDrawing") {
        handler();
      }
    }

    destroy() {
      this.destroyed = true;
    }

    setOptions(options) {
      this.options = { ...this.options, ...options };
    }

    stabilize() {}
    stopSimulation() {}
    redraw() {}
    fit() {}
    focus() {}
    moveTo() {}
    selectNodes() {}
    unselectAll() {}

    getScale() {
      return 1;
    }

    getViewPosition() {
      return { x: 0, y: 0 };
    }

    getPositions() {
      return Object.fromEntries(this.data.nodes.items.map((node, index) => [
        node.id,
        { x: index * 10, y: index * 5 },
      ]));
    }

    canvasToDOM(point) {
      return { x: point.x + 240, y: point.y + 180 };
    }
  }

  const context = {
    console,
    Set,
    Map,
    Date,
    Math,
    Number,
    String,
    Boolean,
    RegExp,
    JSON,
    navigator: { clipboard: { writeText: async () => undefined } },
    acquireVsCodeApi: () => ({
      postMessage(message) {
        posted.push(message);
      },
    }),
    requestAnimationFrame(callback) {
      callback();
    },
    setTimeout(callback) {
      callback();
    },
    getComputedStyle: () => ({
      getPropertyValue: () => "",
    }),
    vis: {
      DataSet: FakeDataSet,
      Network: FakeNetwork,
    },
  };

  context.window = {
    matchMedia: () => ({ matches: true }),
    addEventListener(type, handler) {
      if (type === "message") {
        messageHandlers.push(handler);
      }
    },
  };
  context.document = {
    body: createElement("body"),
    addEventListener() {},
    getElementById(id) {
      const element = elements.get(id);
      assert.ok(element, `missing fake DOM element ${id}`);
      return element;
    },
    createElement() {
      return createElement("created");
    },
  };

  vm.runInNewContext(getGraphScript(), context);

  return {
    elements,
    networks,
    posted,
    send(message) {
      messageHandlers.forEach((handler) => handler({ data: message }));
    },
  };
}

const runtime = createRuntime();

assert.equal(runtime.posted[0]?.type, "ready");

runtime.send({
  type: "state",
  workspaceName: "156-mkt-msg-improve-3",
  workspacePath: "C:/Users/leesu/Documents/ProjectLOCA/loca-genai/issues/156-mkt-msg-improve-3",
});

runtime.send({
  type: "filesResults",
  files: [
    { path: "src/loca_genai/workflows/nodes/mktmsg/logic/query_router_logic.py", language: "python", symbols: 18 },
    { path: "src/loca_genai/workflows/nodes/meeting_room_assistant/utils_llm/query_router.py", language: "python", symbols: 12 },
    { path: "src/loca_genai/workflows/graphs/mktmsg/mkt_msg_graph.py", language: "python", symbols: 9 },
  ],
});

assert.equal(runtime.networks.length, 1, "filesResults should create a vis.Network graph");
assert.ok(runtime.networks[0].data.nodes.items.length >= 12, "file paths should render root, directories, and files");
assert.ok(runtime.networks[0].data.edges.items.length > 0, "file graph should render edges");
assert.match(runtime.elements.get("summary").textContent, /nodes \| .*edges/);
assert.doesNotMatch(runtime.elements.get("graphNetwork").innerHTML, /Loading Graph Explorer/);

const partialRuntime = createRuntime();
partialRuntime.send({ type: "state", workspaceName: "workspace", workspacePath: "C:/workspace" });
partialRuntime.send({
  type: "filesResults",
  files: Array.from({ length: 100 }, (_, index) => ({
    path: `src/backend/api/v1/file_${String(index).padStart(3, "0")}.py`,
    language: "python",
    symbols: 1,
  })),
});
partialRuntime.networks[0].handlers.selectNode({ nodes: ["dir:src/backend/api/v1"] });
assert.match(partialRuntime.elements.get("details").innerHTML, /Connected/);
assert.match(partialRuntime.elements.get("details").innerHTML, /20 not rendered/);
assert.match(partialRuntime.elements.get("details").innerHTML, /100/);

const searchRuntime = createRuntime();
searchRuntime.elements.get("source").value = "search";
searchRuntime.elements.get("query").value = "query_router";
searchRuntime.send({ type: "state", workspaceName: "workspace", workspacePath: "C:/workspace", indexUpdatedAt: Date.now() });
searchRuntime.send({
  type: "graphResults",
  results: [
    { name: "query_router_node", kind: "function", file: "src/loca_genai/workflows/nodes/mktmsg/mkt_msg_nodes.py", line: 504 },
    { name: "_determine_route", kind: "function", file: "src/loca_genai/workflows/nodes/mktmsg/logic/query_router_logic.py", line: 36 },
  ],
});

assert.equal(searchRuntime.networks.length, 1, "graphResults should create a vis.Network graph");
assert.equal(searchRuntime.networks[0].data.nodes.items.length, 5, "search graph should render root, symbols, and files");
assert.ok(searchRuntime.networks[0].data.edges.items.length > 0, "search graph should render edges");
assert.match(searchRuntime.elements.get("graphInsight").innerHTML, /Search matches for query_router/);
assert.match(searchRuntime.elements.get("graphActivity").textContent, /Loaded graph results/);
assert.match(searchRuntime.elements.get("indexFreshness").textContent, /Index/);
searchRuntime.send({ type: "indexChanged", indexUpdatedAt: Date.now() });
assert.match(searchRuntime.elements.get("activityList").innerHTML, /Codegraph index changed/);
searchRuntime.elements.get("refreshGraphActivity").listeners.click();
assert.equal(searchRuntime.posted.at(-1).type, "search");
assert.equal(searchRuntime.posted.at(-1).force, true);

const realWorkspace = process.env.CODEGRAPH_RUNTIME_WORKSPACE;
if (realWorkspace) {
  const files = JSON.parse(runCodegraph([
    "files",
    "--json",
    "--path",
    realWorkspace,
    "--format",
    "flat",
  ])).map((item) => ({
    path: item.path || item.file || item.filePath || item.relativePath,
    language: item.language || item.lang,
    symbols: item.symbols || item.symbolCount || item.nodeCount || item.nodes,
  })).filter((item) => item.path);

  const realFilesRuntime = createRuntime();
  realFilesRuntime.send({
    type: "state",
    workspaceName: realWorkspace.split(/[\\/]/).filter(Boolean).pop(),
    workspacePath: realWorkspace,
  });
  realFilesRuntime.send({ type: "filesResults", files });

  assert.ok(files.length > 0, "real Codegraph workspace should return indexed files");
  assert.equal(realFilesRuntime.networks.length, 1, "real indexed files should create a graph");
  assert.ok(realFilesRuntime.networks[0].data.nodes.items.length > 0, "real file graph should render nodes");
  assert.ok(realFilesRuntime.networks[0].data.edges.items.length > 0, "real file graph should render edges");

  const queryResults = JSON.parse(runCodegraph([
    "query",
    "--json",
    "--path",
    realWorkspace,
    "--limit",
    "20",
    "query_router",
  ])).map((item) => {
    const node = item.node || item;
    return {
      name: node.name || node.qualifiedName || node.label || node.filePath,
      kind: node.kind || node.type,
      file: node.file || node.path || node.filePath || node.relativePath,
      line: node.line || node.startLine || node.lineNumber,
    };
  }).filter((item) => item.name && item.file);

  const realSearchRuntime = createRuntime();
  realSearchRuntime.elements.get("source").value = "search";
  realSearchRuntime.elements.get("query").value = "query_router";
  realSearchRuntime.send({
    type: "state",
    workspaceName: realWorkspace.split(/[\\/]/).filter(Boolean).pop(),
    workspacePath: realWorkspace,
  });
  realSearchRuntime.send({ type: "graphResults", results: queryResults });

  assert.ok(queryResults.length > 0, "real Codegraph query should return query_router results");
  assert.equal(realSearchRuntime.networks.length, 1, "real query_router results should create a graph");
  assert.ok(realSearchRuntime.networks[0].data.nodes.items.length > 0, "real search graph should render nodes");
  assert.ok(realSearchRuntime.networks[0].data.edges.items.length > 0, "real search graph should render edges");
  console.log(`real Codegraph runtime graph passed: ${files.length} files, ${queryResults.length} query_router results`);
}

console.log("graphRuntime tests passed");
