# Codegraph Explorer

Lightweight VS Code navigation for projects that already use Codegraph.

[Install from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=datanewbie-labs.codegraph-index-explorer) or open VS Code Extensions and search for **Codegraph Explorer**.

[Korean README](README.ko.md)

![Codegraph Explorer overview](assets/codegraph-explorer-overview.png)

## Why Install It

Codegraph Explorer is for developers who already have a `.codegraph` index and
want to use that context without leaving VS Code.

- Search indexed symbols and code locations from the Activity Bar.
- Open results at exact file, line, and column positions.
- Inspect callers, callees, impact, files, and graph relationships.
- Use Graph Explorer to pan, zoom, focus, and inspect Codegraph relationships.
- Copy exact locations or agent-ready prompts when handing context to coding
  agents.
- Stay lightweight: this extension reads your existing Codegraph index instead
  of replacing your parser, indexer, MCP server, or agent workflow.

## Install

Marketplace:

[datanewbie-labs.codegraph-index-explorer](https://marketplace.visualstudio.com/items?itemName=datanewbie-labs.codegraph-index-explorer)

VS Code:

1. Open Extensions.
2. Search **Codegraph Explorer**.
3. Choose the extension by **DataNewbie Labs**.
4. Click **Install**.

Quick Open:

```text
ext install datanewbie-labs.codegraph-index-explorer
```

If this extension helps you move around Codegraph projects faster, please
install it from the Marketplace and share **Codegraph Explorer** with other
developers who use Codegraph.

## Initial Setup

Codegraph Explorer activates when the opened workspace contains a `.codegraph`
directory.

Requirements:

- VS Code `1.92.0` or newer.
- A trusted VS Code workspace.
- The `codegraph` CLI available on `PATH`, or configured with
  `codegraph.cliPath`.
- A workspace initialized with Codegraph.

Basic setup:

```sh
codegraph --version
codegraph init
```

Then reopen the workspace in VS Code, or run `Codegraph: Refresh` from the
Command Palette after the `.codegraph` directory exists.

If your CLI is not available as `codegraph`, set the path in VS Code settings:

```json
{
  "codegraph.cliPath": "/absolute/path/to/codegraph"
}
```

## Screenshots

![Search and graph details](assets/codegraph-search-graph-details.png)

![Focused node handoff](assets/codegraph-focused-node-handoff.png)

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

Graph Explorer opens in a separate panel and renders Codegraph relationships
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

## Index Freshness

The extension reads whatever the local Codegraph CLI reports. If your Codegraph
setup automatically re-indexes code changes and writes updates into
`.codegraph`, the extension can pick up those updates without rebuilding the
index itself.

- Graph Explorer watches `.codegraph/**` while the panel is open. When index
  files change, it clears extension-side caches, refreshes index metadata,
  shows the index freshness label, and records activity.
- Graph Explorer shows freshness labels such as `Index just now` and
  `Index 5m ago` based on the newest known `.codegraph` database timestamp.
- Dashboard, side view, command palette search, and status bar reads use short
  CLI caches. Status and file caches live for about 5 seconds; search and
  relationship caches live for about 2 seconds.
- `Codegraph: Refresh` clears extension caches and reloads status/sidebar data.

The extension does not start or manage Codegraph auto-sync. That remains the
responsibility of your Codegraph CLI, MCP, or daemon setup.

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
- `README.ko.md` - Korean guide for users.

## License

MIT
