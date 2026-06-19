const { copyFileSync, existsSync, mkdirSync, statSync } = require("node:fs");
const { dirname, join } = require("node:path");

const root = join(__dirname, "..");
const source = join(root, "node_modules", "vis-network", "dist", "vis-network.min.js");
const target = join(root, "resources", "vis-network.min.js");

if (!existsSync(source)) {
  throw new Error("Missing vis-network bundle. Run npm install before packaging.");
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);

const size = statSync(target).size;
if (size < 100000) {
  throw new Error("Copied vis-network bundle is unexpectedly small.");
}

console.log(`synced ${target}`);
