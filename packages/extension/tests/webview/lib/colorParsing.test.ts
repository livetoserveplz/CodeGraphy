import { describe, it, expect } from 'vitest';
import { parseColor, adjustColorForLightTheme } from '../../../src/webview/lib/colorParsing';

describe('parseColor', () => {
  it('parses a 6-digit lowercase hex color', () => {
    const result = parseColor('#1a2b3c');
    expect(result).toEqual({ r: 26, g: 43, b: 60 });
  });

  it('parses a 6-digit uppercase hex color', () => {
    const result = parseColor('#FF8800');
    expect(result).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parses an rgb color string', () => {
    const result = parseColor('rgb(10, 20, 30)');
    expect(result).toEqual({ r: 10, g: 20, b: 30 });
  });

  it('parses an rgba color string', () => {
    const result = parseColor('rgba(100, 150, 200, 0.5)');
    expect(result).toEqual({ r: 100, g: 150, b: 200 });
  });

  it('returns null for an empty string', () => {
    const result = parseColor('');
    expect(result).toBeNull();
  });

  it('returns null for an unrecognized color format', () => {
    const result = parseColor('not-a-color');
    expect(result).toBeNull();
  });

  it('returns null for a named color (not supported)', () => {
    const result = parseColor('red');
    expect(result).toBeNull();
  });
});

describe('adjustColorForLightTheme', () => {
  it('darkens a hex color by applying a 0.7 factor to each channel', () => {
    // #ffffff = r:255 g:255 b:255 => r:179 g:179 b:179 (Math.round(255*0.7) = 179 = 0xb3)
    const result = adjustColorForLightTheme('#ffffff');
    expect(result).toBe('#b3b3b3');
  });

  it('darkens a non-white hex color correctly', () => {
    // #64c832 = r:100 g:200 b:50 => r:70 g:140 b:35 = 0x46 0x8c 0x23
    const result = adjustColorForLightTheme('#64c832');
    expect(result).toBe('#468c23');
  });

  it('returns the original string for an invalid color', () => {
    const result = adjustColorForLightTheme('not-a-color');
    expect(result).toBe('not-a-color');
  });

  it('returns the original string for an empty input', () => {
    const result = adjustColorForLightTheme('');
    expect(result).toBe('');
  });

  it('produces lowercase hex output', () => {
    const result = adjustColorForLightTheme('#FFFFFF');
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });
});
