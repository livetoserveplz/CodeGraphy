import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterSection } from '../../../../src/webview/components/settingsPanel/filters/Section';
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

function renderSection(storeOverrides: Record<string, unknown> = {}) {
  setStoreState(storeOverrides);
  return render(<FilterSection />);
}

describe('FilterSection', () => {
  beforeEach(() => {
    sentMessages.length = 0;
  });

  it('starts with the add button disabled', () => {
    renderSection();

    expect(screen.getByRole('button', { name: /^Add$/i })).toBeDisabled();
  });

  it('renders existing filter patterns', () => {
    renderSection({ filterPatterns: ['**/*.test.ts', '**/*.spec.ts'] });

    expect(screen.getByText('**/*.test.ts')).toBeInTheDocument();
    expect(screen.getByText('**/*.spec.ts')).toBeInTheDocument();
  });

  it('shows an empty-state message when no custom filter patterns exist', () => {
    renderSection({ filterPatterns: [] });

    expect(screen.getByText('No patterns.')).toBeInTheDocument();
  });

  it('renders plugin defaults when plugin filter patterns are present', () => {
    renderSection({ pluginFilterPatterns: ['**/*.uid'] });

    expect(screen.getByText('Plugin defaults (read-only)')).toBeInTheDocument();
    expect(screen.getByText('**/*.uid')).toBeInTheDocument();
  });

  it('adds a filter pattern on button click', () => {
    renderSection();

    const input = screen.getByPlaceholderText('*.png');
    fireEvent.change(input, { target: { value: '**/*.log' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    expect(graphStore.getState().filterPatterns).toEqual(['**/*.log']);
    expect(input).toHaveValue('');
    expect(sentMessages).toContainEqual({
      type: 'UPDATE_FILTER_PATTERNS',
      payload: { patterns: ['**/*.log'] },
    });
  });

  it('adds a filter pattern on enter', () => {
    renderSection();

    const input = screen.getByPlaceholderText('*.png');
    fireEvent.change(input, { target: { value: '**/*.cache' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(graphStore.getState().filterPatterns).toEqual(['**/*.cache']);
  });

  it('disables the add button for whitespace-only input', () => {
    renderSection();

    fireEvent.change(screen.getByPlaceholderText('*.png'), {
      target: { value: '   ' },
    });

    expect(screen.getByRole('button', { name: /^Add$/i })).toBeDisabled();
  });

  it('does not add a whitespace-only filter pattern on enter', () => {
    renderSection();

    const input = screen.getByPlaceholderText('*.png');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(graphStore.getState().filterPatterns).toEqual([]);
    expect(sentMessages).toEqual([]);
  });

  it('removes a filter pattern', () => {
    renderSection({ filterPatterns: ['**/*.log', '**/*.tmp'] });

    fireEvent.click(screen.getAllByTitle('Delete pattern')[0]);

    expect(graphStore.getState().filterPatterns).toEqual(['**/*.tmp']);
    expect(sentMessages).toContainEqual({
      type: 'UPDATE_FILTER_PATTERNS',
      payload: { patterns: ['**/*.tmp'] },
    });
  });

  it('toggles orphan visibility', () => {
    renderSection({ showOrphans: true });

    fireEvent.click(screen.getByRole('switch'));

    expect(graphStore.getState().showOrphans).toBe(false);
    expect(sentMessages).toContainEqual({
      type: 'UPDATE_SHOW_ORPHANS',
      payload: { showOrphans: false },
    });
  });

  it('does not render the max-files control', () => {
    renderSection();

    expect(screen.queryByText('Max Files')).not.toBeInTheDocument();
  });
});
