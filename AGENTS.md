# AGENTS.md

This file gives coding agents basic guidance for working in this repository.

## Project Purpose

This repository is for a VS Code extension that works with Codegraph-enabled
projects.

When a workspace has an active `.codegraph` directory, the extension should make
Codegraph information easy to use from inside VS Code. The first priority is a
simple, practical experience: search for symbols or code information and show
useful results such as related file paths and locations.

The extension should stay lightweight and focused. Prefer features that help a
developer quickly find where something lives in the codebase over complex UI or
large workflows.

## General Guidelines

- Keep changes focused on the user's request.
- Prefer the existing project style, structure, and tooling.
- Read nearby code before editing so new changes fit the current design.
- Avoid unrelated refactors, formatting churn, or dependency changes.
- Do not overwrite user changes unless explicitly asked.

## Code Size

- Keep every source file under 1000 lines.
- If a file approaches 1000 lines, split responsibilities into smaller modules before adding more logic.
- Prefer clear, cohesive files over large catch-all files.

## Implementation

- Make small, understandable commits or changes.
- Use descriptive names for files, functions, variables, and types.
- Add comments only when they clarify non-obvious behavior.
- Prefer structured parsing and existing helper APIs over ad hoc string manipulation.
- Keep public interfaces stable unless the task requires changing them.
- Prefer simple VS Code commands, views, and quick-pick flows before adding heavier UI.
- Treat `.codegraph` availability as an important activation condition.

## Testing

- Run the most relevant tests, linters, or build checks after code changes.
- If a check cannot be run, mention why.
- Add or update tests when behavior changes or a regression risk is introduced.

## Documentation

- Update documentation when user-facing behavior, setup steps, or project conventions change.
- Keep documentation concise and accurate.
