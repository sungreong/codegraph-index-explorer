import { readFileSync } from "fs";
import { join } from "path";

let cachedScript: string | undefined;

export function getVisNetworkScript(): string {
  cachedScript ??= readFileSync(join(__dirname, "..", "resources", "vis-network.min.js"), "utf8");
  return cachedScript;
}
