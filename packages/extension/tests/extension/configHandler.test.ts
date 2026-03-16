import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleConfigurationChange } from '../../src/extension/configHandler';
import type { GraphViewProvider } from '../../src/extension/GraphViewProvider';

function makeEvent(affectedSections: string[]): { affectsConfiguration: (key: string) => boolean } {
  return {
    affectsConfiguration: (key: string) => affectedSections.includes(key),
  };
}

function makeProvider(): GraphViewProvider {
  return {
    refreshPhysicsSettings: vi.fn(),
    refreshToggleSettings: vi.fn(),
    refreshSettings: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    emitEvent: vi.fn(),
    invalidateTimelineCache: vi.fn().mockResolvedValue(undefined),
    sendPlaybackSpeed: vi.fn(),
  } as unknown as GraphViewProvider;
}

describe('handleConfigurationChange', () => {
  let provider: GraphViewProvider;

  beforeEach(() => {
    provider = makeProvider();
  });

  it('calls refreshPhysicsSettings when only physics settings change', () => {
    const event = makeEvent(['codegraphy.physics']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.refreshPhysicsSettings).toHaveBeenCalledTimes(1);
    expect(provider.refresh).not.toHaveBeenCalled();
  });

  it('calls refreshToggleSettings when disabledRules change', () => {
    const event = makeEvent(['codegraphy.disabledRules']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.refreshToggleSettings).toHaveBeenCalledTimes(1);
    expect(provider.refresh).not.toHaveBeenCalled();
  });

  it('calls refreshToggleSettings when disabledPlugins change', () => {
    const event = makeEvent(['codegraphy.disabledPlugins']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.refreshToggleSettings).toHaveBeenCalledTimes(1);
  });

  it('calls refreshSettings for display-only directionMode change', () => {
    const event = makeEvent(['codegraphy.directionMode']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.refreshSettings).toHaveBeenCalledTimes(1);
    expect(provider.refresh).not.toHaveBeenCalled();
  });

  it('calls refreshSettings for showLabels change', () => {
    const event = makeEvent(['codegraphy.showLabels']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.refreshSettings).toHaveBeenCalledTimes(1);
  });

  it('calls refreshSettings for bidirectionalEdges change', () => {
    const event = makeEvent(['codegraphy.bidirectionalEdges']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.refreshSettings).toHaveBeenCalledTimes(1);
  });

  it('does nothing for groups change (webview handles it directly)', () => {
    const event = makeEvent(['codegraphy.groups']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.refreshPhysicsSettings).not.toHaveBeenCalled();
    expect(provider.refreshToggleSettings).not.toHaveBeenCalled();
    expect(provider.refreshSettings).not.toHaveBeenCalled();
    expect(provider.refresh).not.toHaveBeenCalled();
  });

  it('calls refresh for generic codegraphy change', () => {
    const event = makeEvent(['codegraphy']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.refresh).toHaveBeenCalledTimes(1);
    expect(provider.emitEvent).toHaveBeenCalledWith(
      'workspace:configChanged',
      expect.objectContaining({ key: 'codegraphy' })
    );
  });

  it('invalidates timeline cache when filterPatterns change', () => {
    const event = makeEvent(['codegraphy', 'codegraphy.filterPatterns']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.invalidateTimelineCache).toHaveBeenCalledTimes(1);
  });

  it('invalidates timeline cache when timeline.maxCommits change', () => {
    const event = makeEvent(['codegraphy', 'codegraphy.timeline.maxCommits']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.invalidateTimelineCache).toHaveBeenCalledTimes(1);
  });

  it('sends playback speed when timeline.playbackSpeed changes', () => {
    const event = makeEvent(['codegraphy', 'codegraphy.timeline.playbackSpeed']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.sendPlaybackSpeed).toHaveBeenCalledTimes(1);
  });

  it('does not invalidate timeline cache for unrelated codegraphy changes', () => {
    const event = makeEvent(['codegraphy']);
    handleConfigurationChange(event as import('vscode').ConfigurationChangeEvent, provider);
    expect(provider.invalidateTimelineCache).not.toHaveBeenCalled();
    expect(provider.sendPlaybackSpeed).not.toHaveBeenCalled();
  });
});
