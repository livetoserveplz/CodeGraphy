import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '../../../src/webview/components/ui/overlay/tooltip';
import { graphStore } from '../../../src/webview/store/state';

vi.mock('../../../src/webview/vscodeApi', () => ({
  postMessage: vi.fn(),
}));

const sliderHarness = vi.hoisted(() => ({
  onValueChange: null as null | ((value: number[]) => void),
}));

vi.mock('../../../src/webview/components/ui/controls/slider', () => ({
  Slider: (props: {
    value: number[];
    onValueChange: (value: number[]) => void;
    min: number;
    max: number;
    step: number;
    className?: string;
    disabled?: boolean;
  }) => {
    sliderHarness.onValueChange = props.onValueChange;
    return (
      <input
        data-testid="depth-slider"
        type="range"
        min={props.min}
        max={props.max}
        value={props.value[0]}
        disabled={props.disabled}
        onChange={(event) => props.onValueChange([Number(event.target.value)])}
      />
    );
  },
}));

import { postMessage } from '../../../src/webview/vscodeApi';
import { DepthControl } from '../../../src/webview/components/toolbar/DepthControl';

function renderControl() {
  return render(
    <TooltipProvider>
      <DepthControl />
    </TooltipProvider>,
  );
}

describe('DepthControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sliderHarness.onValueChange = null;
    graphStore.setState({
      activeViewId: 'codegraphy.connections',
      depthLimit: 1,
      maxDepthLimit: null,
      activeFilePath: null,
    });
  });

  it('renders nothing outside depth view', () => {
    renderControl();
    expect(screen.queryByTestId('depth-control')).not.toBeInTheDocument();
  });

  it('renders the bottom depth control with a label and current value in depth view', () => {
    graphStore.setState({
      activeViewId: 'codegraphy.depth-graph',
      depthLimit: 3,
      maxDepthLimit: 5,
      activeFilePath: 'src/app.ts',
    });

    renderControl();

    expect(screen.getByTestId('depth-control')).toBeInTheDocument();
    expect(screen.getByText('Depth')).toBeInTheDocument();
    expect(screen.getByTestId('depth-value')).toHaveTextContent('3');
  });

  it('uses the focused file max depth as the slider maximum', () => {
    graphStore.setState({
      activeViewId: 'codegraphy.depth-graph',
      depthLimit: 2,
      maxDepthLimit: 7,
      activeFilePath: 'src/app.ts',
    });

    renderControl();

    expect(screen.getByTestId('depth-slider')).toHaveAttribute('max', '7');
  });

  it('disables the slider when no file is focused', () => {
    graphStore.setState({
      activeViewId: 'codegraphy.depth-graph',
      depthLimit: 2,
      maxDepthLimit: null,
      activeFilePath: null,
    });

    renderControl();

    expect(screen.getByTestId('depth-slider')).toBeDisabled();
  });

  it('keeps the slider enabled when depth bounds are known even if the active file label has not synced yet', () => {
    graphStore.setState({
      activeViewId: 'codegraphy.depth-graph',
      depthLimit: 2,
      maxDepthLimit: 5,
      activeFilePath: null,
    });

    renderControl();

    expect(screen.getByTestId('depth-slider')).not.toBeDisabled();
  });

  it('sends CHANGE_DEPTH_LIMIT when the slider value changes', () => {
    graphStore.setState({
      activeViewId: 'codegraphy.depth-graph',
      depthLimit: 2,
      maxDepthLimit: 5,
      activeFilePath: 'src/app.ts',
    });

    renderControl();
    expect(sliderHarness.onValueChange).not.toBeNull();

    sliderHarness.onValueChange!([4]);

    expect(postMessage).toHaveBeenCalledWith({
      type: 'CHANGE_DEPTH_LIMIT',
      payload: { depthLimit: 4 },
    });
  });
});
