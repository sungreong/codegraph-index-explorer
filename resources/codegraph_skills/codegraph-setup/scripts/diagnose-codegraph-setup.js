#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const args = parseArgs(process.argv.slice(2));
const workspace = path.resolve(args.workspace || process.cwd());
const contextDir = path.join(workspace, "codegraph_skills", "context");
const diagnosisPath = path.join(contextDir, "codegraph-setup-diagnosis.json");
const historyPath = path.join(contextDir, "codegraph-setup-diagnosis-history.jsonl");
const previous = readJsonIfExists(diagnosisPath);
const diagnosis = buildDiagnosis(workspace, previous, args);

fs.mkdirSync(contextDir, { recursive: true });
fs.writeFileSync(diagnosisPath, `${JSON.stringify(diagnosis, null, 2)}\n`, "utf8");
fs.appendFileSync(historyPath, `${JSON.stringify({
  diagnosedAt: diagnosis.diagnosedAt,
  workspace: diagnosis.workspace,
  summary: diagnosis.summary,
  recommendations: diagnosis.recommendations,
})}\n`, "utf8");

console.log(`Wrote Codegraph setup diagnosis to ${diagnosisPath}`);
console.log(diagnosis.summary);
for (const recommendation of diagnosis.recommendations) {
  console.log(`- ${recommendation}`);
}

function buildDiagnosis(workspaceRoot, previousDiagnosis, options) {
  const envPath = process.env.PATH || "";
  const home = os.homedir();
  const pathEntries = envPath.split(path.delimiter).filter(Boolean);
  const commonCodegraphPaths = unique([
    home ? path.join(home, ".local", "bin", commandName("codegraph")) : undefined,
    home ? path.join(home, ".npm-global", "bin", commandName("codegraph")) : undefined,
    "/usr/local/bin/codegraph",
    "/usr/bin/codegraph",
    process.platform === "darwin" ? "/opt/homebrew/bin/codegraph" : undefined,
  ]);
  const nvmMatches = findNvmCodegraphBins(home);
  const codegraphCommand = findCommand("codegraph");
  const nodeCommand = findCommand("node");
  const npmCommand = findCommand("npm");
  const codegraphCandidates = unique([
    codegraphCommand.path,
    ...commonCodegraphPaths.filter((candidate) => candidate && fs.existsSync(candidate)),
    ...nvmMatches,
  ]);
  const executionChecks = codegraphCandidates.map((candidate) => runExecutableVersion(candidate));
  const mcpConfig = options.mcpConfig ? readTextIfExists(path.resolve(options.mcpConfig)) : "";
  const mcpLog = options.mcpLog ? readTextIfExists(path.resolve(options.mcpLog)) : "";
  const inferred = inferIssue({
    codegraphCommand,
    nodeCommand,
    npmCommand,
    envPath,
    pathEntries,
    codegraphCandidates,
    executionChecks,
    mcpConfig,
    mcpLog,
    nvmMatches,
  });

  return {
    schemaVersion: 1,
    diagnosedAt: new Date().toISOString(),
    workspace: workspaceRoot,
    environment: {
      platform: process.platform,
      arch: process.arch,
      user: os.userInfo().username,
      home,
      shell: process.env.SHELL || process.env.ComSpec || "",
      path: envPath,
      pathEntries,
      osRelease: readTextIfExists("/etc/os-release"),
      packageManager: detectPackageManager(),
    },
    commands: {
      codegraph: codegraphCommand,
      node: nodeCommand,
      npm: npmCommand,
    },
    candidates: {
      codegraph: codegraphCandidates,
      nvmCodegraph: nvmMatches,
    },
    executionChecks,
    mcp: {
      configPath: options.mcpConfig ? path.resolve(options.mcpConfig) : "",
      logPath: options.mcpLog ? path.resolve(options.mcpLog) : "",
      configMentionsBareCodegraph: /"command"\s*:\s*"codegraph"/.test(mcpConfig),
      logMentionsPathFailure: /Executable not found in \$PATH: "codegraph"|command not found|ENOENT/i.test(mcpLog),
    },
    previous: previousDiagnosis ? {
      diagnosedAt: previousDiagnosis.diagnosedAt,
      summary: previousDiagnosis.summary,
      recommendations: previousDiagnosis.recommendations,
    } : undefined,
    summary: inferred.summary,
    recommendations: inferred.recommendations,
  };
}

function inferIssue(input) {
  const nodeRuntimeFailure = input.executionChecks.find((check) => isNodeRuntimeFailure(check.stderr) || isNodeRuntimeFailure(check.stdout));
  if (nodeRuntimeFailure) {
    const candidateDir = path.dirname(nodeRuntimeFailure.command);
    return {
      summary: `Codegraph exists at ${nodeRuntimeFailure.command}, but executing it cannot find node in PATH.`,
      recommendations: [
        `Ask before changing setup. Option A: add env.PATH to MCP config so it starts with ${candidateDir}.`,
        `Option B: point MCP command to a wrapper script that exports PATH=${candidateDir}:$PATH before running codegraph.`,
        "Option C: install Node.js in a stable system PATH location used by MCP, then reinstall or relink Codegraph there.",
      ],
    };
  }

  if (!input.nodeCommand.path && !input.npmCommand.path) {
    return {
      summary: "Node.js and npm are missing in this environment.",
      recommendations: ["Install Node.js/npm with the OS package manager before installing Codegraph."],
    };
  }

  if (!input.npmCommand.path) {
    return {
      summary: "Node.js exists, but npm is missing.",
      recommendations: ["Install npm for this OS, then run npm install -g @colbymchenry/codegraph."],
    };
  }

  if (input.codegraphCommand.path) {
    const directCheck = input.executionChecks.find((check) => check.command === input.codegraphCommand.path);
    return {
      summary: directCheck && directCheck.ok
        ? `Codegraph is available at ${input.codegraphCommand.path}.`
        : `Codegraph is on PATH at ${input.codegraphCommand.path}, but direct execution did not confirm a working version.`,
      recommendations: directCheck && directCheck.ok
        ? ["Run codegraph status against the workspace and initialize with codegraph init if .codegraph is missing."]
        : ["Run the absolute codegraph path with --version and fix any reported runtime dependency such as missing node."],
    };
  }

  const nvmCandidate = input.nvmMatches.find(Boolean);
  if (nvmCandidate) {
    const nvmDir = path.dirname(nvmCandidate);
    return {
      summary: `Codegraph exists under nvm at ${nvmCandidate}, but that directory is not on PATH for this process.`,
      recommendations: [
        `Ask before changing setup. Option A: set MCP command to ${nvmCandidate}.`,
        `Option B: create a symlink from ${nvmCandidate} to /usr/local/bin/codegraph if /usr/local/bin is on PATH.`,
        `Option C: ensure MCP launches with ${nvmDir} on PATH; note that non-interactive MCP processes often do not initialize nvm.`,
      ],
    };
  }

  const localCandidate = input.codegraphCandidates.find((candidate) => candidate && !input.pathEntries.includes(path.dirname(candidate)));
  if (localCandidate) {
    return {
      summary: `Codegraph exists at ${localCandidate}, but its directory is not on PATH.`,
      recommendations: [
        `Ask before changing setup. Option A: set MCP command to ${localCandidate}.`,
        `Option B: add ${path.dirname(localCandidate)} to PATH for the launcher.`,
        `Option C: symlink ${localCandidate} into a PATH directory such as /usr/local/bin.`,
      ],
    };
  }

  if (input.mcp.configMentionsBareCodegraph || input.mcp.logMentionsPathFailure) {
    return {
      summary: "MCP is configured with a bare codegraph command, but this process cannot resolve it.",
      recommendations: [
        "Find the real codegraph binary, then ask whether to use an absolute MCP command path or add/symlink the binary into PATH.",
      ],
    };
  }

  return {
    summary: "Codegraph CLI is not installed or is not discoverable.",
    recommendations: ["Install Codegraph with npm install -g @colbymchenry/codegraph, then rerun this diagnosis."],
  };
}

function findCommand(command) {
  const probe = process.platform === "win32" ? "where" : "command";
  const probeArgs = process.platform === "win32" ? [command] : ["-v", command];
  const result = process.platform === "win32"
    ? spawnSync(probe, probeArgs, { encoding: "utf8" })
    : spawnSync("sh", ["-lc", `command -v ${quoteShell(command)}`], { encoding: "utf8" });
  const found = result.status === 0 ? normalizeExecutablePath(firstLine(result.stdout)) : "";
  const version = found ? runVersion(command) : "";
  return {
    path: found,
    version,
    stderr: result.stderr ? result.stderr.trim() : "",
  };
}

function runVersion(command) {
  const result = spawnSync(command, ["--version"], { encoding: "utf8" });
  if (result.status !== 0) {
    return "";
  }
  return firstLine(result.stdout || result.stderr);
}

function runExecutableVersion(command) {
  const executable = normalizeExecutablePath(command);
  const invocation = executable.toLowerCase().endsWith(".cmd") || executable.toLowerCase().endsWith(".bat")
    ? { command: process.env.ComSpec || "cmd.exe", args: ["/d", "/c", executable, "--version"] }
    : { command: executable, args: ["--version"] };
  const result = spawnSync(invocation.command, invocation.args, { encoding: "utf8" });
  return {
    command: executable,
    ok: result.status === 0,
    status: typeof result.status === "number" ? result.status : null,
    signal: result.signal || "",
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
    error: result.error ? result.error.message : "",
  };
}

function normalizeExecutablePath(command) {
  if (process.platform !== "win32" || !command || path.extname(command)) {
    return command;
  }

  for (const extension of [".cmd", ".exe", ".bat", ".ps1"]) {
    const candidate = `${command}${extension}`;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return command;
}

function isNodeRuntimeFailure(value) {
  return /env:\s*['"]?node['"]?:\s*No such file or directory|node:\s*not found|\/usr\/bin\/env node.*No such file/i.test(String(value || ""));
}

function detectPackageManager() {
  for (const command of ["apt-get", "apk", "dnf", "yum", "brew", "winget"]) {
    const found = findCommand(command).path;
    if (found) {
      return command;
    }
  }
  return "";
}

function findNvmCodegraphBins(home) {
  const versionsDir = home ? path.join(home, ".nvm", "versions", "node") : "";
  if (!versionsDir || !fs.existsSync(versionsDir)) {
    return [];
  }

  return fs.readdirSync(versionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(versionsDir, entry.name, "bin", commandName("codegraph")))
    .filter((candidate) => fs.existsSync(candidate));
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--workspace") {
      parsed.workspace = values[index + 1];
      index += 1;
    } else if (value === "--mcp-config") {
      parsed.mcpConfig = values[index + 1];
      index += 1;
    } else if (value === "--mcp-log") {
      parsed.mcpLog = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function commandName(command) {
  return process.platform === "win32" ? `${command}.cmd` : command;
}

function firstLine(value) {
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
}

function readJsonIfExists(target) {
  try {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch {
    return undefined;
  }
}

function readTextIfExists(target) {
  try {
    return fs.readFileSync(target, "utf8");
  } catch {
    return "";
  }
}

function quoteShell(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
