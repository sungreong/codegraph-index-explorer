# Sync Policy

Default review cadence: 24 hours for generated workspace context, and manual review whenever Codegraph MCP tool descriptions or CLI output changes.

Use this policy when updating `codegraph_skills/context/`:

- Treat `sync-state.json.nextReviewAt` as the next time to refresh cached context.
- Refresh immediately after Codegraph CLI upgrades, MCP server changes, or extension package updates.
- Prefer current MCP tool descriptions over stale reference files.
- Missing MCP tools do not mean Codegraph is unavailable. If `.codegraph` exists, use the Codegraph CLI fallback before grep/read.
- Use web refresh only for documentation or source metadata; do not download executable tooling automatically.
- Keep downloaded docs under `codegraph_skills/downloads/` and record URL, timestamp, and output path.
- Keep generated context separate from source files. Do not write outside `codegraph_skills/` unless the user explicitly asks to install the discoverable skill into `.agents/skills/`.
- When syncing bundled skills from the VS Code extension, install the same skill into every configured agent target root, currently `codegraph_skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`, `.gemini/skills/`, and `.cursor/skills/`, so common agent runtimes can discover it.
- Preserve workspace edits. A sync should overwrite a file only when the file still matches the last bundled hash recorded in `.codegraph-skill-sync.json`; otherwise skip the file and report the conflict.
