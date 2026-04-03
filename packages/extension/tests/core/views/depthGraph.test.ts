import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IGraphData } from '../../../src/shared/graph/types';
import { IViewContext } from '../../../src/core/views/contracts';

const sampleData: IGraphData = {
  nodes: [
    { id: 'a.ts', label: 'a.ts', color: '#93C5FD' },
    { id: 'b.ts', label: 'b.ts', color: '#93C5FD' },
    { id: 'c.ts', label: 'c.ts', color: '#93C5FD' },
    { id: 'd.ts', label: 'd.ts', color: '#93C5FD' },
  ],
  edges: [
    { id: 'a.ts->b.ts', from: 'a.ts', to: 'b.ts' },
    { id: 'b.ts->c.ts', from: 'b.ts', to: 'c.ts' },
    { id: 'c.ts->d.ts', from: 'c.ts', to: 'd.ts' },
  ],
};

function context(overrides: Partial<IViewContext> = {}): IViewContext {
  return { activePlugins: new Set(), ...overrides };
}

describe('depthGraphView', () => {
  describe('view definition properties (fresh import)', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('has the correct id', async () => {
      const { depthGraphView } = await import('../../../src/core/views/depthGraph');
      expect(depthGraphView.id).toBe('codegraphy.depth-graph');
    });

    it('has the correct name', async () => {
      const { depthGraphView } = await import('../../../src/core/views/depthGraph');
      expect(depthGraphView.name).toBe('Depth Graph');
    });

    it('has the correct description', async () => {
      const { depthGraphView } = await import('../../../src/core/views/depthGraph');
      expect(depthGraphView.description).toBe('Focus on current file and its connections up to N levels deep');
    });

    it('has the correct icon', async () => {
      const { depthGraphView } = await import('../../../src/core/views/depthGraph');
      expect(depthGraphView.icon).toBe('target');
    });

    it('has a transform function', async () => {
      const { depthGraphView } = await import('../../../src/core/views/depthGraph');
      expect(typeof depthGraphView.transform).toBe('function');
    });

    it('has an isAvailable function', async () => {
      const { depthGraphView } = await import('../../../src/core/views/depthGraph');
      expect(typeof depthGraphView.isAvailable).toBe('function');
    });

    it('exposes all required IView fields', async () => {
      const { depthGraphView } = await import('../../../src/core/views/depthGraph');
      expect(depthGraphView).toEqual(
        expect.objectContaining({
          id: 'codegraphy.depth-graph',
          name: 'Depth Graph',
          icon: 'target',
          description: 'Focus on current file and its connections up to N levels deep',
        }),
      );
    });
  });

  describe('transform behavior', () => {
    let depthGraphView: Awaited<typeof import('../../../src/core/views/depthGraph')>['depthGraphView'];

    beforeEach(async () => {
      vi.resetModules();
      const mod = await import('../../../src/core/views/depthGraph');
      depthGraphView = mod.depthGraphView;
    });

    it('returns the full graph when no file is focused', () => {
      const result = depthGraphView.transform(sampleData, context());
      expect(result).toEqual(sampleData);
    });

    it('clamps depth limits below 1 to 1', () => {
      const result = depthGraphView.transform(sampleData, context({ focusedFile: 'a.ts', depthLimit: 0 }));
      expect(result.nodes.map((n) => n.id)).toEqual(['a.ts', 'b.ts']);
      expect(result.edges).toHaveLength(1);
    });

    it('includes the focused node and direct neighbors at depth limit 1', () => {
      const result = depthGraphView.transform(sampleData, context({ focusedFile: 'b.ts', depthLimit: 1 }));
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toContain('b.ts');
      expect(ids).toContain('a.ts');
      expect(ids).toContain('c.ts');
      expect(ids).not.toContain('d.ts');
    });

    it('annotates nodes with their depth level', () => {
      const result = depthGraphView.transform(sampleData, context({ focusedFile: 'a.ts', depthLimit: 1 }));
      const aNode = result.nodes.find((n) => n.id === 'a.ts');
      const bNode = result.nodes.find((n) => n.id === 'b.ts');
      expect(aNode?.depthLevel).toBe(0);
      expect(bNode?.depthLevel).toBe(1);
    });

    it('includes edges only between included nodes', () => {
      const result = depthGraphView.transform(sampleData, context({ focusedFile: 'a.ts', depthLimit: 1 }));
      for (const edge of result.edges) {
        const nodeIds = result.nodes.map((n) => n.id);
        expect(nodeIds).toContain(edge.from);
        expect(nodeIds).toContain(edge.to);
      }
    });

    it('falls back to the full graph when focused file is not in the data', () => {
      const result = depthGraphView.transform(sampleData, context({ focusedFile: 'nonexistent.ts', depthLimit: 1 }));
      expect(result).toEqual(sampleData);
    });

    it('is available when a file is focused', () => {
      expect(depthGraphView.isAvailable!(context({ focusedFile: 'a.ts' }))).toBe(true);
    });

    it('is available when no file is focused', () => {
      expect(depthGraphView.isAvailable!(context())).toBe(true);
    });

    it('returns all nodes when focusedFile is undefined', () => {
      const result = depthGraphView.transform(sampleData, context({ focusedFile: undefined }));
      expect(result.nodes).toEqual(sampleData.nodes);
    });

    it('returns all edges when focusedFile is undefined', () => {
      const result = depthGraphView.transform(sampleData, context({ focusedFile: undefined }));
      expect(result.edges).toEqual(sampleData.edges);
    });

    it('publishes a selectable max depth on the view context', () => {
      const viewContext = context({ focusedFile: 'a.ts', depthLimit: 99 });
      depthGraphView.transform(sampleData, viewContext);
      expect(viewContext.maxDepthLimit).toBe(3);
      expect(viewContext.depthLimit).toBe(3);
    });

    it('clears the max depth when no file is focused', () => {
      const viewContext = context({ depthLimit: 4, maxDepthLimit: 2 });
      depthGraphView.transform(sampleData, viewContext);
      expect(viewContext.maxDepthLimit).toBeUndefined();
      expect(viewContext.depthLimit).toBe(4);
    });
  });
});
