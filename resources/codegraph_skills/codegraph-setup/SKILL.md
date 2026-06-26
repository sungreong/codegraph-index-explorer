---
name: codegraph-setup
description: "Install, initialize, or repair Codegraph CLI setup across environments. Use when the user mentions codegraph_setup, Codegraph install, codegraph CLI not found, npm not found, WSL, Docker, Ubuntu, Debian, Alpine, macOS, Windows, PATH issues, .codegraph initialization, or agent MCP setup."
---

# Codegraph Setup

Use this skill to get a workspace from "Codegraph is unavailable" to a usable `.codegraph` index. Prefer the smallest environment-specific fix. Do not use source search as a substitute for setup.

## Diagnose First

Before running new commands, check whether a previous diagnosis exists:

```sh
cat <workspace-root>/codegraph_skills/context/codegraph-setup-diagnosis.json 2>/dev/null || true
```

Use prior diagnosis as context, but verify current PATH and binary locations before applying a fix. Setup can change between shells, agent sessions, containers, and users.

When Node.js is available, run the bundled diagnosis script from this skill folder:

```sh
node scripts/diagnose-codegraph-setup.js --workspace <workspace-root>
```

If MCP logs or config are relevant, include them:

```sh
node scripts/diagnose-codegraph-setup.js \
  --workspace <workspace-root> \
  --mcp-config /root/.claude.json \
  --mcp-log /root/.cache/claude-cli-nodejs/-app/mcp-logs-codegraph/<log>.jsonl
```

The script writes:

- `<workspace-root>/codegraph_skills/context/codegraph-setup-diagnosis.json`
- `<workspace-root>/codegraph_skills/context/codegraph-setup-diagnosis-history.jsonl`

If Node.js is unavailable, run the manual checks below and still save a brief JSON diagnosis under `codegraph_skills/context/codegraph-setup-diagnosis.json` after asking before environment changes.

Run these checks in the target environment, not only on the host machine:

```sh
pwd
command -v codegraph || true
codegraph --version || true
command -v node || true
node --version || true
command -v npm || true
npm --version || true
```

If you find an absolute Codegraph binary path, execute that exact file too:

```sh
<absolute-path-to-codegraph> --version 2>&1
```

If this prints `env: 'node': No such file or directory`, the `codegraph` file exists but its runtime dependency is missing from the MCP process PATH. Treat this as an nvm/MCP runtime PATH problem, not as a missing Codegraph binary.

On Linux, identify the package family:

```sh
cat /etc/os-release 2>/dev/null || true
command -v apt-get || command -v apk || command -v dnf || command -v yum || true
```

Important distinction: Windows, WSL, Dev Containers, Docker, SSH remotes, and CI runners are separate environments. Installing Codegraph in one does not install it in the others.

Before changing the system, explain the detected cause and ask the user for confirmation once. This applies to package installs, PATH edits, symlink creation, shell profile edits, and MCP config rewrites. After the user approves the chosen fix, continue without asking again for each small command unless the next action is destructive or changes the plan.

Save the chosen diagnosis and proposed fix before applying it. Minimum manual record:

```sh
mkdir -p <workspace-root>/codegraph_skills/context
cat > <workspace-root>/codegraph_skills/context/codegraph-setup-diagnosis.json <<'JSON'
{
  "schemaVersion": 1,
  "diagnosedAt": "<ISO timestamp>",
  "workspace": "<workspace-root>",
  "summary": "<what is wrong>",
  "recommendations": ["<fix option that was approved or proposed>"],
  "environment": {
    "path": "<PATH used by the failing process>",
    "home": "<HOME>",
    "user": "<user>"
  },
  "commands": {
    "codegraph": { "path": "<resolved codegraph path or empty>", "version": "<version or empty>" },
    "node": { "path": "<resolved node path or empty>", "version": "<version or empty>" },
    "npm": { "path": "<resolved npm path or empty>", "version": "<version or empty>" }
  }
}
JSON
```

## Install Runtime

Codegraph CLI is distributed as the npm package `@colbymchenry/codegraph`, so `node` and `npm` must exist first.

Debian/Ubuntu, including many Ubuntu-based containers:

```sh
apt-get update
apt-get install -y nodejs npm
```

Alpine:

```sh
apk add --no-cache nodejs npm
```

Fedora/RHEL:

```sh
dnf install -y nodejs npm
```

macOS with Homebrew:

```sh
brew install node
```

Windows PowerShell with winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

If no package manager is available, explain that Node.js/npm must be installed by the base image, VM image, or system administrator before Codegraph can be installed.

## Install Codegraph CLI

After `npm --version` works:

```sh
npm install -g @colbymchenry/codegraph
codegraph --version
```

For Windows PowerShell, if the npm `.ps1` shim is blocked:

```powershell
codegraph.cmd --version
where.exe codegraph
```

Then set VS Code `codegraph.cliPath` to the full `codegraph.cmd` path if needed.

For Linux/macOS permission errors on global npm installs, prefer a user prefix:

```sh
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g @colbymchenry/codegraph
codegraph --version
```

Persist the PATH change in the active shell profile when the install should survive new shells:

```sh
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
```

## Fix PATH-Only Failures

Use this section when Codegraph is installed but MCP or the shell reports an executable lookup failure such as:

```text
Connection failed: Executable not found in $PATH: "codegraph"
```

Also use it when the binary is found but direct execution fails because the runtime is not on PATH:

```text
env: 'node': No such file or directory
```

Typical container/root example:

- MCP config contains `"command": "codegraph"`.
- The real binary is `/root/.local/bin/codegraph`.
- `PATH` contains `/usr/local/bin`, `/usr/bin`, and `/bin`, but not `/root/.local/bin`.

Confirm the mismatch:

```sh
printf '%s\n' "$PATH"
ls -l /root/.local/bin/codegraph 2>/dev/null || true
command -v codegraph || true
/root/.local/bin/codegraph --version 2>&1 || true
```

Ask the user which fix they prefer before applying it:

1. Add a symlink into a directory already on `PATH`:

```sh
ln -s /root/.local/bin/codegraph /usr/local/bin/codegraph
command -v codegraph
codegraph --version
```

2. Add the binary directory to PATH for future shells:

```sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/bin:$PATH"
command -v codegraph
codegraph --version
```

3. Change MCP config to use the absolute binary path, for example `/root/.local/bin/codegraph`, when editing that config is safer than changing PATH.

4. If the absolute binary runs but prints `env: 'node': No such file or directory`, add a PATH value to the MCP config so both `codegraph` and `node` are visible to the MCP process:

```json
{
  "command": "/root/.local/bin/codegraph",
  "env": {
    "PATH": "/root/.nvm/versions/node/<version>/bin:/usr/local/bin:/usr/bin:/bin"
  }
}
```

After any fix, restart or refresh the MCP client/agent. MCP processes inherit PATH from their launcher, so a shell PATH fix may not affect an already-running agent.

## Fix nvm MCP Failures

Use this section when `codegraph` was installed under nvm and works in an interactive user shell, but MCP cannot start it.

Typical signs:

- MCP config contains `"command": "codegraph"`.
- The real binary is under nvm, for example `/home/mockup/.nvm/versions/node/v24.18.0/bin/codegraph`.
- MCP PATH does not include `/home/mockup/.nvm/versions/node/v24.18.0/bin`.
- The shell profile initializes nvm for interactive shells, but the MCP launcher does not source that profile.

Confirm:

```sh
printf '%s\n' "$PATH"
find "$HOME/.nvm/versions/node" -path '*/bin/codegraph' -type f -o -type l 2>/dev/null
command -v codegraph || true
/home/mockup/.nvm/versions/node/v24.18.0/bin/codegraph --version 2>&1 || true
```

Ask the user which fix they prefer before applying it:

1. Use an absolute command path in MCP config. This is simple and precise, but must be updated if the nvm Node version changes:

```json
{
  "command": "/home/mockup/.nvm/versions/node/v24.18.0/bin/codegraph"
}
```

If that still fails with `env: 'node': No such file or directory`, include the nvm Node bin directory in MCP `env.PATH`:

```json
{
  "command": "/home/mockup/.nvm/versions/node/v24.18.0/bin/codegraph",
  "env": {
    "PATH": "/home/mockup/.nvm/versions/node/v24.18.0/bin:/usr/local/bin:/usr/bin:/bin"
  }
}
```

2. Symlink the nvm-installed Codegraph binary into a stable PATH directory. This is convenient when `/usr/local/bin` is already on the MCP PATH, but the link must be updated if the nvm version changes:

```sh
ln -s /home/mockup/.nvm/versions/node/v24.18.0/bin/codegraph /usr/local/bin/codegraph
command -v codegraph
codegraph --version
```

3. Launch MCP with the nvm bin directory in PATH. Use this when the environment manager owns process startup and can reliably inject PATH for non-interactive processes.

Record which option was chosen in `codegraph_skills/context/codegraph-setup-diagnosis.json`, then restart or refresh the MCP client.

## Initialize Workspace

Run initialization against the project root:

```sh
codegraph init <workspace-root>
codegraph status --json <workspace-root>
```

For the current directory:

```sh
codegraph init .
codegraph status --json .
```

If the user gives a path such as `/app`, use that path explicitly:

```sh
codegraph init /app
codegraph status --json /app
```

## Container Snippets

Debian/Ubuntu Dockerfile:

```dockerfile
RUN apt-get update \
  && apt-get install -y --no-install-recommends nodejs npm \
  && npm install -g @colbymchenry/codegraph \
  && rm -rf /var/lib/apt/lists/*
```

Alpine Dockerfile:

```dockerfile
RUN apk add --no-cache nodejs npm \
  && npm install -g @colbymchenry/codegraph
```

For dev containers, install Codegraph inside the container image or in a `postCreateCommand`; installing on the host is not enough.

## Agent MCP Setup

The VS Code extension only needs the CLI and `.codegraph` index. MCP setup is optional and is for coding agents that call Codegraph tools directly.

Interactive:

```sh
codegraph install
```

Non-interactive:

```sh
codegraph install --target auto --location global --yes
```

After MCP install, restart or refresh the agent session so new tools are registered.

## Troubleshooting

- `bash: npm: command not found`: install Node.js/npm for the current OS first.
- `codegraph CLI not found` after npm install: check `npm bin -g`, `npm config get prefix`, and `PATH`.
- `Executable not found in $PATH: "codegraph"` in MCP logs: either add the installed binary directory such as `/root/.local/bin` to PATH, symlink the binary into an existing PATH directory such as `/usr/local/bin`, or change MCP config to an absolute command path.
- `env: 'node': No such file or directory`: the `codegraph` executable was found, but its shebang cannot resolve `node`; add the Node bin directory to MCP `env.PATH`, use a wrapper that exports PATH, or install Node in a stable system PATH location.
- nvm installs work in a user shell but MCP fails: use the absolute nvm `codegraph` path in MCP config, symlink it into a PATH directory, or ensure the MCP launcher receives the nvm bin directory in PATH.
- Repeated setup questions: read `codegraph_skills/context/codegraph-setup-diagnosis.json` first and compare it with the current environment before recommending a fix.
- `.codegraph` missing: run `codegraph init <workspace-root>`.
- CLI works in a terminal but not VS Code: set `codegraph.cliPath` to the absolute CLI shim path.
- CLI works on host but not in Docker/WSL/SSH: install it inside that remote environment.
