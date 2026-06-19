import { execFile } from "node:child_process";
import * as path from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";
import { getCodegraphCommandCandidates, getCodegraphInvocation } from "./codegraphCommand";
import { parseCodegraphJsonOutput } from "./codegraphJson";
import {
  CodegraphFileResult,
  CodegraphRelatedResult,
  CodegraphSearchResult,
  normalizeFileResults,
  normalizeRelatedResults,
  normalizeSearchResults,
} from "./codegraphResults";
import { findCodegraphWorkspaceInfo } from "./codegraphWorkspace";

const execFileAsync = promisify(execFile);
const STATUS_CACHE_TTL_MS = 5_000;
const FILES_CACHE_TTL_MS = 5_000;
const SEARCH_CACHE_TTL_MS = 2_000;
const RELATED_CACHE_TTL_MS = 2_000;

interface CacheEntry<T> {
  expiresAt: number;
  promise: Promise<T>;
}

const statusCache = new Map<string, CacheEntry<unknown>>();
const filesCache = new Map<string, CacheEntry<CodegraphFileResult[]>>();
const searchCache = new Map<string, CacheEntry<CodegraphSearchResult[]>>();
const relatedCache = new Map<string, CacheEntry<CodegraphRelatedResult[]>>();
const successfulCommandByConfigured = new Map<string, string>();

export type { CodegraphFileResult, CodegraphRelatedResult, CodegraphSearchResult };

export interface CodegraphWorkspace {
  folder: vscode.WorkspaceFolder;
  codegraphPath: vscode.Uri;
}

export async function findCodegraphWorkspace(): Promise<CodegraphWorkspace | undefined> {
  const folders = (vscode.workspace.workspaceFolders ?? []).map((folder) => ({
    name: folder.name,
    fsPath: folder.uri.fsPath,
    original: folder,
  }));
  const match = findCodegraphWorkspaceInfo(folders);

  if (!match) {
    return undefined;
  }

  const original = folders.find((folder) => folder.fsPath === match.folder.fsPath)?.original;
  return original
    ? { folder: original, codegraphPath: vscode.Uri.file(match.codegraphPath) }
    : undefined;
}

export async function queryCodegraph(
  workspacePath: string,
  search: string,
  limit: number,
  kind?: string,
): Promise<CodegraphSearchResult[]> {
  const key = cacheKey(workspacePath, "query", search, limit, kind ?? "");
  return getCached(searchCache, key, SEARCH_CACHE_TTL_MS, async () => {
    const args = ["query", "--json", "--path", workspacePath, "--limit", String(limit)];
    if (kind) {
      args.push("--kind", kind);
    }
    args.push(search);
    const output = await runCodegraph(args, workspacePath);
    return normalizeSearchResults(parseCodegraphJsonOutput(output));
  });
}

export async function getCodegraphStatus(workspacePath: string): Promise<unknown> {
  return getCached(statusCache, workspacePath, STATUS_CACHE_TTL_MS, async () => {
    const output = await runCodegraph(["status", "--json", workspacePath], workspacePath);
    return parseCodegraphJsonOutput(output);
  });
}

export async function listCodegraphFiles(workspacePath: string, filter?: string, pattern?: string): Promise<CodegraphFileResult[]> {
  const key = cacheKey(workspacePath, "files", filter ?? "", pattern ?? "");
  return getCached(filesCache, key, FILES_CACHE_TTL_MS, async () => {
    const args = ["files", "--json", "--path", workspacePath, "--format", "flat"];
    if (filter) {
      args.push("--filter", filter);
    }
    if (pattern) {
      args.push("--pattern", pattern);
    }
    const output = await runCodegraph(args, workspacePath);
    return normalizeFileResults(parseCodegraphJsonOutput(output));
  });
}

export async function getCodegraphCallers(workspacePath: string, symbol: string, limit: number): Promise<CodegraphRelatedResult[]> {
  return getRelated(workspacePath, "callers", symbol, limit, ["callers", "items", "results"]);
}

export async function getCodegraphCallees(workspacePath: string, symbol: string, limit: number): Promise<CodegraphRelatedResult[]> {
  return getRelated(workspacePath, "callees", symbol, limit, ["callees", "items", "results"]);
}

export async function getCodegraphImpact(workspacePath: string, symbol: string, depth: number): Promise<CodegraphRelatedResult[]> {
  const key = cacheKey(workspacePath, "impact", symbol, depth);
  return getCached(relatedCache, key, RELATED_CACHE_TTL_MS, async () => {
    const output = await runCodegraph(["impact", "--json", "--path", workspacePath, "--depth", String(depth), symbol], workspacePath);
    return normalizeRelatedResults(parseCodegraphJsonOutput(output), ["affected", "items", "results"]);
  });
}

export function resolveResultUri(workspacePath: string, resultPath: string): vscode.Uri {
  const resolvedPath = path.isAbsolute(resultPath) ? resultPath : path.join(workspacePath, resultPath);
  return vscode.Uri.file(resolvedPath);
}

export function clearCodegraphCache(): void {
  statusCache.clear();
  filesCache.clear();
  searchCache.clear();
  relatedCache.clear();
}

export function preloadCodegraphWorkspace(workspacePath: string): void {
  void getCodegraphStatus(workspacePath).catch(() => undefined);
  void listCodegraphFiles(workspacePath).catch(() => undefined);
}

async function runCodegraph(args: string[], cwd: string): Promise<string> {
  const configured = vscode.workspace.getConfiguration("codegraph").get<string>("cliPath") || "codegraph";
  const cachedCommand = successfulCommandByConfigured.get(configured);
  const candidates = [
    ...(cachedCommand ? [cachedCommand] : []),
    ...getCodegraphCommandCandidates(configured).filter((command) => command !== cachedCommand),
  ];

  let lastError: unknown;
  for (const command of candidates) {
    try {
      const invocation = getCodegraphInvocation(command, args);
      const { stdout } = await execFileAsync(invocation.command, invocation.args, {
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: "0",
          NO_COLOR: "1",
          TERM: "dumb",
        },
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      });
      successfulCommandByConfigured.set(configured, command);
      return stdout;
    } catch (error) {
      lastError = error;
      if (!isMissingExecutable(error)) {
        throw enrichCodegraphError(error);
      }
    }
  }

  throw enrichCodegraphError(lastError);
}

async function getRelated(
  workspacePath: string,
  mode: "callers" | "callees",
  symbol: string,
  limit: number,
  resultKeys: string[],
): Promise<CodegraphRelatedResult[]> {
  const key = cacheKey(workspacePath, mode, symbol, limit);
  return getCached(relatedCache, key, RELATED_CACHE_TTL_MS, async () => {
    const output = await runCodegraph([mode, "--json", "--path", workspacePath, "--limit", String(limit), symbol], workspacePath);
    return normalizeRelatedResults(parseCodegraphJsonOutput(output), resultKeys);
  });
}

function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }

  const promise = load().catch((error) => {
    if (cache.get(key)?.promise === promise) {
      cache.delete(key);
    }
    throw error;
  });
  cache.set(key, { expiresAt: now + ttlMs, promise });
  return promise;
}

function cacheKey(...parts: Array<string | number>): string {
  return parts.map((part) => String(part).replaceAll("\u001f", "")).join("\u001f");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMissingExecutable(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

function enrichCodegraphError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Codegraph CLI failed. Make sure the codegraph command is installed and available on PATH.");
}
