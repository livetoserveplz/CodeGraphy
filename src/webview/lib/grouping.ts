/**
 * @fileoverview Utilities for grouping graph nodes by folder.
 * Provides functions to calculate folder groups and generate group colors.
 * @module webview/lib/grouping
 */

import { IGraphNode, IFolderGroup } from '../../shared/types';

/** Colors for folder groups (pastel palette for backgrounds) */
const GROUP_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

/**
 * Extract the parent folder from a file path.
 * Returns '.' for root-level files.
 * 
 * @param path - File path (e.g., 'src/components/Button.tsx')
 * @returns Parent folder path (e.g., 'src/components')
 */
export function getParentFolder(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) {
    return '.'; // Root level
  }
  return path.slice(0, lastSlash);
}

/**
 * Get a display label for a folder path.
 * Shows just the folder name, not the full path.
 * 
 * @param folderPath - Full folder path (e.g., 'src/components')
 * @returns Display label (e.g., 'components')
 */
export function getFolderLabel(folderPath: string): string {
  if (folderPath === '.') {
    return '(root)';
  }
  const lastSlash = folderPath.lastIndexOf('/');
  if (lastSlash === -1) {
    return folderPath;
  }
  return folderPath.slice(lastSlash + 1);
}

/**
 * Calculate folder groups from a list of nodes.
 * 
 * @param nodes - Array of graph nodes
 * @param collapsedGroups - Set of group IDs that are collapsed
 * @returns Array of folder groups
 */
export function calculateFolderGroups(
  nodes: IGraphNode[],
  collapsedGroups: Set<string> = new Set()
): IFolderGroup[] {
  // Group nodes by their parent folder
  const folderMap = new Map<string, string[]>();
  
  for (const node of nodes) {
    const folder = getParentFolder(node.id);
    if (!folderMap.has(folder)) {
      folderMap.set(folder, []);
    }
    folderMap.get(folder)!.push(node.id);
  }

  // Convert to IFolderGroup array
  const groups: IFolderGroup[] = [];
  let colorIndex = 0;

  // Sort folders for consistent ordering
  const sortedFolders = Array.from(folderMap.keys()).sort();

  for (const folder of sortedFolders) {
    const nodeIds = folderMap.get(folder)!;
    
    // Only create groups for folders with more than 1 node
    if (nodeIds.length > 1) {
      groups.push({
        id: folder,
        label: getFolderLabel(folder),
        nodeIds,
        collapsed: collapsedGroups.has(folder),
        color: GROUP_COLORS[colorIndex % GROUP_COLORS.length],
      });
      colorIndex++;
    }
  }

  return groups;
}

/**
 * Get the cluster ID for a folder group.
 * Used by vis-network clustering.
 * 
 * @param folderId - Folder path
 * @returns Cluster ID string
 */
export function getClusterId(folderId: string): string {
  return `cluster:${folderId}`;
}

/**
 * Check if an ID is a cluster ID.
 * 
 * @param id - Node or cluster ID
 * @returns True if the ID is a cluster ID
 */
export function isClusterId(id: string): boolean {
  return id.startsWith('cluster:');
}

/**
 * Extract the folder path from a cluster ID.
 * 
 * @param clusterId - Cluster ID (e.g., 'cluster:src/components')
 * @returns Folder path (e.g., 'src/components')
 */
export function getFolderFromClusterId(clusterId: string): string {
  return clusterId.replace('cluster:', '');
}
