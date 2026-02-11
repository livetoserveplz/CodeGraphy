import { describe, it, expect } from 'vitest';
import { generateInteractiveHtml } from '../../src/webview/utils/exportHtml';

describe('generateInteractiveHtml', () => {
  it('should return valid HTML with vis-network', () => {
    const html = generateInteractiveHtml(
      [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      [{ from: 'a', to: 'b' }]
    );
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('vis-network');
    expect(html).toContain('"a"');
    expect(html).toContain('"b"');
  });

  it('should include node and edge counts', () => {
    const html = generateInteractiveHtml(
      [{ id: '1', label: 'One' }],
      []
    );
    expect(html).toContain('1 nodes');
    expect(html).toContain('0 edges');
  });

  it('should handle empty graph', () => {
    const html = generateInteractiveHtml([], []);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('0 nodes');
  });

  it('should preserve node colors', () => {
    const html = generateInteractiveHtml(
      [{ id: 'x', label: 'X', color: '#ff0000' }],
      []
    );
    expect(html).toContain('#ff0000');
  });
});
