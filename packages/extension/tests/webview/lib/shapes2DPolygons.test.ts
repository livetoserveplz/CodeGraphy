import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  drawTriangle,
  drawHexagon,
  drawStar,
} from '../../../src/webview/lib/shapes2DPolygons';

function createMockContext() {
  return {
    beginPath: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('shapes2DPolygons', () => {
  let ctx: CanvasRenderingContext2D;
  let mock: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
    mock = ctx as unknown as ReturnType<typeof createMockContext>;
  });

  describe('drawTriangle', () => {
    it('calls moveTo once, lineTo twice, and closes path', () => {
      drawTriangle(ctx, 10, 20, 5);

      expect(mock.beginPath).toHaveBeenCalledOnce();
      expect(mock.moveTo).toHaveBeenCalledOnce();
      expect(mock.lineTo).toHaveBeenCalledTimes(2);
      expect(mock.closePath).toHaveBeenCalledOnce();
    });

    it('starts from the top vertex', () => {
      drawTriangle(ctx, 0, 0, 10);

      // Top vertex: cos(-PI/2) = 0, sin(-PI/2) = -1 => (0, -10)
      expect(mock.moveTo).toHaveBeenCalledWith(
        expect.closeTo(0, 10),
        expect.closeTo(-10, 10),
      );
    });

    it('does not call arc or rect', () => {
      drawTriangle(ctx, 10, 20, 5);

      expect(mock.arc).not.toHaveBeenCalled();
      expect(mock.rect).not.toHaveBeenCalled();
    });
  });

  describe('drawHexagon', () => {
    it('calls moveTo once, lineTo five times, and closes path', () => {
      drawHexagon(ctx, 10, 20, 5);

      expect(mock.beginPath).toHaveBeenCalledOnce();
      expect(mock.moveTo).toHaveBeenCalledOnce();
      expect(mock.lineTo).toHaveBeenCalledTimes(5);
      expect(mock.closePath).toHaveBeenCalledOnce();
    });

    it('starts from the top vertex', () => {
      drawHexagon(ctx, 0, 0, 10);

      // Top vertex: cos(-PI/2) = 0, sin(-PI/2) = -1 => (0, -10)
      expect(mock.moveTo).toHaveBeenCalledWith(
        expect.closeTo(0, 10),
        expect.closeTo(-10, 10),
      );
    });

    it('does not call arc or rect', () => {
      drawHexagon(ctx, 10, 20, 5);

      expect(mock.arc).not.toHaveBeenCalled();
      expect(mock.rect).not.toHaveBeenCalled();
    });
  });

  describe('drawStar', () => {
    it('calls moveTo once, lineTo nine times, and closes path', () => {
      drawStar(ctx, 10, 20, 5);

      expect(mock.beginPath).toHaveBeenCalledOnce();
      expect(mock.moveTo).toHaveBeenCalledOnce();
      expect(mock.lineTo).toHaveBeenCalledTimes(9);
      expect(mock.closePath).toHaveBeenCalledOnce();
    });

    it('starts from the top vertex at outer radius', () => {
      drawStar(ctx, 0, 0, 10);

      // Top vertex: outerRadius * cos(-PI/2) = 0, outerRadius * sin(-PI/2) = -10
      expect(mock.moveTo).toHaveBeenCalledWith(
        expect.closeTo(0, 10),
        expect.closeTo(-10, 10),
      );
    });

    it('alternates between outer and inner radius', () => {
      const size = 10;
      const innerRadius = size * 0.4;
      drawStar(ctx, 0, 0, size);

      // Second point (i=1) uses inner radius
      const step = Math.PI / 5;
      const startAngle = -Math.PI / 2;
      const a1 = startAngle + 1 * step;
      const expectedX = innerRadius * Math.cos(a1);
      const expectedY = innerRadius * Math.sin(a1);

      expect(mock.lineTo).toHaveBeenNthCalledWith(
        1,
        expect.closeTo(expectedX, 10),
        expect.closeTo(expectedY, 10),
      );
    });

    it('does not call arc or rect', () => {
      drawStar(ctx, 10, 20, 5);

      expect(mock.arc).not.toHaveBeenCalled();
      expect(mock.rect).not.toHaveBeenCalled();
    });
  });
});
