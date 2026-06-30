export function getGraphDetailStyles(): string {
  return `
    .details {
      min-width: 0;
      max-width: 100%;
      min-height: 0;
      padding: 12px;
      border-left: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
      overflow: auto;
      display: none;
      container-type: inline-size;
    }
    .details * { box-sizing: border-box; }
    body.details-open .details { display: block; }
    .details h2 {
      margin: 0;
      min-width: 0;
      font-size: 13px;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .detail-head {
      display: grid;
      grid-template-columns: 26px minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      min-width: 0;
      margin-bottom: 8px;
    }
    .node-orb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid var(--vscode-focusBorder);
      background: var(--vscode-editorWidget-background);
      box-shadow: 0 0 12px color-mix(in srgb, var(--vscode-focusBorder) 42%, transparent);
    }
    .detail-head.symbol .node-orb { background: var(--vscode-button-background); }
    .detail-head.file .node-orb { background: var(--vscode-badge-background); }
    .detail-head.directory .node-orb { background: var(--vscode-editorInfo-foreground); }
    .detail-kind {
      margin-top: 1px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }
    .detail-insight {
      margin: 0 0 8px;
      padding: 7px 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 72%, transparent);
      font-size: 12px;
    }
    .detail-primary-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
      gap: 6px;
      margin: 8px 0;
    }
    .detail-primary-actions button,
    .detail-actions .group-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .detail-primary-actions button {
      min-width: 0;
      min-height: 30px;
      padding: 6px 9px;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .detail-primary-actions .primary-action {
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
    }
    .detail-primary-actions .graph-icon,
    .detail-actions .graph-icon {
      flex: 0 0 auto;
      width: 14px;
      height: 14px;
    }
    .cluster-return {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(112px, auto);
      align-items: center;
      gap: 8px;
      margin: 0 0 8px;
      padding: 8px;
      border: 1px solid color-mix(in srgb, var(--vscode-focusBorder) 58%, var(--vscode-panel-border));
      border-radius: 4px;
      background: color-mix(in srgb, var(--vscode-focusBorder) 12%, var(--vscode-editorWidget-background));
    }
    .cluster-return strong,
    .cluster-return span {
      display: block;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .cluster-return strong {
      font-size: 11px;
      text-transform: uppercase;
    }
    .cluster-return span {
      margin-top: 2px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }
    .cluster-return-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 5px;
      min-width: 0;
    }
    .cluster-return button {
      min-height: 28px;
      min-width: 0;
      padding: 5px 8px;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .detail-table,
    .neighbor-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 12px;
    }
    .detail-table th,
    .detail-table td,
    .neighbor-table th,
    .neighbor-table td {
      padding: 5px 6px;
      border-bottom: 1px solid color-mix(in srgb, var(--vscode-panel-border) 72%, transparent);
      vertical-align: top;
      text-align: left;
    }
    .detail-table th,
    .neighbor-table th {
      width: clamp(64px, 30%, 92px);
      min-width: 0;
      color: var(--vscode-descriptionForeground);
      font-weight: 650;
      text-transform: uppercase;
      font-size: 10px;
      overflow-wrap: anywhere;
    }
    .detail-table td,
    .neighbor-table td {
      color: var(--vscode-foreground);
      font-weight: 600;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .compact-section,
    .neighbor-list,
    .raw-payload {
      margin-top: 10px;
      border-top: 1px solid var(--vscode-panel-border);
      padding-top: 8px;
    }
    .section-title,
    .section-row h3,
    .raw-payload summary {
      margin: 0;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .section-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 5px;
    }
    .section-row span {
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
    }
    .details pre {
      margin: 8px 0 0;
      max-height: 180px;
      padding: 8px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      background: var(--vscode-editorWidget-background);
      overflow: auto;
      white-space: pre-wrap;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }
    .raw-payload summary { cursor: pointer; }
    .detail-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(34px, 1fr));
      gap: 5px;
      margin: 8px 0;
    }
    .detail-actions .icon-button {
      width: 100%;
      min-width: 0;
      font-size: 12px;
    }
    .detail-actions .group-action {
      width: 100%;
      min-width: 58px;
      min-height: 28px;
      padding: 5px 8px;
      font-size: 12px;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    button:disabled {
      cursor: default;
      opacity: 0.45;
    }
    .neighbor-table tr {
      cursor: pointer;
    }
    .neighbor-table tr:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .neighbor-table td {
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .neighbor-table tr.not-rendered td {
      color: var(--vscode-descriptionForeground);
      font-weight: 500;
    }
    .neighbor-status {
      display: inline-flex;
      margin-left: 6px;
      padding: 1px 5px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 999px;
      color: var(--vscode-descriptionForeground);
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      vertical-align: 1px;
    }
    .pager {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 6px;
    }
    .pager button {
      min-height: 26px;
      padding: 4px 8px;
    }
    .state-card {
      position: absolute;
      z-index: 2;
      left: 50%;
      top: 50%;
      width: min(360px, calc(100% - 32px));
      padding: 14px;
      transform: translate(-50%, -50%);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 94%, transparent);
      box-shadow: 0 14px 36px color-mix(in srgb, var(--vscode-editor-background) 58%, transparent);
      font-size: 12px;
      line-height: 1.42;
    }
    .state-title {
      margin-bottom: 5px;
      color: var(--vscode-foreground);
      font-size: 13px;
      font-weight: 700;
    }
    .state-card p {
      margin: 0;
    }
    .state-card.loading::before {
      content: "";
      display: inline-block;
      width: 11px;
      height: 11px;
      margin-right: 8px;
      border: 2px solid color-mix(in srgb, var(--vscode-descriptionForeground) 45%, transparent);
      border-top-color: var(--vscode-focusBorder);
      border-radius: 50%;
      vertical-align: -2px;
      animation: graph-spin 900ms linear infinite;
    }
    .state-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 11px;
    }
    .state-actions button {
      min-height: 27px;
      padding: 5px 9px;
    }
    .loading-label::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 10px;
      margin-right: 8px;
      border: 2px solid color-mix(in srgb, var(--vscode-descriptionForeground) 45%, transparent);
      border-top-color: var(--vscode-focusBorder);
      border-radius: 50%;
      vertical-align: -2px;
      animation: graph-spin 900ms linear infinite;
    }
    @keyframes graph-spin { to { transform: rotate(360deg); } }
    .hover-tip.static-tip {
      left: 14px;
      top: 48px;
      transform: none;
    }
    @container (max-width: 420px) {
      .detail-head {
        grid-template-columns: 22px minmax(0, 1fr);
        gap: 7px;
      }
      .node-orb {
        width: 17px;
        height: 17px;
      }
      .detail-table tr,
      .neighbor-table tr {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1px;
        padding: 5px 0;
        border-bottom: 1px solid color-mix(in srgb, var(--vscode-panel-border) 72%, transparent);
      }
      .detail-table th,
      .detail-table td,
      .neighbor-table th,
      .neighbor-table td {
        width: auto;
        min-width: 0;
        padding: 1px 0;
        border-bottom: 0;
      }
      .detail-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .cluster-return {
        grid-template-columns: 1fr;
      }
      .cluster-return button {
        width: 100%;
      }
    }
    @media (max-width: 1180px) {
      .canvas-wrap { min-height: 460px; }
      body.details-open .graph-stage {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(460px, 1fr) minmax(190px, 34vh);
      }
      .details {
        border-left: 0;
        border-top: 1px solid var(--vscode-panel-border);
      }
    }
    @media (max-width: 920px) {
      .topbar { grid-template-columns: 1fr; align-items: start; }
      .summary { justify-self: start; }
      .controls { grid-template-columns: 1fr; }
      body.controls-collapsed .graph-stage { grid-template-rows: minmax(0, 1fr); }
      .quick-selects { display: grid; grid-template-columns: 1fr 1fr; }
      .quick-selects select { width: 100%; }
      .icon-actions { justify-content: start; flex-wrap: wrap; }
      .advanced-panel { left: 0; right: auto; }
      .action-menu-panel { left: 0; right: auto; }
      .canvas-wrap { min-height: 420px; }
      .graph-stage { grid-template-columns: 1fr; grid-template-rows: minmax(420px, 1fr); }
      body.details-open .graph-stage { grid-template-columns: 1fr; grid-template-rows: minmax(420px, 1fr) minmax(170px, 32vh); }
      .details { border-left: 0; border-top: 1px solid var(--vscode-panel-border); }
      .topbar { align-items: start; flex-direction: column; }
      .mini-map { width: 132px; height: 84px; }
      .graph-hud { max-width: calc(100% - 164px); }
      .graph-mode-bar {
        grid-template-columns: 1fr;
        right: 10px;
        bottom: 42px;
        max-width: none;
      }
      .mode-actions {
        justify-content: start;
      }
      .graph-insight { left: 10px; right: 10px; top: 10px; }
      .insight-chip { max-width: min(300px, 72vw); }
    }
    @media (max-width: 560px) {
      .topbar {
        gap: 4px;
        padding: 5px 8px;
      }
      .title-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2px;
      }
      .subtitle::before { content: ""; margin: 0; }
      .summary {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .controls {
        gap: 6px;
        padding: 6px 8px;
      }
      .panel-toggle {
        min-height: 26px;
        padding: 3px 8px;
      }
      .icon-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
        width: 100%;
      }
      .icon-button {
        width: 100%;
        min-width: 30px;
        min-height: 30px;
      }
      .advanced-controls { position: static; }
      .action-menu { position: static; }
      .advanced-panel {
        left: 0;
        right: 0;
        top: auto;
        width: auto;
        margin-top: 6px;
      }
      .action-menu-panel {
        left: 8px;
        right: 8px;
        top: auto;
        width: auto;
        margin-top: 6px;
      }
      .canvas-wrap { min-height: 380px; }
      .graph-hud {
        left: 8px;
        right: 8px;
        bottom: 8px;
        max-width: none;
        border-radius: 4px;
      }
      .legend {
        left: 8px;
        right: 8px;
        top: 48px;
        flex-wrap: wrap;
        white-space: normal;
      }
      .graph-insight {
        left: 8px;
        right: 8px;
        top: 8px;
      }
      .insight-chip {
        max-width: 78vw;
        padding: 4px 7px;
      }
      .mini-map {
        right: 8px;
        bottom: 42px;
        width: 116px;
        height: 74px;
      }
      .shortcut-overlay {
        left: 8px;
        right: 8px;
        top: 104px;
        width: auto;
      }
      .shortcut-grid {
        grid-template-columns: 64px minmax(0, 1fr);
      }
      body.details-open .graph-stage {
        grid-template-rows: minmax(360px, 1fr) minmax(150px, 30vh);
      }
      .details { padding: 10px; }
      .detail-actions { grid-template-columns: repeat(auto-fit, minmax(32px, 1fr)); }
    }
  `;
}
