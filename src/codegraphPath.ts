import * as path from "node:path";

export type CodegraphPathPlatform = "win32" | "posix";

export function inferCodegraphPathPlatform(
  value: string,
  fallback: NodeJS.Platform = process.platform,
): CodegraphPathPlatform {
  if (looksLikeWindowsPath(value)) {
    return "win32";
  }
  if (value.startsWith("/")) {
    return "posix";
  }

  return fallback === "win32" ? "win32" : "posix";
}

export function joinCodegraphPath(basePath: string, ...segments: string[]): string {
  return pathFor(inferCodegraphPathPlatform(basePath)).join(basePath, ...segments);
}

export function resolveCodegraphPath(workspacePath: string, resultPath: string): string {
  if (isAbsoluteCodegraphPath(resultPath)) {
    return resultPath;
  }

  return joinCodegraphPath(workspacePath, resultPath);
}

export function isAbsoluteCodegraphPath(value: string): boolean {
  return path.win32.isAbsolute(value) || path.posix.isAbsolute(value);
}

export function expandHomePath(
  value: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (value !== "~" && !value.startsWith("~/") && !value.startsWith("~\\")) {
    return value;
  }

  const home = platform === "win32" ? env.USERPROFILE : env.HOME;
  if (!home) {
    return value;
  }

  const rest = value.slice(1).replace(/^[\\/]/, "");
  return pathFor(platform === "win32" ? "win32" : "posix").join(home, rest);
}

function pathFor(platform: CodegraphPathPlatform): path.PlatformPath {
  return platform === "win32" ? path.win32 : path.posix;
}

function looksLikeWindowsPath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(value) || /^\\\\[^\\]+\\[^\\]+/.test(value) || value.includes("\\");
}
