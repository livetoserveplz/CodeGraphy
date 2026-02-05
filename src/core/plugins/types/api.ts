/**
 * @fileoverview Main CodeGraphy Plugin API interface.
 * This is the primary interface that plugins interact with to extend CodeGraphy.
 * @module core/plugins/types/api
 */

import { Disposable, EventCallback } from './base';
import { LanguagePlugin } from './language';
import { ViewPlugin, ViewContext } from './view';
import { NodeDecorator, EdgeDecorator } from './decorator';
import { ActionPlugin, ActionContext, ActionResult } from './action';
import { FilterPlugin } from './filter';
import { ExportPlugin, ExportOptions, ExportResult } from './exporter';
import { PluginSettingsSchema, PluginSettingsAccessor } from './settings';
import { IGraphData, IGraphNode, IGraphEdge } from '../../../shared/types';

/**
 * Events that plugins can subscribe to.
 */
export interface PluginEvents {
  /**
   * Fired when the graph data is updated (files added/removed/changed).
   */
  onGraphUpdated: EventCallback<IGraphData>;

  /**
   * Fired when a node is selected in the graph.
   */
  onNodeSelected: EventCallback<IGraphNode | null>;

  /**
   * Fired when nodes are double-clicked (file opened).
   */
  onNodeOpened: EventCallback<IGraphNode>;

  /**
   * Fired when the active view changes.
   */
  onViewChanged: EventCallback<{ previousViewId?: string; newViewId: string }>;

  /**
   * Fired when filter configuration changes.
   */
  onFiltersChanged: EventCallback<{ activeFilters: string[] }>;

  /**
   * Fired when the workspace is reloaded.
   */
  onWorkspaceReloaded: EventCallback<void>;
}

/**
 * Read-only access to graph data.
 */
export interface GraphAccessor {
  /**
   * Get the current graph data.
   * This returns a snapshot; changes to the returned object don't affect the graph.
   */
  getGraph(): IGraphData;

  /**
   * Get a specific node by its file path.
   * 
   * @param filePath - Relative or absolute file path
   * @returns The node, or undefined if not found
   */
  getNode(filePath: string): IGraphNode | undefined;

  /**
   * Get all nodes matching a predicate.
   * 
   * @param predicate - Filter function
   * @returns Array of matching nodes
   */
  findNodes(predicate: (node: IGraphNode) => boolean): IGraphNode[];

  /**
   * Get edges connected to a node.
   * 
   * @param nodeId - Node ID (file path)
   * @param direction - 'incoming', 'outgoing', or 'both'
   * @returns Array of connected edges
   */
  getEdges(nodeId: string, direction?: 'incoming' | 'outgoing' | 'both'): IGraphEdge[];

  /**
   * Get neighbors of a node.
   * 
   * @param nodeId - Node ID (file path)
   * @param direction - 'incoming', 'outgoing', or 'both'
   * @returns Array of neighboring nodes
   */
  getNeighbors(nodeId: string, direction?: 'incoming' | 'outgoing' | 'both'): IGraphNode[];

  /**
   * Check if two nodes are connected.
   * 
   * @param fromId - Source node ID
   * @param toId - Target node ID
   * @param checkBoth - If true, check connection in either direction
   */
  areConnected(fromId: string, toId: string, checkBoth?: boolean): boolean;
}

/**
 * UI interaction methods.
 */
export interface UIAccessor {
  /**
   * Request the graph to refresh/re-render.
   */
  refreshGraph(): void;

  /**
   * Select a node in the graph.
   * 
   * @param nodeId - Node ID to select, or null to clear selection
   */
  selectNode(nodeId: string | null): void;

  /**
   * Focus the view on a specific node.
   * 
   * @param nodeId - Node ID to focus on
   * @param animate - Whether to animate the transition
   */
  focusNode(nodeId: string, animate?: boolean): void;

  /**
   * Fit the view to show all nodes.
   * 
   * @param animate - Whether to animate the transition
   */
  fitView(animate?: boolean): void;

  /**
   * Show a notification message.
   * 
   * @param message - Message to display
   * @param type - Message type
   */
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): void;

  /**
   * Show a quick pick selection dialog.
   * 
   * @param items - Items to choose from
   * @param options - Dialog options
   * @returns Selected item, or undefined if cancelled
   */
  showQuickPick<T extends { label: string }>(
    items: T[],
    options?: { title?: string; placeholder?: string }
  ): Promise<T | undefined>;

  /**
   * Show an input box dialog.
   * 
   * @param options - Input options
   * @returns Entered value, or undefined if cancelled
   */
  showInputBox(options?: {
    title?: string;
    placeholder?: string;
    value?: string;
    validateInput?: (value: string) => string | undefined;
  }): Promise<string | undefined>;
}

/**
 * Main API surface for CodeGraphy plugins.
 * This is the object passed to plugin activation functions.
 * 
 * @example
 * ```typescript
 * export function activate(api: CodeGraphyPluginAPI) {
 *   // Register a custom view
 *   const viewDisposable = api.registerView({
 *     id: 'my-plugin.custom-view',
 *     name: 'Custom View',
 *     icon: 'eye',
 *     render(graph, context) {
 *       return { graph };
 *     }
 *   });
 *   
 *   // Subscribe to graph updates
 *   const eventDisposable = api.onGraphUpdated((graph) => {
 *     console.log('Graph updated:', graph.nodes.length, 'nodes');
 *   });
 *   
 *   // Access current graph
 *   const graph = api.getGraph();
 *   
 *   // Return disposables for cleanup
 *   return {
 *     dispose() {
 *       viewDisposable.dispose();
 *       eventDisposable.dispose();
 *     }
 *   };
 * }
 * ```
 */
export interface CodeGraphyPluginAPI extends GraphAccessor, UIAccessor {
  /**
   * CodeGraphy version string.
   */
  readonly version: string;

  // ============================================================================
  // Plugin Registration
  // ============================================================================

  /**
   * Register a language plugin for file analysis.
   * 
   * @param plugin - The language plugin to register
   * @returns Disposable to unregister the plugin
   */
  registerLanguage(plugin: LanguagePlugin): Disposable;

  /**
   * Register a view plugin.
   * 
   * @param plugin - The view plugin to register
   * @returns Disposable to unregister the plugin
   */
  registerView(plugin: ViewPlugin): Disposable;

  /**
   * Register a node decorator.
   * 
   * @param decorator - The node decorator to register
   * @returns Disposable to unregister the decorator
   */
  registerNodeDecorator(decorator: NodeDecorator): Disposable;

  /**
   * Register an edge decorator.
   * 
   * @param decorator - The edge decorator to register
   * @returns Disposable to unregister the decorator
   */
  registerEdgeDecorator(decorator: EdgeDecorator): Disposable;

  /**
   * Register an action plugin.
   * 
   * @param action - The action plugin to register
   * @returns Disposable to unregister the action
   */
  registerAction(action: ActionPlugin): Disposable;

  /**
   * Register a filter plugin.
   * 
   * @param filter - The filter plugin to register
   * @returns Disposable to unregister the filter
   */
  registerFilter(filter: FilterPlugin): Disposable;

  /**
   * Register an export plugin.
   * 
   * @param exporter - The export plugin to register
   * @returns Disposable to unregister the exporter
   */
  registerExporter(exporter: ExportPlugin): Disposable;

  /**
   * Register plugin settings schema.
   * This makes settings appear in VS Code's settings UI.
   * 
   * @param schema - The settings schema
   * @returns Settings accessor for this plugin
   */
  registerSettings(schema: PluginSettingsSchema): PluginSettingsAccessor;

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

  /**
   * Subscribe to graph update events.
   * 
   * @param callback - Called when the graph is updated
   * @returns Disposable to unsubscribe
   */
  onGraphUpdated(callback: EventCallback<IGraphData>): Disposable;

  /**
   * Subscribe to node selection events.
   * 
   * @param callback - Called when a node is selected (or null when deselected)
   * @returns Disposable to unsubscribe
   */
  onNodeSelected(callback: EventCallback<IGraphNode | null>): Disposable;

  /**
   * Subscribe to node open events (double-click).
   * 
   * @param callback - Called when a node is opened
   * @returns Disposable to unsubscribe
   */
  onNodeOpened(callback: EventCallback<IGraphNode>): Disposable;

  /**
   * Subscribe to view change events.
   * 
   * @param callback - Called when the active view changes
   * @returns Disposable to unsubscribe
   */
  onViewChanged(callback: EventCallback<{ previousViewId?: string; newViewId: string }>): Disposable;

  // ============================================================================
  // Settings Access
  // ============================================================================

  /**
   * Get a CodeGraphy core setting value.
   * 
   * @param key - Setting key (e.g., 'showExternalDependencies')
   * @returns The setting value
   */
  getSetting<T>(key: string): T;

  /**
   * Get a setting with a default value.
   * 
   * @param key - Setting key
   * @param defaultValue - Value to return if setting is not defined
   * @returns The setting value or default
   */
  getSetting<T>(key: string, defaultValue: T): T;

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Resolve a file path relative to the workspace root.
   * 
   * @param relativePath - Relative path to resolve
   * @returns Absolute path
   */
  resolvePath(relativePath: string): string;

  /**
   * Get the workspace root path.
   */
  getWorkspaceRoot(): string;

  /**
   * Get the current view context.
   */
  getViewContext(): ViewContext;

  /**
   * Execute an action by ID.
   * 
   * @param actionId - Action plugin ID
   * @param context - Optional context override
   * @returns Action result
   */
  executeAction(actionId: string, context?: Partial<ActionContext>): Promise<ActionResult>;

  /**
   * Trigger an export.
   * 
   * @param exporterId - Export plugin ID
   * @param options - Export options
   * @returns Export result
   */
  triggerExport(exporterId: string, options?: ExportOptions): Promise<ExportResult>;

  /**
   * Log a message (respects CodeGraphy's logging settings).
   * 
   * @param level - Log level
   * @param message - Message to log
   * @param data - Optional additional data
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void;
}

/**
 * Plugin activation function signature.
 * Plugins export an `activate` function that receives the API.
 */
export type PluginActivationFunction = (api: CodeGraphyPluginAPI) => Disposable | void;

/**
 * Plugin deactivation function signature.
 * Optional cleanup when the plugin is unloaded.
 */
export type PluginDeactivationFunction = () => void;

/**
 * Plugin module exports structure.
 */
export interface PluginModule {
  /**
   * Called when the plugin is activated.
   */
  activate: PluginActivationFunction;

  /**
   * Optional cleanup when the plugin is deactivated.
   */
  deactivate?: PluginDeactivationFunction;
}
