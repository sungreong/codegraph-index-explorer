import * as fs from "node:fs/promises";
import { createHash } from "node:crypto";
import * as path from "node:path";

interface SkillBundleManifest {
  version: number;
  bundleName?: string;
  bundleVersion?: string;
  skills: SkillBundleEntry[];
}

interface SkillBundleEntry {
  id: string;
  version?: string;
  source: string;
  workspaceCatalogTarget?: string;
  agentSkillTarget?: string;
  additionalSkillTargets?: string[];
}

export interface SyncBundledCodegraphSkillsOptions {
  extensionPath: string;
  workspacePath: string;
}

export interface SyncBundledCodegraphSkillsReport {
  skills: string[];
  copied: number;
  updated: number;
  unchanged: number;
  skipped: number;
  targetRoots: string[];
  targets: string[];
}

interface CopyReport {
  copied: number;
  updated: number;
  unchanged: number;
  skipped: number;
}

interface SyncMetadata {
  bundleVersion?: string;
  skillId: string;
  skillVersion?: string;
  syncedAt: string;
  files: Record<string, SyncMetadataFile>;
}

interface SyncMetadataFile {
  sha256: string;
}

export interface CodegraphSkillTargetRoot {
  id: string;
  label: string;
  relativePath: string;
}

export const CODEGRAPH_SKILL_TARGET_ROOTS: readonly CodegraphSkillTargetRoot[] = [
  { id: "workspace-catalog", label: "codegraph_skills", relativePath: "codegraph_skills" },
  { id: "agents", label: ".agents/skills", relativePath: ".agents/skills" },
  { id: "claude", label: ".claude/skills", relativePath: ".claude/skills" },
  { id: "codex", label: ".codex/skills", relativePath: ".codex/skills" },
  { id: "gemini", label: ".gemini/skills", relativePath: ".gemini/skills" },
  { id: "cursor", label: ".cursor/skills", relativePath: ".cursor/skills" },
];

export function getBundledCodegraphSkillsRoot(extensionPath: string): string {
  return path.join(extensionPath, "resources", "codegraph_skills");
}

export function getWorkspaceCodegraphSkillsRoot(workspacePath: string): string {
  return getWorkspaceSkillTargetRoot(workspacePath, "workspace-catalog");
}

export function getWorkspaceAgentSkillsRoot(workspacePath: string): string {
  return getWorkspaceSkillTargetRoot(workspacePath, "agents");
}

export function getWorkspaceClaudeSkillsRoot(workspacePath: string): string {
  return getWorkspaceSkillTargetRoot(workspacePath, "claude");
}

export function getWorkspaceCodexSkillsRoot(workspacePath: string): string {
  return getWorkspaceSkillTargetRoot(workspacePath, "codex");
}

export function getWorkspaceGeminiSkillsRoot(workspacePath: string): string {
  return getWorkspaceSkillTargetRoot(workspacePath, "gemini");
}

export function getWorkspaceCursorSkillsRoot(workspacePath: string): string {
  return getWorkspaceSkillTargetRoot(workspacePath, "cursor");
}

export function getWorkspaceCodegraphSkillTargetRoots(workspacePath: string): string[] {
  return CODEGRAPH_SKILL_TARGET_ROOTS.map((target) => resolveInside(workspacePath, target.relativePath));
}

export async function syncBundledCodegraphSkills(
  options: SyncBundledCodegraphSkillsOptions,
): Promise<SyncBundledCodegraphSkillsReport> {
  const bundleRoot = getBundledCodegraphSkillsRoot(options.extensionPath);
  const manifest = await readManifest(bundleRoot);
  const report: SyncBundledCodegraphSkillsReport = {
    skills: [],
    copied: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    targetRoots: [],
    targets: [],
  };

  for (const skill of manifest.skills) {
    const source = resolveInside(bundleRoot, skill.source);
    const targets = getSkillTargets(options.workspacePath, skill);

    await assertDirectory(source);
    for (const target of [...new Set(targets)]) {
      const copyReport = await copyDirectory(source, target, {
        bundleVersion: manifest.bundleVersion,
        skillId: skill.id,
        skillVersion: skill.version,
      });
      report.copied += copyReport.copied;
      report.updated += copyReport.updated;
      report.unchanged += copyReport.unchanged;
      report.skipped += copyReport.skipped;
      report.targetRoots.push(path.dirname(target));
      report.targets.push(target);
    }
    report.skills.push(skill.id);
  }

  return {
    ...report,
    targetRoots: [...new Set(report.targetRoots)],
    targets: [...new Set(report.targets)],
  };
}

function getSkillTargets(workspacePath: string, skill: SkillBundleEntry): string[] {
  const defaultTargets = CODEGRAPH_SKILL_TARGET_ROOTS.map((targetRoot) => `${targetRoot.relativePath}/${skill.id}`);
  const manifestTargets = [
    skill.workspaceCatalogTarget,
    skill.agentSkillTarget,
    ...(skill.additionalSkillTargets ?? []),
  ].filter(isString);

  return [...defaultTargets, ...manifestTargets].map((target) => resolveInside(workspacePath, target));
}

function getWorkspaceSkillTargetRoot(workspacePath: string, id: string): string {
  const targetRoot = CODEGRAPH_SKILL_TARGET_ROOTS.find((target) => target.id === id);
  if (!targetRoot) {
    throw new Error(`Unknown Codegraph skill target root: ${id}`);
  }
  return resolveInside(workspacePath, targetRoot.relativePath);
}

async function readManifest(bundleRoot: string): Promise<SkillBundleManifest> {
  const manifestPath = path.join(bundleRoot, "manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as SkillBundleManifest;
  if (manifest.version !== 1 || !Array.isArray(manifest.skills)) {
    throw new Error(`Invalid Codegraph skill bundle manifest: ${manifestPath}`);
  }
  return manifest;
}

async function assertDirectory(targetPath: string): Promise<void> {
  const stat = await fs.stat(targetPath);
  if (!stat.isDirectory()) {
    throw new Error(`Expected directory: ${targetPath}`);
  }
}

async function copyDirectory(
  source: string,
  target: string,
  metadataInput: Pick<SyncMetadata, "bundleVersion" | "skillId" | "skillVersion">,
): Promise<CopyReport> {
  const report: CopyReport = { copied: 0, updated: 0, unchanged: 0, skipped: 0 };
  await fs.mkdir(target, { recursive: true });
  const metadata = await readSyncMetadata(target);
  const nextFiles = { ...metadata.files };
  const entries = await listFiles(source);

  for (const sourcePath of entries) {
    const relativePath = toPortablePath(path.relative(source, sourcePath));
    const targetPath = path.join(target, relativePath);
    const result = await copyFileIfChanged(sourcePath, targetPath, metadata.files[relativePath]);
    report[result] += 1;
    if (result !== "skipped") {
      nextFiles[relativePath] = { sha256: await hashFile(sourcePath) };
    }
  }

  await writeSyncMetadata(target, {
    ...metadataInput,
    syncedAt: new Date().toISOString(),
    files: nextFiles,
  });

  return report;
}

async function copyFileIfChanged(
  source: string,
  target: string,
  previous: SyncMetadataFile | undefined,
): Promise<keyof CopyReport> {
  const sourceContent = await fs.readFile(source);
  try {
    const targetContent = await fs.readFile(target);
    if (Buffer.compare(sourceContent, targetContent) === 0) {
      return "unchanged";
    }
    const targetHash = hashBuffer(targetContent);
    if (!previous || targetHash !== previous.sha256) {
      return "skipped";
    }
    await fs.writeFile(target, sourceContent);
    return "updated";
  } catch (error) {
    if (isMissingFile(error)) {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, sourceContent);
      return "copied";
    }
    throw error;
  }
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(target));
      continue;
    }
    if (entry.isFile()) {
      files.push(target);
    }
  }
  return files.sort();
}

async function readSyncMetadata(target: string): Promise<SyncMetadata> {
  try {
    const metadata = JSON.parse(await fs.readFile(syncMetadataPath(target), "utf8")) as SyncMetadata;
    return {
      skillId: metadata.skillId,
      skillVersion: metadata.skillVersion,
      bundleVersion: metadata.bundleVersion,
      syncedAt: metadata.syncedAt,
      files: isRecord(metadata.files) ? metadata.files : {},
    };
  } catch (error) {
    if (isMissingFile(error)) {
      return { skillId: "", syncedAt: "", files: {} };
    }
    throw error;
  }
}

async function writeSyncMetadata(target: string, metadata: SyncMetadata): Promise<void> {
  await fs.writeFile(syncMetadataPath(target), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

function syncMetadataPath(target: string): string {
  return path.join(target, ".codegraph-skill-sync.json");
}

async function hashFile(target: string): Promise<string> {
  return hashBuffer(await fs.readFile(target));
}

function hashBuffer(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function toPortablePath(value: string): string {
  return value.split(path.sep).join("/");
}

function resolveInside(root: string, relativeTarget: string): string {
  if (path.isAbsolute(relativeTarget)) {
    throw new Error(`Expected relative path in Codegraph skill manifest: ${relativeTarget}`);
  }

  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, relativeTarget);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Path escapes Codegraph skill bundle target: ${relativeTarget}`);
  }
  return resolvedTarget;
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, SyncMetadataFile> {
  return typeof value === "object" && value !== null;
}
