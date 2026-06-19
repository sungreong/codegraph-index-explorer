import * as path from "node:path";

export interface CodegraphInvocation {
  command: string;
  args: string[];
}

export function getCodegraphCommandCandidates(
  configuredCommand: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const configured = configuredCommand.trim() || "codegraph";

  if (configured !== "codegraph") {
    return [configured];
  }

  if (platform !== "win32") {
    return ["codegraph"];
  }

  return unique([
    "codegraph.cmd",
    "codegraph.exe",
    "codegraph",
    env.APPDATA ? path.join(env.APPDATA, "npm", "codegraph.cmd") : undefined,
    env.USERPROFILE ? path.join(env.USERPROFILE, "AppData", "Roaming", "npm", "codegraph.cmd") : undefined,
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
