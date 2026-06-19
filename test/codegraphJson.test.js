const assert = require("node:assert/strict");
const {
  parseCodegraphJsonOutput,
  stripAnsiControlSequences,
} = require("../out/codegraphJson");

assert.deepEqual(parseCodegraphJsonOutput(""), []);

assert.deepEqual(
  parseCodegraphJsonOutput("\u001b[34m[{\"name\":\"query_router\"}]\u001b[0m"),
  [{ name: "query_router" }],
);

assert.deepEqual(
  parseCodegraphJsonOutput("warning: noisy prefix\n{\"results\":[{\"name\":\"query_router\"}]}\n"),
  { results: [{ name: "query_router" }] },
);

assert.equal(
  stripAnsiControlSequences("\u001b[31mUnexpected token\u001b[0m"),
  "Unexpected token",
);

console.log("codegraphJson tests passed");
