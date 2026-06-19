export interface CodegraphSearchResult {
  name: string;
  kind?: string;
  file: string;
  line?: number;
  column?: number;
  signature?: string;
  detail?: string;
}

export interface CodegraphFileResult {
  path: string;
  language?: string;
  symbols?: number;
}

export interface CodegraphRelatedResult {
  name: string;
  kind?: string;
  file: string;
  line?: number;
}

export function normalizeSearchResults(value: unknown): CodegraphSearchResult[] {
  const items = Array.isArray(value) ? value : getArrayProperty(value, ["results", "items", "nodes"]);

  return items
    .map((item) => normalizeSearchResult(item))
    .filter((item): item is CodegraphSearchResult => Boolean(item));
}

export function normalizeFileResults(value: unknown): CodegraphFileResult[] {
  const items = Array.isArray(value) ? value : getArrayProperty(value, ["files", "items", "results"]);

  return items
    .map((item) => normalizeFileResult(item))
    .filter((item): item is CodegraphFileResult => Boolean(item));
}

export function normalizeRelatedResults(value: unknown, keys: string[]): CodegraphRelatedResult[] {
  const items = Array.isArray(value) ? value : getArrayProperty(value, keys);

  return items
    .map((item) => normalizeRelatedResult(item))
    .filter((item): item is CodegraphRelatedResult => Boolean(item));
}

function normalizeSearchResult(value: unknown): CodegraphSearchResult | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const node = isRecord(value.node) ? value.node : value;
  const file = getString(node, ["file", "path", "filePath", "relativePath"]);
  const name = getString(node, ["name", "symbol", "qualifiedName", "label"]) ?? file;

  if (!file || !name) {
    return undefined;
  }

  return {
    name,
    kind: getString(node, ["kind", "type"]),
    file,
    line: getNumber(node, ["line", "startLine", "lineNumber"]),
    column: getNumber(node, ["column", "startColumn", "character"]),
    signature: getString(node, ["signature"]),
    detail: getString(node, ["detail", "description"]),
  };
}

function normalizeRelatedResult(value: unknown): CodegraphRelatedResult | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const file = getString(value, ["file", "path", "filePath", "relativePath"]);
  const name = getString(value, ["name", "symbol", "qualifiedName", "label"]) ?? file;
  if (!file || !name) {
    return undefined;
  }

  return {
    name,
    kind: getString(value, ["kind", "type"]),
    file,
    line: getNumber(value, ["line", "startLine", "lineNumber"]),
  };
}

function normalizeFileResult(value: unknown): CodegraphFileResult | undefined {
  if (typeof value === "string") {
    return { path: value };
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const filePath = getString(value, ["path", "file", "filePath", "relativePath"]);
  if (!filePath) {
    return undefined;
  }

  return {
    path: filePath,
    language: getString(value, ["language", "lang"]),
    symbols: getNumber(value, ["symbols", "symbolCount", "nodeCount", "nodes"]),
  };
}

function getArrayProperty(value: unknown, keys: string[]): unknown[] {
  if (!isRecord(value)) {
    return [];
  }

  for (const key of keys) {
    const item = value[key];
    if (Array.isArray(item)) {
      return item;
    }
  }

  return [];
}

function getString(value: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" && item.length > 0) {
      return item;
    }
  }

  return undefined;
}

function getNumber(value: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const item = value[key];
    if (typeof item === "number" && Number.isFinite(item)) {
      return item;
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
