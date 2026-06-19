#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const args = parseArgs(process.argv.slice(2));
const workspace = path.resolve(requiredArg(args, "workspace"));
const skillDir = path.resolve(args.source || path.join(__dirname, ".."));
const intervalHours = Number.parseInt(args["interval-hours"] || "24", 10);
const contextDir = path.join(workspace, "codegraph_skills", "context");

fs.mkdirSync(contextDir, { recursive: true });

copyReference("tool-registry.json");
copyReference("validation-checklist.md");
copyReference("sync-policy.md");
copyReference("research-notes.md");

const status = runCodegraph(["status", "--json", workspace], workspace);
const files = runCodegraph(["files", "--json", "--path", workspace, "--format", "flat"], workspace);
const now = new Date();
const nextReviewAt = new Date(now.getTime() + safeInterval(intervalHours) * 60 * 60 * 1000);

writeJson(path.join(contextDir, "sync-state.json"), {
  workspace,
  skillDir,
  generatedAt: now.toISOString(),
  nextReviewAt: nextReviewAt.toISOString(),
  intervalHours: safeInterval(intervalHours),
  codegraph: {
    status,
    files
  }
});

console.log(`Synced Codegraph context into ${contextDir}`);

function copyReference(name) {
  const source = path.join(skillDir, "references", name);
  const target = path.join(contextDir, name);
  fs.copyFileSync(source, target);
}

function runCodegraph(args, cwd) {
  try {
    const stdout = execFileSync("codegraph", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    return {
      ok: true,
      json: parseJson(stdout),
      rawLength: stdout.length
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function writeJson(target, value) {
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function requiredArg(values, key) {
  const value = values[key];
  if (!value) {
    throw new Error(`Missing --${key}`);
  }
  return value;
}

function safeInterval(value) {
  return Number.isFinite(value) && value > 0 ? value : 24;
}

function parseArgs(items) {
  const parsed = {};
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.startsWith("--")) {
      continue;
    }
    const key = item.slice(2);
    const next = items[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
    } else {
      parsed[key] = "true";
    }
  }
  return parsed;
}
