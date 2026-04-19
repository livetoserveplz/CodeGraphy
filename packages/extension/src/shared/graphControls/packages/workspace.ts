import type { IGraphData } from '../../graph/contracts';

export const WORKSPACE_PACKAGE_NODE_ID_PREFIX = 'pkg:workspace:' as const;

export function isFileNode(node: IGraphData['nodes'][number]): boolean {
  return (node.nodeType ?? 'file') === 'file';
}

export function getWorkspacePackageNodeId(rootPath: string): string {
  return `${WORKSPACE_PACKAGE_NODE_ID_PREFIX}${rootPath}`;
}

export function isWorkspacePackageNodeId(nodeId: string): boolean {
  return nodeId.startsWith(WORKSPACE_PACKAGE_NODE_ID_PREFIX);
}

export function getWorkspacePackageRootFromNodeId(nodeId: string): string {
  return isWorkspacePackageNodeId(nodeId)
    ? nodeId.slice(WORKSPACE_PACKAGE_NODE_ID_PREFIX.length)
    : nodeId;
}

export function getWorkspacePackageLabel(rootPath: string): string {
  if (rootPath === '.') {
    return 'workspace';
  }

  return rootPath.split('/').pop() ?? rootPath;
}
