/**
 * @fileoverview Action plugin type definitions.
 * Actions are commands that can be triggered by users via context menus,
 * keyboard shortcuts, or the command palette.
 * @module core/plugins/types/action
 */

import { PluginMetadata } from './base';
import { IGraphNode, IGraphEdge, IGraphData } from '../../../shared/types';

/**
 * Location where an action can be displayed.
 */
export type ActionLocation = 
  | 'context-menu'      // Right-click context menu on nodes/edges
  | 'command-palette'   // VS Code command palette
  | 'toolbar'           // Graph toolbar
  | 'node-hover'        // Action buttons on node hover
  | 'keyboard';         // Keyboard shortcut only (hidden from menus)

/**
 * Target type that the action operates on.
 */
export type ActionTarget = 
  | 'node'        // Single node selected
  | 'nodes'       // Multiple nodes selected
  | 'edge'        // Single edge selected
  | 'edges'       // Multiple edges selected
  | 'graph'       // The entire graph
  | 'selection'   // Current selection (nodes and/or edges)
  | 'none';       // No target required (global action)

/**
 * Context provided when an action is executed.
 */
export interface ActionContext {
  /**
   * The complete graph data.
   */
  graph: IGraphData;

  /**
   * Currently selected nodes.
   */
  selectedNodes: IGraphNode[];

  /**
   * Currently selected edges.
   */
  selectedEdges: IGraphEdge[];

  /**
   * The specific node that was right-clicked (for context menu actions).
   */
  targetNode?: IGraphNode;

  /**
   * The specific edge that was right-clicked (for context menu actions).
   */
  targetEdge?: IGraphEdge;

  /**
   * Workspace root path (absolute).
   */
  workspaceRoot: string;

  /**
   * Current view ID.
   */
  currentView: string;

  /**
   * Access to VS Code extension context for advanced operations.
   * Only available in extension context, not webview.
   */
  extensionContext?: unknown;
}

/**
 * Result of an action execution.
 */
export interface ActionResult {
  /**
   * Whether the action completed successfully.
   */
  success: boolean;

  /**
   * Optional message to display to the user.
   */
  message?: string;

  /**
   * If true, the graph should be refreshed after this action.
   */
  refreshGraph?: boolean;

  /**
   * Updated selection after the action.
   */
  newSelection?: {
    nodeIds?: string[];
    edgeIds?: string[];
  };

  /**
   * Custom data returned by the action.
   */
  data?: unknown;
}

/**
 * Keyboard shortcut definition.
 */
export interface KeyBinding {
  /**
   * The key combination (VS Code keybinding format).
   * @example 'ctrl+shift+d', 'cmd+k cmd+d' (chord)
   */
  key: string;

  /**
   * Platform-specific key for Mac.
   * @example 'cmd+shift+d'
   */
  mac?: string;

  /**
   * When clause for conditional activation.
   * @example 'codegraphy.graphFocused && codegraphy.hasSelection'
   */
  when?: string;
}

/**
 * Menu item grouping configuration.
 */
export interface MenuGroup {
  /**
   * Group identifier for ordering.
   * Standard groups: 'navigation', 'modification', 'clipboard', 'other'
   */
  group: string;

  /**
   * Order within the group (lower = higher in menu).
   */
  order?: number;
}

/**
 * Interface for action plugins.
 * Actions are user-invokable commands that operate on the graph.
 * 
 * @example
 * ```typescript
 * const copyPathAction: ActionPlugin = {
 *   id: 'codegraphy.copy-path',
 *   name: 'Copy File Path',
 *   description: 'Copy the file path to clipboard',
 *   icon: 'copy',
 *   target: 'node',
 *   locations: ['context-menu', 'keyboard'],
 *   keybinding: { key: 'ctrl+shift+c', mac: 'cmd+shift+c' },
 *   menuGroup: { group: 'clipboard', order: 1 },
 *   
 *   isEnabled(context) {
 *     return context.selectedNodes.length === 1;
 *   },
 *   
 *   async execute(context) {
 *     const path = context.targetNode?.id ?? context.selectedNodes[0]?.id;
 *     await navigator.clipboard.writeText(path);
 *     return { success: true, message: 'Path copied!' };
 *   }
 * };
 * ```
 */
export interface ActionPlugin extends PluginMetadata {
  /**
   * Codicon icon name for the action.
   * @example 'copy', 'trash', 'file-symlink-file'
   */
  icon?: string;

  /**
   * What the action operates on.
   */
  target: ActionTarget;

  /**
   * Where this action should appear.
   */
  locations: ActionLocation[];

  /**
   * Optional keyboard shortcut.
   */
  keybinding?: KeyBinding;

  /**
   * Menu grouping for context menus.
   */
  menuGroup?: MenuGroup;

  /**
   * Whether this action should appear when multiple items are selected.
   * @default false for 'node'/'edge' targets, true for 'nodes'/'edges'/'selection'
   */
  allowMultiple?: boolean;

  /**
   * Check if the action is currently enabled.
   * Return false to gray out the action in menus.
   * 
   * @param context - Current action context
   * @returns true if the action can be executed
   */
  isEnabled?(context: ActionContext): boolean;

  /**
   * Check if the action should be visible.
   * Return false to hide the action entirely.
   * Different from isEnabled - hidden actions don't appear at all.
   * 
   * @param context - Current action context
   * @returns true if the action should be shown
   */
  isVisible?(context: ActionContext): boolean;

  /**
   * Execute the action.
   * 
   * @param context - Current action context
   * @returns Result of the action execution
   */
  execute(context: ActionContext): Promise<ActionResult> | ActionResult;
}

/**
 * Information about a registered action.
 */
export interface ActionInfo {
  /** The action plugin instance */
  action: ActionPlugin;
  /** Generated VS Code command ID */
  commandId: string;
  /** Registration order */
  order: number;
}
