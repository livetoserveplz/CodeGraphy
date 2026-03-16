/**
 * @fileoverview Timeline position seeding for new graph nodes.
 * When switching between commits in timeline mode, newly-appearing nodes
 * are seeded near a connected neighbor so the graph doesn't jump.
 */

/** Minimal shape required by the seeding algorithm. */
export interface SeedableNode {
  readonly id: string;
  x?: number;
  y?: number;
}

/** Minimal edge shape required by the seeding algorithm. */
export interface SeedableEdge {
  readonly from: string;
  readonly to: string;
}

/**
 * For nodes that have no position yet, seed an initial (x, y) near a connected
 * neighbor that already has a position.  Mutates nodes in-place.
 *
 * Only runs when `prevPositions` is non-null and non-empty (i.e. during timeline
 * playback where we want smooth transitions instead of a full layout restart).
 */
export function seedTimelinePositions(
  nodes: SeedableNode[],
  edges: SeedableEdge[],
  prevPositions: Map<string, { x: number | undefined; y: number | undefined }> | null
): void {
  if (!prevPositions || prevPositions.size === 0) return;

  const nodePositionMap = new Map(nodes.map(node => [node.id, node]));

  for (const node of nodes) {
    if (node.x !== undefined || node.y !== undefined) continue;

    const edge = edges.find(edgeItem => edgeItem.from === node.id || edgeItem.to === node.id);
    if (!edge) continue;

    const neighborId = edge.from === node.id ? edge.to : edge.from;
    const neighbor = nodePositionMap.get(neighborId);
    if (neighbor?.x !== undefined && neighbor?.y !== undefined) {
      node.x = neighbor.x + (Math.random() - 0.5) * 40;
      node.y = neighbor.y + (Math.random() - 0.5) * 40;
    }
  }
}
