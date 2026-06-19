const assert = require("node:assert/strict");
const {
  normalizeFileResults,
  normalizeRelatedResults,
  normalizeSearchResults,
} = require("../out/codegraphResults");

const searchResults = normalizeSearchResults([
  {
    node: {
      kind: "function",
      name: "searchSymbols",
      filePath: "src/extension.ts",
      startLine: 25,
      startColumn: 0,
      signature: "(): Promise<void>",
    },
    score: 96.8,
  },
]);

assert.deepEqual(searchResults, [
  {
    name: "searchSymbols",
    kind: "function",
    file: "src/extension.ts",
    line: 25,
    column: 0,
    signature: "(): Promise<void>",
    detail: undefined,
  },
]);

const fileResults = normalizeFileResults([
  {
    path: "src/codegraphCli.ts",
    language: "typescript",
    nodeCount: 26,
  },
]);

assert.deepEqual(fileResults, [
  {
    path: "src/codegraphCli.ts",
    language: "typescript",
    symbols: 26,
  },
]);

const relatedResults = normalizeRelatedResults({
  callers: [
    {
      name: "constructor",
      kind: "method",
      filePath: "src/codegraphPanel.ts",
      startLine: 56,
    },
  ],
}, ["callers"]);

assert.deepEqual(relatedResults, [
  {
    name: "constructor",
    kind: "method",
    file: "src/codegraphPanel.ts",
    line: 56,
  },
]);

console.log("codegraphResults tests passed");
