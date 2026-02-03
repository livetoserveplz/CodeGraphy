/**
 * Test fixtures for visual regression testing.
 * Each fixture represents a specific state of the graph.
 */

import type { IGraphData, IPhysicsSettings, BidirectionalEdgeMode, IAvailableView } from '../../../src/shared/types';

export interface TestFixture {
  name: string;
  description: string;
  graphData: IGraphData;
  favorites?: string[];
  bidirectionalEdges?: BidirectionalEdgeMode;
  physicsSettings?: IPhysicsSettings;
  views?: IAvailableView[];
}

/**
 * Default fixture - small graph with typical structure.
 */
const defaultFixture: TestFixture = {
  name: 'default',
  description: 'Small graph with typical project structure',
  graphData: {
    nodes: [
      { id: 'src/index.ts', label: 'index.ts', color: '#93C5FD' },
      { id: 'src/App.tsx', label: 'App.tsx', color: '#93C5FD' },
      { id: 'src/components/Button.tsx', label: 'Button.tsx', color: '#93C5FD' },
      { id: 'src/components/Input.tsx', label: 'Input.tsx', color: '#93C5FD' },
      { id: 'src/utils/helpers.ts', label: 'helpers.ts', color: '#FCD34D' },
      { id: 'src/types.ts', label: 'types.ts', color: '#F472B6' },
    ],
    edges: [
      { id: 'e1', from: 'src/index.ts', to: 'src/App.tsx' },
      { id: 'e2', from: 'src/App.tsx', to: 'src/components/Button.tsx' },
      { id: 'e3', from: 'src/App.tsx', to: 'src/components/Input.tsx' },
      { id: 'e4', from: 'src/components/Button.tsx', to: 'src/utils/helpers.ts' },
      { id: 'e5', from: 'src/components/Input.tsx', to: 'src/utils/helpers.ts' },
      { id: 'e6', from: 'src/App.tsx', to: 'src/types.ts' },
    ],
  },
};

/**
 * Empty graph - no nodes or edges.
 */
const emptyFixture: TestFixture = {
  name: 'empty',
  description: 'Empty graph with no nodes',
  graphData: {
    nodes: [],
    edges: [],
  },
};

/**
 * Large graph - stress test with many nodes.
 */
const largeFixture: TestFixture = {
  name: 'large',
  description: 'Large graph with many nodes for stress testing',
  graphData: {
    nodes: Array.from({ length: 50 }, (_, i) => ({
      id: `file${i}.ts`,
      label: `file${i}.ts`,
      color: ['#93C5FD', '#FCD34D', '#F472B6', '#86EFAC', '#FDA4AF'][i % 5],
    })),
    edges: Array.from({ length: 80 }, (_, i) => ({
      id: `e${i}`,
      from: `file${i % 50}.ts`,
      to: `file${(i * 3 + 7) % 50}.ts`,
    })),
  },
};

/**
 * Bidirectional edges - shows combined bidirectional edges.
 */
const bidirectionalFixture: TestFixture = {
  name: 'bidirectional',
  description: 'Graph with bidirectional edges in combined mode',
  graphData: {
    nodes: [
      { id: 'a.ts', label: 'a.ts', color: '#93C5FD' },
      { id: 'b.ts', label: 'b.ts', color: '#FCD34D' },
      { id: 'c.ts', label: 'c.ts', color: '#F472B6' },
    ],
    edges: [
      { id: 'e1', from: 'a.ts', to: 'b.ts' },
      { id: 'e2', from: 'b.ts', to: 'a.ts' }, // Bidirectional with e1
      { id: 'e3', from: 'b.ts', to: 'c.ts' },
    ],
  },
  bidirectionalEdges: 'combined',
};

/**
 * Favorites - graph with favorited nodes.
 */
const favoritesFixture: TestFixture = {
  name: 'favorites',
  description: 'Graph with some nodes marked as favorites',
  graphData: {
    nodes: [
      { id: 'src/index.ts', label: 'index.ts', color: '#93C5FD' },
      { id: 'src/App.tsx', label: 'App.tsx', color: '#93C5FD' },
      { id: 'src/utils.ts', label: 'utils.ts', color: '#FCD34D' },
    ],
    edges: [
      { id: 'e1', from: 'src/index.ts', to: 'src/App.tsx' },
      { id: 'e2', from: 'src/App.tsx', to: 'src/utils.ts' },
    ],
  },
  favorites: ['src/App.tsx'],
};

/**
 * Depth graph - simulates depth view with levels.
 */
const depthFixture: TestFixture = {
  name: 'depth',
  description: 'Depth graph view with focused node and depth levels',
  graphData: {
    nodes: [
      { id: 'center.ts', label: 'center.ts', color: '#93C5FD', depthLevel: 0 },
      { id: 'dep1a.ts', label: 'dep1a.ts', color: '#FCD34D', depthLevel: 1 },
      { id: 'dep1b.ts', label: 'dep1b.ts', color: '#FCD34D', depthLevel: 1 },
      { id: 'dep2a.ts', label: 'dep2a.ts', color: '#F472B6', depthLevel: 2 },
      { id: 'dep2b.ts', label: 'dep2b.ts', color: '#F472B6', depthLevel: 2 },
    ],
    edges: [
      { id: 'e1', from: 'center.ts', to: 'dep1a.ts' },
      { id: 'e2', from: 'center.ts', to: 'dep1b.ts' },
      { id: 'e3', from: 'dep1a.ts', to: 'dep2a.ts' },
      { id: 'e4', from: 'dep1b.ts', to: 'dep2b.ts' },
    ],
  },
  views: [
    { id: 'codegraphy.connections', name: 'Connections', active: false },
    { id: 'codegraphy.depth-graph', name: 'Depth Graph', active: true },
  ],
};

/**
 * All test fixtures indexed by name.
 */
export const testFixtures: Record<string, TestFixture> = {
  default: defaultFixture,
  empty: emptyFixture,
  large: largeFixture,
  bidirectional: bidirectionalFixture,
  favorites: favoritesFixture,
  depth: depthFixture,
};
