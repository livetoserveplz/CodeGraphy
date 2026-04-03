import { describe, expect, it } from 'vitest';
import {
  canAddFilterPattern,
  shouldShowPluginFilterPatterns,
} from '../../../../src/webview/components/settingsPanel/filters/model';

describe('settingsPanel filter model', () => {
  it('only allows non-empty filter patterns after trimming', () => {
    expect(canAddFilterPattern('**/*.log')).toBe(true);
    expect(canAddFilterPattern('   ')).toBe(false);
  });

  it('shows plugin filter patterns only when defaults are present', () => {
    expect(shouldShowPluginFilterPatterns(['**/*.uid'])).toBe(true);
    expect(shouldShowPluginFilterPatterns([])).toBe(false);
  });
});
