import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeTooltip } from '../../src/webview/components/NodeTooltip';

describe('NodeTooltip', () => {
  it('shows coverage percentage when provided', () => {
    render(
      <NodeTooltip
        path="src/example.ts"
        incomingCount={1}
        outgoingCount={2}
        position={{ x: 100, y: 100 }}
        visible
        coveragePercent={87.5}
      />
    );

    expect(screen.getByText('Coverage:')).toBeInTheDocument();
    expect(screen.getByText('87.5%')).toBeInTheDocument();
  });
});
