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
  assertRelative(skill.workspaceCatalogTarget, `${skill.id}.workspaceCatalogTarget`);
  assertRelative(skill.agentSkillTarget, `${skill.id}.agentSkillTarget`);
  if (skill.additionalSkillTargets !== undefined) {
    assert.ok(Array.isArray(skill.additionalSkillTargets), `${skill.id}.additionalSkillTargets must be an array`);
    for (const target of skill.additionalSkillTargets) {
      assertRelative(target, `${skill.id}.additionalSkillTargets[]`);
    }
  }

  const skillRoot = resolveInside(bundleRoot, skill.source);
  const skillMd = path.join(skillRoot, "SKILL.md");
  const openaiYaml = path.join(skillRoot, "agents", "openai.yaml");
  const toolRegistry = path.join(skillRoot, "references", "tool-registry.json");
  const validationChecklist = path.join(skillRoot, "references", "validation-checklist.md");
  const syncPolicy = path.join(skillRoot, "references", "sync-policy.md");

  assertFile(skillMd);
  assertFile(openaiYaml);
  assertFile(toolRegistry);
  assertFile(validationChecklist);
  assertFile(syncPolicy);

  const skillText = fs.readFileSync(skillMd, "utf8");
  assert.match(skillText, /^---\r?\nname: codegraph-search-skills\r?\ndescription: /, "SKILL.md frontmatter is missing");
  assert.match(skillText, /## Capability Routing/, "SKILL.md must include Capability Routing");
  assert.match(skillText, /## First Rule/, "SKILL.md must include First Rule");
  assert.match(skillText, /query_router 어디에 있어/, "SKILL.md must include Korean location trigger examples");
  assert.match(skillText, /where is query_router/, "SKILL.md must include English location trigger examples");
  assert.match(skillText, /Codegraph CLI/, "SKILL.md must mention CLI fallback");
  assert.match(skillText, /grep\/read last/, "SKILL.md must keep grep/read as the last fallback");
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

console.log("codegraph skill bundle validation passed");

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
