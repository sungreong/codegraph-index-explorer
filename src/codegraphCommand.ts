import * as path from "node:path";
import { expandHomePath } from "./codegraphPath";

export interface CodegraphInvocation {
  command: string;
  args: string[];
}

export function getCodegraphCommandCandidates(
  configuredCommand: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const configured = expandHomePath(configuredCommand.trim() || "codegraph", platform, env);

  if (configured !== "codegraph") {
    return [configured];
  }

  if (platform === "win32") {
    return unique([
      "codegraph.cmd",
      "codegraph.exe",
      "codegraph",
      env.APPDATA ? path.win32.join(env.APPDATA, "npm", "codegraph.cmd") : undefined,
      env.USERPROFILE ? path.win32.join(env.USERPROFILE, "AppData", "Roaming", "npm", "codegraph.cmd") : undefined,
    ]);
  }

  return unique([
    "codegraph",
    env.NPM_CONFIG_PREFIX ? path.posix.join(env.NPM_CONFIG_PREFIX, "bin", "codegraph") : undefined,
    env.HOME ? path.posix.join(env.HOME, ".npm-global", "bin", "codegraph") : undefined,
    env.HOME ? path.posix.join(env.HOME, ".local", "bin", "codegraph") : undefined,
    platform === "darwin" ? "/opt/homebrew/bin/codegraph" : undefined,
    "/usr/local/bin/codegraph",
  ]);
}

export function getCodegraphInvocation(
  command: string,
  args: string[],
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): CodegraphInvocation {
  if (platform === "win32" && isWindowsCommandScript(command)) {
    return {
      command: env.ComSpec || "cmd.exe",
      args: ["/d", "/c", command, ...args],
    };
  }

  return { command, args };
}

function isWindowsCommandScript(command: string): boolean {
  return /\.(cmd|bat)$/i.test(command);
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
