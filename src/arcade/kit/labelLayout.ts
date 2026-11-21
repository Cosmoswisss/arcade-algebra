/**
 * Keeps coordinate labels readable: a label that would sit on an axis, on a tick number
 * or on another label is nudged to the nearest free spot around where it wanted to be.
 * Pure (no Pixi, no DOM): used by the lesson scenes (SVG) and by the arcade kit (Pixi).
 */

export interface Rect { x: number; y: number; w: number; h: number }

export const overlaps = (a: Rect, b: Rect, pad = 0): boolean =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

const overlapArea = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** Offsets tried in order: stay put, then above, below, left, right, then the diagonals, then twice as far. */
function candidates(r: Rect, gap: number): [number, number][] {
  const v = r.h + gap, hz = r.w / 2 + gap;
  const near: [number, number][] = [[0, 0], [0, -v], [0, v], [-hz, 0], [hz, 0], [-hz, -v], [hz, -v], [-hz, v], [hz, v]];
  return [...near, ...near.slice(1).map(([dx, dy]) => [dx * 2, dy * 2] as [number, number])];
}

/**
 * Places labels one after the other (earlier labels win). Returns, for each label, the offset
 * to add to its wanted position. A label that cannot be freed takes the spot with the least overlap.
 */
export function placeLabels(labels: Rect[], obstacles: Rect[], bounds: Rect, gap = 4): [number, number][] {
  const placed: Rect[] = [];
  return labels.map((r) => {
    let best: [number, number] = [0, 0], bestCost = Infinity;
    for (const [dx, dy] of candidates(r, gap)) {
      const c = { x: r.x + dx, y: r.y + dy, w: r.w, h: r.h };
      const outside = c.x < bounds.x || c.y < bounds.y || c.x + c.w > bounds.x + bounds.w || c.y + c.h > bounds.y + bounds.h;
      let cost = outside ? 1e6 : 0;
      for (const o of obstacles) cost += overlapArea(c, o);
      for (const p of placed) cost += overlapArea(c, p) * 2;
      cost += Math.hypot(dx, dy) * 0.01; // prefer the closest free spot
      if (cost < bestCost) { bestCost = cost; best = [dx, dy]; }
      if (cost < 1) break;
    }
    placed.push({ x: r.x + best[0], y: r.y + best[1], w: r.w, h: r.h });
    return best;
  });
}

/** What a graduated pair of axes occupies on screen: both axis lines and every tick number
 * (tick numbers centred `below` the x axis and `left` of the y axis). */
export function axisObstacles(o: { ox: number; oy: number; u: number; xr: [number, number]; yr: [number, number]; tick: { below: number; left: number; size: number } }): Rect[] {
  const { ox, oy, u, xr, yr, tick } = o;
  const line = 3;
  const out: Rect[] = [
    { x: ox + (xr[0] - 0.3) * u, y: oy - line, w: (xr[1] - xr[0] + 0.6) * u, h: line * 2 },
    { x: ox - line, y: oy - (yr[1] + 0.3) * u, w: line * 2, h: (yr[1] - yr[0] + 0.6) * u },
  ];
  const box = (cx: number, cy: number, chars: number) => {
    const w = tick.size * 0.62 * chars + 2, h = tick.size + 2;
    out.push({ x: cx - w / 2, y: cy - h / 2, w, h });
  };
  for (let x = xr[0]; x <= xr[1]; x++) if (x) box(ox + x * u, oy + tick.below, String(x).length);
  for (let y = yr[0]; y <= yr[1]; y++) if (y) box(ox - tick.left, oy - y * u, String(y).length);
  return out;
}

/** True for a label that shows coordinates, such as "î (1, 0)" or "HOLE (2, -1.5)". */
export const isCoordLabel = (s: string): boolean => /\(\s*[-−]?\d+(\.\d+)?\s*,\s*[-−]?\d+(\.\d+)?\s*\)/.test(s);
