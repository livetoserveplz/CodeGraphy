/**
 * @fileoverview Plugin-specific message parsing utilities for the App message handler.
 * Extracts and validates plugin-related extension→webview messages so App.tsx
 * remains a thin orchestrator.
 */

import type { PluginInjectPayload } from '../hooks/usePluginManager';
import type { WebviewPluginHost } from '../pluginHost';

/**
 * Validates and normalizes a raw PLUGIN_WEBVIEW_INJECT payload.
 * Returns null when the payload is not a valid inject payload.
 */
export function normalizePluginInjectPayload(raw: unknown): PluginInjectPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.pluginId !== 'string') return null;
  return {
    pluginId: candidate.pluginId,
    scripts: Array.isArray(candidate.scripts) ? (candidate.scripts as string[]) : [],
    styles: Array.isArray(candidate.styles) ? (candidate.styles as string[]) : [],
  };
}

/**
 * Result from attempting to parse a plugin-scoped message (type starts with "plugin:").
 */
export interface ParsedPluginMessage {
  pluginId: string;
  innerType: string;
  data: unknown;
}

/**
 * Parses a plugin-scoped message whose type follows the "plugin:<id>:<type>" convention.
 * Returns null when the message type is not a well-formed plugin-scoped message.
 */
export function parsePluginScopedMessage(
  messageType: string,
  data: unknown
): ParsedPluginMessage | null {
  if (!messageType.startsWith('plugin:')) return null;
  const [, pluginId, ...typeParts] = messageType.split(':');
  if (!pluginId || typeParts.length === 0) return null;
  return { pluginId, innerType: typeParts.join(':'), data };
}

/**
 * Delivers a parsed plugin-scoped message to the plugin host.
 */
export function resolvePluginModuleActivator(
  parsed: ParsedPluginMessage,
  pluginHost: WebviewPluginHost
): void {
  pluginHost.deliverMessage(parsed.pluginId, {
    type: parsed.innerType,
    data: parsed.data,
  });
}
