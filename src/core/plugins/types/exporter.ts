/**
 * @fileoverview Export plugin type definitions.
 * Export plugins allow exporting the graph in various formats.
 * @module core/plugins/types/exporter
 */

import { PluginMetadata } from './base';
import { IGraphData } from '../../../shared/types';

/**
 * Type of export output.
 */
export type ExportOutputType = 
  | 'text'    // Text/string output (JSON, CSV, DOT, etc.)
  | 'binary'  // Binary output (PNG, PDF, etc.)
  | 'file';   // Writes directly to a file

/**
 * Category for organizing exporters in UI.
 */
export type ExportCategory = 
  | 'image'       // PNG, SVG, PDF
  | 'data'        // JSON, CSV, GraphML
  | 'diagram'     // Mermaid, DOT, PlantUML
  | 'clipboard'   // Copy to clipboard
  | 'other';      // Miscellaneous

/**
 * Options for export operations.
 */
export interface ExportOptions {
  /**
   * Whether to include node positions.
   * @default true
   */
  includePositions?: boolean;

  /**
   * Whether to include styling information.
   * @default true
   */
  includeStyling?: boolean;

  /**
   * Whether to include metadata (file sizes, access counts, etc.).
   * @default false
   */
  includeMetadata?: boolean;

  /**
   * Whether to export only visible/filtered nodes.
   * @default true
   */
  visibleOnly?: boolean;

  /**
   * Custom options specific to the export format.
   */
  formatOptions?: Record<string, unknown>;
}

/**
 * Image-specific export options.
 */
export interface ImageExportOptions extends ExportOptions {
  /**
   * Image width in pixels.
   */
  width?: number;

  /**
   * Image height in pixels.
   */
  height?: number;

  /**
   * Scale factor for high-DPI exports.
   * @default 2
   */
  scale?: number;

  /**
   * Background color (transparent if not specified).
   */
  backgroundColor?: string;

  /**
   * Image quality for lossy formats (0-1).
   * @default 0.92
   */
  quality?: number;
}

/**
 * Context provided during export.
 */
export interface ExportContext {
  /**
   * Current export options.
   */
  options: ExportOptions;

  /**
   * Workspace name (for default filenames).
   */
  workspaceName?: string;

  /**
   * Current view ID.
   */
  currentView?: string;

  /**
   * Current date for timestamps.
   */
  date: Date;

  /**
   * Function to trigger a file save dialog.
   * Only available in extension context.
   */
  saveFile?: (content: string | Uint8Array, suggestedName: string, mimeType: string) => Promise<boolean>;
}

/**
 * Result of an export operation.
 */
export interface ExportResult {
  /**
   * Whether the export succeeded.
   */
  success: boolean;

  /**
   * The exported content (for text/binary outputs).
   */
  content?: string | Uint8Array;

  /**
   * MIME type of the exported content.
   */
  mimeType?: string;

  /**
   * Suggested filename for saving.
   */
  suggestedFilename?: string;

  /**
   * Error message if export failed.
   */
  error?: string;

  /**
   * Statistics about what was exported.
   */
  stats?: {
    nodeCount: number;
    edgeCount: number;
    byteSize?: number;
  };
}

/**
 * UI specification for export options.
 */
export interface ExportUISpec {
  /**
   * Whether to show a configuration dialog before export.
   * @default false
   */
  showDialog?: boolean;

  /**
   * Fields to show in the configuration dialog.
   */
  fields?: Array<{
    key: string;
    label: string;
    type: 'checkbox' | 'number' | 'text' | 'select';
    defaultValue?: unknown;
    options?: Array<{ value: string; label: string }>;
  }>;
}

/**
 * Interface for export plugins.
 * Export plugins convert the graph to various output formats.
 * 
 * @example
 * ```typescript
 * const mermaidExporter: ExportPlugin = {
 *   id: 'codegraphy.export-mermaid',
 *   name: 'Mermaid Diagram',
 *   description: 'Export as Mermaid flowchart',
 *   format: 'mermaid',
 *   fileExtension: '.mmd',
 *   mimeType: 'text/plain',
 *   category: 'diagram',
 *   outputType: 'text',
 *   
 *   export(graph, context) {
 *     const lines = ['flowchart TD'];
 *     
 *     for (const node of graph.nodes) {
 *       const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
 *       lines.push(`    ${safeId}["${node.label}"]`);
 *     }
 *     
 *     for (const edge of graph.edges) {
 *       const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
 *       const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
 *       lines.push(`    ${fromId} --> ${toId}`);
 *     }
 *     
 *     return {
 *       success: true,
 *       content: lines.join('\n'),
 *       mimeType: 'text/plain',
 *       suggestedFilename: `${context.workspaceName}-graph.mmd`,
 *       stats: {
 *         nodeCount: graph.nodes.length,
 *         edgeCount: graph.edges.length,
 *       }
 *     };
 *   }
 * };
 * ```
 */
export interface ExportPlugin extends PluginMetadata {
  /**
   * Short format identifier.
   * @example 'json', 'png', 'mermaid', 'dot'
   */
  format: string;

  /**
   * File extension for this format (including dot).
   * @example '.json', '.png', '.mmd'
   */
  fileExtension: string;

  /**
   * MIME type for the export.
   * @example 'application/json', 'image/png'
   */
  mimeType: string;

  /**
   * Category for UI organization.
   */
  category: ExportCategory;

  /**
   * Type of output this exporter produces.
   */
  outputType: ExportOutputType;

  /**
   * Codicon icon for the export option.
   * @example 'file-code', 'file-media'
   */
  icon?: string;

  /**
   * UI specification for export options dialog.
   */
  ui?: ExportUISpec;

  /**
   * Default export options for this format.
   */
  defaultOptions?: ExportOptions;

  /**
   * Export the graph data to this format.
   * 
   * @param graph - The graph data to export
   * @param context - Export context with options
   * @returns Export result with content or error
   */
  export(graph: IGraphData, context: ExportContext): Promise<ExportResult> | ExportResult;

  /**
   * Optional preview generation for the export dialog.
   * Returns a small preview of what the export will look like.
   * 
   * @param graph - The graph data
   * @returns Preview string (truncated if necessary)
   */
  generatePreview?(graph: IGraphData): string;
}

/**
 * Information about a registered exporter.
 */
export interface ExporterInfo {
  /** The export plugin instance */
  exporter: ExportPlugin;
  /** Registration order */
  order: number;
}
