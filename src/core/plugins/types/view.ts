/**
 * @fileoverview View plugin type definitions.
 * View plugins provide different ways to visualize the codebase graph.
 * @module core/plugins/types/view
 */

import { PluginMetadata } from './base';
import { IGraphData } from '../../../shared/types';

/**
 * Context provided to view plugins during transformation.
 */
export interface ViewContext {
  /**
   * Currently focused file path (relative to workspace).
   * Used by views like Depth Graph that center on a specific file.
   */
  focusedFile?: string;

  /**
   * Currently selected folder path (relative to workspace).
   * Used by views like Subfolder View that limit scope.
   */
  selectedFolder?: string;

  /**
   * Set of active plugin IDs.
   * Used to determine which plugin-provided features are available.
   */
  activePlugins: Set<string>;

  /**
   * Workspace root path (absolute).
   */
  workspaceRoot?: string;

  /**
   * Maximum depth for depth-limited views (e.g., Depth Graph).
   * Controls how many hops from the focused node to include.
   * @default 1
   */
  depthLimit?: number;

  /**
   * User's filter preferences, if any active filters are applied.
   */
  activeFilters?: string[];
}

/**
 * Result of a view render operation.
 * Includes the transformed graph data and optional metadata.
 */
export interface ViewRenderResult {
  /**
   * The transformed graph data to render.
   */
  graph: IGraphData;

  /**
   * Optional view-specific metadata for the UI.
   */
  metadata?: ViewMetadata;
}

/**
 * Metadata about the view's current state.
 */
export interface ViewMetadata {
  /**
   * Total number of nodes before any view filtering.
   */
  totalNodes?: number;

  /**
   * Total number of edges before any view filtering.
   */
  totalEdges?: number;

  /**
   * Number of nodes hidden by this view's filtering.
   */
  hiddenNodes?: number;

  /**
   * Number of edges hidden by this view's filtering.
   */
  hiddenEdges?: number;

  /**
   * View-specific status message to display.
   */
  statusMessage?: string;

  /**
   * Custom key-value pairs for view-specific information.
   */
  custom?: Record<string, unknown>;
}

/**
 * Options for configuring a view.
 */
export interface ViewOptions {
  /**
   * Whether to show orphan nodes (nodes with no connections).
   * @default true
   */
  showOrphans?: boolean;

  /**
   * Whether to show external dependencies (unresolved imports).
   * @default false
   */
  showExternal?: boolean;

  /**
   * Custom physics settings for this view, if different from default.
   */
  physics?: {
    enabled?: boolean;
    gravitationalConstant?: number;
    springLength?: number;
    springConstant?: number;
    damping?: number;
    centralGravity?: number;
  };
}

/**
 * Interface for view plugins.
 * Views transform the base graph data into different visualizations.
 * Each view provides a unique perspective on the codebase structure.
 * 
 * @example
 * ```typescript
 * const depthView: ViewPlugin = {
 *   id: 'codegraphy.depth',
 *   name: 'Depth View',
 *   icon: 'type-hierarchy',
 *   description: 'Shows files by distance from selected file',
 *   
 *   render(graph, context) {
 *     // Filter and annotate nodes by depth from focused file
 *     const result = computeDepthGraph(graph, context.focusedFile);
 *     return { graph: result };
 *   }
 * };
 * ```
 */
export interface ViewPlugin extends PluginMetadata {
  /**
   * Codicon icon name for the view (without 'codicon-' prefix).
   * @see https://microsoft.github.io/vscode-codicons/dist/codicon.html
   * @example 'symbol-file', 'type-hierarchy', 'folder'
   */
  icon: string;

  /**
   * Default options for this view.
   */
  defaultOptions?: ViewOptions;

  /**
   * Transforms and renders the graph data for this view.
   * 
   * @param graph - The complete graph data from workspace analysis
   * @param context - Additional context for the transformation
   * @returns Render result with transformed graph and optional metadata
   */
  render(graph: IGraphData, context: ViewContext): ViewRenderResult;

  /**
   * Optional validation to check if this view can be used.
   * Return false to hide the view from the UI.
   * 
   * @param context - Context to validate against
   * @returns true if the view can be displayed
   */
  isAvailable?(context: ViewContext): boolean;

  /**
   * Optional method to update the view when options change.
   * Called when user changes view-specific settings.
   * 
   * @param options - New options to apply
   */
  updateOptions?(options: ViewOptions): void;

  /**
   * Optional cleanup when the view is deactivated.
   */
  deactivate?(): void;
}

/**
 * Information about a registered view plugin.
 */
export interface ViewPluginInfo {
  /** The view plugin instance */
  plugin: ViewPlugin;
  /** Whether this is a core (built-in) view */
  core: boolean;
  /** Registration order (lower = registered earlier) */
  order: number;
}
