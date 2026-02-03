import { describe, it, expect } from 'vitest';
import {
  getParentFolder,
  getFolderLabel,
  calculateFolderGroups,
  getClusterId,
  isClusterId,
  getFolderFromClusterId,
} from '../../../src/webview/lib/grouping';
import { IGraphNode } from '../../../src/shared/types';

describe('getParentFolder', () => {
  it('should extract parent folder from file path', () => {
    expect(getParentFolder('src/components/Button.tsx')).toBe('src/components');
    expect(getParentFolder('src/index.ts')).toBe('src');
    expect(getParentFolder('utils/helpers/format.ts')).toBe('utils/helpers');
  });

  it('should return "." for root-level files', () => {
    expect(getParentFolder('index.ts')).toBe('.');
    expect(getParentFolder('package.json')).toBe('.');
    expect(getParentFolder('README.md')).toBe('.');
  });
});

describe('getFolderLabel', () => {
  it('should return just the folder name', () => {
    expect(getFolderLabel('src/components')).toBe('components');
    expect(getFolderLabel('src/utils/helpers')).toBe('helpers');
    expect(getFolderLabel('lib')).toBe('lib');
  });

  it('should return "(root)" for root folder', () => {
    expect(getFolderLabel('.')).toBe('(root)');
  });
});

describe('calculateFolderGroups', () => {
  const mockNodes: IGraphNode[] = [
    { id: 'src/components/Button.tsx', label: 'Button.tsx', color: '#93C5FD' },
    { id: 'src/components/Header.tsx', label: 'Header.tsx', color: '#93C5FD' },
    { id: 'src/utils/format.ts', label: 'format.ts', color: '#93C5FD' },
    { id: 'src/utils/helpers.ts', label: 'helpers.ts', color: '#93C5FD' },
    { id: 'src/index.ts', label: 'index.ts', color: '#93C5FD' },
    { id: 'package.json', label: 'package.json', color: '#86EFAC' },
  ];

  it('should group nodes by parent folder', () => {
    const groups = calculateFolderGroups(mockNodes);
    
    // Should create groups only for folders with 2+ nodes
    expect(groups.length).toBe(2); // src/components and src/utils
    
    const componentsGroup = groups.find(g => g.id === 'src/components');
    expect(componentsGroup).toBeDefined();
    expect(componentsGroup?.nodeIds).toContain('src/components/Button.tsx');
    expect(componentsGroup?.nodeIds).toContain('src/components/Header.tsx');
    expect(componentsGroup?.label).toBe('components');
    
    const utilsGroup = groups.find(g => g.id === 'src/utils');
    expect(utilsGroup).toBeDefined();
    expect(utilsGroup?.nodeIds).toContain('src/utils/format.ts');
    expect(utilsGroup?.nodeIds).toContain('src/utils/helpers.ts');
    expect(utilsGroup?.label).toBe('utils');
  });

  it('should not create groups for single-file folders', () => {
    const groups = calculateFolderGroups(mockNodes);
    
    // src folder has only one file (index.ts), so no group
    const srcGroup = groups.find(g => g.id === 'src');
    expect(srcGroup).toBeUndefined();
    
    // Root folder has only one file (package.json), so no group
    const rootGroup = groups.find(g => g.id === '.');
    expect(rootGroup).toBeUndefined();
  });

  it('should mark groups as collapsed based on collapsedGroups set', () => {
    const collapsedGroups = new Set(['src/components']);
    const groups = calculateFolderGroups(mockNodes, collapsedGroups);
    
    const componentsGroup = groups.find(g => g.id === 'src/components');
    expect(componentsGroup?.collapsed).toBe(true);
    
    const utilsGroup = groups.find(g => g.id === 'src/utils');
    expect(utilsGroup?.collapsed).toBe(false);
  });

  it('should return empty array for nodes without groupable folders', () => {
    const singleNodes: IGraphNode[] = [
      { id: 'a.ts', label: 'a.ts', color: '#93C5FD' },
      { id: 'b.ts', label: 'b.ts', color: '#93C5FD' },
      { id: 'c.ts', label: 'c.ts', color: '#93C5FD' },
    ];
    
    // All files are in root - but we need 2+ in same folder to create group
    const groups = calculateFolderGroups(singleNodes);
    
    // Should create one group for root since all 3 are in root
    expect(groups.length).toBe(1);
    expect(groups[0].id).toBe('.');
    expect(groups[0].nodeIds.length).toBe(3);
  });

  it('should assign unique colors to groups', () => {
    const groups = calculateFolderGroups(mockNodes);
    const colors = groups.map(g => g.color);
    
    // Each group should have a color
    groups.forEach(g => {
      expect(g.color).toBeDefined();
      expect(g.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
    
    // Colors should be different for different groups
    if (groups.length > 1) {
      expect(colors[0]).not.toBe(colors[1]);
    }
  });
});

describe('cluster ID utilities', () => {
  it('getClusterId should create cluster ID from folder path', () => {
    expect(getClusterId('src/components')).toBe('cluster:src/components');
    expect(getClusterId('.')).toBe('cluster:.');
    expect(getClusterId('utils')).toBe('cluster:utils');
  });

  it('isClusterId should identify cluster IDs', () => {
    expect(isClusterId('cluster:src/components')).toBe(true);
    expect(isClusterId('cluster:.')).toBe(true);
    expect(isClusterId('src/components/Button.tsx')).toBe(false);
    expect(isClusterId('cluster')).toBe(false);
  });

  it('getFolderFromClusterId should extract folder path', () => {
    expect(getFolderFromClusterId('cluster:src/components')).toBe('src/components');
    expect(getFolderFromClusterId('cluster:.')).toBe('.');
    expect(getFolderFromClusterId('cluster:utils/helpers')).toBe('utils/helpers');
  });
});
