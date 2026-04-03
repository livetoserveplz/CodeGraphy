import type React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeneralSection } from '../../../../src/webview/components/settingsPanel/general/Section';
import { graphStore } from '../../../../src/webview/store/state';

const sentMessages: unknown[] = [];
vi.mock('../../../../src/webview/vscodeApi', () => ({
  postMessage: (message: unknown) => sentMessages.push(message),
  vscode: { getState: () => undefined, setState: vi.fn() },
}));

function setStoreState(overrides: Record<string, unknown> = {}) {
  graphStore.setState({
    maxFiles: 1000,
    maxTimelineCommits: 500,
    ...overrides,
  });
}

function renderSection(storeOverrides: Record<string, unknown> = {}) {
  setStoreState(storeOverrides);
  return render(<GeneralSection />);
}

describe('GeneralSection', () => {
  beforeEach(() => {
    sentMessages.length = 0;
  });

  it('renders both numeric limits from the store', () => {
    renderSection({ maxFiles: 1200, maxTimelineCommits: 750 });

    expect(screen.getByDisplayValue('1200')).toBeInTheDocument();
    expect(screen.getByDisplayValue('750')).toBeInTheDocument();
  });

  it('posts max file updates from the increment buttons', () => {
    renderSection({ maxFiles: 1000 });

    fireEvent.click(screen.getAllByTitle('Increase by 100')[0]);

    expect(graphStore.getState().maxFiles).toBe(1100);
    expect(sentMessages).toContainEqual({
      type: 'UPDATE_MAX_FILES',
      payload: { maxFiles: 1100 },
    });
  });

  it('posts max timeline commit updates from the increment buttons', () => {
    renderSection({ maxTimelineCommits: 500 });

    fireEvent.click(screen.getAllByTitle('Increase by 100')[1]);

    expect(graphStore.getState().maxTimelineCommits).toBe(600);
    expect(sentMessages).toContainEqual({
      type: 'UPDATE_MAX_TIMELINE_COMMITS',
      payload: { maxTimelineCommits: 600 },
    });
  });

  it('updates the file limit optimistically while typing and commits on enter', () => {
    renderSection();

    const input = screen.getByDisplayValue('1000');
    fireEvent.change(input, { target: { value: '1350' } });

    expect(graphStore.getState().maxFiles).toBe(1350);

    act(() => {
      fireEvent.keyDown(input, {
        key: 'Enter',
        currentTarget: { value: '1350' },
      } as React.KeyboardEvent<HTMLInputElement>);
    });

    expect(sentMessages).toContainEqual({
      type: 'UPDATE_MAX_FILES',
      payload: { maxFiles: 1350 },
    });
  });

  it('falls back to one when the timeline commit input blurs with invalid text', () => {
    renderSection();

    const input = screen.getByDisplayValue('500');
    fireEvent.blur(input, { target: { value: 'not-a-number' } });

    expect(graphStore.getState().maxTimelineCommits).toBe(1);
    expect(sentMessages).toContainEqual({
      type: 'UPDATE_MAX_TIMELINE_COMMITS',
      payload: { maxTimelineCommits: 1 },
    });
  });
});
