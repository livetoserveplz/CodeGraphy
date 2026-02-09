/**
 * @fileoverview Pathfinding utilities for finding all paths between two nodes in a graph.
 */

export interface EdgeLike {
  id: string;
  from: string;
  to: string;
}

export interface PathResult {
  /** Ordered node IDs in the path */
  nodeIds: string[];
  /** Edge IDs traversed in the path */
  edgeIds: string[];
}

/**
 * Build an adjacency list from edges (undirected — treats all edges as bidirectional
 * for path discovery since the user cares about connections, not direction).
 */
function buildAdjacency(edges: EdgeLike[]): Map<string, { neighbor: string; edgeId: string }[]> {
  const adj = new Map<string, { neighbor: string; edgeId: string }[]>();
  for (const edge of edges) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    if (!adj.has(edge.to)) adj.set(edge.to, []);
    adj.get(edge.from)!.push({ neighbor: edge.to, edgeId: edge.id });
    adj.get(edge.to)!.push({ neighbor: edge.from, edgeId: edge.id });
  }
  return adj;
}

/**
 * Find all simple paths between two nodes using DFS with depth limit.
 * Returns an array of PathResult. Each path contains no repeated nodes.
 *
 * @param edges - Graph edges
 * @param from - Source node ID
 * @param to - Target node ID
 * @param maxDepth - Maximum path length (number of edges). Default 10.
 * @returns Array of paths found
 */
export function findAllPaths(
  edges: EdgeLike[],
  from: string,
  to: string,
  maxDepth = 10,
): PathResult[] {
  if (from === to) return [];

  const adj = buildAdjacency(edges);
  if (!adj.has(from) || !adj.has(to)) return [];

  const results: PathResult[] = [];
  const visited = new Set<string>();

  function dfs(current: string, nodeIds: string[], edgeIds: string[]) {
    if (nodeIds.length - 1 >= maxDepth) return;
    if (current === to) {
      results.push({ nodeIds: [...nodeIds], edgeIds: [...edgeIds] });
      return;
    }

    const neighbors = adj.get(current);
    if (!neighbors) return;

    for (const { neighbor, edgeId } of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      nodeIds.push(neighbor);
      edgeIds.push(edgeId);
      dfs(neighbor, nodeIds, edgeIds);
      nodeIds.pop();
      edgeIds.pop();
      visited.delete(neighbor);
    }
  }

  visited.add(from);
  dfs(from, [from], []);

  // Sort by path length (shortest first)
  results.sort((a, b) => a.nodeIds.length - b.nodeIds.length);
  return results;
}

/**
 * Find the shortest path between two nodes using BFS.
 *
 * @param edges - Graph edges
 * @param from - Source node ID
 * @param to - Target node ID
 * @returns The shortest path, or null if no path exists
 */
export function findShortestPath(
  edges: EdgeLike[],
  from: string,
  to: string,
): PathResult | null {
  if (from === to) return null;

  const adj = buildAdjacency(edges);
  if (!adj.has(from) || !adj.has(to)) return null;

  const queue: { node: string; nodeIds: string[]; edgeIds: string[] }[] = [
    { node: from, nodeIds: [from], edgeIds: [] },
  ];
  const visited = new Set<string>([from]);

  while (queue.length > 0) {
    const { node, nodeIds, edgeIds } = queue.shift()!;
    const neighbors = adj.get(node);
    if (!neighbors) continue;

    for (const { neighbor, edgeId } of neighbors) {
      if (visited.has(neighbor)) continue;
      const newNodeIds = [...nodeIds, neighbor];
      const newEdgeIds = [...edgeIds, edgeId];
      if (neighbor === to) {
        return { nodeIds: newNodeIds, edgeIds: newEdgeIds };
      }
      visited.add(neighbor);
      queue.push({ node: neighbor, nodeIds: newNodeIds, edgeIds: newEdgeIds });
    }
  }

  return null;
}

/**
 * Collect all unique node IDs and edge IDs from multiple paths.
 */
export function collectPathElements(paths: PathResult[]): {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
} {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  for (const path of paths) {
    for (const id of path.nodeIds) nodeIds.add(id);
    for (const id of path.edgeIds) edgeIds.add(id);
  }
  return { nodeIds, edgeIds };
}
