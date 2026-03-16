import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  seedTimelinePositions,
  type SeedableNode,
  type SeedableEdge,
} from '../../../src/webview/lib/timelinePositionSeeding';

describe('seedTimelinePositions', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when prevPositions is null', () => {
    const nodes: SeedableNode[] = [{ id: 'a' }];
    const edges: SeedableEdge[] = [];
    seedTimelinePositions(nodes, edges, null);
    expect(nodes[0].x).toBeUndefined();
    expect(nodes[0].y).toBeUndefined();
  });

  it('does nothing when prevPositions is empty', () => {
    const nodes: SeedableNode[] = [{ id: 'a' }];
    const edges: SeedableEdge[] = [];
    seedTimelinePositions(nodes, edges, new Map());
    expect(nodes[0].x).toBeUndefined();
    expect(nodes[0].y).toBeUndefined();
  });

  it('does not change a node that already has a position', () => {
    const nodes: SeedableNode[] = [{ id: 'a', x: 10, y: 20 }];
    const edges: SeedableEdge[] = [];
    const prevPositions = new Map([['existing', { x: 100, y: 200 }]]);
    seedTimelinePositions(nodes, edges, prevPositions);
    expect(nodes[0].x).toBe(10);
    expect(nodes[0].y).toBe(20);
  });

  it('seeds a new node near a connected neighbor that has a position', () => {
    // neighbor already in nodes with a position
    const neighbor: SeedableNode = { id: 'neighbor', x: 100, y: 200 };
    const newNode: SeedableNode = { id: 'new' };
    const nodes: SeedableNode[] = [neighbor, newNode];
    const edges: SeedableEdge[] = [{ from: 'new', to: 'neighbor' }];
    const prevPositions = new Map([['neighbor', { x: 100, y: 200 }]]);

    seedTimelinePositions(nodes, edges, prevPositions);

    // Math.random() mocked to 0.5 → offset = (0.5 - 0.5) * 40 = 0
    expect(newNode.x).toBe(100);
    expect(newNode.y).toBe(200);
  });

  it('handles edges where the new node is the "from" side', () => {
    const neighbor: SeedableNode = { id: 'neighbor', x: 50, y: 60 };
    const newNode: SeedableNode = { id: 'new' };
    const nodes: SeedableNode[] = [neighbor, newNode];
    const edges: SeedableEdge[] = [{ from: 'new', to: 'neighbor' }];
    const prevPositions = new Map([['neighbor', { x: 50, y: 60 }]]);

    seedTimelinePositions(nodes, edges, prevPositions);
    expect(newNode.x).toBeDefined();
    expect(newNode.y).toBeDefined();
  });

  it('handles edges where the new node is the "to" side', () => {
    const neighbor: SeedableNode = { id: 'neighbor', x: 30, y: 40 };
    const newNode: SeedableNode = { id: 'new' };
    const nodes: SeedableNode[] = [neighbor, newNode];
    const edges: SeedableEdge[] = [{ from: 'neighbor', to: 'new' }];
    const prevPositions = new Map([['neighbor', { x: 30, y: 40 }]]);

    seedTimelinePositions(nodes, edges, prevPositions);
    expect(newNode.x).toBeDefined();
    expect(newNode.y).toBeDefined();
  });

  it('leaves a new node without position when it has no connected neighbor with a position', () => {
    const isolatedNode: SeedableNode = { id: 'isolated' };
    const nodes: SeedableNode[] = [isolatedNode];
    const edges: SeedableEdge[] = [];
    const prevPositions = new Map([['other', { x: 0, y: 0 }]]);

    seedTimelinePositions(nodes, edges, prevPositions);
    expect(isolatedNode.x).toBeUndefined();
    expect(isolatedNode.y).toBeUndefined();
  });

  it('seeds multiple new nodes independently', () => {
    const anchor: SeedableNode = { id: 'anchor', x: 0, y: 0 };
    const newNode1: SeedableNode = { id: 'new1' };
    const newNode2: SeedableNode = { id: 'new2' };
    const nodes: SeedableNode[] = [anchor, newNode1, newNode2];
    const edges: SeedableEdge[] = [
      { from: 'new1', to: 'anchor' },
      { from: 'new2', to: 'anchor' },
    ];
    const prevPositions = new Map([['anchor', { x: 0, y: 0 }]]);

    seedTimelinePositions(nodes, edges, prevPositions);
    expect(newNode1.x).toBeDefined();
    expect(newNode2.x).toBeDefined();
  });
});
