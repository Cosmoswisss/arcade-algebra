import { describe, expect, test } from 'vitest';
import { checklist, evaluateRewind, goalText, solution } from '../../src/arcade/cabinets/rewind/logic';
import { validateRewindParams } from '../../src/arcade/cabinets/rewind/params';
import { loadContent } from '../../src/content/load';
import { allPlayableWaves } from '../../src/content/lessons';
import type { Mat2 } from '../../src/engine/types';

describe('rewind logic', () => {
  test('solution is the inverse', () => expect(solution([[2, 0], [0, 2]])).toEqual([[0.5, 0], [0, 0.5]]));
  test('a flat picture cannot be repaired', () => expect(solution([[1, 2], [0.5, 1]])).toBe('cant-repair'));
  test('building the inverse is correct', () => expect(evaluateRewind([[1, 1], [0, 1]], [[1, -1], [0, 1]], false).correct).toBe(true));
  test('saying "can\'t repair" on a flat picture is correct', () => expect(evaluateRewind([[2, 1], [2, 1]], [[1, 0], [0, 1]], true).correct).toBe(true));
  test('trying to repair a flat picture', () => expect(evaluateRewind([[2, 1], [2, 1]], [[1, 0], [0, 1]], false).diagnosis?.kind).toBe('repaired-flat'));
  test('giving up on a repairable picture', () => expect(evaluateRewind([[2, 0], [0, 2]], [[1, 0], [0, 1]], true).diagnosis?.kind).toBe('missed-repairable'));
  test('swapped columns of the inverse are diagnosed', () => expect(evaluateRewind([[1, 0], [1, 1]], [[0, 1], [1, -1]], false).diagnosis?.kind).toBe('swapped-columns'));
  test('goal never gives the inverse away', () => expect(goalText([[2, 0], [0, 2]], 'assist')).not.toContain('0.5'));
  test('abstract checklist is empty', () => expect(checklist([[2, 0], [0, 2]], [[1, 0], [0, 1]], 'abstract')).toEqual([]));
  test('params validator', () => {
    expect(validateRewindParams({ matrix: [[1, 0], [0, 1]], image: 'city' })).toBeNull();
    expect(validateRewindParams({ matrix: [[1, 0], [0, 1]], image: 'cat' })).not.toBeNull();
  });
  test('every bundled repair is reachable with 0.5 steps inside ±3', () => {
    const c = loadContent().cabinets.rewind!;
    for (const w of allPlayableWaves(c)) {
      const s = solution((w.params as { matrix: Mat2 }).matrix);
      if (s === 'cant-repair') continue;
      for (const v of s.flat()) { expect(Math.abs(v * 2 - Math.round(v * 2)), w.id).toBeLessThan(1e-9); expect(Math.abs(v), w.id).toBeLessThanOrEqual(3); }
    }
  });
});
