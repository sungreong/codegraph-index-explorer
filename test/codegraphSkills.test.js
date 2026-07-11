const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  getBundledCodegraphSkillsRoot,
  getWorkspaceAgentSkillsRoot,
  getWorkspaceClaudeSkillsRoot,
  getWorkspaceCodexSkillsRoot,
  getWorkspaceCodegraphSkillsRoot,
  getWorkspaceCursorSkillsRoot,
  getWorkspaceGeminiSkillsRoot,
  syncBundledCodegraphSkills,
} = require("../out/codegraphSkills");

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-skills-test-"));
  const extensionPath = path.join(temp, "extension");
  const workspacePath = path.join(temp, "workspace");
  const bundleRoot = getBundledCodegraphSkillsRoot(extensionPath);
  const skillRoot = path.join(bundleRoot, "codegraph-search-skills");
  const setupSkillRoot = path.join(bundleRoot, "codegraph-setup");

  fs.mkdirSync(path.join(skillRoot, "references"), { recursive: true });
  fs.mkdirSync(path.join(skillRoot, "agents"), { recursive: true });
  fs.mkdirSync(path.join(setupSkillRoot, "agents"), { recursive: true });
  fs.writeFileSync(path.join(bundleRoot, "manifest.json"), JSON.stringify({
    version: 1,
    bundleVersion: "test-bundle",
    skills: [
      {
        id: "codegraph-search-skills",
        version: "0.1.0",
        source: "codegraph-search-skills"
      },
      {
        id: "codegraph-setup",
        version: "0.1.0",
        source: "codegraph-setup"
      },
    ],
  }));
  fs.writeFileSync(path.join(skillRoot, "SKILL.md"), "---\nname: codegraph-search-skills\ndescription: test\n---\n");
  fs.writeFileSync(path.join(skillRoot, "agents", "openai.yaml"), "interface:\n  display_name: test\n");
  fs.writeFileSync(path.join(skillRoot, "references", "tool-registry.json"), "{}\n");
  fs.writeFileSync(path.join(setupSkillRoot, "SKILL.md"), "---\nname: codegraph-setup\ndescription: test\n---\n");
  fs.writeFileSync(path.join(setupSkillRoot, "agents", "openai.yaml"), "interface:\n  display_name: setup\n");

  const first = await syncBundledCodegraphSkills({ extensionPath, workspacePath });
  assert.deepEqual(first.skills, ["codegraph-search-skills", "codegraph-setup"]);
  assert.equal(first.copied, 30);
  assert.equal(first.updated, 0);
  assert.equal(first.unchanged, 0);
  assert.equal(first.skipped, 0);
  assert.equal(first.targets.length, 12);
  assert.deepEqual(
    first.targetRoots.map((target) => path.relative(workspacePath, target)).sort(),
    [
      ".agents\\skills",
      ".claude\\skills",
      ".codex\\skills",
      ".cursor\\skills",
      ".gemini\\skills",
      "codegraph_skills",
    ].sort(),
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceCodegraphSkillsRoot(workspacePath), "codegraph-search-skills", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceAgentSkillsRoot(workspacePath), "codegraph-search-skills", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceClaudeSkillsRoot(workspacePath), "codegraph-search-skills", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceCodexSkillsRoot(workspacePath), "codegraph-search-skills", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceGeminiSkillsRoot(workspacePath), "codegraph-search-skills", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceCursorSkillsRoot(workspacePath), "codegraph-search-skills", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceCodegraphSkillsRoot(workspacePath), "codegraph-setup", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceAgentSkillsRoot(workspacePath), "codegraph-setup", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceClaudeSkillsRoot(workspacePath), "codegraph-setup", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceCodexSkillsRoot(workspacePath), "codegraph-setup", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceGeminiSkillsRoot(workspacePath), "codegraph-setup", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(getWorkspaceCursorSkillsRoot(workspacePath), "codegraph-setup", "SKILL.md")),
    true,
  );

  const second = await syncBundledCodegraphSkills({ extensionPath, workspacePath });
  assert.equal(second.copied, 0);
  assert.equal(second.updated, 0);
  assert.equal(second.unchanged, 30);
  assert.equal(second.skipped, 0);

  const selectedTarget = path.join(temp, "selected-workspace");
  const selectedOnly = await syncBundledCodegraphSkills({
    extensionPath,
    workspacePath: selectedTarget,
    targetRootIds: ["agents", "cursor"],
  });
  assert.equal(selectedOnly.targets.length, 4);
  assert.deepEqual(
    selectedOnly.targetRoots.map((target) => path.relative(selectedTarget, target)).sort(),
    [".agents\\skills", ".cursor\\skills"].sort(),
  );
  assert.equal(fs.existsSync(path.join(selectedTarget, ".claude", "skills")), false);

  fs.writeFileSync(path.join(skillRoot, "SKILL.md"), "---\nname: codegraph-search-skills\ndescription: updated\n---\n");
  const third = await syncBundledCodegraphSkills({ extensionPath, workspacePath });
  assert.equal(third.updated, 6);
  assert.equal(third.skipped, 0);

  const workspaceSkillMd = path.join(getWorkspaceAgentSkillsRoot(workspacePath), "codegraph-search-skills", "SKILL.md");
  fs.writeFileSync(workspaceSkillMd, "user customized\n");
  fs.writeFileSync(path.join(skillRoot, "SKILL.md"), "---\nname: codegraph-search-skills\ndescription: newer bundle\n---\n");
  const fourth = await syncBundledCodegraphSkills({ extensionPath, workspacePath });
  assert.equal(fourth.skipped, 1);
  assert.equal(fs.readFileSync(workspaceSkillMd, "utf8"), "user customized\n");

  fs.writeFileSync(path.join(bundleRoot, "manifest.json"), JSON.stringify({
    version: 1,
    skills: [
      {
        id: "bad",
        source: "../outside",
      },
    ],
  }));
  await assert.rejects(
    () => syncBundledCodegraphSkills({ extensionPath, workspacePath }),
    /escapes Codegraph skill bundle target/,
  );

  fs.rmSync(temp, { recursive: true, force: true });
  console.log("codegraphSkills tests passed");
})();
