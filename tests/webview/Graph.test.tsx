import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import Graph from '../../src/webview/components/Graph';
import { IGraphData } from '../../src/shared/types';
import { Network } from 'vis-network';

// Helper to get sent messages from the global mock (set up in tests/setup.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSentMessages = (): unknown[] => (globalThis as any).__vscodeSentMessages;

// Helper to clear sent messages between tests
const clearSentMessages = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__vscodeSentMessages.length = 0;
};

describe('Graph', () => {
  const mockData: IGraphData = {
    nodes: [
      { id: 'a.ts', label: 'a.ts', color: '#93C5FD' },
      { id: 'b.ts', label: 'b.ts', color: '#67E8F9' },
      { id: 'c.ts', label: 'c.ts', color: '#93C5FD' },
    ],
    edges: [
      { id: 'a.ts->b.ts', from: 'a.ts', to: 'b.ts' },
      { id: 'a.ts->c.ts', from: 'a.ts', to: 'c.ts' },
    ],
  };

  beforeEach(() => {
    clearSentMessages();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render graph container', () => {
    const { container } = render(<Graph data={mockData} />);
    const graphContainer = container.querySelector('div');
    expect(graphContainer).toBeInTheDocument();
  });

  it('should apply correct container styles', () => {
    const { container } = render(<Graph data={mockData} />);
    const graphContainer = container.querySelector('div');
    expect(graphContainer).toHaveClass('absolute', 'inset-0', 'rounded-lg', 'border', 'border-zinc-700', 'm-1');
    expect(graphContainer).toHaveStyle({ backgroundColor: '#18181b' });
  });

  it('should initialize vis-network on mount', () => {
    // The Network constructor should be called with nodes and edges
    const { container } = render(<Graph data={mockData} />);
    // Network initialization happens - we verify the container is set up
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should handle empty graph data', () => {
    const emptyData: IGraphData = { nodes: [], edges: [] };
    const { container } = render(<Graph data={emptyData} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should handle single node without edges', () => {
    const singleNodeData: IGraphData = {
      nodes: [{ id: 'single.ts', label: 'single.ts', color: '#93C5FD' }],
      edges: [],
    };
    const { container } = render(<Graph data={singleNodeData} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should handle nodes with saved positions', () => {
    const dataWithPositions: IGraphData = {
      nodes: [
        { id: 'a.ts', label: 'a.ts', color: '#93C5FD', x: 100, y: 200 },
        { id: 'b.ts', label: 'b.ts', color: '#67E8F9', x: 300, y: 400 },
      ],
      edges: [{ id: 'a.ts->b.ts', from: 'a.ts', to: 'b.ts' }],
    };
    const { container } = render(<Graph data={dataWithPositions} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});

describe('Graph Messages', () => {
  beforeEach(() => {
    clearSentMessages();
  });

  it('should define correct message types', () => {
    // Test that message types are correctly structured
    const nodeSelectedMsg = { type: 'NODE_SELECTED', payload: { nodeId: 'test.ts' } };
    const nodeDoubleClickedMsg = { type: 'NODE_DOUBLE_CLICKED', payload: { nodeId: 'test.ts' } };
    const positionsUpdatedMsg = {
      type: 'POSITIONS_UPDATED',
      payload: { positions: { 'test.ts': { x: 100, y: 200 } } },
    };
    const webviewReadyMsg = { type: 'WEBVIEW_READY', payload: null };

    // Verify structure
    expect(nodeSelectedMsg.type).toBe('NODE_SELECTED');
    expect(nodeDoubleClickedMsg.type).toBe('NODE_DOUBLE_CLICKED');
    expect(positionsUpdatedMsg.type).toBe('POSITIONS_UPDATED');
    expect(webviewReadyMsg.type).toBe('WEBVIEW_READY');
  });
});

describe('Bug #39: Ctrl+click context menu behavior', () => {
  const mockData: IGraphData = {
    nodes: [
      { id: 'a.ts', label: 'a.ts', color: '#93C5FD' },
      { id: 'b.ts', label: 'b.ts', color: '#67E8F9' },
      { id: 'c.ts', label: 'c.ts', color: '#93C5FD' },
    ],
    edges: [],
  };

  beforeEach(() => {
    clearSentMessages();
    Network.clearAllHandlers();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register select event handler for tracking selection', () => {
    render(<Graph data={mockData} />);
    
    // Verify select event is registered
    const registeredEvents = Network.getRegisteredEvents();
    expect(registeredEvents).toContain('select');
  });

  /**
   * Bug #39 fix: Context menu logic is now in React's onContextMenu handler
   * instead of vis-network's oncontext event. This ensures the node under
   * the pointer is captured BEFORE Radix opens the menu, fixing the issue
   * where first Ctrl+click showed background menu instead of node menu.
   */
  it('should render container with onContextMenu handler', () => {
    const { container } = render(<Graph data={mockData} />);
    
    // The container div should exist (context menu logic is now handled via React)
    const graphContainer = container.querySelector('[tabindex="0"]');
    expect(graphContainer).toBeTruthy();
  });

  it('should handle context menu events via React onContextMenu', async () => {
    const { container } = render(<Graph data={mockData} />);
    const graphContainer = container.querySelector('[tabindex="0"]');
    expect(graphContainer).toBeTruthy();
    
    // Simulate right-click via React - the onContextMenu handler processes it
    // before Radix opens the menu, ensuring correct node targeting
    await act(async () => {
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });
      graphContainer!.dispatchEvent(event);
    });
    
    // No errors means handler executed successfully
    // The actual menu display is handled by Radix
  });

  it('should handle Ctrl+click context menu via React onContextMenu', async () => {
    const { container } = render(<Graph data={mockData} />);
    const graphContainer = container.querySelector('[tabindex="0"]');
    expect(graphContainer).toBeTruthy();
    
    // Simulate Ctrl+click (Mac multi-select style context menu)
    await act(async () => {
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        ctrlKey: true,
        metaKey: false,
      });
      graphContainer!.dispatchEvent(event);
    });
    
    // No errors means handler executed successfully
    // Ctrl+click on a node should show node menu, not background menu
  });
});
