#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const bundleRoot = path.join(root, "resources", "codegraph_skills");
const manifestPath = path.join(bundleRoot, "manifest.json");
const manifest = readJson(manifestPath);

assert.equal(manifest.version, 1, "manifest.version must be 1");
assert.equal(typeof manifest.bundleVersion, "string", "manifest.bundleVersion is required");
assert.ok(Array.isArray(manifest.skills), "manifest.skills must be an array");
assert.ok(manifest.skills.length > 0, "manifest must declare at least one skill");

for (const skill of manifest.skills) {
  assert.equal(typeof skill.id, "string", "skill.id is required");
  assert.equal(typeof skill.version, "string", `${skill.id} must declare a version`);
  assertRelative(skill.source, `${skill.id}.source`);
  if (skill.workspaceCatalogTarget !== undefined) {
    assertRelative(skill.workspaceCatalogTarget, `${skill.id}.workspaceCatalogTarget`);
  }
  if (skill.agentSkillTarget !== undefined) {
    assertRelative(skill.agentSkillTarget, `${skill.id}.agentSkillTarget`);
  }
  if (skill.additionalSkillTargets !== undefined) {
    assert.ok(Array.isArray(skill.additionalSkillTargets), `${skill.id}.additionalSkillTargets must be an array`);
    for (const target of skill.additionalSkillTargets) {
      assertRelative(target, `${skill.id}.additionalSkillTargets[]`);
    }
  }

  const skillRoot = resolveInside(bundleRoot, skill.source);
  const skillMd = path.join(skillRoot, "SKILL.md");
  const openaiYaml = path.join(skillRoot, "agents", "openai.yaml");

  assertFile(skillMd);
  assertFile(openaiYaml);

  const skillText = fs.readFileSync(skillMd, "utf8");
  const openaiText = fs.readFileSync(openaiYaml, "utf8");
  assert.match(skillText, new RegExp(`^---\\r?\\nname: ${escapeRegExp(skill.id)}\\r?\\ndescription: `), `${skill.id} SKILL.md frontmatter is missing`);
  assert.match(openaiText, new RegExp(`\\$${escapeRegExp(skill.id)}`), `${skill.id} openai.yaml default_prompt must mention the skill`);

  if (skill.id === "codegraph-search-skills") {
    validateSearchSkill(skillRoot, skillText);
    continue;
  }

  if (skill.id === "codegraph-setup") {
    validateSetupSkill(skillRoot, skillText);
    continue;
  }

  throw new Error(`No validation rules for Codegraph skill: ${skill.id}`);
}

console.log("codegraph skill bundle validation passed");

function validateSearchSkill(skillRoot, skillText) {
  const toolRegistry = path.join(skillRoot, "references", "tool-registry.json");
  const validationChecklist = path.join(skillRoot, "references", "validation-checklist.md");
  const syncPolicy = path.join(skillRoot, "references", "sync-policy.md");

  assertFile(toolRegistry);
  assertFile(validationChecklist);
  assertFile(syncPolicy);

  assert.match(skillText, /## Capability Routing/, "SKILL.md must include Capability Routing");
  assert.match(skillText, /## First Rule/, "SKILL.md must include First Rule");
  assert.match(skillText, /query_router 어디에 있어/, "SKILL.md must include Korean location trigger examples");
  assert.match(skillText, /where is query_router/, "SKILL.md must include English location trigger examples");
  assert.match(skillText, /Codegraph CLI/, "SKILL.md must mention CLI fallback");
  assert.match(skillText, /grep\/read last/, "SKILL.md must keep grep/read as the last fallback");
  assert.match(skillText, /\$codegraph-setup/, "SKILL.md must route setup failures to codegraph-setup");
  assert.match(skillText, /## Sync Workflow/, "SKILL.md must include Sync Workflow");
  assert.match(skillText, /## Validation/, "SKILL.md must include Validation");

  const registry = readJson(toolRegistry);
  assert.equal(typeof registry.lastReviewed, "string", "tool-registry.json lastReviewed is required");
  assert.ok(Array.isArray(registry.primarySources), "tool-registry.json primarySources must be an array");
  assert.ok(Array.isArray(registry.tools), "tool-registry.json tools must be an array");
  for (const tool of registry.tools) {
    assert.equal(typeof tool.name, "string", "tool.name is required");
    assert.equal(typeof tool.capability, "string", `${tool.name} capability is required`);
    assert.equal(typeof tool.intent, "string", `${tool.name} intent is required`);
    assert.equal(typeof tool.returns, "string", `${tool.name} returns is required`);
    assert.equal(typeof tool.cliFallback, "string", `${tool.name} cliFallback is required`);
  }
  assert.ok(Array.isArray(registry.fallbackOrder), "tool-registry.json fallbackOrder must be an array");
  assert.match(registry.fallbackOrder.join(" "), /MCP.*CLI.*grep\/read/, "fallback order must prefer MCP, then CLI, then grep/read");
}

function validateSetupSkill(skillRoot, skillText) {
  assertFile(path.join(skillRoot, "scripts", "diagnose-codegraph-setup.js"));
  assert.match(skillText, /codegraph_setup/, "codegraph-setup must include the underscore alias");
  assert.match(skillText, /## Diagnose First/, "codegraph-setup must include Diagnose First");
  assert.match(skillText, /codegraph-setup-diagnosis\.json/, "codegraph-setup must persist diagnosis state");
  assert.match(skillText, /codegraph-setup-diagnosis-history\.jsonl/, "codegraph-setup must persist diagnosis history");
  assert.match(skillText, /diagnose-codegraph-setup\.js --workspace/, "codegraph-setup must describe the diagnosis script");
  assert.match(skillText, /## Install Runtime/, "codegraph-setup must include Install Runtime");
  assert.match(skillText, /apt-get install -y nodejs npm/, "codegraph-setup must include Debian/Ubuntu runtime install");
  assert.match(skillText, /apk add --no-cache nodejs npm/, "codegraph-setup must include Alpine runtime install");
  assert.match(skillText, /dnf install -y nodejs npm/, "codegraph-setup must include Fedora/RHEL runtime install");
  assert.match(skillText, /## Fix PATH-Only Failures/, "codegraph-setup must include PATH-only failure guidance");
  assert.match(skillText, /## Fix nvm MCP Failures/, "codegraph-setup must include nvm MCP failure guidance");
  assert.match(skillText, /Executable not found in \$PATH: "codegraph"/, "codegraph-setup must mention MCP PATH error");
  assert.match(skillText, /env: 'node': No such file or directory/, "codegraph-setup must mention missing node runtime errors");
  assert.match(skillText, /<absolute-path-to-codegraph> --version 2>&1/, "codegraph-setup must require absolute binary execution checks");
  assert.match(skillText, /"env": \{\s*"PATH":/s, "codegraph-setup must include MCP env.PATH guidance");
  assert.match(skillText, /\/root\/\.local\/bin\/codegraph/, "codegraph-setup must include root local bin example");
  assert.match(skillText, /\/home\/mockup\/\.nvm\/versions\/node\/v24\.18\.0\/bin\/codegraph/, "codegraph-setup must include nvm absolute path example");
  assert.match(skillText, /ask the user for confirmation once/i, "codegraph-setup must require one user confirmation before environment changes");
  assert.match(skillText, /ln -s \/root\/\.local\/bin\/codegraph \/usr\/local\/bin\/codegraph/, "codegraph-setup must include symlink fix");
  assert.match(skillText, /codegraph install --target auto --location global --yes/, "codegraph-setup must include non-interactive MCP setup");

  const setupScript = fs.readFileSync(path.join(skillRoot, "scripts", "diagnose-codegraph-setup.js"), "utf8");
  assert.match(setupScript, /executionChecks/, "diagnosis script must record direct execution checks");
  assert.match(setupScript, /isNodeRuntimeFailure/, "diagnosis script must detect missing node runtime failures");
}

function readJson(target) {
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function assertFile(target) {
  assert.equal(fs.statSync(target).isFile(), true, `${target} must be a file`);
}

function assertRelative(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.equal(path.isAbsolute(value), false, `${label} must be relative`);
  resolveInside(bundleRoot, value);
}

function resolveInside(base, relativeTarget) {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(resolvedBase, relativeTarget);
  assert.ok(
    resolvedTarget === resolvedBase || resolvedTarget.startsWith(`${resolvedBase}${path.sep}`),
    `${relativeTarget} must stay inside ${base}`,
  );
  return resolvedTarget;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
