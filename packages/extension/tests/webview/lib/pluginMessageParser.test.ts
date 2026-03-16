import { describe, it, expect, vi } from 'vitest';
import {
  normalizePluginInjectPayload,
  parsePluginScopedMessage,
  resolvePluginModuleActivator,
} from '../../../src/webview/lib/pluginMessageParser';
import type { WebviewPluginHost } from '../../../src/webview/pluginHost';

describe('normalizePluginInjectPayload', () => {
  it('returns a valid payload when all fields are present', () => {
    const result = normalizePluginInjectPayload({
      pluginId: 'my-plugin',
      scripts: ['script.js'],
      styles: ['style.css'],
    });
    expect(result).toEqual({
      pluginId: 'my-plugin',
      scripts: ['script.js'],
      styles: ['style.css'],
    });
  });

  it('defaults scripts and styles to empty arrays when missing', () => {
    const result = normalizePluginInjectPayload({ pluginId: 'my-plugin' });
    expect(result).toEqual({ pluginId: 'my-plugin', scripts: [], styles: [] });
  });

  it('returns null when payload is null', () => {
    expect(normalizePluginInjectPayload(null)).toBeNull();
  });

  it('returns null when payload is not an object', () => {
    expect(normalizePluginInjectPayload('string')).toBeNull();
    expect(normalizePluginInjectPayload(42)).toBeNull();
  });

  it('returns null when pluginId is missing', () => {
    expect(normalizePluginInjectPayload({ scripts: [] })).toBeNull();
  });

  it('returns null when pluginId is not a string', () => {
    expect(normalizePluginInjectPayload({ pluginId: 123 })).toBeNull();
  });

  it('defaults scripts to empty array when scripts is not an array', () => {
    const result = normalizePluginInjectPayload({ pluginId: 'plug', scripts: 'bad' });
    expect(result?.scripts).toEqual([]);
  });

  it('defaults styles to empty array when styles is not an array', () => {
    const result = normalizePluginInjectPayload({ pluginId: 'plug', styles: null });
    expect(result?.styles).toEqual([]);
  });
});

describe('parsePluginScopedMessage', () => {
  it('parses a well-formed plugin:id:type message', () => {
    const result = parsePluginScopedMessage('plugin:my-plugin:SOME_EVENT', { value: 1 });
    expect(result).toEqual({
      pluginId: 'my-plugin',
      innerType: 'SOME_EVENT',
      data: { value: 1 },
    });
  });

  it('returns null for a non-plugin message type', () => {
    expect(parsePluginScopedMessage('GRAPH_DATA_UPDATED', null)).toBeNull();
  });

  it('returns null when the message has no inner type after the plugin id', () => {
    expect(parsePluginScopedMessage('plugin:my-plugin', null)).toBeNull();
  });

  it('returns null when the plugin id is empty', () => {
    expect(parsePluginScopedMessage('plugin::EVENT', null)).toBeNull();
  });

  it('preserves multi-segment inner types (e.g. plugin:id:a:b)', () => {
    const result = parsePluginScopedMessage('plugin:myplugin:a:b', 'data');
    expect(result?.innerType).toBe('a:b');
  });

  it('includes the data payload unchanged', () => {
    const data = { nested: { deeply: true } };
    const result = parsePluginScopedMessage('plugin:myplugin:EVENT', data);
    expect(result?.data).toBe(data);
  });
});

describe('resolvePluginModuleActivator', () => {
  it('calls pluginHost.deliverMessage with the parsed message', () => {
    const pluginHost = { deliverMessage: vi.fn() } as unknown as WebviewPluginHost;
    const parsed = { pluginId: 'my-plugin', innerType: 'SOME_EVENT', data: { key: 'value' } };

    resolvePluginModuleActivator(parsed, pluginHost);

    expect(pluginHost.deliverMessage).toHaveBeenCalledWith('my-plugin', {
      type: 'SOME_EVENT',
      data: { key: 'value' },
    });
  });

  it('forwards null data to deliverMessage', () => {
    const pluginHost = { deliverMessage: vi.fn() } as unknown as WebviewPluginHost;
    const parsed = { pluginId: 'plug', innerType: 'EV', data: null };

    resolvePluginModuleActivator(parsed, pluginHost);

    expect(pluginHost.deliverMessage).toHaveBeenCalledWith('plug', { type: 'EV', data: null });
  });
});
