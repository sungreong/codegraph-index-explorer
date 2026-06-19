# Codegraph Explorer

A lightweight, unofficial VS Code extension for browsing existing `.codegraph`
indexes. It does not try to be a Codegraph engine, MCP server, or replacement
indexer. Instead, it gives developers a practical editor UI for the Codegraph
index they already have: search, related locations, graph browsing, and
agent-ready handoff.

## Positioning

Many CodeGraph-style extensions include their own parser, indexer, language
server, MCP server, memory layer, or AI summary workflow. This extension is
deliberately narrower:

- It activates only when a workspace already contains `.codegraph`.
- It calls the local `codegraph` CLI and renders the returned JSON.
- It focuses on fast navigation, indexed file discovery, callers, callees,
  impact, and graph browsing inside VS Code.
- It helps hand selected Codegraph results to coding agents by copying exact
  locations or a structured prompt.
- It stays small enough to use beside any existing Codegraph setup instead of
  owning the whole indexing pipeline.

This project is best described as a Codegraph index explorer and agent handoff
tool, not an official Codegraph sub-extension.

## What It Does

- Activates automatically when the workspace contains a `.codegraph` directory.
- Shows Codegraph status and indexed files inside VS Code.
- Searches symbols through the local Codegraph CLI.
- Opens results at the matching file, line, and column when available.
- Provides callers, callees, and impact lookups for selected results.
- Includes a dashboard, Activity Bar view, status bar entry, and command palette
  commands.
- Offers a Graph Explorer for visual navigation across symbols, files, and
  relationships.
- Copies file locations or agent-ready prompts from selected results.
- Bundles a Codegraph agent skill that can be synced into supported agent
  folders.

## Index Freshness

The extension reads whatever the local Codegraph CLI reports. If your Codegraph
setup automatically re-indexes code changes and writes updates into
`.codegraph`, the extension can pick up those updates without rebuilding the
index itself.

Behavior by surface:

- Graph Explorer watches `.codegraph/**` while the panel is open. When the index
  files change, it clears extension-side caches, refreshes index metadata, shows
  the index freshness label, and records `Codegraph index changed | cache
  cleared` in Graph Activity.
- Graph Explorer also shows `Index just now`, `Index 5m ago`, and similar
  freshness labels based on the newest known `.codegraph` database timestamp.
- The dashboard, side view, command palette search, and status bar read through
  short-lived CLI caches. Status and file caches live for about 5 seconds;
  search and relationship caches live for about 2 seconds.
- `Codegraph: Refresh` clears extension caches and reloads status/sidebar data.
  Use it when you want to force the editor UI to forget cached CLI results.

The extension does not start or manage Codegraph auto-sync. That remains the
responsibility of your Codegraph CLI/MCP/daemon setup.

## Requirements

- VS Code `1.92.0` or newer.
- Node.js and npm for local development.
- The `codegraph` CLI available on `PATH`, or configured with
  `codegraph.cliPath`.
- A workspace initialized with Codegraph:

```sh
codegraph init
```

## Usage

Open a workspace that contains `.codegraph`, then use one of these entry points:

- Activity Bar: `Codegraph`
- Status Bar: `Codegraph`
- Command Palette: `Codegraph: Open Dashboard`
- Command Palette: `Codegraph: Open Graph Explorer`
- Command Palette: `Codegraph: Search Symbols`
- Keyboard: `Ctrl+Alt+G` on Windows/Linux or `Cmd+Alt+G` on macOS

The dashboard and side view show index status, indexed files, search results,
and related Codegraph actions. Selecting a result opens the source file at the
indexed location.

The Graph Explorer opens in a separate panel and renders Codegraph relationships
with pan, zoom, node dragging, focus mode, minimap, hover previews, and detail
actions.

## Commands

| Command | Purpose |
| --- | --- |
| `Codegraph: Open Dashboard` | Open the main Codegraph dashboard. |
| `Codegraph: Open Graph Explorer` | Open the visual graph panel. |
| `Codegraph: Search Symbols` | Search indexed symbols. |
| `Codegraph: Show Status` | Show Codegraph workspace status. |
| `Codegraph: List Indexed Files` | Browse indexed files. |
| `Codegraph: Refresh` | Clear cached extension state and refresh data. |
| `Codegraph: Sync Bundled Agent Skills` | Copy the bundled Codegraph skill into supported agent folders. |
| `Codegraph: Show Update History` | Show extension changelog entries. |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `codegraph.searchLimit` | `20` | Maximum number of search results to show. |
| `codegraph.cliPath` | `codegraph` | Command or path used to run the Codegraph CLI. |
| `codegraph.preloadOnActivation` | `true` | Preload status and indexed files after activation. |

## Development

Install dependencies and copy the packaged webview dependency:

```sh
npm install
npm run sync:vis-network
```

Common development commands:

```sh
npm run compile
npm test
npm run test:extension
npm run package
```

Open this folder in VS Code and press `F5` to launch an Extension Development
Host.

## Packaging

Create a local VSIX:

```sh
npm run package
```

Install the generated `.vsix` from VS Code with
`Extensions: Install from VSIX`.

Before publishing publicly:

- Confirm the `publisher` value in `package.json` matches the Marketplace
  publisher account.
- Confirm repository, homepage, and issue tracker metadata point at the public
  GitHub repository.
- Run `npm test`.
- Confirm generated `.vsix` files, local `.codegraph` indexes, test artifacts,
  and `node_modules` are not committed.

## Repository Contents

- `src/` - extension source code.
- `resources/` - packaged extension assets and bundled Codegraph skill.
- `scripts/` - maintenance and validation scripts.
- `test/` - unit, package, asset, graph, and extension smoke tests.
- `CHANGELOG.md` - release history.

## License

MIT
