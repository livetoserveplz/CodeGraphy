/**
 * @fileoverview Color parsing utilities for CSS color strings.
 */

export type RgbColor = { r: number; g: number; b: number };

/**
 * Parses a CSS color string to RGB values.
 * Supports 6-digit hex (#rrggbb) and rgb/rgba formats.
 * Returns null for unrecognized formats.
 */
export function parseColor(color: string): RgbColor | null {
  // Handle hex colors
  const hexMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  return null;
}

/**
 * Adjusts a hex color for light theme (darkens by a 0.7 factor).
 * Returns the original string if the color cannot be parsed.
 */
export function adjustColorForLightTheme(hexColor: string): string {
  const rgb = parseColor(hexColor);
  if (!rgb) return hexColor;

  const darkenFactor = 0.7;

  return '#' + Math.round(rgb.r * darkenFactor).toString(16).padStart(2, '0') + Math.round(rgb.g * darkenFactor).toString(16).padStart(2, '0') + Math.round(rgb.b * darkenFactor).toString(16).padStart(2, '0');
}
