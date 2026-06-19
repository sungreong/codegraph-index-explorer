---
name: codegraph-search-skills
description: "Use when the user asks where code lives or how code is connected in a .codegraph-enabled workspace, including questions like 'where is query_router', 'query_router 어디에 있어?', 'find this function/class/file', 'what calls this', 'impact of changing this', symbol search, code location search, Codegraph MCP or CLI fallback, and syncing this skill into workspace agent skill folders. Before grep/read, prefer Codegraph MCP; if MCP is unavailable but .codegraph exists, use Codegraph CLI."
---

# Codegraph Search Skills

Use this skill to make Codegraph navigation repeatable across agents and workspaces. Treat Codegraph as a capability, not as a single MCP transport. Keep the skill lean in context, and load references only when the task needs detail.

## First Rule

For short code-location questions such as `query_router 어디에 있어?`, `where is query_router`, `find FooService`, or `이 함수 어디서 호출돼?`, use Codegraph before grep/read.

If `.codegraph` exists and MCP tools are not registered, say briefly that MCP is unavailable and run the Codegraph CLI. Do not answer with grep/read unless the CLI is unavailable or the workspace has no `.codegraph` index.

## Capability Routing

Prefer Codegraph before raw file exploration when a `.codegraph` index is active. Do not fall straight from missing MCP tools to grep.

Use this order:

1. **Codegraph MCP**: If tools such as `codegraph_explore`, `codegraph_search`, `codegraph_callers`, `codegraph_callees`, `codegraph_impact`, `codegraph_files`, or `codegraph_status` are registered, use them.
2. **Codegraph CLI**: If MCP tools are missing but the workspace contains `.codegraph`, run the local CLI before any grep/read fallback. Use `codegraph status --json <workspace>` to confirm the index and `codegraph query --json --path <workspace> --limit <n> <query>` for symbol lookup.
3. **Heuristic fallback**: Use grep/read only when neither MCP nor CLI Codegraph access is available, or when the workspace has no `.codegraph` index.

Report the active route briefly when it matters, for example: `Codegraph MCP not registered; using local Codegraph CLI because .codegraph exists.`

Common triggers for this skill:

- `query_router 어디에 있어?`
- `where is query_router?`
- `find determine_route`
- `이 함수 어디서 호출돼?`
- `what calls determine_route?`
- `이걸 바꾸면 영향 받는 곳 찾아줘`
- `show indexed files under mktmsg`

## Task Map

- For architecture, "how does this work", bug orientation, or flow tracing, use MCP `codegraph_explore`; if MCP is absent, use CLI `codegraph query` to find entry symbols, then inspect the top indexed files.
- For locating a symbol such as `query_router`, use MCP `codegraph_search`; if MCP is absent, run `codegraph query --json --path <workspace> --limit 20 query_router`.
- For one exact symbol body, use MCP `codegraph_node`; if MCP is absent, use CLI query results to open the indexed file and line.
- For callers, callees, and impact, use MCP relationship tools; if MCP is absent, try CLI `codegraph callers`, `codegraph callees`, or `codegraph impact` with `--json --path <workspace>` before grep.
- For indexed files, use MCP `codegraph_files`; if MCP is absent, run `codegraph files --json --path <workspace> --format flat`.
- For index health, use MCP `codegraph_status`; if MCP is absent, run `codegraph status --json <workspace>`.

For the complete capability and fallback map, read `references/tool-registry.json`.

## Sync Workflow

When asked to install, refresh, export, or pre-load Codegraph context for a workspace:

1. Identify the workspace root. Prefer the root containing `.codegraph`; otherwise ask only if multiple roots are plausible.
2. Run `scripts/sync-codegraph-context.js --workspace <workspace-root>` from this skill folder.
3. Review the generated `codegraph_skills/context/sync-state.json`.
4. If the context is stale or incomplete, run Codegraph sync/status in the workspace and rerun the script.
5. If external docs or tool metadata need refresh, run `scripts/download-codegraph-resources.js --workspace <workspace-root>` after confirming network access is allowed.

The VS Code extension sync command installs the bundled skill into `codegraph_skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`, and `.gemini/skills/` while preserving locally edited files. The context sync script writes a structured workspace cache under `codegraph_skills/context/` without modifying source code.

## Validation

Before trusting updates to this skill or its generated context, run the 10-pass validation in `references/validation-checklist.md`.

At minimum, verify:

- The `SKILL.md` trigger description is specific and not overly broad.
- The tool registry matches the currently exposed MCP/CLI tool surface.
- The fallback route is MCP first, CLI second, grep/read last.
- The sync script is idempotent and writes only below `codegraph_skills/`.
- The generated context records source, timestamp, and next review time.
- The workflow still favors simple Codegraph search/navigation over heavy UI or broad refactors.

## Research Loop

When updating the skill from MCP or web feedback:

1. Prefer live MCP tool descriptions for the active environment.
2. Use official CodeGraph, MCP, and Codex Skills documentation before blogs or secondary material.
3. Record the source URL, retrieval date, and reason for change in the generated context cache.
4. Keep stable guidance in `SKILL.md`; move detailed or changing material into `references/`.
5. Re-run the 10-pass validation and the repository tests that cover packaging/sync behavior.

See `references/sync-policy.md` for cadence and stale-context rules.
