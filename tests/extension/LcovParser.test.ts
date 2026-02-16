import { describe, it, expect } from 'vitest';
import { parseLcovCoverage } from '../../src/extension/LcovParser';

describe('parseLcovCoverage', () => {
  it('parses line coverage percentages keyed by workspace-relative path', () => {
    const lcov = [
      'TN:',
      'SF:/repo/src/a.ts',
      'DA:1,1',
      'DA:2,0',
      'end_of_record',
      'SF:src/b.ts',
      'DA:1,1',
      'DA:2,1',
      'end_of_record',
    ].join('\n');

    const result = parseLcovCoverage(lcov, '/repo');

    expect(result.get('src/a.ts')).toBe(50);
    expect(result.get('src/b.ts')).toBe(100);
  });

  it('returns empty map for malformed or empty input', () => {
    expect(parseLcovCoverage('', '/repo').size).toBe(0);
    expect(parseLcovCoverage('SF:src/a.ts\nend_of_record', '/repo').size).toBe(0);
  });
});
