import { describe, expect, test } from 'vitest';
import { diagnose, ERROR_MESSAGES } from '../../src/engine/diagnose';
import { mul } from '../../src/engine/matrix';
import type { Level, Mat2 } from '../../src/engine/types';

const base: Level = {
  id: 't', skill: 'matrix-transform', title: 't', prompt: 'p',
  shape: [[0, 0], [1, 0], [1, 1], [0, 1]], target: { type: 'shape', matrix: [[2, 0], [1, 1]] },
  movable: ['i', 'j'], start: [[1, 0], [0, 1]], snap: 0.5, tolerance: 0.1, hints: [],
};

describe('diagnose', () => {
  test('success → null', () => expect(diagnose(base, [[2, 0], [1, 1]])).toBeNull());
  test('swapped columns', () => expect(diagnose(base, [[0, 2], [1, 1]])).toBe('swapped-columns'));
  test('sign flip', () => expect(diagnose(base, [[-2, 0], [-1, 1]])).toBe('sign-flip'));
  test('scale', () => expect(diagnose(base, [[4, 0], [2, 2]])).toBe('scale'));
  test('one column', () => expect(diagnose(base, [[2, 0], [1, 3]])).toBe('one-column'));
  test('other', () => expect(diagnose(base, [[0, 3], [-1, 2]])).toBe('other'));
  test('composition order', () => {
    const rot: Mat2 = [[0, -1], [1, 0]];
    const stretch: Mat2 = [[2, 0], [0, 1]];
    const lvl: Level = { ...base, pre: rot, target: { type: 'shape', matrix: mul(rot, stretch) } };
    // player built `stretch`: they got stretch·rot, but the target is rot·stretch
    expect(diagnose(lvl, stretch)).toBe('composition-order');
  });
  test('non-shape failure → other', () =>
    expect(diagnose({ ...base, target: { type: 'area', det: 3 } }, [[1, 0], [0, 1]])).toBe('other'));
  test('every error kind has an English message', () => {
    for (const k of ['swapped-columns', 'sign-flip', 'scale', 'one-column', 'composition-order', 'other'] as const)
      expect(ERROR_MESSAGES[k].length).toBeGreaterThan(5);
  });
});
