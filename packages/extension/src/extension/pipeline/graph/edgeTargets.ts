import * as path from 'path';
import type { IProjectedConnection, IPlugin } from '../../../core/plugins/types/contracts';
import { isExternalPackageSpecifier } from './packageSpecifiers/match';
import { getExternalPackageNodeId } from './packageSpecifiers/nodeId';
import {
  resolveMonorepoImportMapTargetId,
  type MonorepoImportMap,
} from './monorepoImportMap/resolve';

export function getConnectionTargetId(
  _plugin: IPlugin | undefined,
  connection: IProjectedConnection,
  fileConnections: ReadonlyMap<string, IProjectedConnection[]>,
  workspaceRoot: string,
  monorepoImportMap: MonorepoImportMap = {},
): string | null {
  if (connection.resolvedPath) {
    const targetRelative = path.relative(workspaceRoot, connection.resolvedPath);
    return fileConnections.has(targetRelative) ? targetRelative : null;
  }

  const mappedTargetId = resolveMonorepoImportMapTargetId(
    connection.specifier,
    monorepoImportMap,
    fileConnections,
    workspaceRoot,
  );
  if (mappedTargetId) {
    return mappedTargetId;
  }

  return isExternalPackageSpecifier(connection.specifier)
    ? getExternalPackageNodeId(connection.specifier)
    : null;
}
