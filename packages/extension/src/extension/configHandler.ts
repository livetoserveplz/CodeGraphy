/**
 * @fileoverview Configuration change handler for the CodeGraphy extension.
 * Handles vscode.workspace.onDidChangeConfiguration events and delegates
 * to the appropriate GraphViewProvider methods.
 */

import * as vscode from 'vscode';
import type { GraphViewProvider } from './GraphViewProvider';

/**
 * Handles a configuration change event and delegates to the appropriate
 * provider refresh method based on which codegraphy setting changed.
 */
export function handleConfigurationChange(
  event: vscode.ConfigurationChangeEvent,
  provider: GraphViewProvider
): void {
  if (event.affectsConfiguration('codegraphy.physics')) {
    // Physics settings: only update physics, no re-analysis
    provider.refreshPhysicsSettings();
  } else if (
    event.affectsConfiguration('codegraphy.disabledRules') ||
    event.affectsConfiguration('codegraphy.disabledPlugins')
  ) {
    // Rule/plugin toggles are applied from cached analysis data.
    provider.refreshToggleSettings();
  } else if (
    event.affectsConfiguration('codegraphy.directionMode') ||
    event.affectsConfiguration('codegraphy.directionColor') ||
    event.affectsConfiguration('codegraphy.particleSpeed') ||
    event.affectsConfiguration('codegraphy.particleSize') ||
    event.affectsConfiguration('codegraphy.showLabels') ||
    event.affectsConfiguration('codegraphy.bidirectionalEdges')
  ) {
    // Display-only settings: resend display settings, no re-analysis or position reset
    provider.refreshSettings();
  } else if (
    event.affectsConfiguration('codegraphy.groups') ||
    event.affectsConfiguration('codegraphy.hiddenPluginGroups')
  ) {
    // Groups/hidden groups: already handled by the webview message handlers
    // (UPDATE_GROUPS, TOGGLE_PLUGIN_GROUP_DISABLED, etc.) which call _sendGroupsUpdated() directly.
    // No re-analysis needed — skip to avoid double refresh.
  } else if (event.affectsConfiguration('codegraphy')) {
    // All other codegraphy settings (filterPatterns, showOrphans, maxFiles, etc.)
    // require re-analysis because they affect which files/nodes are in the graph
    console.log('[CodeGraphy] Configuration changed, refreshing graph');
    void provider.refresh();
    provider.emitEvent('workspace:configChanged', { key: 'codegraphy', value: undefined, old: undefined });
    // Invalidate timeline cache when settings that affect analysis change
    if (
      event.affectsConfiguration('codegraphy.filterPatterns') ||
      event.affectsConfiguration('codegraphy.timeline.maxCommits')
    ) {
      void provider.invalidateTimelineCache();
    }
    // Send updated playback speed to webview (display-only, no cache invalidation)
    if (event.affectsConfiguration('codegraphy.timeline.playbackSpeed')) {
      provider.sendPlaybackSpeed();
    }
  }
}
