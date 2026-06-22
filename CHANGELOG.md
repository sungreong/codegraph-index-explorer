# Change Log

## [0.0.59] - 2026-06-22

### Fixed

- Improves cross-platform path handling for Windows, macOS, and Linux workspaces.
- Adds macOS/Linux Codegraph CLI fallback candidates for common npm, local, and Homebrew install locations.
- Expands `~` in the configured Codegraph CLI path.

## [0.0.58] - 2026-06-22

### Changed

- Refreshes the Marketplace README with installation-focused copy, initial setup guidance, and product screenshots.
- Adds a Korean README for developers who prefer a localized setup and usage guide.

## [0.0.57] - 2026-06-19

### Fixed

- Restores a dedicated Activity Bar SVG icon so VS Code does not render the packaged PNG as a square placeholder.

## [0.0.56] - 2026-06-19

### Fixed

- Uses the provided Codegraph Explorer PNG for both the packaged extension icon and Activity Bar container icon.

## [0.0.55] - 2026-06-19

### Fixed

- Hides the floating graph mode bar during normal graph browsing when no cluster, selection, filter, or hidden-limit state needs recovery.

## [0.0.54] - 2026-06-19

### Changed

- Keeps the floating graph mode bar compact by showing the highest-priority recovery actions first and moving overflow actions back to the top insight bar.
- Updates recent changelog entries so the in-extension update history matches the packaged behavior.

## [0.0.53] - 2026-06-19

### Fixed

- Ignores stale Graph Explorer results and stale node-expansion responses when a newer graph request has already started.
- Clears Codegraph CLI result caches on forced refresh and `.codegraph` index changes so graph views do not reuse stale data.

## [0.0.52] - 2026-06-19

### Changed

- Narrows activation to Codegraph-relevant workspace and view events instead of activating on every VS Code startup.
- Adds a Codegraph search keybinding scoped to active Codegraph workspaces.

## [0.0.51] - 2026-06-18

### Added

- Adds a floating graph mode bar for active cluster, selection, filter, and hidden-limit states so recovery actions stay visible even when the details pane is closed.
- Reuses the same `Show full graph`, `Clear focus`, `Show more`, `Clear filters`, and `Fit` actions from the graph insight bar inside the canvas surface.

## [0.0.50] - 2026-06-18

### Added

- Adds a `Group list` action while inspecting a node inside cluster-only mode so users can return to the selected group's contents without leaving the filtered graph.

### Fixed

- Keeps an already selected cluster locked when its hull is clicked again, reserving full-graph restore for explicit `Show full graph` and clear-focus actions.

## [0.0.49] - 2026-06-18

### Added

- Adds an `Inside group` table to cluster-only details so users can inspect and jump to files/directories within the selected group.
- Adds paging for large cluster contents while preserving the compact details pane layout.

## [0.0.48] - 2026-06-18

### Added

- Watches the active workspace `.codegraph` directory while Graph Explorer is open and records index-change events in Graph Activity.
- Clears the Graph Explorer in-memory result cache when the index changes so subsequent graph requests do not reuse stale cached data.

### Fixed

- Pauses graph physics when filtering to a cluster so large graphs stop drifting while users inspect a specific group.
- Adds an explicit `Show only this group` action to directory details as a reliable fallback when dense cluster boxes are hard to click.

## [0.0.47] - 2026-06-18

### Added

- Adds a compact Codegraph index freshness indicator to Graph Explorer, showing when the `.codegraph` index was last updated.
- Refreshes the displayed index timestamp after forced graph refreshes so users can judge whether the graph reflects the current index.

## [0.0.46] - 2026-06-18

### Fixed

- Makes Graph Explorer refresh actions bypass the in-memory result cache, so manual refreshes re-read Codegraph data instead of replaying a cached graph.
- Keeps normal graph requests cached for speed while reserving forced refresh for the activity refresh controls.

## [0.0.45] - 2026-06-18

### Added

- Expands the graph activity strip into a lightweight recent activity popover so users can inspect fresh loads, cached loads, refreshes, expansions, and errors without leaving the graph.
- Adds dedicated refresh controls beside the activity strip and inside the popover, keeping activity inspection separate from reloading the current graph request.

## [0.0.44] - 2026-06-18

### Added

- Adds a compact graph activity strip beside the summary so users can see whether the latest graph load came from fresh data, cache, loading, expansion, or an error.
- Lets users click the activity strip to refresh the current graph request without changing filters or modes.

## [0.0.43] - 2026-06-18

### Added

- Turns the graph insight chips into a compact view-state action bar with `Show full graph`, `Clear focus`, `Show more`, `Clear filters`, and `Fit` recovery actions.
- Keeps cluster-only state visible from the graph surface so users can return to the full graph without hunting through the details pane.

### Fixed

- Refreshes cluster regions after graph animations finish so selected module areas stay aligned after fit, center, zoom, and movement.

## [0.0.42] - 2026-06-18

### Added

- Replaces ambiguous empty/loading canvas text with a compact Graph State card that explains what is happening and offers next actions.
- Adds state-card actions for focusing search, clearing filters, and opening shortcuts when a graph has no visible nodes.

## [0.0.41] - 2026-06-18

### Added

- Adds a lightweight `Shortcuts & gestures` overlay in Graph Explorer, available from the `View` menu or the `?` key.
- Documents the core graph gestures and keyboard shortcuts without adding another always-visible toolbar control.

## [0.0.40] - 2026-06-18

### Changed

- Groups secondary Graph Explorer controls into `View` and `Export` menus so the toolbar keeps core navigation actions visible without becoming a button shelf.
- Keeps the hidden menu actions wired to the existing graph controls and closes open menus on outside click or Escape.

## [0.0.39] - 2026-06-18

### Fixed

- Keeps CodeFlow-style cluster regions synced with graph movement, zooming, dragging, and stabilization frames.
- Adds a visible `Show full graph` action in the details pane while a cluster-only view is active.

## [0.0.38] - 2026-06-18

### Fixed

- Widens the Graph Explorer details pane on desktop so node metadata no longer clips into a narrow strip.
- Reflows the details pane below the graph on constrained editor widths and lets detail tables wrap long paths and labels.

## [0.0.37] - 2026-06-18

### Fixed

- Lets clicks pass through the inside of an active cluster region so nodes can be selected for details without leaving cluster-only mode.
- Keeps cluster region controls available on the active border and label while preserving normal graph interaction inside the box.

## [0.0.36] - 2026-06-18

### Fixed

- Keeps cluster-only mode active when selecting a node inside the cluster to inspect details.
- Separates node selection reset from cluster filter reset so detailed inspection no longer jumps back to the full graph.

## [0.0.35] - 2026-06-18

### Changed

- Makes CodeFlow-style cluster regions clickable so a module box can isolate only its nodes and edges.
- Keeps cluster-only mode reversible through the same clear-focus flow and by clicking the active region again.
- Updates minimap and graph status text to reflect the active cluster-only view.

## [0.0.34] - 2026-06-18

### Changed

- Adds a graph limit down button so an `All` render can be folded back to a smaller visible graph.
- Adds a cluster-region toggle for hiding or showing CodeFlow-style module regions when they obscure the graph.
- Shows a compact `Show fewer nodes` action in node details when the current graph limit can be reduced.

## [0.0.33] - 2026-06-18

### Changed

- Adds a CodeFlow-inspired `Flow` graph layout for left-to-right architecture reading.
- Colors nodes by path/module family and draws lightweight translucent cluster regions behind related folders.
- Keeps the cluster overlay tied to pan, zoom, drag, resize, and stabilization updates so large graphs stay responsive.

## [0.0.32] - 2026-06-18

### Added

- Adds a Codegraph update history command and sidebar icon for opening this changelog from the installed VSIX.
- Shows a one-time update notification with a `View changes` action when the installed extension version changes.

### Changed

- Fixes Graph Explorer webview startup so graph rendering survives ready/load ordering and script parsing.
- Adds Graph Explorer runtime coverage against real Codegraph data.
- Makes the Graph Explorer details pane more compact with table-based node metadata, compact action buttons, and paged connected-node rows.
- Adds one-click `All` expansion for hidden graph items and relationship exploration.
- Reduces graph physics stabilization work on larger visible graphs.

## [0.0.31] - 2026-06-18

### Changed

- Compresses sidebar actions into one six-button icon row.
- Replaces text navigation buttons with compact dashboard, graph, and refresh icons.
- Reduces command preview height to leave more room for search results.

## [0.0.30] - 2026-06-18

### Changed

- Removes the sidebar agent-question input to keep the Codegraph search view compact.
- Replaces long copy labels with a one-line action row, including a compact AI prompt button.
- Shows the Codegraph CLI command used for the latest sidebar search and includes it in copied agent prompts.

## [0.0.29] - 2026-06-18

### Changed

- Adds an explanatory empty state to the dashboard Context tab.
- Shows Callers, Callees, and Impact actions in the Context tab when a search result is selected.
- Clarifies when the Context tab is empty because no relationship lookup has been run yet.

## [0.0.28] - 2026-06-18

### Fixed

- Improves Graph Explorer node contrast so secondary and muted nodes remain visible on dark themes.
- Shortens inspector action labels and adds tooltips so the right details panel no longer clips button text.
- Allows the details panel width to adapt within a small range instead of locking to a cramped fixed width.

## [0.0.27] - 2026-06-18

### Fixed

- Strips ANSI/control sequences from Codegraph CLI JSON output before parsing.
- Recovers JSON payloads when warnings or other non-JSON text surround the CLI output.
- Runs Codegraph CLI commands with color disabled to prevent graph/dashboard/sidebar JSON parse errors.

## [0.0.26] - 2026-06-18

### Changed

- Replaces the Codegraph Activity Bar action tree with an inline sidebar search view.
- Adds the search box, mode/kind filters, result list, multi-select checkboxes, and copy actions directly inside the left Codegraph tab.
- Keeps dashboard and command-palette searches synchronized into the sidebar result list.

## [0.0.25] - 2026-06-18

### Added

- Shows the latest Codegraph search results in the Codegraph Activity Bar view.
- Supports copying one or more search result locations with absolute paths, line numbers, columns, symbol names, and signatures.
- Adds dashboard result checkboxes plus `Copy Locations` and `Copy Prompt` actions.
- Adds an agent-ready prompt copier that combines the user's question with selected Codegraph locations and asks the receiving agent to validate or improve the question against the code structure.

### Changed

- Marks the extension as a preview package and declares trusted workspace requirements for local Codegraph CLI execution.
- Updates packaging to run the test suite before creating a VSIX.
