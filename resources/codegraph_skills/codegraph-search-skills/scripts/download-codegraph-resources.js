#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");

const args = parseArgs(process.argv.slice(2));
const workspace = path.resolve(requiredArg(args, "workspace"));
const skillDir = path.resolve(args.source || path.join(__dirname, ".."));
const sourcesPath = path.join(skillDir, "references", "resource-sources.json");
const sources = JSON.parse(fs.readFileSync(sourcesPath, "utf8")).sources || [];
const downloadsDir = path.join(workspace, "codegraph_skills", "downloads");

fs.mkdirSync(downloadsDir, { recursive: true });

(async () => {
  const manifest = [];
  for (const source of sources) {
    const target = path.join(downloadsDir, safeFileName(source.target));
    const body = await download(source.url);
    fs.writeFileSync(target, body, "utf8");
    manifest.push({
      id: source.id,
      url: source.url,
      target,
      purpose: source.purpose,
      downloadedAt: new Date().toISOString(),
      bytes: Buffer.byteLength(body, "utf8")
    });
  }

  fs.writeFileSync(
    path.join(downloadsDir, "download-manifest.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), manifest }, null, 2)}\n`,
    "utf8"
  );
  console.log(`Downloaded ${manifest.length} Codegraph resources into ${downloadsDir}`);
})().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

function download(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error(`Refusing non-HTTPS URL: ${url}`);
  }

  return new Promise((resolve, reject) => {
    https.get(parsed, { headers: { "user-agent": "codegraph-vs-extension" } }, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        resolve(download(new URL(response.headers.location, parsed).toString()));
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      response.setEncoding("utf8");
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

function safeFileName(value) {
  const normalized = path.basename(String(value || ""));
  if (!normalized || normalized === "." || normalized === "..") {
    throw new Error(`Invalid target filename: ${value}`);
  }
  return normalized;
}

function requiredArg(values, key) {
  const value = values[key];
  if (!value) {
    throw new Error(`Missing --${key}`);
  }
  return value;
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
