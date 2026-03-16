import { describe, it, expect } from 'vitest';
import { classifyTarget } from '../../src/webview/components/graphContextMenu/targetClassification';
import type { IPluginContextMenuItem } from '../../src/shared/types';
import type { GraphContextSelection } from '../../src/webview/components/graphContextMenu/types';

const nodeItem: IPluginContextMenuItem = { label: 'Node Action', when: 'node', pluginId: 'plugin-a', index: 0 };
const edgeItem: IPluginContextMenuItem = { label: 'Edge Action', when: 'edge', pluginId: 'plugin-a', index: 1 };
const bothItem: IPluginContextMenuItem = { label: 'Both Action', when: 'both', pluginId: 'plugin-a', index: 2 };

describe('classifyTarget', () => {
  describe('background selection', () => {
    it('returns null for a background selection', () => {
      const selection: GraphContextSelection = { kind: 'background', targets: [] };
      expect(classifyTarget(selection, [nodeItem, edgeItem, bothItem])).toBeNull();
    });
  });

  describe('node selection', () => {
    it('returns null for a multi-node selection', () => {
      const selection: GraphContextSelection = { kind: 'node', targets: ['src/a.ts', 'src/b.ts'] };
      expect(classifyTarget(selection, [nodeItem])).toBeNull();
    });

    it('returns node classification for a single-node selection', () => {
      const selection: GraphContextSelection = { kind: 'node', targets: ['src/app.ts'] };
      const result = classifyTarget(selection, [nodeItem, bothItem]);
      expect(result).not.toBeNull();
      expect(result?.targetId).toBe('src/app.ts');
      expect(result?.targetType).toBe('node');
    });

    it('includes node-only and both items for a node selection', () => {
      const selection: GraphContextSelection = { kind: 'node', targets: ['src/app.ts'] };
      const result = classifyTarget(selection, [nodeItem, edgeItem, bothItem]);
      expect(result?.eligibleItems).toHaveLength(2);
      expect(result?.eligibleItems.map(item => item.label)).toEqual(['Node Action', 'Both Action']);
    });

    it('excludes edge-only items for a node selection', () => {
      const selection: GraphContextSelection = { kind: 'node', targets: ['src/app.ts'] };
      const result = classifyTarget(selection, [edgeItem]);
      expect(result?.eligibleItems).toHaveLength(0);
    });
  });

  describe('edge selection', () => {
    it('returns null when edge selection has no edgeId', () => {
      const selection: GraphContextSelection = { kind: 'edge', targets: [], edgeId: undefined };
      expect(classifyTarget(selection, [edgeItem])).toBeNull();
    });

    it('returns edge classification for an edge selection with edgeId', () => {
      const selection: GraphContextSelection = {
        kind: 'edge',
        targets: ['src/a.ts', 'src/b.ts'],
        edgeId: 'src/a.ts->src/b.ts',
      };
      const result = classifyTarget(selection, [edgeItem, bothItem]);
      expect(result).not.toBeNull();
      expect(result?.targetId).toBe('src/a.ts->src/b.ts');
      expect(result?.targetType).toBe('edge');
    });

    it('includes edge-only and both items for an edge selection', () => {
      const selection: GraphContextSelection = {
        kind: 'edge',
        targets: ['src/a.ts', 'src/b.ts'],
        edgeId: 'src/a.ts->src/b.ts',
      };
      const result = classifyTarget(selection, [nodeItem, edgeItem, bothItem]);
      expect(result?.eligibleItems).toHaveLength(2);
      expect(result?.eligibleItems.map(item => item.label)).toEqual(['Edge Action', 'Both Action']);
    });

    it('excludes node-only items for an edge selection', () => {
      const selection: GraphContextSelection = {
        kind: 'edge',
        targets: ['src/a.ts', 'src/b.ts'],
        edgeId: 'src/a.ts->src/b.ts',
      };
      const result = classifyTarget(selection, [nodeItem]);
      expect(result?.eligibleItems).toHaveLength(0);
    });
  });
});
