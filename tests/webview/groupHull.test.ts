import { describe, it, expect } from 'vitest';
import { convexHull, expandHull, getGroupColor, GROUP_COLORS, Point } from '../../src/webview/utils/groupHull';

describe('convexHull', () => {
  it('returns empty array for empty input', () => {
    expect(convexHull([])).toEqual([]);
  });

  it('returns single point for single input', () => {
    expect(convexHull([{ x: 1, y: 2 }])).toEqual([{ x: 1, y: 2 }]);
  });

  it('returns both points for two points', () => {
    const result = convexHull([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    expect(result).toHaveLength(2);
  });

  it('computes hull for a triangle', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 3 },
    ];
    const hull = convexHull(points);
    expect(hull).toHaveLength(3);
  });

  it('excludes interior points', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
      { x: 2, y: 2 },
    ];
    const hull = convexHull(points);
    expect(hull).toHaveLength(4);
    expect(hull.find(p => p.x === 2 && p.y === 2)).toBeUndefined();
  });
});

describe('expandHull', () => {
  it('returns empty for empty input', () => {
    expect(expandHull([], 10)).toEqual([]);
  });

  it('returns same point for single point', () => {
    expect(expandHull([{ x: 5, y: 5 }], 10)).toEqual([{ x: 5, y: 5 }]);
  });

  it('expands points outward from centroid', () => {
    const hull: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
    ];
    const expanded = expandHull(hull, 5);
    expect(expanded).toHaveLength(3);
    const cx = 5, cy = 10 / 3;
    for (let i = 0; i < hull.length; i++) {
      const origDist = Math.sqrt((hull[i].x - cx) ** 2 + (hull[i].y - cy) ** 2);
      const expDist = Math.sqrt((expanded[i].x - cx) ** 2 + (expanded[i].y - cy) ** 2);
      expect(expDist).toBeGreaterThan(origDist);
    }
  });
});

describe('getGroupColor', () => {
  it('returns colors from palette', () => {
    expect(getGroupColor(0)).toBe(GROUP_COLORS[0]);
    expect(getGroupColor(1)).toBe(GROUP_COLORS[1]);
  });

  it('cycles through palette', () => {
    expect(getGroupColor(GROUP_COLORS.length)).toBe(GROUP_COLORS[0]);
  });
});
