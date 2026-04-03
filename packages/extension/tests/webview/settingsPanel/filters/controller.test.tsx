import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFilterController } from '../../../../src/webview/components/settingsPanel/filters/controller';
import { graphStore } from '../../../../src/webview/store/state';

const sentMessages: unknown[] = [];
vi.mock('../../../../src/webview/vscodeApi', () => ({
  postMessage: (message: unknown) => sentMessages.push(message),
  vscode: { getState: () => undefined, setState: vi.fn() },
}));

function setStoreState(overrides: Record<string, unknown> = {}) {
  graphStore.setState({
    filterPatterns: [],
    pluginFilterPatterns: [],
    showOrphans: true,
    ...overrides,
  });
}

describe('filters controller', () => {
  beforeEach(() => {
    sentMessages.length = 0;
  });

  it('exposes the current filter state from the graph store', () => {
    setStoreState({
      filterPatterns: ['**/*.test.ts'],
      pluginFilterPatterns: ['**/*.generated.ts'],
      showOrphans: false,
    });

    const { result } = renderHook(() => useFilterController());

    expect(result.current.filterPatterns).toEqual(['**/*.test.ts']);
    expect(result.current.pluginFilterPatterns).toEqual(['**/*.generated.ts']);
    expect(result.current.showOrphans).toBe(false);
    expect(result.current.newFilterPattern).toBe('');
  });

  it('adds trimmed patterns and clears the draft', () => {
    setStoreState();
    const { result } = renderHook(() => useFilterController());

    act(() => {
      result.current.onPatternChange('  **/*.cache  ');
    });

    act(() => {
      result.current.onAddPattern();
    });

    expect(graphStore.getState().filterPatterns).toEqual(['**/*.cache']);
    expect(result.current.newFilterPattern).toBe('');
  });

  it('deletes patterns from the store and posts the updated list', () => {
    setStoreState({ filterPatterns: ['**/*.cache', '**/*.log'] });
    const { result } = renderHook(() => useFilterController());

    act(() => {
      result.current.onDeletePattern('**/*.cache');
    });

    expect(graphStore.getState().filterPatterns).toEqual(['**/*.log']);
    expect(sentMessages).toContainEqual({
      type: 'UPDATE_FILTER_PATTERNS',
      payload: { patterns: ['**/*.log'] },
    });
  });

  it('updates orphan visibility and posts the new flag', () => {
    setStoreState({ showOrphans: true });
    const { result } = renderHook(() => useFilterController());

    act(() => {
      result.current.onShowOrphansChange(false);
    });

    expect(graphStore.getState().showOrphans).toBe(false);
    expect(sentMessages).toContainEqual({
      type: 'UPDATE_SHOW_ORPHANS',
      payload: { showOrphans: false },
    });
  });
});
