type WebviewIconName =
  | "activity"
  | "agent"
  | "arrowDown"
  | "checkSquare"
  | "chevronDown"
  | "circle"
  | "copy"
  | "dashboard"
  | "download"
  | "external"
  | "fileJson"
  | "fit"
  | "focus"
  | "graph"
  | "info"
  | "layout"
  | "list"
  | "minus"
  | "pause"
  | "play"
  | "plus"
  | "refresh"
  | "settings"
  | "spark"
  | "target"
  | "x";

const iconPaths: Record<WebviewIconName, string> = {
  activity: '<path d="M22 12h-4l-3 8-6-16-3 8H2"></path>',
  agent: '<rect x="5" y="7" width="14" height="11" rx="3"></rect><path d="M9 7V5"></path><path d="M15 7V5"></path><path d="M9 12h.01"></path><path d="M15 12h.01"></path><path d="M10 16h4"></path>',
  arrowDown: '<path d="M12 5v14"></path><path d="m6 13 6 6 6-6"></path>',
  checkSquare: '<rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="m8 12 3 3 5-6"></path>',
  chevronDown: '<path d="m6 9 6 6 6-6"></path>',
  circle: '<circle cx="12" cy="12" r="8"></circle>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M5 15V7a2 2 0 0 1 2-2h8"></path>',
  dashboard: '<rect x="4" y="4" width="7" height="7" rx="1.5"></rect><rect x="13" y="4" width="7" height="7" rx="1.5"></rect><rect x="4" y="13" width="7" height="7" rx="1.5"></rect><rect x="13" y="13" width="7" height="7" rx="1.5"></rect>',
  download: '<path d="M12 4v10"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path>',
  external: '<path d="M14 4h6v6"></path><path d="M10 14 20 4"></path><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"></path>',
  fileJson: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M10 13h-1a1 1 0 0 0 0 2h1a1 1 0 0 1 0 2H9"></path><path d="M14 13v4"></path>',
  fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path><circle cx="12" cy="12" r="2"></circle>',
  focus: '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle>',
  graph: '<circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="7" r="2.5"></circle><circle cx="18" cy="17" r="2.5"></circle><path d="M8.3 11 15.7 8"></path><path d="M8.3 13 15.7 16"></path>',
  info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path>',
  layout: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="18" height="7" rx="1"></rect>',
  list: '<path d="M8 6h12"></path><path d="M8 12h12"></path><path d="M8 18h12"></path><path d="M4 6h.01"></path><path d="M4 12h.01"></path><path d="M4 18h.01"></path>',
  minus: '<path d="M5 12h14"></path>',
  pause: '<path d="M10 5v14"></path><path d="M14 5v14"></path>',
  play: '<path d="m8 5 11 7-11 7Z"></path>',
  plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.4-4.8L4 8"></path><path d="M4 4v4h4"></path><path d="M4 13a8 8 0 0 0 14.4 4.8L20 16"></path><path d="M20 20v-4h-4"></path>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 .6 1.8 1.8 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1A1.8 1.8 0 0 0 8.6 19.4a1.8 1.8 0 0 0-1.98.36l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-.6-1 1.8 1.8 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.1A1.8 1.8 0 0 0 4.6 8.6a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1-.6 1.8 1.8 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.1a1.8 1.8 0 0 0 1 1.5 1.8 1.8 0 0 0 1.98-.36l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04A1.8 1.8 0 0 0 19.4 9c.2.4.6.7 1 .7h.6a2 2 0 1 1 0 4h-.1a1.8 1.8 0 0 0-1.5 1.3Z"></path>',
  spark: '<path d="M13 2 9 10l-7 3 7 3 4 8 4-8 7-3-7-3-4-8Z"></path>',
  target: '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle>',
  x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
};

export function webviewIcon(name: WebviewIconName, className = "webview-icon"): string {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${iconPaths[name]}</svg>`;
}

export function webviewIconScript(): string {
  return `
    const webviewIconPaths = ${JSON.stringify(iconPaths)};
    function webviewIcon(name, className) {
      const paths = webviewIconPaths || {};
      return '<svg class="' + escapeHtml(className || 'webview-icon') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (paths[name] || '') + '</svg>';
    }
  `;
}
