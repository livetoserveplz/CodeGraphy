import { describe, it, expect } from 'vitest';
import { fileDataToNodes, fileDataToEdges, getMockGraphData } from '../../src/shared/mockDataTransforms';
import { MOCK_FILE_DATA } from '../../src/shared/mockData';
import { IFileData, FILE_TYPE_COLORS, DEFAULT_NODE_COLOR } from '../../src/shared/types';

describe('mockDataTransforms', () => {
  describe('fileDataToNodes', () => {
    it('should return an empty array for empty input', () => {
      expect(fileDataToNodes([])).toEqual([]);
    });

    it('should create one node per file', () => {
      const files: IFileData[] = [
        { path: 'src/a.ts', name: 'a.ts', extension: '.ts', imports: [] },
        { path: 'src/b.tsx', name: 'b.tsx', extension: '.tsx', imports: [] },
      ];
      expect(fileDataToNodes(files)).toHaveLength(2);
    });

    it('should use the file path as the node id', () => {
      const files: IFileData[] = [
        { path: 'src/App.tsx', name: 'App.tsx', extension: '.tsx', imports: [] },
      ];
      const nodes = fileDataToNodes(files);
      expect(nodes[0].id).toBe('src/App.tsx');
    });

    it('should use the file name as the node label', () => {
      const files: IFileData[] = [
        { path: 'src/App.tsx', name: 'App.tsx', extension: '.tsx', imports: [] },
      ];
      const nodes = fileDataToNodes(files);
      expect(nodes[0].label).toBe('App.tsx');
    });

    it('should assign the correct color for a known extension', () => {
      const files: IFileData[] = [
        { path: 'src/a.ts', name: 'a.ts', extension: '.ts', imports: [] },
      ];
      const nodes = fileDataToNodes(files);
      expect(nodes[0].color).toBe(FILE_TYPE_COLORS['.ts']);
    });

    it('should assign the default color for an unknown extension', () => {
      const files: IFileData[] = [
        { path: 'src/a.xyz', name: 'a.xyz', extension: '.xyz', imports: [] },
      ];
      const nodes = fileDataToNodes(files);
      expect(nodes[0].color).toBe(DEFAULT_NODE_COLOR);
    });

    it('should preserve node order matching file input order', () => {
      const files: IFileData[] = [
        { path: 'src/a.ts', name: 'a.ts', extension: '.ts', imports: [] },
        { path: 'src/b.ts', name: 'b.ts', extension: '.ts', imports: [] },
        { path: 'src/c.ts', name: 'c.ts', extension: '.ts', imports: [] },
      ];
      const nodes = fileDataToNodes(files);
      expect(nodes.map((node) => node.id)).toEqual(['src/a.ts', 'src/b.ts', 'src/c.ts']);
    });
  });

  describe('fileDataToEdges', () => {
    it('should return an empty array for empty input', () => {
      expect(fileDataToEdges([])).toEqual([]);
    });

    it('should return no edges when no file has imports', () => {
      const files: IFileData[] = [
        { path: 'a.ts', name: 'a.ts', extension: '.ts', imports: [] },
        { path: 'b.ts', name: 'b.ts', extension: '.ts', imports: [] },
      ];
      expect(fileDataToEdges(files)).toEqual([]);
    });

    it('should create an edge when an import target exists in the file list', () => {
      const files: IFileData[] = [
        { path: 'a.ts', name: 'a.ts', extension: '.ts', imports: ['b.ts'] },
        { path: 'b.ts', name: 'b.ts', extension: '.ts', imports: [] },
      ];
      const edges = fileDataToEdges(files);
      expect(edges).toHaveLength(1);
      expect(edges[0]).toEqual({ id: 'a.ts->b.ts', from: 'a.ts', to: 'b.ts' });
    });

    it('should not create an edge when the import target is missing from the file list', () => {
      const files: IFileData[] = [
        { path: 'a.ts', name: 'a.ts', extension: '.ts', imports: ['missing.ts'] },
      ];
      expect(fileDataToEdges(files)).toEqual([]);
    });

    it('should format the edge id as "from->to"', () => {
      const files: IFileData[] = [
        { path: 'src/App.tsx', name: 'App.tsx', extension: '.tsx', imports: ['src/Header.tsx'] },
        { path: 'src/Header.tsx', name: 'Header.tsx', extension: '.tsx', imports: [] },
      ];
      const edges = fileDataToEdges(files);
      expect(edges[0].id).toBe('src/App.tsx->src/Header.tsx');
    });

    it('should create multiple edges when a file has multiple imports', () => {
      const files: IFileData[] = [
        { path: 'a.ts', name: 'a.ts', extension: '.ts', imports: ['b.ts', 'c.ts'] },
        { path: 'b.ts', name: 'b.ts', extension: '.ts', imports: [] },
        { path: 'c.ts', name: 'c.ts', extension: '.ts', imports: [] },
      ];
      const edges = fileDataToEdges(files);
      expect(edges).toHaveLength(2);
    });

    it('should produce unique edge ids for distinct import relationships', () => {
      const files: IFileData[] = [
        { path: 'a.ts', name: 'a.ts', extension: '.ts', imports: ['b.ts'] },
        { path: 'b.ts', name: 'b.ts', extension: '.ts', imports: ['c.ts'] },
        { path: 'c.ts', name: 'c.ts', extension: '.ts', imports: [] },
      ];
      const edges = fileDataToEdges(files);
      const ids = edges.map((edge) => edge.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getMockGraphData', () => {
    it('should return an object with nodes and edges arrays', () => {
      const data = getMockGraphData();
      expect(Array.isArray(data.nodes)).toBe(true);
      expect(Array.isArray(data.edges)).toBe(true);
    });

    it('should create one node for each mock file', () => {
      const data = getMockGraphData();
      expect(data.nodes).toHaveLength(MOCK_FILE_DATA.length);
    });

    it('should create one edge for each mock import relationship', () => {
      const data = getMockGraphData();
      const totalImports = MOCK_FILE_DATA.reduce((sum, file) => sum + file.imports.length, 0);
      expect(data.edges).toHaveLength(totalImports);
    });

    it('should have unique node ids', () => {
      const data = getMockGraphData();
      const ids = data.nodes.map((node) => node.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have unique edge ids', () => {
      const data = getMockGraphData();
      const ids = data.edges.map((edge) => edge.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
