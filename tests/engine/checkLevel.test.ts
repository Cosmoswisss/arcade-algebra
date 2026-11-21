import { describe, expect, test } from 'vitest';
import { checkLevel, effectiveMatrix } from '../../src/engine/checkLevel';
import { mul } from '../../src/engine/matrix';
import type { Level, Mat2 } from '../../src/engine/types';

const base: Level = {
  id: 't', skill: 'matrix-transform', title: 't', prompt: 'p',
  shape: [[0, 0], [1, 0], [1, 1], [0, 1]], target: { type: 'shape', matrix: [[2, 0], [1, 1]] },
  movable: ['i', 'j'], start: [[1, 0], [0, 1]], snap: 0.5, tolerance: 0.1, hints: [],
};
const rot: Mat2 = [[0, -1], [1, 0]];
const stretch: Mat2 = [[2, 0], [0, 1]];

describe('checkLevel', () => {
  test('shape: passes within 0.05, fails at 0.2', () => {
    expect(checkLevel(base, [[2.05, 0], [1, 1]])).toBe(true);
    expect(checkLevel(base, [[2.2, 0], [1, 1]])).toBe(false);
  });
  test('shape with pre: uses m·pre, not pre·m', () => {
    const lvl: Level = { ...base, pre: rot, target: { type: 'shape', matrix: mul(stretch, rot) } };
    expect(effectiveMatrix(lvl, stretch)).toEqual(mul(stretch, rot));
    expect(checkLevel(lvl, stretch)).toBe(true);
    expect(checkLevel({ ...lvl, target: { type: 'shape', matrix: mul(rot, stretch) } }, stretch)).toBe(false);
  });
  test('area: det -2 passes only when target is -2', () => {
    const m: Mat2 = [[0, 1], [2, 0]];
    expect(checkLevel({ ...base, target: { type: 'area', det: -2 } }, m)).toBe(true);
    expect(checkLevel({ ...base, target: { type: 'area', det: 2 } }, m)).toBe(false);
  });
  test('point: (1,0) sent to (3,2)', () => {
    const lvl: Level = { ...base, target: { type: 'point', from: [1, 0], point: [3, 2] } };
    expect(checkLevel(lvl, [[3, 0], [2, 1]])).toBe(true);
    expect(checkLevel(lvl, [[3, 0], [1, 1]])).toBe(false);
  });
  test('direction: v=(1,0) with start diag(2,3) passes; v=(1,1) fails', () => {
    const lvl: Level = { ...base, movable: ['v'], start: [[2, 0], [0, 3]], target: { type: 'direction' } };
    expect(checkLevel(lvl, lvl.start, [1, 0])).toBe(true);
    expect(checkLevel(lvl, lvl.start, [1, 1])).toBe(false);
  });
  test('direction: v=(0,0) never passes', () => {
    const lvl: Level = { ...base, movable: ['v'], start: [[2, 0], [0, 3]], target: { type: 'direction' } };
    expect(checkLevel(lvl, lvl.start, [0, 0])).toBe(false);
    expect(checkLevel(lvl, lvl.start)).toBe(false);
  });
  test('no exception with a det-0 matrix', () => {
    const flat: Mat2 = [[1, 2], [2, 4]];
    expect(() => checkLevel(base, flat)).not.toThrow();
    expect(checkLevel({ ...base, target: { type: 'area', det: 0 } }, flat)).toBe(true);
    const dir: Level = { ...base, movable: ['v'], start: flat, target: { type: 'direction' } };
    expect(checkLevel(dir, flat, [2, -1])).toBe(true); // eigenvalue 0: image is zero
  });
});
