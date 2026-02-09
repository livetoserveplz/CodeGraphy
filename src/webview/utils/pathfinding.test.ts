import { describe, it, expect } from 'vitest';
import { findAllPaths, findShortestPath, collectPathElements, EdgeLike } from './pathfinding';

const edge = (from: string, to: string): EdgeLike => ({
  id: `${from}->${to}`,
  from,
  to,
});

describe('findAllPaths', () => {
  it('returns empty for disconnected nodes', () => {
    const edges = [edge('A', 'B'), edge('C', 'D')];
    expect(findAllPaths(edges, 'A', 'D')).toEqual([]);
  });

  it('returns empty when from === to', () => {
    const edges = [edge('A', 'B')];
    expect(findAllPaths(edges, 'A', 'A')).toEqual([]);
  });

  it('returns empty when node does not exist', () => {
    const edges = [edge('A', 'B')];
    expect(findAllPaths(edges, 'A', 'Z')).toEqual([]);
  });

  it('finds single hop path', () => {
    const edges = [edge('A', 'B')];
    const paths = findAllPaths(edges, 'A', 'B');
    expect(paths).toHaveLength(1);
    expect(paths[0].nodeIds).toEqual(['A', 'B']);
    expect(paths[0].edgeIds).toEqual(['A->B']);
  });

  it('finds multiple paths', () => {
    // A -> B -> D
    // A -> C -> D
    const edges = [edge('A', 'B'), edge('B', 'D'), edge('A', 'C'), edge('C', 'D')];
    const paths = findAllPaths(edges, 'A', 'D');
    expect(paths.length).toBeGreaterThanOrEqual(2);
    // All paths should start with A and end with D
    for (const p of paths) {
      expect(p.nodeIds[0]).toBe('A');
      expect(p.nodeIds[p.nodeIds.length - 1]).toBe('D');
    }
  });

  it('handles cycles without infinite loop', () => {
    // A -> B -> C -> A (cycle), B -> D
    const edges = [edge('A', 'B'), edge('B', 'C'), edge('C', 'A'), edge('B', 'D')];
    const paths = findAllPaths(edges, 'A', 'D');
    expect(paths.length).toBeGreaterThanOrEqual(1);
    // No path should have repeated nodes
    for (const p of paths) {
      expect(new Set(p.nodeIds).size).toBe(p.nodeIds.length);
    }
  });

  it('respects maxDepth', () => {
    // A -> B -> C -> D (3 hops)
    const edges = [edge('A', 'B'), edge('B', 'C'), edge('C', 'D')];
    expect(findAllPaths(edges, 'A', 'D', 2)).toEqual([]); // 3 hops needed, max 2
    expect(findAllPaths(edges, 'A', 'D', 3)).toHaveLength(1);
  });

  it('treats edges as bidirectional', () => {
    const edges = [edge('A', 'B')];
    const paths = findAllPaths(edges, 'B', 'A');
    expect(paths).toHaveLength(1);
    expect(paths[0].nodeIds).toEqual(['B', 'A']);
  });
});

describe('findShortestPath', () => {
  it('returns null for disconnected nodes', () => {
    const edges = [edge('A', 'B'), edge('C', 'D')];
    expect(findShortestPath(edges, 'A', 'D')).toBeNull();
  });

  it('finds shortest path', () => {
    // A -> B -> D (2 hops), A -> C -> E -> D (3 hops)
    const edges = [edge('A', 'B'), edge('B', 'D'), edge('A', 'C'), edge('C', 'E'), edge('E', 'D')];
    const result = findShortestPath(edges, 'A', 'D');
    expect(result).not.toBeNull();
    expect(result!.nodeIds).toEqual(['A', 'B', 'D']);
  });
});

describe('collectPathElements', () => {
  it('collects unique node and edge IDs', () => {
    const paths = [
      { nodeIds: ['A', 'B', 'C'], edgeIds: ['e1', 'e2'] },
      { nodeIds: ['A', 'D', 'C'], edgeIds: ['e3', 'e4'] },
    ];
    const { nodeIds, edgeIds } = collectPathElements(paths);
    expect(nodeIds).toEqual(new Set(['A', 'B', 'C', 'D']));
    expect(edgeIds).toEqual(new Set(['e1', 'e2', 'e3', 'e4']));
  });
});
