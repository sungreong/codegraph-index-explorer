export function getWebviewBaseStyles(): string {
  return `
    :root {
      color-scheme: light dark;
      --cg-space-1: 4px;
      --cg-space-2: 6px;
      --cg-space-3: 8px;
      --cg-space-4: 10px;
      --cg-space-5: 12px;
      --cg-radius-sm: 4px;
      --cg-radius-md: 6px;
      --cg-radius-pill: 999px;
      --cg-control-height: 30px;
      --cg-border: var(--vscode-panel-border);
      --cg-focus-ring: var(--vscode-focusBorder);
      --cg-surface: var(--vscode-editorWidget-background);
      --cg-surface-muted: color-mix(in srgb, var(--vscode-editorWidget-background) 68%, transparent);
      --cg-danger: var(--vscode-errorForeground);
      --cg-warning: var(--vscode-editorWarning-foreground);
      --cg-info: var(--vscode-editorInfo-foreground);
      --cg-muted-fg: var(--vscode-descriptionForeground);
      --cg-button-bg: var(--vscode-button-background);
      --cg-button-fg: var(--vscode-button-foreground);
      --cg-button-bg-hover: var(--vscode-button-hoverBackground);
      --cg-button-secondary-bg: var(--vscode-button-secondaryBackground);
      --cg-button-secondary-fg: var(--vscode-button-secondaryForeground);
      --cg-button-secondary-bg-hover: var(--vscode-button-secondaryHoverBackground);
    }
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    button,
    input,
    select,
    textarea {
      min-width: 0;
      font: inherit;
      letter-spacing: 0;
    }
    input,
    select,
    textarea {
      width: 100%;
      min-height: var(--cg-control-height);
      border: 1px solid var(--vscode-input-border, var(--cg-border));
      border-radius: var(--cg-radius-sm);
      outline: none;
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
    }
    select {
      border-color: var(--vscode-dropdown-border, var(--cg-border));
      color: var(--vscode-dropdown-foreground);
      background: var(--vscode-dropdown-background);
    }
    button {
      min-height: var(--cg-control-height);
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: var(--cg-radius-sm);
      color: var(--cg-button-fg);
      background: var(--cg-button-bg);
      cursor: pointer;
      font-weight: 650;
    }
    button:hover { background: var(--cg-button-bg-hover); }
    button.ghost,
    button.secondary {
      color: var(--cg-button-secondary-fg);
      background: var(--cg-button-secondary-bg);
    }
    button.ghost:hover,
    button.secondary:hover {
      background: var(--cg-button-secondary-bg-hover);
    }
    button.primary-action,
    button.primary {
      color: var(--cg-button-fg);
      background: var(--cg-button-bg);
    }
    button:disabled,
    input:disabled,
    select:disabled,
    textarea:disabled {
      opacity: 0.52;
      cursor: not-allowed;
    }
    button:focus-visible,
    input:focus,
    select:focus,
    textarea:focus,
    summary:focus-visible,
    [role="button"]:focus-visible,
    [role="option"]:focus-visible,
    [role="tab"]:focus-visible {
      outline: 1px solid var(--cg-focus-ring);
      outline-offset: 2px;
      border-color: var(--cg-focus-ring);
    }
    .empty {
      color: var(--cg-muted-fg);
      line-height: 1.48;
      overflow-wrap: anywhere;
    }
    .empty strong,
    .state-title {
      display: block;
      color: var(--vscode-foreground);
      overflow-wrap: anywhere;
    }
    .empty-actions,
    .state-actions,
    .toolbar,
    .actions,
    .row-actions,
    .detail-actions,
    .detail-primary-actions {
      min-width: 0;
    }
    .error {
      color: var(--cg-danger);
      overflow-wrap: anywhere;
    }
    .command-preview,
    .preview-box,
    .row-title,
    .row-detail,
    .detail,
    .sig,
    .title {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  `;
}
