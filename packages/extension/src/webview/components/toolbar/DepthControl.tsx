import React from 'react';
import { Slider } from '../ui/controls/slider';
import { useGraphStore } from '../../store/state';
import { postMessage } from '../../vscodeApi';

export function DepthControl(): React.ReactElement | null {
  const activeViewId = useGraphStore(s => s.activeViewId);
  const depthLimit = useGraphStore(s => s.depthLimit);
  const maxDepthLimit = useGraphStore(s => s.maxDepthLimit);

  if (activeViewId !== 'codegraphy.depth-graph') {
    return null;
  }

  const sliderMax = Math.max(1, maxDepthLimit ?? depthLimit);
  const sliderValue = Math.max(1, Math.min(depthLimit, sliderMax));
  const sliderDisabled = maxDepthLimit === null;

  return (
    <div
      data-testid="depth-control"
      className="flex h-7 min-w-[12rem] items-center gap-2 rounded-md border border-input/80 bg-transparent px-2 text-foreground shadow-sm backdrop-blur-[1px]"
    >
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Depth
      </span>
      <Slider
        min={1}
        max={sliderMax}
        step={1}
        value={[sliderValue]}
        disabled={sliderDisabled}
        onValueChange={(value) =>
          postMessage({ type: 'CHANGE_DEPTH_LIMIT', payload: { depthLimit: value[0] } })
        }
        className="min-w-0 flex-1"
      />
      <span
        data-testid="depth-value"
        className="min-w-[1ch] shrink-0 text-xs font-semibold tabular-nums text-foreground"
      >
        {sliderValue}
      </span>
    </div>
  );
}
