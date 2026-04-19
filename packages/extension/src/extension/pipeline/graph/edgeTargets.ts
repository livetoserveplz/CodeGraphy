import * as path from 'path';
import type { IProjectedConnection, IPlugin } from '../../../core/plugins/types/contracts';
import { isExternalPackageSpecifier } from './packageSpecifiers/match';
import { getExternalPackageName } from './packageSpecifiers/name';
import { getExternalPackageNodeId } from './packageSpecifiers/nodeId';
import type { WorkspacePackageRegistry } from './workspacePackages/registry';

export function getConnectionTargetId(
  _plugin: IPlugin | undefined,
  connection: IProjectedConnection,
  fileConnections: ReadonlyMap<string, IProjectedConnection[]>,
  workspaceRoot: string,
  workspacePackages: WorkspacePackageRegistry = new Map(),
): string | null {
  if (connection.resolvedPath) {
    const targetRelative = path.relative(workspaceRoot, connection.resolvedPath);
    return fileConnections.has(targetRelative) ? targetRelative : null;
  }

  const packageName = getExternalPackageName(connection.specifier);
  const workspacePackage = packageName ? workspacePackages.get(packageName) : undefined;
  if (workspacePackage) {
    return workspacePackage.nodeId;
  }

  return isExternalPackageSpecifier(connection.specifier)
    ? getExternalPackageNodeId(connection.specifier)
    : null;
}
