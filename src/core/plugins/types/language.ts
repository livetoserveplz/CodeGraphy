/**
 * @fileoverview Language plugin type definitions.
 * Language plugins detect file connections (imports/dependencies) for specific file types.
 * This extends the existing IPlugin interface with additional capabilities.
 * @module core/plugins/types/language
 */

import { PluginMetadata } from './base';

/**
 * Types of connections that can be detected between files.
 */
export type ConnectionType = 
  | 'static'    // Standard ES6 import
  | 'dynamic'   // Dynamic import()
  | 'require'   // CommonJS require()
  | 'reexport'  // Re-export from another module
  | 'type-only' // TypeScript type-only import
  | 'reference' // Reference (e.g., /// <reference>)
  | 'implicit'; // Implicit dependency (e.g., side-effect import)

/**
 * Represents a detected connection (import) from one file to another.
 * Extended from the base IConnection with additional metadata.
 */
export interface Connection {
  /**
   * The import specifier as written in the source.
   * @example './utils', 'lodash', '@myorg/shared'
   */
  specifier: string;

  /**
   * The resolved absolute file path, or null if unresolved.
   * Null typically indicates an external package or unresolvable path.
   */
  resolvedPath: string | null;

  /**
   * The type of import/connection.
   */
  type: ConnectionType;

  /**
   * Optional line number where the import appears.
   * Used for navigation and diagnostics.
   */
  line?: number;

  /**
   * Optional column number where the import appears.
   */
  column?: number;

  /**
   * Whether this is a type-only import (TypeScript).
   * When true, the import doesn't create a runtime dependency.
   */
  typeOnly?: boolean;

  /**
   * Named imports from this connection.
   * @example ['useState', 'useEffect'] for `import { useState, useEffect } from 'react'`
   */
  namedImports?: string[];

  /**
   * Default import name, if any.
   * @example 'React' for `import React from 'react'`
   */
  defaultImport?: string;

  /**
   * Namespace import name, if any.
   * @example 'utils' for `import * as utils from './utils'`
   */
  namespaceImport?: string;
}

/**
 * Context provided to language plugins during analysis.
 */
export interface LanguagePluginContext {
  /**
   * Absolute path to the workspace root.
   */
  workspaceRoot: string;

  /**
   * Function to resolve a specifier relative to the current file.
   * Plugins can use this for custom resolution logic.
   */
  resolve?: (specifier: string, fromFile: string) => string | null;

  /**
   * Whether to include type-only imports in the analysis.
   * @default true
   */
  includeTypeImports?: boolean;

  /**
   * Abort signal for cancellation support.
   */
  signal?: AbortSignal;
}

/**
 * Main interface for language plugins.
 * Language plugins are responsible for detecting connections (imports/dependencies)
 * in files they support. Each plugin declares which file extensions it handles.
 * 
 * @example
 * ```typescript
 * const typescriptPlugin: LanguagePlugin = {
 *   id: 'codegraphy.typescript',
 *   name: 'TypeScript',
 *   version: '1.0.0',
 *   supportedExtensions: ['.ts', '.tsx', '.mts', '.cts'],
 *   
 *   async detectConnections(filePath, content, context) {
 *     // Parse and return connections
 *     return [
 *       { specifier: './utils', resolvedPath: '/src/utils.ts', type: 'static' },
 *     ];
 *   }
 * };
 * ```
 */
export interface LanguagePlugin extends PluginMetadata {
  /**
   * Semantic version string (required for language plugins).
   */
  version: string;

  /**
   * File extensions this plugin can handle.
   * Include the leading dot.
   * @example ['.ts', '.tsx', '.js', '.jsx']
   */
  supportedExtensions: string[];

  /**
   * Optional preferred colors for supported file extensions.
   * These colors override generated colors but can be overridden by user settings.
   * 
   * Supports three pattern types:
   * - Extensions: `.ts`, `.md`
   * - Exact filenames: `project.godot`, `Makefile`
   * - Glob patterns: `**\/*.test.ts`
   * 
   * @example
   * ```typescript
   * fileColors: {
   *   '.gd': '#A5B4FC',    // Soft indigo for GDScript
   *   '.tscn': '#6EE7B7',  // Soft emerald for scenes
   * }
   * ```
   */
  fileColors?: Record<string, string>;

  /**
   * Optional default exclude patterns for this plugin's ecosystem.
   * These are merged with user-defined exclude patterns.
   * 
   * @example
   * ```typescript
   * // TypeScript plugin
   * defaultExclude: ['**\/node_modules\/**', '**\/dist\/**']
   * ```
   */
  defaultExclude?: string[];

  /**
   * Detects connections (imports) in a file.
   * 
   * @param filePath - Absolute path to the file being analyzed
   * @param content - The file's content as a string
   * @param context - Analysis context with workspace info
   * @returns Array of detected connections
   */
  detectConnections(
    filePath: string,
    content: string,
    context: LanguagePluginContext
  ): Promise<Connection[]>;

  /**
   * Optional initialization hook called when the plugin is loaded.
   * Use this to set up any required state or resources.
   * 
   * @param workspaceRoot - Absolute path to the workspace root
   */
  initialize?(workspaceRoot: string): Promise<void>;

  /**
   * Optional cleanup hook called when the plugin is unloaded.
   * Use this to release any resources.
   */
  dispose?(): void;

  /**
   * Optional method to provide additional file metadata.
   * Can be used for language-specific information like exports, classes, etc.
   * 
   * @param filePath - Absolute path to the file
   * @param content - File content
   */
  getFileMetadata?(filePath: string, content: string): Promise<FileMetadata>;
}

/**
 * Extended file metadata that language plugins can provide.
 */
export interface FileMetadata {
  /**
   * Named exports from the file.
   */
  exports?: string[];

  /**
   * Whether the file has a default export.
   */
  hasDefaultExport?: boolean;

  /**
   * Classes defined in the file.
   */
  classes?: string[];

  /**
   * Functions defined in the file.
   */
  functions?: string[];

  /**
   * Interfaces/types defined in the file (TypeScript).
   */
  types?: string[];

  /**
   * Custom metadata specific to the language plugin.
   */
  custom?: Record<string, unknown>;
}

/**
 * Information about a registered language plugin.
 */
export interface LanguagePluginInfo {
  /** The plugin instance */
  plugin: LanguagePlugin;
  /** Whether this is a built-in plugin */
  builtIn: boolean;
  /** Source extension ID for community plugins */
  sourceExtension?: string;
}
