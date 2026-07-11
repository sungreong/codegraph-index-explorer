import { getWebviewBaseStyles } from "./webviewDesign";

export function getDashboardStyles(): string {
  return `
    ${getWebviewBaseStyles()}
    body {
      margin: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      line-height: 1.42;
    }
    .shell { height: 100vh; min-height: 0; display: grid; grid-template-rows: auto 1fr; }
    header {
      display: none;
    }
    h1 { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: 0; }
    .subtitle, .muted { color: var(--vscode-descriptionForeground); line-height: 1.45; }
    .subtitle { margin-top: 6px; }
    .status-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 8px;
      padding: 6px 18px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: color-mix(in srgb, var(--vscode-editor-background) 72%, var(--vscode-sideBar-background));
      overflow-x: auto;
    }
    .metric {
      position: relative;
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      align-items: center;
      gap: 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 5px 9px 5px 11px;
      background: var(--vscode-editorWidget-background);
      min-width: 0;
    }
    .metric::before {
      content: "";
      position: absolute;
      inset: 7px auto 7px 0;
      width: 2px;
      border-radius: 999px;
      background: var(--vscode-focusBorder);
      opacity: 0.72;
    }
    .metric-label { color: var(--vscode-descriptionForeground); font-size: 11px; margin-bottom: 0; }
    .metric-value { font-size: 13px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    main { display: grid; grid-template-rows: auto 1fr; min-height: 0; }
    .tabs {
      display: flex;
      gap: 4px;
      padding: 5px 18px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
    }
    .tab {
      color: var(--vscode-foreground);
      background: transparent;
      border: 1px solid transparent;
      border-bottom: 0;
      border-radius: 6px 6px 0 0;
      padding: 5px 11px;
      min-height: 28px;
    }
    .tab.active { background: var(--vscode-editorWidget-background); border-color: var(--vscode-panel-border); }
    .tab[aria-selected="true"] { background: var(--vscode-editorWidget-background); border-color: var(--vscode-panel-border); }
    .tab-panels { min-height: 0; display: grid; }
    section.tab-panel { min-width: 0; min-height: 0; display: none; flex-direction: column; container-type: inline-size; }
    section.tab-panel.active { display: flex; }
    .section-head { padding: 14px 16px 10px; border-bottom: 1px solid var(--vscode-panel-border); }
    #tab-search .section-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      gap: 6px;
      padding: 8px 14px;
      background: color-mix(in srgb, var(--vscode-sideBar-background) 74%, var(--vscode-editor-background));
    }
    .section-title {
      margin: 0 0 10px;
      font-size: 13px;
      font-weight: 650;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
    }
    #tab-search .section-title {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
    .search-box { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr minmax(140px, auto) auto; gap: 6px; }
    .head-tools { display: grid; grid-template-columns: 1fr minmax(140px, 0.35fr) auto; gap: 8px; align-items: center; }
    .option-grid { grid-column: 1 / 2; display: grid; grid-template-columns: minmax(150px, 0.6fr) minmax(150px, 0.6fr) 88px 88px; gap: 6px; margin-top: 0; }
    .agent-copy-panel {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      gap: 6px;
      align-items: center;
      margin-top: 0;
    }
    .agent-copy-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .agent-copy-actions button { white-space: nowrap; }
    .search-workbench {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(220px, min(32vw, 380px));
    }
    .results-pane {
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .search-inspector {
      min-width: 0;
      overflow: auto;
      border-left: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
      container-type: inline-size;
    }
    input {
      padding: 7px 9px;
    }
    select {
      padding: 6px 8px;
    }
    button {
      padding: 7px 11px;
      font-weight: 600;
    }
    button.with-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
    }
    .dashboard-icon {
      width: 15px;
      height: 15px;
      display: block;
      flex: 0 0 auto;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.85;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 16px;
      border-top: 1px solid var(--vscode-panel-border);
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      min-height: 34px;
      background: var(--vscode-editor-background);
    }
    .pager, .page-numbers, .row-actions { display: flex; align-items: center; gap: 6px; }
    .pager { min-width: 0; flex-wrap: wrap; white-space: normal; justify-content: flex-end; }
    .page-number { min-width: 28px; }
    .jump { width: 64px; padding: 4px 6px; }
    .pager button, .row-actions button { padding: 3px 8px; font-size: 11px; font-weight: 600; }
    .list { overflow: auto; min-height: 0; }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(112px, max-content);
      gap: 12px;
      padding: 11px 16px;
      border-bottom: 1px solid color-mix(in srgb, var(--vscode-panel-border) 65%, transparent);
      cursor: pointer;
      min-width: 0;
      transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
    }
    .row:has(.result-check) { grid-template-columns: max-content minmax(0, 1fr) minmax(112px, max-content); }
    .result-check {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      align-self: start;
      min-height: 22px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      cursor: pointer;
      user-select: none;
    }
    .result-check input {
      width: 14px;
      height: 14px;
      min-height: 0;
      padding: 0;
      margin: 2px 0 0;
    }
    .result-check span {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
    .row:hover, .row.expanded, .row.selected { background: var(--vscode-list-hoverBackground); }
    .row:focus-visible {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
    }
    .row.selected { box-shadow: inset 2px 0 0 var(--vscode-focusBorder); }
    .row-title {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      font-weight: 600;
      overflow: hidden;
      overflow-wrap: anywhere;
      line-height: 1.35;
    }
    .row-detail {
      margin-top: 3px;
      color: var(--vscode-descriptionForeground);
      overflow-wrap: anywhere;
      font-size: 12px;
      line-height: 1.35;
      min-width: 0;
    }
    .row-relations {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      min-height: 18px;
      margin-top: 5px;
    }
    .row-relations span {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      padding: 1px 6px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 58%, transparent);
      font-size: 10px;
      line-height: 1.35;
      white-space: nowrap;
    }
    .badge {
      align-self: start;
      border-radius: 999px;
      padding: 2px 8px;
      color: var(--vscode-badge-foreground);
      background: var(--vscode-badge-background);
      font-size: 11px;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .row-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; min-width: 112px; max-width: 180px; }
    .row-actions { flex-wrap: wrap; justify-content: flex-end; gap: 4px; }
    .row-actions button,
    .row-side > button {
      min-height: 28px;
      min-width: 54px;
    }
    .index-note {
      padding: 8px 14px;
      border-bottom: 1px solid var(--vscode-panel-border);
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 52%, transparent);
      font-size: 11px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .inspector-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      gap: 10px;
      align-items: start;
      padding: 14px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .inspector-head span {
      display: block;
      margin-bottom: 5px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      text-transform: uppercase;
    }
    .inspector-head strong {
      display: block;
      overflow-wrap: anywhere;
      font-size: 14px;
      line-height: 1.35;
    }
    .inspector-location,
    .inspector-detail {
      margin: 12px 14px 0;
      color: var(--vscode-descriptionForeground);
      line-height: 1.45;
      overflow-wrap: anywhere;
    }
    .inspector-location {
      padding: 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      background: var(--vscode-editorWidget-background);
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }
    .inspector-detail {
      font-size: 12px;
      max-height: 140px;
      overflow: auto;
    }
    .relationship-summary {
      margin: 12px 14px 0;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 64%, transparent);
      overflow: hidden;
    }
    .relationship-title {
      padding: 7px 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-weight: 650;
      text-transform: uppercase;
    }
    .relationship-loading {
      padding: 9px 8px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      line-height: 1.4;
    }
    .relationship-grid {
      display: grid;
      grid-template-columns: 1fr;
    }
    .relationship-group {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr) minmax(44px, auto);
      gap: 8px;
      min-width: 0;
      width: 100%;
      padding: 8px;
      border: 0;
      border-top: 1px solid color-mix(in srgb, var(--vscode-panel-border) 62%, transparent);
      border-radius: 0;
      color: inherit;
      background: transparent;
      text-align: left;
    }
    .relationship-group:hover { background: var(--vscode-list-hoverBackground); }
    .relationship-group:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: -2px; }
    .relationship-group:first-child { border-top: 0; }
    .relationship-group strong {
      display: block;
      color: var(--vscode-foreground);
      font-size: 14px;
      line-height: 1.1;
    }
    .relationship-group div > span {
      display: block;
      margin-top: 3px;
      color: var(--vscode-descriptionForeground);
      font-size: 10px;
      text-transform: uppercase;
    }
    .relationship-group p {
      display: grid;
      gap: 3px;
      margin: 0;
      min-width: 0;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      line-height: 1.35;
    }
    .relationship-group p span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .graph-cue {
      align-self: center;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      padding: 1px 6px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 68%, transparent);
      font-size: 10px;
      line-height: 1.4;
      white-space: nowrap;
    }
    .relationship-error { color: var(--vscode-errorForeground); }
    .inspector-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
      padding: 14px;
    }
    .inspector-actions button { width: 100%; }
    .inspector-actions .primary-action {
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
    }
    .context { background: var(--vscode-sideBar-background); overflow: auto; min-height: 0; flex: 1; }
    .context-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .context-title { font-weight: 650; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .context-note { color: var(--vscode-descriptionForeground); font-size: 12px; white-space: nowrap; }
    .context-intro {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .context-intro div,
    .context-empty {
      min-width: 0;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 10px;
      background: var(--vscode-editorWidget-background);
    }
    .context-intro span {
      display: block;
      margin-bottom: 5px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-weight: 650;
      text-transform: uppercase;
    }
    .context-intro strong,
    .context-empty strong {
      display: block;
      color: var(--vscode-foreground);
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .context-intro p,
    .context-empty p {
      margin: 7px 0 0;
      color: var(--vscode-descriptionForeground);
      line-height: 1.45;
    }
    .context-empty { margin: 14px 16px; }
    .context-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px 14px;
    }
    .context-empty .context-actions {
      padding: 10px 0 0;
    }
    .context-actions button {
      min-width: 92px;
    }
    .empty { padding: 22px 16px; color: var(--vscode-descriptionForeground); line-height: 1.5; }
    .empty strong { display: block; color: var(--vscode-foreground); font-size: 13px; margin-bottom: 4px; }
    .empty p { margin: 0; max-width: 680px; }
    .empty-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 12px;
    }
    .empty-actions button { min-height: 30px; }
    .setup-empty {
      max-width: 720px;
      padding-top: 30px;
      padding-bottom: 30px;
    }
    .setup-empty strong { font-size: 15px; }
    .text-action {
      margin-top: 12px;
      padding: 0;
      min-height: 22px;
      color: var(--vscode-textLink-foreground);
      background: transparent;
      border: 0;
      font-weight: 650;
    }
    .text-action:hover {
      color: var(--vscode-textLink-activeForeground);
      background: transparent;
      text-decoration: underline;
    }
    .error { padding: 10px 16px; color: var(--vscode-errorForeground); border-bottom: 1px solid var(--vscode-panel-border); }
    .command-details {
      grid-column: 2 / 3;
      align-self: center;
      margin-top: 0;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
    }
    .command-details summary {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 2px 7px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 54%, transparent);
      cursor: pointer;
      user-select: none;
    }
    .command-details[open] {
      grid-column: 1 / -1;
      align-self: stretch;
    }
    .command-details summary:focus-visible {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
    .preview-box {
      margin-top: 6px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 8px;
      background: var(--vscode-editorWidget-background);
      color: var(--vscode-descriptionForeground);
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      overflow: auto;
    }
    .inline-detail {
      grid-column: 1 / -1;
      margin-top: 4px;
      padding-top: 10px;
      border-top: 1px solid var(--vscode-panel-border);
      color: var(--vscode-descriptionForeground);
      cursor: default;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .detail-grid div {
      min-width: 0;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 8px;
      background: var(--vscode-editorWidget-background);
    }
    .detail-grid span {
      display: block;
      margin-bottom: 4px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      text-transform: uppercase;
    }
    .detail-grid strong {
      display: block;
      color: var(--vscode-foreground);
      font-size: 12px;
      white-space: normal;
      overflow-wrap: anywhere;
      line-height: 1.35;
    }
    .inline-detail pre {
      max-height: 260px;
      margin: 10px 0 0;
      overflow: auto;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      white-space: pre-wrap;
    }
    .action-tab {
      margin-left: auto;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-secondaryBackground);
      border-color: transparent;
      border-radius: 4px;
      align-self: center;
    }
    .action-tab.active {
      background: var(--vscode-button-secondaryBackground);
      border-color: transparent;
    }
    @media (max-width: 820px) {
      .status-row { grid-template-columns: repeat(4, minmax(120px, 1fr)); }
      .search-workbench { grid-template-columns: 1fr; }
      .search-inspector { border-left: 0; border-top: 1px solid var(--vscode-panel-border); max-height: 230px; }
      .detail-grid { grid-template-columns: 1fr; }
      section.tab-panel { min-height: 360px; }
    }
    @container (max-width: 900px) {
      .search-workbench { grid-template-columns: 1fr; }
      .search-inspector { border-left: 0; border-top: 1px solid var(--vscode-panel-border); max-height: 260px; }
      .row,
      .row:has(.result-check) { grid-template-columns: max-content minmax(0, 1fr); }
      .row:not(:has(.result-check)) { grid-template-columns: 1fr; }
      .row-side { grid-column: 1 / -1; min-width: 0; max-width: none; align-items: flex-start; }
      .row-actions { justify-content: flex-start; }
      .toolbar { align-items: flex-start; }
      .pager { justify-content: flex-start; }
    }
    @container (max-width: 320px) {
      .inspector-head { grid-template-columns: 1fr; }
      .relationship-group { grid-template-columns: 1fr; }
      .relationship-group p span {
        white-space: normal;
        overflow-wrap: anywhere;
      }
      .graph-cue { display: none; }
      .inspector-actions { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      header { padding: 10px 12px; }
      .status-row { padding: 5px 12px; gap: 6px; }
      .metric { grid-template-columns: 1fr; gap: 2px; }
      .tabs { padding: 5px 12px 0; overflow-x: auto; }
      .tab { padding: 5px 9px; }
      .section-head { padding: 10px 12px; }
      .search-box,
      .head-tools,
      .agent-copy-panel,
      .option-grid { grid-template-columns: 1fr; }
      #tab-search .section-head,
      .search-box,
      .option-grid,
      .agent-copy-panel,
      .command-details,
      .command-details[open] { grid-column: 1 / -1; }
      .agent-copy-actions { justify-content: flex-start; }
      .toolbar { align-items: flex-start; flex-direction: column; }
      .pager { flex-wrap: wrap; white-space: normal; }
      .row { grid-template-columns: 1fr; gap: 8px; padding: 9px 12px; }
      .row:has(.result-check) { grid-template-columns: max-content minmax(0, 1fr); }
      .row-side { min-width: 0; align-items: flex-start; }
      .row-actions { justify-content: flex-start; }
      .relationship-group { grid-template-columns: 54px minmax(0, 1fr) max-content; }
      .page-numbers { flex-wrap: wrap; }
      .search-inspector { max-height: 260px; }
      .context-intro { grid-template-columns: 1fr; padding: 12px; }
      .context-empty { margin: 12px; }
      .context-actions { padding-inline: 12px; }
    }
  `;
}
