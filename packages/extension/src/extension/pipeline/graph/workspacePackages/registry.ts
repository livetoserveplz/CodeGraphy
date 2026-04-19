import * as fs from 'node:fs';
import * as path from 'node:path';
import { getWorkspacePackageNodeId } from '../../../../shared/graphControls/packages/workspace';
import {
  getWorkspacePackageRootFromManifest,
  isWorkspacePackageManifestPath,
} from '../../../../shared/graphControls/packages/roots';

export interface WorkspacePackageInfo {
  name: string;
  nodeId: string;
  rootPath: string;
}

export type WorkspacePackageRegistry = ReadonlyMap<string, WorkspacePackageInfo>;

function readPackageName(manifestPath: string): string | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as unknown;
    if (
      typeof parsed !== 'object'
      || parsed === null
      || Array.isArray(parsed)
      || typeof (parsed as { name?: unknown }).name !== 'string'
    ) {
      return null;
    }

    return (parsed as { name: string }).name;
  } catch {
    return null;
  }
}

export function buildWorkspacePackageRegistry(
  filePaths: Iterable<string>,
  workspaceRoot: string,
): WorkspacePackageRegistry {
  const registry = new Map<string, WorkspacePackageInfo>();

  for (const filePath of [...filePaths].filter(isWorkspacePackageManifestPath).sort()) {
    const name = readPackageName(path.join(workspaceRoot, filePath));
    if (!name || registry.has(name)) {
      continue;
    }

    const rootPath = getWorkspacePackageRootFromManifest(filePath);
    registry.set(name, {
      name,
      nodeId: getWorkspacePackageNodeId(rootPath),
      rootPath,
    });
  }

  return registry;
}
