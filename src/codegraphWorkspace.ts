import * as fs from "node:fs";
import * as path from "node:path";

export interface WorkspaceFolderLike {
  name: string;
  fsPath: string;
}

export interface CodegraphWorkspaceInfo {
  folder: WorkspaceFolderLike;
  codegraphPath: string;
}

export function findCodegraphWorkspaceInfo(
  folders: WorkspaceFolderLike[],
  existsAsDirectory: (targetPath: string) => boolean = isDirectory,
): CodegraphWorkspaceInfo | undefined {
  for (const folder of folders) {
    const codegraphPath = path.join(folder.fsPath, ".codegraph");
    if (existsAsDirectory(codegraphPath)) {
      return { folder, codegraphPath };
    }
  }

  return undefined;
}

function isDirectory(targetPath: string): boolean {
  try {
    return fs.statSync(targetPath).isDirectory();
  } catch {
    return false;
  }
}
