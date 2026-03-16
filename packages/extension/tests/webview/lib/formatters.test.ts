import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatSize, formatRelativeTime } from '../../../src/webview/lib/formatters';

describe('formatSize', () => {
  it('returns bytes for values under 1024', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1023)).toBe('1023 B');
  });

  it('returns KB for values from 1024 to under 1MB', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1536)).toBe('1.5 KB');
  });

  it('returns MB for values 1MB and above', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "just now" for timestamps less than 1 minute ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now)).toBe('just now');
    expect(formatRelativeTime(now - 30_000)).toBe('just now');
  });

  it('returns minutes for timestamps 1-59 minutes ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 5 * 60_000)).toBe('5m ago');
    expect(formatRelativeTime(now - 59 * 60_000)).toBe('59m ago');
  });

  it('returns hours for timestamps 1-23 hours ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 3 * 3_600_000)).toBe('3h ago');
    expect(formatRelativeTime(now - 23 * 3_600_000)).toBe('23h ago');
  });

  it('returns days for timestamps 1-6 days ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 3 * 86_400_000)).toBe('3d ago');
    expect(formatRelativeTime(now - 6 * 86_400_000)).toBe('6d ago');
  });

  it('returns a locale date string for timestamps 7+ days ago', () => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86_400_000;
    const result = formatRelativeTime(sevenDaysAgo);
    expect(result).toBe(new Date(sevenDaysAgo).toLocaleDateString());
  });
});
