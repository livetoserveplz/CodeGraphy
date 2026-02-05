/**
 * @fileoverview Base types shared across all plugin interfaces.
 * Contains common patterns like Disposable, Priority, and metadata types.
 * @module core/plugins/types/base
 */

/**
 * Represents a resource that can be disposed.
 * Call dispose() to release resources and unregister from the system.
 * 
 * @example
 * ```typescript
 * const registration = api.registerView(myView);
 * // Later, to unregister:
 * registration.dispose();
 * ```
 */
export interface Disposable {
  /**
   * Releases resources and unregisters from the plugin system.
   * After calling dispose(), the associated plugin/component will no longer be active.
   */
  dispose(): void;
}

/**
 * Interface for plugins that support priority-based ordering.
 * Higher priority values take precedence over lower ones.
 * 
 * @example
 * ```typescript
 * const decorator: NodeDecorator & PluginPriority = {
 *   id: 'my.decorator',
 *   priority: 10, // Runs after default (0) decorators
 *   decorate(node) { ... }
 * };
 * ```
 */
export interface PluginPriority {
  /**
   * Priority level for this plugin. Higher values run later and can override
   * results from lower-priority plugins.
   * @default 0
   */
  priority: number;
}

/**
 * Common metadata fields shared by all plugin types.
 * Provides identification and descriptive information.
 */
export interface PluginMetadata {
  /**
   * Unique identifier for the plugin.
   * Should be namespaced to avoid conflicts (e.g., 'codegraphy.typescript').
   * @example 'myplugin.custom-decorator'
   */
  id: string;

  /**
   * Human-readable name for display in UI.
   * @example 'TypeScript Language Support'
   */
  name: string;

  /**
   * Optional brief description of what this plugin does.
   * Used for tooltips and documentation.
   */
  description?: string;

  /**
   * Optional semantic version string.
   * @example '1.0.0'
   */
  version?: string;
}

/**
 * Result of a bulk operation that may partially fail.
 * Used when processing multiple items where some may succeed and others fail.
 */
export interface BulkOperationResult<T> {
  /** Successfully processed items */
  succeeded: T[];
  /** Items that failed processing, with error information */
  failed: Array<{ item: T; error: Error }>;
}

/**
 * Generic event callback type used throughout the plugin system.
 */
export type EventCallback<T> = (event: T) => void;

/**
 * Registration options common to many plugin types.
 */
export interface RegistrationOptions {
  /**
   * If true, this registration replaces any existing registration with the same ID.
   * If false (default), attempting to register a duplicate ID throws an error.
   * @default false
   */
  replace?: boolean;
}
