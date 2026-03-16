import { describe, it, expect } from 'vitest';
import {
  sizeByUniform,
  sizeByConnections,
  sizeByAccessCount,
  sizeByFileSize,
  MIN_NODE_SIZE,
  MAX_NODE_SIZE,
  DEFAULT_NODE_SIZE,
} from '../../../src/webview/lib/sizingModes';
import type { IGraphNode } from '../../../src/shared/types';

function makeNode(id: string, overrides: Partial<IGraphNode> = {}): IGraphNode {
  return { id, label: id, color: '#aaa', ...overrides };
}

describe('sizeByUniform', () => {
  it('assigns DEFAULT_NODE_SIZE to every node', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')];
    const sizes = sizeByUniform(nodes);
    for (const node of nodes) {
      expect(sizes.get(node.id)).toBe(DEFAULT_NODE_SIZE);
    }
  });

  it('returns an entry for every node provided', () => {
    const nodes = [makeNode('x'), makeNode('y')];
    const sizes = sizeByUniform(nodes);
    expect(sizes.size).toBe(2);
  });

  it('returns an empty map when there are no nodes', () => {
    const sizes = sizeByUniform([]);
    expect(sizes.size).toBe(0);
  });
});

describe('sizeByConnections', () => {
  it('gives the most-connected node a larger size', () => {
    const nodes = [makeNode('hub'), makeNode('leaf1'), makeNode('leaf2')];
    const edges = [
      { from: 'hub', to: 'leaf1' },
      { from: 'hub', to: 'leaf2' },
    ];
    const sizes = sizeByConnections(nodes, edges);
    expect(sizes.get('hub')!).toBeGreaterThan(sizes.get('leaf1')!);
  });

  it('assigns MIN_NODE_SIZE to a completely isolated node', () => {
    const nodes = [makeNode('isolated')];
    const sizes = sizeByConnections(nodes, []);
    expect(sizes.get('isolated')).toBe(MIN_NODE_SIZE);
  });

  it('keeps sizes within MIN/MAX bounds', () => {
    const nodes = Array.from({ length: 5 }, (_, idx) => makeNode(`n${idx}`));
    const edges = nodes.slice(1).map(node => ({ from: nodes[0].id, to: node.id }));
    const sizes = sizeByConnections(nodes, edges);
    for (const size of sizes.values()) {
      expect(size).toBeGreaterThanOrEqual(MIN_NODE_SIZE);
      expect(size).toBeLessThanOrEqual(MAX_NODE_SIZE);
    }
  });

  it('counts both inbound and outbound edges for a node', () => {
    const nodes = [makeNode('src'), makeNode('mid'), makeNode('dst')];
    const edges = [
      { from: 'src', to: 'mid' },
      { from: 'mid', to: 'dst' },
    ];
    const sizes = sizeByConnections(nodes, edges);
    // mid has 2 connections; src and dst each have 1
    expect(sizes.get('mid')!).toBeGreaterThan(sizes.get('src')!);
    expect(sizes.get('mid')!).toBeGreaterThan(sizes.get('dst')!);
  });
});

describe('sizeByAccessCount', () => {
  it('gives the most-accessed node a larger size', () => {
    const nodes = [
      makeNode('popular', { accessCount: 100 }),
      makeNode('rare', { accessCount: 1 }),
    ];
    const sizes = sizeByAccessCount(nodes);
    expect(sizes.get('popular')!).toBeGreaterThan(sizes.get('rare')!);
  });

  it('assigns MIN_NODE_SIZE when all nodes have zero access count', () => {
    const nodes = [makeNode('zero', { accessCount: 0 }), makeNode('also-zero', { accessCount: 0 })];
    const sizes = sizeByAccessCount(nodes);
    for (const size of sizes.values()) {
      expect(size).toBe(MIN_NODE_SIZE);
    }
  });

  it('treats missing accessCount as zero', () => {
    const nodes = [makeNode('nocount'), makeNode('withcount', { accessCount: 10 })];
    const sizes = sizeByAccessCount(nodes);
    expect(sizes.get('nocount')).toBe(MIN_NODE_SIZE);
    expect(sizes.get('withcount')!).toBeGreaterThan(MIN_NODE_SIZE);
  });

  it('keeps sizes within MIN/MAX bounds', () => {
    const nodes = [
      makeNode('small', { accessCount: 1 }),
      makeNode('large', { accessCount: 999 }),
    ];
    const sizes = sizeByAccessCount(nodes);
    for (const size of sizes.values()) {
      expect(size).toBeGreaterThanOrEqual(MIN_NODE_SIZE);
      expect(size).toBeLessThanOrEqual(MAX_NODE_SIZE);
    }
  });
});

describe('sizeByFileSize', () => {
  it('gives a larger node to the bigger file', () => {
    const nodes = [
      makeNode('big', { fileSize: 10000 }),
      makeNode('small', { fileSize: 10 }),
    ];
    const sizes = sizeByFileSize(nodes);
    expect(sizes.get('big')!).toBeGreaterThan(sizes.get('small')!);
  });

  it('assigns DEFAULT_NODE_SIZE to all nodes when no file sizes are known', () => {
    const nodes = [makeNode('nosize1'), makeNode('nosize2')];
    const sizes = sizeByFileSize(nodes);
    for (const size of sizes.values()) {
      expect(size).toBe(DEFAULT_NODE_SIZE);
    }
  });

  it('assigns MIN_NODE_SIZE to a node with zero fileSize when others have real sizes', () => {
    const nodes = [
      makeNode('zero', { fileSize: 0 }),
      makeNode('big', { fileSize: 5000 }),
    ];
    const sizes = sizeByFileSize(nodes);
    expect(sizes.get('zero')).toBe(MIN_NODE_SIZE);
  });

  it('keeps sizes within MIN/MAX bounds', () => {
    const nodes = [
      makeNode('tiny', { fileSize: 1 }),
      makeNode('huge', { fileSize: 10_000_000 }),
    ];
    const sizes = sizeByFileSize(nodes);
    for (const size of sizes.values()) {
      expect(size).toBeGreaterThanOrEqual(MIN_NODE_SIZE);
      expect(size).toBeLessThanOrEqual(MAX_NODE_SIZE);
    }
  });
});
