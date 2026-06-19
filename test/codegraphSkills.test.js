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
  getWorkspaceGeminiSkillsRoot,
  syncBundledCodegraphSkills,
} = require("../out/codegraphSkills");

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-skills-test-"));
  const extensionPath = path.join(temp, "extension");
  const workspacePath = path.join(temp, "workspace");
  const bundleRoot = getBundledCodegraphSkillsRoot(extensionPath);
  const skillRoot = path.join(bundleRoot, "codegraph-search-skills");

  fs.mkdirSync(path.join(skillRoot, "references"), { recursive: true });
  fs.writeFileSync(path.join(bundleRoot, "manifest.json"), JSON.stringify({
    version: 1,
    skills: [
      {
        id: "codegraph-search-skills",
        source: "codegraph-search-skills",
        workspaceCatalogTarget: "codegraph_skills/codegraph-search-skills",
        agentSkillTarget: ".agents/skills/codegraph-search-skills",
        additionalSkillTargets: [
          ".claude/skills/codegraph-search-skills",
          ".codex/skills/codegraph-search-skills",
          ".gemini/skills/codegraph-search-skills",
        ],
      },
    ],
  }));
  fs.writeFileSync(path.join(skillRoot, "SKILL.md"), "---\nname: codegraph-search-skills\ndescription: test\n---\n");
  fs.writeFileSync(path.join(skillRoot, "references", "tool-registry.json"), "{}\n");

  const first = await syncBundledCodegraphSkills({ extensionPath, workspacePath });
  assert.deepEqual(first.skills, ["codegraph-search-skills"]);
  assert.equal(first.copied, 10);
  assert.equal(first.updated, 0);
  assert.equal(first.unchanged, 0);
  assert.equal(first.skipped, 0);
  assert.equal(first.targets.length, 5);
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

  const second = await syncBundledCodegraphSkills({ extensionPath, workspacePath });
  assert.equal(second.copied, 0);
  assert.equal(second.updated, 0);
  assert.equal(second.unchanged, 10);
  assert.equal(second.skipped, 0);

  fs.writeFileSync(path.join(skillRoot, "SKILL.md"), "---\nname: codegraph-search-skills\ndescription: updated\n---\n");
  const third = await syncBundledCodegraphSkills({ extensionPath, workspacePath });
  assert.equal(third.updated, 5);
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
        workspaceCatalogTarget: "codegraph_skills/bad",
        agentSkillTarget: ".agents/skills/bad",
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
