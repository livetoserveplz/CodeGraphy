/**
 * @fileoverview Plugin settings type definitions.
 * Defines how plugins can expose configurable settings.
 * @module core/plugins/types/settings
 */

/**
 * Types of settings that plugins can define.
 */
export type SettingType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'enum';

/**
 * Validation rules for a setting value.
 */
export interface SettingValidation {
  /**
   * Minimum value for numbers, minimum length for strings/arrays.
   */
  min?: number;

  /**
   * Maximum value for numbers, maximum length for strings/arrays.
   */
  max?: number;

  /**
   * Regular expression pattern for string validation.
   */
  pattern?: string;

  /**
   * Custom validation function.
   * Return an error message if invalid, undefined if valid.
   */
  custom?: (value: unknown) => string | undefined;
}

/**
 * Definition of a single plugin setting.
 */
export interface SettingDefinition<T = unknown> {
  /**
   * Setting key (without plugin prefix).
   * @example 'showTestFiles'
   */
  key: string;

  /**
   * Human-readable title for the setting.
   * @example 'Show Test Files'
   */
  title: string;

  /**
   * Detailed description of what this setting does.
   */
  description: string;

  /**
   * Type of the setting value.
   */
  type: SettingType;

  /**
   * Default value if not set.
   */
  default: T;

  /**
   * For enum type: available options.
   */
  enum?: T[];

  /**
   * Human-readable labels for enum options.
   */
  enumLabels?: string[];

  /**
   * For array type: type of array items.
   */
  items?: {
    type: SettingType;
    enum?: unknown[];
  };

  /**
   * For object type: property definitions.
   */
  properties?: Record<string, Omit<SettingDefinition, 'key'>>;

  /**
   * Validation rules.
   */
  validation?: SettingValidation;

  /**
   * Category for grouping in settings UI.
   */
  category?: string;

  /**
   * Order within category (lower = higher in list).
   */
  order?: number;

  /**
   * When clause for conditional visibility.
   * Setting is hidden if this evaluates to false.
   * @example 'config.myPlugin.advancedMode'
   */
  when?: string;

  /**
   * Scope of the setting.
   * - 'window': Applies to the current VS Code window
   * - 'resource': Applies per workspace folder
   * - 'machine': Applies to the current machine
   * @default 'window'
   */
  scope?: 'window' | 'resource' | 'machine';

  /**
   * Whether changing this setting requires a reload.
   * @default false
   */
  requiresReload?: boolean;

  /**
   * Deprecation message if this setting is deprecated.
   */
  deprecated?: string;
}

/**
 * Schema for all settings exposed by a plugin.
 */
export interface PluginSettingsSchema {
  /**
   * Plugin ID that these settings belong to.
   * Used to namespace settings in VS Code configuration.
   */
  pluginId: string;

  /**
   * Human-readable name for the settings section.
   */
  title: string;

  /**
   * Array of setting definitions.
   */
  settings: SettingDefinition[];

  /**
   * Categories for organizing settings in the UI.
   */
  categories?: Array<{
    id: string;
    title: string;
    order?: number;
  }>;
}

/**
 * Runtime access to plugin settings.
 */
export interface PluginSettingsAccessor {
  /**
   * Get a setting value.
   * 
   * @param key - Setting key (without plugin prefix)
   * @returns The setting value, or default if not set
   */
  get<T>(key: string): T;

  /**
   * Get a setting value with explicit default.
   * 
   * @param key - Setting key (without plugin prefix)
   * @param defaultValue - Value to return if not set
   * @returns The setting value, or defaultValue if not set
   */
  get<T>(key: string, defaultValue: T): T;

  /**
   * Check if a setting has been explicitly set (not using default).
   * 
   * @param key - Setting key
   * @returns true if the setting has been explicitly configured
   */
  has(key: string): boolean;

  /**
   * Update a setting value.
   * 
   * @param key - Setting key (without plugin prefix)
   * @param value - New value to set
   * @param global - If true, update globally; if false, update for workspace
   */
  update<T>(key: string, value: T, global?: boolean): Promise<void>;

  /**
   * Reset a setting to its default value.
   * 
   * @param key - Setting key
   * @param global - If true, reset globally; if false, reset for workspace
   */
  reset(key: string, global?: boolean): Promise<void>;

  /**
   * Subscribe to setting changes.
   * 
   * @param key - Setting key to watch (or '*' for all)
   * @param callback - Called when the setting changes
   * @returns Disposable to unsubscribe
   */
  onDidChange(key: string, callback: (newValue: unknown, oldValue: unknown) => void): { dispose(): void };

  /**
   * Get all settings as an object.
   * 
   * @returns Object with all setting key-value pairs
   */
  getAll(): Record<string, unknown>;
}

/**
 * Event fired when plugin settings change.
 */
export interface SettingsChangeEvent {
  /**
   * Plugin ID whose settings changed.
   */
  pluginId: string;

  /**
   * Keys that changed.
   */
  changedKeys: string[];

  /**
   * Previous values (may be undefined if newly set).
   */
  previousValues: Record<string, unknown>;

  /**
   * Current values.
   */
  currentValues: Record<string, unknown>;
}
