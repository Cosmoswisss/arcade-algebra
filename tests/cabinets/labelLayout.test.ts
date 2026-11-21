import { describe, expect, test } from 'vitest';
import { axisObstacles, isCoordLabel, overlaps, placeLabels, type Rect } from '../../src/arcade/kit/labelLayout';

const bounds: Rect = { x: 0, y: 0, w: 400, h: 300 };
const axes = axisObstacles({ ox: 150, oy: 150, u: 40, xr: [-3, 4], yr: [-3, 3], tick: { below: 12, left: 12, size: 10 } });
const moved = (r: Rect, [dx, dy]: [number, number]): Rect => ({ ...r, x: r.x + dx, y: r.y + dy });

describe('placeLabels', () => {
  test('a label in free space stays where it is', () => {
    const r = { x: 260, y: 40, w: 60, h: 14 };
    expect(placeLabels([r], axes, bounds)).toEqual([[0, 0]]);
  });
  test('a label lying on the x axis and its tick numbers is moved off them', () => {
    const r = { x: 180, y: 145, w: 70, h: 14 }; // "î (1, 0)" written on the axis
    const [off] = placeLabels([r], axes, bounds);
    const out = moved(r, off);
    for (const o of axes) expect(overlaps(out, o)).toBe(false);
  });
  test('two labels at the same spot end up apart', () => {
    const a = { x: 250, y: 60, w: 60, h: 14 }, b = { ...a };
    const [oa, ob] = placeLabels([a, b], axes, bounds);
    expect(overlaps(moved(a, oa), moved(b, ob))).toBe(false);
  });
  test('labels stay inside the view', () => {
    const r = { x: 0, y: 0, w: 60, h: 14 };
    const out = moved(r, placeLabels([r], [{ x: 0, y: 0, w: 70, h: 20 }], bounds)[0]);
    expect(out.x >= 0 && out.y >= 0 && out.x + out.w <= 400 && out.y + out.h <= 300).toBe(true);
  });
});

describe('isCoordLabel', () => {
  test.each(['î (1, 0)', 'HOLE (2, -1.5)', 'ends at (−1, −1)'])('%s is a coordinate label', (s) => expect(isCoordLabel(s)).toBe(true));
  test.each(['SMASH!', '2', 'WAVE 3'])('%s is not', (s) => expect(isCoordLabel(s)).toBe(false));
});
