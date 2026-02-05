/**
 * @fileoverview Filter plugin type definitions.
 * Filters allow users to show/hide nodes and edges based on various criteria.
 * @module core/plugins/types/filter
 */

import { PluginMetadata } from './base';
import { IGraphNode, IGraphEdge } from '../../../shared/types';

/**
 * Filter mode determining how multiple filters combine.
 */
export type FilterMode = 
  | 'include'   // Only show items matching the filter
  | 'exclude';  // Hide items matching the filter

/**
 * How filters combine with other active filters.
 */
export type FilterCombination = 
  | 'and'  // Item must match ALL active filters
  | 'or';  // Item must match ANY active filter

/**
 * Result of applying a filter to nodes and edges.
 */
export interface FilterResult {
  /**
   * Nodes that pass the filter (should be shown).
   */
  nodes: IGraphNode[];

  /**
   * Edges that pass the filter (should be shown).
   * Edges are typically auto-filtered if their source/target nodes are hidden.
   */
  edges: IGraphEdge[];

  /**
   * Optional metadata about the filter operation.
   */
  metadata?: FilterMetadata;
}

/**
 * Metadata about filter results.
 */
export interface FilterMetadata {
  /**
   * Number of nodes that matched the filter.
   */
  matchedNodes: number;

  /**
   * Number of edges that matched the filter.
   */
  matchedEdges: number;

  /**
   * Number of nodes hidden by this filter.
   */
  hiddenNodes: number;

  /**
   * Number of edges hidden by this filter.
   */
  hiddenEdges: number;

  /**
   * Human-readable description of what was filtered.
   */
  description?: string;
}

/**
 * Configuration options for a filter instance.
 */
export interface FilterConfig {
  /**
   * Whether this filter is currently active.
   */
  active: boolean;

  /**
   * Filter mode (include/exclude).
   */
  mode: FilterMode;

  /**
   * Filter-specific parameters.
   */
  params?: Record<string, unknown>;
}

/**
 * Context provided to filters during execution.
 */
export interface FilterContext {
  /**
   * Current filter configuration.
   */
  config: FilterConfig;

  /**
   * Workspace root path.
   */
  workspaceRoot?: string;

  /**
   * Current view ID.
   */
  currentView?: string;

  /**
   * Other active filters (for combination logic).
   */
  activeFilters?: string[];
}

/**
 * UI specification for filter configuration.
 */
export interface FilterUISpec {
  /**
   * Type of UI control for this filter.
   */
  type: 'checkbox' | 'dropdown' | 'text' | 'number' | 'range' | 'multi-select';

  /**
   * Label for the UI control.
   */
  label: string;

  /**
   * Default value.
   */
  defaultValue?: unknown;

  /**
   * Options for dropdown/multi-select types.
   */
  options?: Array<{ value: string; label: string }>;

  /**
   * Placeholder text for text/number inputs.
   */
  placeholder?: string;

  /**
   * Min value for number/range types.
   */
  min?: number;

  /**
   * Max value for number/range types.
   */
  max?: number;

  /**
   * Step value for number/range types.
   */
  step?: number;
}

/**
 * Interface for filter plugins.
 * Filters dynamically show/hide nodes and edges based on criteria.
 * 
 * @example
 * ```typescript
 * const extensionFilter: FilterPlugin = {
 *   id: 'codegraphy.filter-extension',
 *   name: 'Filter by Extension',
 *   description: 'Show only files with specific extensions',
 *   icon: 'file-code',
 *   
 *   ui: {
 *     type: 'multi-select',
 *     label: 'Extensions',
 *     options: [
 *       { value: '.ts', label: 'TypeScript (.ts)' },
 *       { value: '.tsx', label: 'TSX (.tsx)' },
 *       { value: '.js', label: 'JavaScript (.js)' },
 *     ]
 *   },
 *   
 *   filter(nodes, edges, context) {
 *     const extensions = context.config.params?.extensions as string[] ?? [];
 *     if (extensions.length === 0) {
 *       return { nodes, edges };
 *     }
 *     
 *     const filteredNodes = nodes.filter(n => 
 *       extensions.some(ext => n.id.endsWith(ext))
 *     );
 *     const nodeIds = new Set(filteredNodes.map(n => n.id));
 *     const filteredEdges = edges.filter(e => 
 *       nodeIds.has(e.from) && nodeIds.has(e.to)
 *     );
 *     
 *     return {
 *       nodes: filteredNodes,
 *       edges: filteredEdges,
 *       metadata: {
 *         matchedNodes: filteredNodes.length,
 *         matchedEdges: filteredEdges.length,
 *         hiddenNodes: nodes.length - filteredNodes.length,
 *         hiddenEdges: edges.length - filteredEdges.length,
 *       }
 *     };
 *   }
 * };
 * ```
 */
export interface FilterPlugin extends PluginMetadata {
  /**
   * Codicon icon name for the filter.
   * @example 'filter', 'file-code', 'folder'
   */
  icon?: string;

  /**
   * How this filter combines with others when multiple are active.
   * @default 'and'
   */
  combination?: FilterCombination;

  /**
   * UI specification for filter configuration.
   */
  ui?: FilterUISpec;

  /**
   * Default configuration for this filter.
   */
  defaultConfig?: Partial<FilterConfig>;

  /**
   * Apply the filter to the graph data.
   * 
   * @param nodes - All nodes in the graph
   * @param edges - All edges in the graph
   * @param context - Filter context including configuration
   * @returns Filtered nodes and edges
   */
  filter(
    nodes: IGraphNode[],
    edges: IGraphEdge[],
    context: FilterContext
  ): FilterResult;

  /**
   * Optional method to get dynamic options (e.g., list of extensions in workspace).
   * Called when the filter UI is opened.
   * 
   * @param nodes - Current graph nodes
   * @returns Updated UI options
   */
  getDynamicOptions?(nodes: IGraphNode[]): Array<{ value: string; label: string }>;

  /**
   * Optional validation of filter configuration.
   * 
   * @param config - Configuration to validate
   * @returns Error message if invalid, undefined if valid
   */
  validateConfig?(config: FilterConfig): string | undefined;
}

/**
 * Information about a registered filter.
 */
export interface FilterInfo {
  /** The filter plugin instance */
  filter: FilterPlugin;
  /** Current configuration */
  config: FilterConfig;
  /** Registration order */
  order: number;
}
