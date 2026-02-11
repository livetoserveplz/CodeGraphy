/**
 * @fileoverview Convex hull computation and drawing for node groups.
 */

export interface Point {
  x: number;
  y: number;
}

export function convexHull(points: Point[]): Point[] {
  if (points.length <= 1) return [...points];
  if (points.length === 2) return [...points];

  const sorted = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
  const pivot = sorted[0];

  const rest = sorted.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
    const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
    if (angleA !== angleB) return angleA - angleB;
    const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2;
    const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2;
    return distA - distB;
  });

  const hull: Point[] = [pivot];
  for (const p of rest) {
    while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
      hull.pop();
    }
    hull.push(p);
  }

  return hull;
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function expandHull(hull: Point[], padding: number): Point[] {
  if (hull.length === 0) return [];
  if (hull.length === 1) return [hull[0]];

  const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
  const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;

  return hull.map(p => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: p.x + (dx / dist) * padding,
      y: p.y + (dy / dist) * padding,
    };
  });
}

export function drawRoundedHull(
  ctx: CanvasRenderingContext2D,
  hull: Point[],
  radius: number
): void {
  if (hull.length === 0) return;

  if (hull.length === 1) {
    ctx.arc(hull[0].x, hull[0].y, radius, 0, Math.PI * 2);
    return;
  }

  if (hull.length === 2) {
    const [a, b] = hull;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len * radius;
    const ny = dx / len * radius;
    const angle = Math.atan2(dy, dx);

    ctx.moveTo(a.x + nx, a.y + ny);
    ctx.lineTo(b.x + nx, b.y + ny);
    ctx.arc(b.x, b.y, radius, angle - Math.PI / 2, angle + Math.PI / 2);
    ctx.lineTo(a.x - nx, a.y - ny);
    ctx.arc(a.x, a.y, radius, angle + Math.PI / 2, angle + Math.PI * 3 / 2);
    ctx.closePath();
    return;
  }

  const n = hull.length;
  for (let i = 0; i < n; i++) {
    const prev = hull[(i - 1 + n) % n];
    const curr = hull[i];
    const next = hull[(i + 1) % n];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;

    const r = Math.min(radius, len1 / 2, len2 / 2);

    const x1 = curr.x - (dx1 / len1) * r;
    const y1 = curr.y - (dy1 / len1) * r;
    const x2 = curr.x + (dx2 / len2) * r;
    const y2 = curr.y + (dy2 / len2) * r;

    if (i === 0) {
      ctx.moveTo(x1, y1);
    } else {
      ctx.lineTo(x1, y1);
    }
    ctx.quadraticCurveTo(curr.x, curr.y, x2, y2);
  }
  ctx.closePath();
}

export const GROUP_COLORS = [
  '#4FC3F7', '#81C784', '#FFB74D', '#E57373',
  '#BA68C8', '#4DB6AC', '#FFD54F', '#F06292',
];

export function getGroupColor(index: number): string {
  return GROUP_COLORS[index % GROUP_COLORS.length];
}
