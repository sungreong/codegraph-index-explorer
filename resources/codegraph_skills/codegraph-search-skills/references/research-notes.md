# Research Notes

Reviewed on 2026-06-18.

- CodeGraph exposes CLI/MCP surfaces for query/search, explore, node, files, callers, callees, impact, status, sync, and install workflows.
- CodeGraph guidance emphasizes using the pre-indexed graph before repeating file-search/read loops.
- MCP client best practices recommend progressive discovery when tool definitions would otherwise dominate context.
- Codex skill guidance recommends focused skills, imperative workflows, scripts only for deterministic repeated work, and repository-scoped skill folders under `.agents/skills`.
- MCP research agent feedback on 2026-06-18 prioritized preserving user edits during sync, adding bundle/skill version metadata, and turning passive validation guidance into automated package checks.
- MCP research agent feedback on 2026-06-18 identified MCP transport coupling as a failure mode. The skill now defines Codegraph as a capability with MCP first, CLI second, and grep/read last.
- A live Claude Code-style test showed `query_router 어디에 있어?` went straight to grep. The trigger text now explicitly includes short English/Korean location questions and a first rule requiring CLI fallback before grep when `.codegraph` exists.

Use these notes as a pointer, not as the source of truth. Re-check live MCP descriptions and official docs before changing the skill.
