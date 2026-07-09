import { getGraphDetailStyles } from "./graphDetailStyles";
import { getWebviewBaseStyles } from "./webviewDesign";

export function getGraphStyles(): string {
  return `
    ${getWebviewBaseStyles()}
    body {
      margin: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .graph-shell { height: 100vh; display: grid; grid-template-rows: auto auto 1fr; min-height: 0; }
    .topbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, auto);
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 32px;
      padding: 5px 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
    }
    .title-row {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .topbar-meta {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 6px;
      min-width: 0;
      max-width: 100%;
    }
    h1 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0; white-space: nowrap; }
    .subtitle, .summary, .details p { color: var(--vscode-descriptionForeground); line-height: 1.45; }
    .subtitle {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
    }
    .subtitle::before {
      content: "|";
      margin-right: 8px;
      color: var(--vscode-panel-border);
    }
    .summary {
      white-space: nowrap;
      font-size: 12px;
      font-weight: 650;
      min-width: 0;
      padding: 2px 7px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      background: color-mix(in srgb, var(--vscode-editor-background) 74%, transparent);
    }
    .activity-strip {
      min-height: 24px;
      max-width: min(360px, 30vw);
      padding: 2px 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editor-background) 66%, transparent);
      font-size: 11px;
      font-weight: 650;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .index-freshness {
      min-height: 24px;
      max-width: min(220px, 20vw);
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editor-background) 74%, transparent);
      font-size: 11px;
      font-weight: 650;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .index-freshness.fresh {
      color: var(--vscode-foreground);
      border-color: color-mix(in srgb, var(--vscode-focusBorder) 34%, var(--vscode-panel-border));
    }
    .index-freshness.stale {
      color: var(--vscode-editorWarning-foreground);
      border-color: color-mix(in srgb, var(--vscode-editorWarning-foreground) 42%, var(--vscode-panel-border));
    }
    .activity-strip:hover { color: var(--vscode-foreground); }
    .activity-strip.cached {
      border-color: color-mix(in srgb, var(--vscode-editorWarning-foreground) 42%, var(--vscode-panel-border));
      color: var(--vscode-editorWarning-foreground);
    }
    .activity-strip.loading {
      border-color: color-mix(in srgb, var(--vscode-focusBorder) 42%, var(--vscode-panel-border));
      color: var(--vscode-focusBorder);
    }
    .activity-strip.error {
      border-color: color-mix(in srgb, var(--vscode-errorForeground) 45%, var(--vscode-panel-border));
      color: var(--vscode-errorForeground);
    }
    .activity-refresh {
      min-width: 24px;
      width: 24px;
      min-height: 24px;
      padding: 0;
      border-radius: 999px;
      color: var(--vscode-button-secondaryForeground);
      background: var(--vscode-button-secondaryBackground);
      font-size: 13px;
      line-height: 1;
    }
    .graph-icon {
      width: 15px;
      height: 15px;
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.85;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    .panel-toggle {
      min-height: 24px;
      padding: 2px 8px;
      border-radius: 999px;
      color: var(--vscode-button-secondaryForeground);
      background: var(--vscode-button-secondaryBackground);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    .panel-toggle[aria-expanded="true"] {
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
    }
    .activity-panel {
      position: absolute;
      z-index: 8;
      top: calc(100% + 7px);
      right: 0;
      width: min(430px, calc(100vw - 24px));
      max-width: calc(100vw - 24px);
      padding: 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background: var(--vscode-sideBar-background);
      box-shadow: 0 12px 30px color-mix(in srgb, #000 28%, transparent);
    }
    .activity-panel[hidden] { display: none; }
    .activity-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
    .activity-panel-head strong {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
    }
    .activity-panel-head button {
      min-height: 24px;
      padding: 3px 8px;
      font-size: 11px;
    }
    .activity-list {
      display: grid;
      gap: 4px;
      max-height: 210px;
      overflow: auto;
    }
    .activity-item {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr) max-content;
      gap: 8px;
      align-items: center;
      min-height: 28px;
      padding: 5px 7px;
      border: 1px solid color-mix(in srgb, var(--vscode-panel-border) 78%, transparent);
      border-radius: 4px;
      background: color-mix(in srgb, var(--vscode-editor-background) 58%, transparent);
      font-size: 11px;
    }
    .activity-item time,
    .activity-kind {
      color: var(--vscode-descriptionForeground);
      white-space: nowrap;
    }
    .activity-item span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .activity-kind {
      text-transform: uppercase;
      font-weight: 700;
    }
    .activity-kind.cached { color: var(--vscode-editorWarning-foreground); }
    .activity-kind.loading { color: var(--vscode-focusBorder); }
    .activity-kind.error { color: var(--vscode-errorForeground); }
    .controls {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) minmax(0, auto) minmax(0, auto);
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
    }
    body.controls-collapsed .controls { display: none; }
    .quick-selects {
      display: flex;
      gap: 6px;
      min-width: 0;
    }
    .quick-selects select { width: 132px; }
    .icon-actions {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-width: 0;
      flex-wrap: wrap;
      white-space: nowrap;
      position: relative;
    }
    input, select {
      padding: 7px 9px;
    }
    button {
      padding: 7px 12px;
    }
    .icon-button {
      width: 34px;
      min-width: 34px;
      min-height: 30px;
      padding: 0;
      display: inline-grid;
      place-items: center;
      font-size: 15px;
      line-height: 1;
    }
    .icon-button.primary { background: var(--vscode-button-background); }
    .advanced-controls,
    .action-menu { position: relative; }
    .advanced-controls summary,
    .action-menu summary {
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      color: var(--vscode-button-secondaryForeground);
      background: var(--vscode-button-secondaryBackground);
      cursor: pointer;
      list-style: none;
    }
    .advanced-controls summary::-webkit-details-marker,
    .action-menu summary::-webkit-details-marker { display: none; }
    .advanced-controls[open] summary,
    .action-menu[open] summary {
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
    }
    .menu-button {
      min-height: 30px;
      min-width: 58px;
      padding: 0 9px;
      display: inline-grid;
      place-items: center;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
    }
    .advanced-panel {
      position: absolute;
      z-index: 4;
      right: 0;
      top: 36px;
      width: min(258px, calc(100vw - 24px));
      max-width: calc(100vw - 24px);
      padding: 10px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background: var(--vscode-editorWidget-background);
      box-shadow: 0 12px 34px color-mix(in srgb, var(--vscode-editor-background) 70%, transparent);
    }
    .action-menu-panel {
      position: absolute;
      z-index: 5;
      right: 0;
      top: 36px;
      width: min(168px, calc(100vw - 24px));
      max-width: calc(100vw - 24px);
      padding: 6px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background: var(--vscode-editorWidget-background);
      box-shadow: 0 12px 34px color-mix(in srgb, var(--vscode-editor-background) 70%, transparent);
    }
    .menu-action {
      width: 100%;
      min-height: 28px;
      padding: 5px 8px;
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr);
      align-items: center;
      gap: 5px;
      text-align: left;
      font-size: 12px;
    }
    .menu-action span {
      display: inline-grid;
      place-items: center;
      min-width: 0;
      color: var(--vscode-descriptionForeground);
      font-weight: 700;
    }
    .menu-action span .graph-icon {
      width: 14px;
      height: 14px;
    }
    .advanced-panel label {
      display: grid;
      grid-template-columns: 74px minmax(0, 1fr);
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .advanced-panel span {
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      text-transform: uppercase;
    }
    .advanced-panel input,
    .advanced-panel select { width: 100%; min-width: 0; }
    .graph-stage { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); }
    body.details-open .graph-stage { grid-template-columns: minmax(320px, 1fr) minmax(300px, clamp(300px, 26vw, 480px)); }
    .canvas-wrap { position: relative; min-width: 0; min-height: 520px; overflow: hidden; }
    .graph-insight {
      position: absolute;
      z-index: 3;
      left: 14px;
      top: 12px;
      right: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      pointer-events: none;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .graph-insight::-webkit-scrollbar { display: none; }
    .insight-chip,
    .insight-action {
      flex: 0 0 auto;
      pointer-events: auto;
    }
    .insight-chip {
      max-width: min(360px, 42vw);
      padding: 5px 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editor-background) 88%, transparent);
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .insight-chip.strong {
      color: var(--vscode-foreground);
      border-color: color-mix(in srgb, var(--vscode-focusBorder) 55%, var(--vscode-panel-border));
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 88%, transparent);
      font-weight: 650;
    }
    .insight-chip.warning {
      color: var(--vscode-editorWarning-foreground);
      border-color: color-mix(in srgb, var(--vscode-editorWarning-foreground) 52%, var(--vscode-panel-border));
    }
    .insight-action {
      min-height: 26px;
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 650;
      white-space: nowrap;
    }
    .legend {
      position: absolute;
      z-index: 3;
      left: 14px;
      top: 48px;
      display: flex;
      gap: 14px;
      padding: 7px 9px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editor-background) 92%, transparent);
      font-size: 12px;
      white-space: nowrap;
      display: none;
    }
    body.legend-open .legend { display: flex; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .graph-hud {
      position: absolute;
      z-index: 3;
      left: 14px;
      bottom: 12px;
      max-width: min(420px, calc(100% - 220px));
      padding: 5px 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editor-background) 82%, transparent);
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .graph-mode-bar {
      position: absolute;
      z-index: 3;
      left: 14px;
      right: 14px;
      bottom: 46px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      gap: 8px;
      align-items: center;
      max-width: 900px;
      padding: 7px 8px;
      border: 1px solid color-mix(in srgb, var(--vscode-focusBorder) 34%, var(--vscode-panel-border));
      border-radius: 6px;
      background: color-mix(in srgb, var(--vscode-editor-background) 88%, transparent);
      box-shadow: 0 8px 24px color-mix(in srgb, var(--vscode-editor-background) 48%, transparent);
    }
    .graph-mode-bar[hidden] { display: none; }
    .mode-copy,
    .mode-actions {
      display: flex;
      align-items: center;
      gap: 5px;
      min-width: 0;
      flex-wrap: wrap;
    }
    .mode-copy span {
      min-width: 0;
      max-width: 220px;
      padding: 3px 7px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 70%, transparent);
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mode-actions button {
      min-height: 24px;
      padding: 3px 8px;
      font-size: 11px;
      white-space: nowrap;
    }
    .mode-overflow {
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      white-space: nowrap;
    }
    .hover-tip {
      position: absolute;
      z-index: 4;
      max-width: 260px;
      padding: 9px 10px;
      border: 1px solid var(--vscode-focusBorder);
      border-radius: 6px;
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 94%, transparent);
      box-shadow: 0 10px 28px color-mix(in srgb, var(--vscode-editor-background) 65%, transparent);
      pointer-events: none;
      opacity: 0;
      transition: opacity 120ms ease;
    }
    .hover-tip.visible { opacity: 1; }
    .tip-kind {
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .tip-title {
      color: var(--vscode-foreground);
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .tip-path {
      margin-top: 4px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .mini-map {
      position: absolute;
      right: 14px;
      bottom: 14px;
      z-index: 3;
      width: 170px;
      height: 108px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background: color-mix(in srgb, var(--vscode-editor-background) 90%, transparent);
      box-shadow: 0 8px 22px color-mix(in srgb, var(--vscode-editor-background) 55%, transparent);
      pointer-events: none;
      display: none;
    }
    body.mini-map-open .mini-map { display: block; }
    .mini-map line {
      stroke: var(--vscode-descriptionForeground);
      stroke-opacity: 0.28;
      stroke-width: 0.7;
    }
    .mini-map circle {
      fill: var(--vscode-editorWidget-background);
      stroke: var(--vscode-focusBorder);
      stroke-width: 0.7;
      opacity: 0.72;
    }
    .mini-map circle.symbol { fill: var(--vscode-button-background); }
    .mini-map circle.match { fill: var(--vscode-editorWarning-foreground); }
    .mini-map circle.file { fill: var(--vscode-badge-background); }
    .mini-map circle.directory { fill: var(--vscode-editorInfo-foreground); }
    .mini-map circle.selected { opacity: 1; stroke-width: 1.8; }
    .shortcut-overlay {
      position: absolute;
      z-index: 6;
      right: 14px;
      top: 58px;
      width: min(320px, calc(100% - 28px));
      padding: 10px;
      border: 1px solid var(--vscode-focusBorder);
      border-radius: 6px;
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 96%, transparent);
      box-shadow: 0 14px 40px color-mix(in srgb, var(--vscode-editor-background) 62%, transparent);
    }
    .shortcut-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 28px;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .shortcut-head strong {
      font-size: 12px;
      text-transform: uppercase;
    }
    .shortcut-head .icon-button {
      width: 28px;
      min-width: 28px;
      min-height: 26px;
    }
    .shortcut-grid {
      display: grid;
      grid-template-columns: 74px minmax(0, 1fr);
      gap: 5px 10px;
      align-items: start;
    }
    .shortcut-grid span {
      display: inline-grid;
      min-height: 22px;
      place-items: center;
      padding: 2px 6px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-size: 11px;
      font-weight: 700;
    }
    .shortcut-grid p {
      margin: 2px 0 0;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      line-height: 1.35;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 1px solid var(--vscode-focusBorder);
      background: var(--vscode-editorWidget-background);
    }
    .dot.symbol { background: var(--vscode-button-background); }
    .dot.match { background: var(--vscode-editorWarning-foreground); }
    .dot.file { background: var(--vscode-badge-background); }
    .dot.directory { background: var(--vscode-editorInfo-foreground); }
    .graph-network {
      position: absolute;
      inset: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
      background:
        radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--vscode-focusBorder) 7%, transparent), transparent 34%),
        radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--vscode-descriptionForeground) 16%, transparent) 1px, transparent 0) 0 0 / 24px 24px,
        var(--vscode-editor-background);
      touch-action: none;
      user-select: none;
    }
    .graph-network canvas { outline: none; }
    .graph-network:active { cursor: grabbing; }
    .cluster-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
    }
    .cluster-hull {
      cursor: zoom-in;
      pointer-events: none;
    }
    .cluster-fill {
      fill: color-mix(in srgb, var(--cluster) 11%, transparent);
      stroke: color-mix(in srgb, var(--cluster) 68%, transparent);
      stroke-width: 1.6;
      pointer-events: auto;
    }
    .cluster-hull:hover .cluster-fill,
    .cluster-hull:focus-visible .cluster-fill {
      fill: color-mix(in srgb, var(--cluster) 18%, transparent);
      stroke: var(--cluster);
      stroke-width: 2.2;
    }
    .cluster-hull.active .cluster-fill {
      fill: color-mix(in srgb, var(--cluster) 16%, transparent);
      stroke: var(--cluster);
      stroke-width: 2.4;
      pointer-events: stroke;
    }
    .cluster-label {
      fill: var(--cluster);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      paint-order: stroke;
      stroke: var(--vscode-editor-background);
      stroke-width: 4px;
      stroke-linejoin: round;
      pointer-events: auto;
    }
    ${getGraphDetailStyles()}
    @media (prefers-reduced-motion: reduce) {
      .hover-tip { transition: none; }
    }
  `;
}
