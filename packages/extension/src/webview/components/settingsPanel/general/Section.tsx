import React from 'react';
import { mdiMinus, mdiPlus } from '@mdi/js';
import { Label } from '../../ui/form/label';
import { MdiIcon } from '../../icons/MdiIcon';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { postMessage } from '../../../vscodeApi';
import { useGraphStore } from '../../../store/state';

function clampLimit(value: number): number {
  return Math.max(1, value);
}

function parseLimitInput(value: string): number | null {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function NumericLimitControl({
  decreaseTitle,
  increaseTitle,
  label,
  onBlur,
  onChange,
  onDecrease,
  onIncrease,
  onKeyDown,
  value,
}: {
  decreaseTitle: string;
  increaseTitle: string;
  label: string;
  onBlur: (value: string) => void;
  onChange: (value: string) => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  value: number;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-0.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-0.5">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={onDecrease}
          disabled={value <= 1}
          title={decreaseTitle}
        >
          <MdiIcon path={mdiMinus} size={12} />
        </Button>
        <Input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onBlur(event.target.value)}
          onKeyDown={onKeyDown}
          className="h-6 w-16 text-xs text-center px-1"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={onIncrease}
          title={increaseTitle}
        >
          <MdiIcon path={mdiPlus} size={12} />
        </Button>
      </div>
    </div>
  );
}

export function GeneralSection(): React.ReactElement {
  const maxFiles = useGraphStore((state) => state.maxFiles);
  const maxTimelineCommits = useGraphStore((state) => state.maxTimelineCommits);
  const setMaxFiles = useGraphStore((state) => state.setMaxFiles);
  const setMaxTimelineCommits = useGraphStore((state) => state.setMaxTimelineCommits);

  const commitMaxFiles = (value: number) => {
    const clamped = clampLimit(value);
    setMaxFiles(clamped);
    postMessage({ type: 'UPDATE_MAX_FILES', payload: { maxFiles: clamped } });
  };

  const commitMaxTimelineCommits = (value: number) => {
    const clamped = clampLimit(value);
    setMaxTimelineCommits(clamped);
    postMessage({
      type: 'UPDATE_MAX_TIMELINE_COMMITS',
      payload: { maxTimelineCommits: clamped },
    });
  };

  return (
    <div className="mb-2 space-y-2">
      <NumericLimitControl
        label="Max Files"
        value={maxFiles}
        onDecrease={() => commitMaxFiles(maxFiles - 100)}
        onIncrease={() => commitMaxFiles(maxFiles + 100)}
        onChange={(value) => {
          const parsed = parseLimitInput(value);
          if (parsed !== null) {
            setMaxFiles(parsed);
          }
        }}
        onBlur={(value) => commitMaxFiles(parseLimitInput(value) ?? 1)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commitMaxFiles(parseLimitInput(event.currentTarget.value) ?? 1);
          }
        }}
        decreaseTitle="Decrease by 100"
        increaseTitle="Increase by 100"
      />

      <NumericLimitControl
        label="Max Timeline Commits"
        value={maxTimelineCommits}
        onDecrease={() => commitMaxTimelineCommits(maxTimelineCommits - 100)}
        onIncrease={() => commitMaxTimelineCommits(maxTimelineCommits + 100)}
        onChange={(value) => {
          const parsed = parseLimitInput(value);
          if (parsed !== null) {
            setMaxTimelineCommits(parsed);
          }
        }}
        onBlur={(value) => commitMaxTimelineCommits(parseLimitInput(value) ?? 1)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commitMaxTimelineCommits(parseLimitInput(event.currentTarget.value) ?? 1);
          }
        }}
        decreaseTitle="Decrease by 100"
        increaseTitle="Increase by 100"
      />
    </div>
  );
}
