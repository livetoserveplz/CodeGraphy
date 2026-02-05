/**
 * @fileoverview Decorator plugin type definitions.
 * Decorators modify the visual appearance of nodes and edges.
 * @module core/plugins/types/decorator
 */

import { PluginMetadata, PluginPriority } from './base';
import { IGraphNode, IGraphEdge } from '../../../shared/types';

/**
 * Visual style properties that can be applied to a node.
 */
export interface NodeStyle {
  /**
   * Fill color (hex string).
   * @example '#FF5733'
   */
  color?: string;

  /**
   * Border color (hex string).
   */
  borderColor?: string;

  /**
   * Border width in pixels.
   */
  borderWidth?: number;

  /**
   * Border style.
   */
  borderStyle?: 'solid' | 'dashed' | 'dotted';

  /**
   * Node opacity (0-1).
   */
  opacity?: number;

  /**
   * Node size multiplier (1 = default).
   */
  sizeMultiplier?: number;

  /**
   * Node shape override.
   */
  shape?: 'dot' | 'box' | 'diamond' | 'star' | 'triangle' | 'hexagon';

  /**
   * Custom icon to display on the node (codicon name).
   */
  icon?: string;

  /**
   * Whether to show a badge indicator.
   */
  badge?: {
    /** Badge text (short, ideally 1-2 characters) */
    text?: string;
    /** Badge color */
    color?: string;
    /** Badge position */
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };

  /**
   * Font style for the label.
   */
  font?: {
    color?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
  };

  /**
   * Shadow effect.
   */
  shadow?: {
    enabled: boolean;
    color?: string;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
  };
}

/**
 * A node with decoration information applied.
 */
export interface DecoratedNode extends IGraphNode {
  /**
   * Applied style overrides from decorators.
   */
  style?: NodeStyle;

  /**
   * Tooltip content to show on hover.
   */
  tooltip?: string;

  /**
   * Additional labels/tags to display.
   */
  tags?: string[];

  /**
   * Decorator-specific metadata.
   */
  decoratorData?: Record<string, unknown>;
}

/**
 * Visual style properties that can be applied to an edge.
 */
export interface EdgeStyle {
  /**
   * Edge color (hex string).
   */
  color?: string;

  /**
   * Edge width in pixels.
   */
  width?: number;

  /**
   * Edge style.
   */
  style?: 'solid' | 'dashed' | 'dotted';

  /**
   * Edge opacity (0-1).
   */
  opacity?: number;

  /**
   * Whether to show arrows and their configuration.
   */
  arrows?: {
    to?: boolean | { enabled: boolean; scaleFactor?: number };
    from?: boolean | { enabled: boolean; scaleFactor?: number };
  };

  /**
   * Whether this edge should be smoothed/curved.
   */
  smooth?: boolean | {
    enabled: boolean;
    type?: 'dynamic' | 'continuous' | 'discrete' | 'diagonalCross' | 'straightCross' | 'horizontal' | 'vertical' | 'curvedCW' | 'curvedCCW';
    roundness?: number;
  };

  /**
   * Label to display on the edge.
   */
  label?: string;

  /**
   * Font style for the edge label.
   */
  font?: {
    color?: string;
    size?: number;
    strokeWidth?: number;
    strokeColor?: string;
  };
}

/**
 * An edge with decoration information applied.
 */
export interface DecoratedEdge extends IGraphEdge {
  /**
   * Applied style overrides from decorators.
   */
  style?: EdgeStyle;

  /**
   * Tooltip content to show on hover.
   */
  tooltip?: string;

  /**
   * Decorator-specific metadata.
   */
  decoratorData?: Record<string, unknown>;
}

/**
 * Context provided to decorators for decision-making.
 */
export interface DecoratorContext {
  /**
   * All nodes in the current graph.
   */
  allNodes: IGraphNode[];

  /**
   * All edges in the current graph.
   */
  allEdges: IGraphEdge[];

  /**
   * Currently selected/focused node IDs.
   */
  selectedNodes?: string[];

  /**
   * Current view ID being displayed.
   */
  currentView?: string;

  /**
   * Workspace root path.
   */
  workspaceRoot?: string;

  /**
   * User-defined settings relevant to decoration.
   */
  settings?: Record<string, unknown>;
}

/**
 * Interface for node decorator plugins.
 * Node decorators modify the visual appearance of nodes in the graph.
 * Multiple decorators can be applied in priority order.
 * 
 * @example
 * ```typescript
 * const testFileDecorator: NodeDecorator = {
 *   id: 'codegraphy.test-files',
 *   name: 'Test File Highlighter',
 *   priority: 5,
 *   
 *   decorate(node, context) {
 *     if (node.id.includes('.test.') || node.id.includes('.spec.')) {
 *       return {
 *         ...node,
 *         style: {
 *           borderColor: '#10B981',
 *           borderWidth: 2,
 *           badge: { text: 'T', color: '#10B981' }
 *         },
 *         tags: ['test']
 *       };
 *     }
 *     return node;
 *   }
 * };
 * ```
 */
export interface NodeDecorator extends PluginMetadata, Partial<PluginPriority> {
  /**
   * Decorates a node with visual style modifications.
   * Return the node unchanged if no decoration should be applied.
   * 
   * @param node - The node to potentially decorate
   * @param context - Context about the current graph state
   * @returns The decorated node (may be the same reference if unchanged)
   */
  decorate(node: IGraphNode, context: DecoratorContext): DecoratedNode;

  /**
   * Optional filter to quickly skip nodes that won't be decorated.
   * Improves performance by avoiding unnecessary decorate() calls.
   * 
   * @param node - The node to check
   * @returns true if this decorator might apply to this node
   */
  shouldDecorate?(node: IGraphNode): boolean;
}

/**
 * Interface for edge decorator plugins.
 * Edge decorators modify the visual appearance of edges in the graph.
 * Multiple decorators can be applied in priority order.
 * 
 * @example
 * ```typescript
 * const cyclicEdgeDecorator: EdgeDecorator = {
 *   id: 'codegraphy.cyclic-edges',
 *   name: 'Cyclic Dependency Highlighter',
 *   priority: 10,
 *   
 *   decorate(edge, context) {
 *     // Check if there's a reverse edge (cycle)
 *     const hasReverse = context.allEdges.some(
 *       e => e.from === edge.to && e.to === edge.from
 *     );
 *     if (hasReverse) {
 *       return {
 *         ...edge,
 *         style: {
 *           color: '#EF4444',
 *           width: 2,
 *           style: 'dashed'
 *         },
 *         tooltip: 'Circular dependency detected'
 *       };
 *     }
 *     return edge;
 *   }
 * };
 * ```
 */
export interface EdgeDecorator extends PluginMetadata, Partial<PluginPriority> {
  /**
   * Decorates an edge with visual style modifications.
   * Return the edge unchanged if no decoration should be applied.
   * 
   * @param edge - The edge to potentially decorate
   * @param context - Context about the current graph state
   * @returns The decorated edge (may be the same reference if unchanged)
   */
  decorate(edge: IGraphEdge, context: DecoratorContext): DecoratedEdge;

  /**
   * Optional filter to quickly skip edges that won't be decorated.
   * Improves performance by avoiding unnecessary decorate() calls.
   * 
   * @param edge - The edge to check
   * @returns true if this decorator might apply to this edge
   */
  shouldDecorate?(edge: IGraphEdge): boolean;
}

/**
 * Information about a registered decorator.
 */
export interface DecoratorInfo<T extends NodeDecorator | EdgeDecorator> {
  /** The decorator instance */
  decorator: T;
  /** Resolved priority (default 0) */
  priority: number;
  /** Registration order for tie-breaking */
  order: number;
}
