/**
 * @fileoverview Dynamic color palette generation and management.
 * Generates distinct colors for file extensions with plugin and user overrides.
 * @module core/colors/ColorPaletteManager
 */

import distinctColors from 'distinct-colors';

/**
 * Color source priority levels (highest to lowest).
 */
export type ColorSource = 'user' | 'plugin' | 'generated';

/**
 * Information about a color assignment.
 */
export interface IColorInfo {
  /** The hex color string */
  color: string;
  /** Where this color came from */
  source: ColorSource;
}

/**
 * Options for color generation.
 */
export interface IColorGenerationOptions {
  /** Minimum lightness (0-100). Default: 60 */
  lightMin?: number;
  /** Maximum lightness (0-100). Default: 85 */
  lightMax?: number;
  /** Minimum chroma/saturation (0-100). Default: 40 */
  chromaMin?: number;
  /** Maximum chroma/saturation (0-100). Default: 70 */
  chromaMax?: number;
}

/**
 * Default color for unknown extensions when no generation is possible.
 */
export const DEFAULT_FALLBACK_COLOR = '#A1A1AA'; // Soft zinc

/**
 * Manages dynamic color palette generation with layered overrides.
 * 
 * Color priority (highest to lowest):
 * 1. User settings - User-defined colors for specific extensions
 * 2. Plugin colors - Plugins can declare colors for their supported extensions
 * 3. Runtime generated - Auto-generate distinct colors for remaining extensions
 * 
 * @example
 * ```typescript
 * const manager = new ColorPaletteManager();
 * 
 * // Add plugin colors
 * manager.setPluginColors({ '.gd': '#A5B4FC', '.tscn': '#6EE7B7' });
 * 
 * // Add user overrides
 * manager.setUserColors({ '.ts': '#3B82F6' });
 * 
 * // Generate palette for discovered extensions
 * manager.generateForExtensions(['.ts', '.js', '.gd', '.json', '.md']);
 * 
 * // Get color for a file
 * const color = manager.getColor('.ts'); // Returns '#3B82F6' (user override)
 * ```
 */
export class ColorPaletteManager {
  private generatedColors: Map<string, string> = new Map();
  private pluginColors: Map<string, string> = new Map();
  private userColors: Map<string, string> = new Map();
  private generationOptions: IColorGenerationOptions;

  constructor(options: IColorGenerationOptions = {}) {
    this.generationOptions = {
      lightMin: options.lightMin ?? 60,
      lightMax: options.lightMax ?? 85,
      chromaMin: options.chromaMin ?? 40,
      chromaMax: options.chromaMax ?? 70,
    };
  }

  /**
   * Set plugin-defined colors.
   * These override generated colors but are overridden by user colors.
   * 
   * @param colors - Map of extension to hex color
   */
  setPluginColors(colors: Record<string, string>): void {
    this.pluginColors.clear();
    for (const [ext, color] of Object.entries(colors)) {
      const normalizedExt = this.normalizeExtension(ext);
      this.pluginColors.set(normalizedExt, color);
    }
  }

  /**
   * Add plugin colors (merges with existing).
   * 
   * @param colors - Map of extension to hex color
   */
  addPluginColors(colors: Record<string, string>): void {
    for (const [ext, color] of Object.entries(colors)) {
      const normalizedExt = this.normalizeExtension(ext);
      this.pluginColors.set(normalizedExt, color);
    }
  }

  /**
   * Set user-defined colors.
   * These have highest priority and override all other colors.
   * 
   * @param colors - Map of extension to hex color
   */
  setUserColors(colors: Record<string, string>): void {
    this.userColors.clear();
    for (const [ext, color] of Object.entries(colors)) {
      const normalizedExt = this.normalizeExtension(ext);
      this.userColors.set(normalizedExt, color);
    }
  }

  /**
   * Generate distinct colors for a set of extensions.
   * Extensions are sorted alphabetically for deterministic color assignment.
   * 
   * @param extensions - Array of file extensions (with or without leading dot)
   */
  generateForExtensions(extensions: string[]): void {
    // Normalize and deduplicate
    const uniqueExtensions = [...new Set(
      extensions.map(ext => this.normalizeExtension(ext))
    )].sort();

    if (uniqueExtensions.length === 0) {
      return;
    }

    // Generate distinct colors
    const palette = distinctColors({
      count: uniqueExtensions.length,
      lightMin: this.generationOptions.lightMin,
      lightMax: this.generationOptions.lightMax,
      chromaMin: this.generationOptions.chromaMin,
      chromaMax: this.generationOptions.chromaMax,
    });

    // Map extensions to colors (alphabetical order = deterministic)
    this.generatedColors.clear();
    uniqueExtensions.forEach((ext, index) => {
      this.generatedColors.set(ext, palette[index].hex());
    });
  }

  /**
   * Get the color for a file extension.
   * Checks user colors first, then plugin colors, then generated colors.
   * 
   * @param extension - File extension (with or without leading dot)
   * @returns Hex color string
   */
  getColor(extension: string): string {
    const normalizedExt = this.normalizeExtension(extension);
    
    // Priority 1: User colors
    const userColor = this.userColors.get(normalizedExt);
    if (userColor) {
      return userColor;
    }

    // Priority 2: Plugin colors
    const pluginColor = this.pluginColors.get(normalizedExt);
    if (pluginColor) {
      return pluginColor;
    }

    // Priority 3: Generated colors
    const generatedColor = this.generatedColors.get(normalizedExt);
    if (generatedColor) {
      return generatedColor;
    }

    // Fallback
    return DEFAULT_FALLBACK_COLOR;
  }

  /**
   * Get color info including the source.
   * 
   * @param extension - File extension (with or without leading dot)
   * @returns Color info with source
   */
  getColorInfo(extension: string): IColorInfo {
    const normalizedExt = this.normalizeExtension(extension);
    
    const userColor = this.userColors.get(normalizedExt);
    if (userColor) {
      return { color: userColor, source: 'user' };
    }

    const pluginColor = this.pluginColors.get(normalizedExt);
    if (pluginColor) {
      return { color: pluginColor, source: 'plugin' };
    }

    const generatedColor = this.generatedColors.get(normalizedExt);
    if (generatedColor) {
      return { color: generatedColor, source: 'generated' };
    }

    return { color: DEFAULT_FALLBACK_COLOR, source: 'generated' };
  }

  /**
   * Get the full color map (all extensions to colors).
   * Useful for sending to webview.
   * 
   * @returns Record of extension to hex color
   */
  getColorMap(): Record<string, string> {
    const map: Record<string, string> = {};
    
    // Start with generated colors
    for (const [ext, color] of this.generatedColors) {
      map[ext] = color;
    }
    
    // Override with plugin colors
    for (const [ext, color] of this.pluginColors) {
      map[ext] = color;
    }
    
    // Override with user colors
    for (const [ext, color] of this.userColors) {
      map[ext] = color;
    }
    
    return map;
  }

  /**
   * Clear all colors.
   */
  clear(): void {
    this.generatedColors.clear();
    this.pluginColors.clear();
    this.userColors.clear();
  }

  /**
   * Normalize extension to lowercase with leading dot.
   */
  private normalizeExtension(extension: string): string {
    const trimmed = extension.trim().toLowerCase();
    return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
  }
}
