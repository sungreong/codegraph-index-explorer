# 10-Pass Validation Checklist

Run these passes after changing `SKILL.md`, references, scripts, or extension packaging logic.

1. Trigger fit: confirm the frontmatter description names concrete Codegraph tasks and does not trigger for unrelated search work.
   - Include short location questions such as `where is X` and `X 어디에 있어?`.
2. Progressive disclosure: keep `SKILL.md` focused; move volatile details to `references/`.
3. Capability routing: verify the order is Codegraph MCP first, Codegraph CLI second, grep/read last.
4. MCP parity: compare `references/tool-registry.json` with the active MCP tool list or CodeGraph CLI help.
5. Source freshness: confirm every external source in the registry has a review date and a stable URL.
6. Sync safety: run the sync script in a temporary workspace and confirm writes stay under `codegraph_skills/`.
7. Idempotence: run sync twice and confirm the second run reports unchanged files unless inputs changed.
8. Package inclusion: build or dry-run the VSIX package and confirm `resources/codegraph_skills/**` is included.
9. Extension command: run the command that exports bundled skills and confirm `codegraph_skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`, and `.gemini/skills/` targets update without overwriting locally modified files.
10. Repository checks: run the relevant compile/tests and fix failures before shipping.
