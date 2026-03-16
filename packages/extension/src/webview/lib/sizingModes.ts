/**
 * @fileoverview Individual node-sizing mode implementations.
 * Each function computes a Map<nodeId, size> for a specific NodeSizeMode.
 */

import type { IGraphNode } from '../../shared/types';

/** Minimum rendered node radius */
export const MIN_NODE_SIZE = 10;
/** Maximum rendered node radius */
export const MAX_NODE_SIZE = 40;
/** Default node radius when no scaling applies */
export const DEFAULT_NODE_SIZE = 16;

/**
 * Assigns the same fixed size to every node.
 */
export function sizeByUniform(nodes: IGraphNode[]): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const node of nodes) {
    sizes.set(node.id, DEFAULT_NODE_SIZE);
  }
  return sizes;
}

/**
 * Scales node size proportionally to the node's total connection count
 * (both inbound and outbound edges).
 */
export function sizeByConnections(
  nodes: IGraphNode[],
  edges: { from: string; to: string }[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const node of nodes) counts.set(node.id, 0);
  for (const edge of edges) {
    counts.set(edge.from, (counts.get(edge.from) ?? 0) + 1);
    counts.set(edge.to, (counts.get(edge.to) ?? 0) + 1);
  }

  const vals = Array.from(counts.values());
  const minVal = Math.min(...vals, 0);
  const maxVal = Math.max(...vals, 1);
  const range = maxVal - minVal || 1;

  const sizes = new Map<string, number>();
  for (const node of nodes) {
    const count = counts.get(node.id) ?? 0;
    sizes.set(node.id, MIN_NODE_SIZE + ((count - minVal) / range) * (MAX_NODE_SIZE - MIN_NODE_SIZE));
  }
  return sizes;
}

/**
 * Scales node size proportionally to how many times the file has been accessed
 * (the node.accessCount field).
 */
export function sizeByAccessCount(nodes: IGraphNode[]): Map<string, number> {
  const vals = nodes.map(node => node.accessCount ?? 0);
  const minVal = Math.min(...vals, 0);
  const maxVal = Math.max(...vals, 1);
  const range = maxVal - minVal || 1;

  const sizes = new Map<string, number>();
  for (const node of nodes) {
    const accessCount = node.accessCount ?? 0;
    sizes.set(node.id, MIN_NODE_SIZE + ((accessCount - minVal) / range) * (MAX_NODE_SIZE - MIN_NODE_SIZE));
  }
  return sizes;
}

/**
 * Scales node size proportionally to the file size on disk (node.fileSize),
 * using a logarithmic scale so very large files don't dominate visually.
 * Nodes with no file-size data receive the minimum size.
 */
export function sizeByFileSize(nodes: IGraphNode[]): Map<string, number> {
  const sizes = new Map<string, number>();

  const fileSizes = nodes.map(node => node.fileSize ?? 0).filter(fs => fs > 0);
  if (fileSizes.length === 0) {
    for (const node of nodes) sizes.set(node.id, DEFAULT_NODE_SIZE);
    return sizes;
  }

  const logSizes = fileSizes.map(fs => Math.log10(fs + 1));
  const minLog = Math.min(...logSizes);
  const maxLog = Math.max(...logSizes);
  const range = maxLog - minLog || 1;

  for (const node of nodes) {
    const fs = node.fileSize ?? 0;
    if (fs === 0) {
      sizes.set(node.id, MIN_NODE_SIZE);
    } else {
      const logSize = Math.log10(fs + 1);
      sizes.set(node.id, MIN_NODE_SIZE + ((logSize - minLog) / range) * (MAX_NODE_SIZE - MIN_NODE_SIZE));
    }
  }
  return sizes;
}
