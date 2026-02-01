import { describe, it, expect, beforeEach } from 'vitest';
import { ColorPaletteManager, DEFAULT_FALLBACK_COLOR } from '../../../src/core/colors/ColorPaletteManager';

describe('ColorPaletteManager', () => {
  let manager: ColorPaletteManager;

  beforeEach(() => {
    manager = new ColorPaletteManager();
  });

  describe('generateForExtensions', () => {
    it('should generate colors for given extensions', () => {
      manager.generateForExtensions(['.ts', '.js', '.css']);

      // Should return colors, not the fallback
      expect(manager.getColor('.ts')).not.toBe(DEFAULT_FALLBACK_COLOR);
      expect(manager.getColor('.js')).not.toBe(DEFAULT_FALLBACK_COLOR);
      expect(manager.getColor('.css')).not.toBe(DEFAULT_FALLBACK_COLOR);
    });

    it('should generate distinct colors', () => {
      manager.generateForExtensions(['.ts', '.js', '.css', '.html', '.json']);

      const colors = ['.ts', '.js', '.css', '.html', '.json'].map(ext => manager.getColor(ext));
      const uniqueColors = new Set(colors);

      // All colors should be different
      expect(uniqueColors.size).toBe(5);
    });

    it('should be deterministic (same extensions = same colors)', () => {
      manager.generateForExtensions(['.ts', '.js', '.css']);
      const colors1 = {
        ts: manager.getColor('.ts'),
        js: manager.getColor('.js'),
        css: manager.getColor('.css'),
      };

      // Create new manager and generate again
      const manager2 = new ColorPaletteManager();
      manager2.generateForExtensions(['.ts', '.js', '.css']);
      const colors2 = {
        ts: manager2.getColor('.ts'),
        js: manager2.getColor('.js'),
        css: manager2.getColor('.css'),
      };

      expect(colors1).toEqual(colors2);
    });

    it('should deduplicate extensions', () => {
      manager.generateForExtensions(['.ts', '.ts', '.js', '.js']);

      // Should work fine without errors
      expect(manager.getColor('.ts')).not.toBe(DEFAULT_FALLBACK_COLOR);
    });

    it('should normalize extensions to lowercase with dot', () => {
      manager.generateForExtensions(['ts', 'JS', '.CSS']);

      expect(manager.getColor('.ts')).not.toBe(DEFAULT_FALLBACK_COLOR);
      expect(manager.getColor('.js')).not.toBe(DEFAULT_FALLBACK_COLOR);
      expect(manager.getColor('.css')).not.toBe(DEFAULT_FALLBACK_COLOR);
    });

    it('should handle empty array', () => {
      // Should not throw
      manager.generateForExtensions([]);
      expect(manager.getColor('.ts')).toBe(DEFAULT_FALLBACK_COLOR);
    });
  });

  describe('setPluginColors', () => {
    it('should set plugin colors that override generated', () => {
      manager.generateForExtensions(['.ts', '.js']);
      const generatedColor = manager.getColor('.ts');

      manager.setPluginColors({ '.ts': '#FF0000' });

      expect(manager.getColor('.ts')).toBe('#FF0000');
      expect(manager.getColor('.ts')).not.toBe(generatedColor);
    });

    it('should clear previous plugin colors', () => {
      manager.setPluginColors({ '.ts': '#FF0000', '.js': '#00FF00' });
      manager.setPluginColors({ '.css': '#0000FF' });

      // Old colors should be gone, using fallback
      expect(manager.getColor('.ts')).toBe(DEFAULT_FALLBACK_COLOR);
      expect(manager.getColor('.css')).toBe('#0000FF');
    });
  });

  describe('addPluginColors', () => {
    it('should add colors without clearing existing', () => {
      manager.setPluginColors({ '.ts': '#FF0000' });
      manager.addPluginColors({ '.js': '#00FF00' });

      expect(manager.getColor('.ts')).toBe('#FF0000');
      expect(manager.getColor('.js')).toBe('#00FF00');
    });
  });

  describe('setUserColors', () => {
    it('should override plugin colors', () => {
      manager.setPluginColors({ '.ts': '#FF0000' });
      manager.setUserColors({ '.ts': '#00FF00' });

      expect(manager.getColor('.ts')).toBe('#00FF00');
    });

    it('should override generated colors', () => {
      manager.generateForExtensions(['.ts']);
      manager.setUserColors({ '.ts': '#123456' });

      expect(manager.getColor('.ts')).toBe('#123456');
    });

    it('should have highest priority', () => {
      manager.generateForExtensions(['.ts']);
      manager.setPluginColors({ '.ts': '#FF0000' });
      manager.setUserColors({ '.ts': '#00FF00' });

      expect(manager.getColor('.ts')).toBe('#00FF00');
    });
  });

  describe('getColor', () => {
    it('should return fallback for unknown extension', () => {
      expect(manager.getColor('.unknown')).toBe(DEFAULT_FALLBACK_COLOR);
    });

    it('should normalize extension', () => {
      manager.setPluginColors({ '.ts': '#FF0000' });

      expect(manager.getColor('ts')).toBe('#FF0000');
      expect(manager.getColor('.ts')).toBe('#FF0000');
      expect(manager.getColor('TS')).toBe('#FF0000');
      expect(manager.getColor('.TS')).toBe('#FF0000');
    });
  });

  describe('getColorInfo', () => {
    it('should return source as generated', () => {
      manager.generateForExtensions(['.ts']);
      const info = manager.getColorInfo('.ts');

      expect(info.source).toBe('generated');
      expect(info.color).not.toBe(DEFAULT_FALLBACK_COLOR);
    });

    it('should return source as plugin', () => {
      manager.setPluginColors({ '.ts': '#FF0000' });
      const info = manager.getColorInfo('.ts');

      expect(info.source).toBe('plugin');
      expect(info.color).toBe('#FF0000');
    });

    it('should return source as user', () => {
      manager.setUserColors({ '.ts': '#00FF00' });
      const info = manager.getColorInfo('.ts');

      expect(info.source).toBe('user');
      expect(info.color).toBe('#00FF00');
    });

    it('should return generated source for fallback', () => {
      const info = manager.getColorInfo('.unknown');

      expect(info.source).toBe('generated');
      expect(info.color).toBe(DEFAULT_FALLBACK_COLOR);
    });
  });

  describe('getColorMap', () => {
    it('should return combined map with proper priority', () => {
      manager.generateForExtensions(['.ts', '.js', '.css']);
      manager.setPluginColors({ '.ts': '#PLUGIN_TS' });
      manager.setUserColors({ '.ts': '#USER_TS', '.html': '#USER_HTML' });

      const map = manager.getColorMap();

      // User override takes precedence
      expect(map['.ts']).toBe('#USER_TS');
      // User color for non-generated ext
      expect(map['.html']).toBe('#USER_HTML');
      // Generated colors for others
      expect(map['.js']).toBeDefined();
      expect(map['.css']).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all colors', () => {
      manager.generateForExtensions(['.ts']);
      manager.setPluginColors({ '.js': '#FF0000' });
      manager.setUserColors({ '.css': '#00FF00' });

      manager.clear();

      expect(manager.getColor('.ts')).toBe(DEFAULT_FALLBACK_COLOR);
      expect(manager.getColor('.js')).toBe(DEFAULT_FALLBACK_COLOR);
      expect(manager.getColor('.css')).toBe(DEFAULT_FALLBACK_COLOR);
    });
  });

  describe('custom generation options', () => {
    it('should accept custom lightness and chroma options', () => {
      const customManager = new ColorPaletteManager({
        lightMin: 50,
        lightMax: 60,
        chromaMin: 80,
        chromaMax: 90,
      });

      customManager.generateForExtensions(['.ts', '.js']);

      // Should generate colors without error
      expect(customManager.getColor('.ts')).not.toBe(DEFAULT_FALLBACK_COLOR);
    });
  });
});
