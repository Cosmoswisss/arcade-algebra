import { describe, expect, test } from 'vitest';
import { areaFactor, checklist, evaluateSquash, goalText, snapBet } from '../../src/arcade/cabinets/squash/logic';
import { validateSquashParams } from '../../src/arcade/cabinets/squash/params';
import { loadContent } from '../../src/content/load';
import { allPlayableWaves } from '../../src/content/lessons';
import type { Mat2 } from '../../src/engine/types';

describe('squash logic', () => {
  test('areaFactor is the determinant', () => { expect(areaFactor([[2, 0], [0, 1.5]])).toBe(3); expect(areaFactor([[0, 1], [1, 0]])).toBe(-1); });
  test('a zero matrix gives 0, never NaN', () => expect(areaFactor([[0, 0], [0, 0]])).toBe(0));
  test('right bet', () => expect(evaluateSquash([[2, 0], [0, 1]], 2).correct).toBe(true));
  test('wrong sign on a flip', () => expect(evaluateSquash([[0, 1], [1, 0]], 1).diagnosis?.kind).toBe('wrong-sign'));
  test('missed a squash to zero', () => expect(evaluateSquash([[1, 2], [0.5, 1]], 1).diagnosis?.kind).toBe('missed-zero'));
  test('snapBet rounds to 0.5 and clamps to ±3', () => { expect(snapBet(1.26)).toBe(1.5); expect(snapBet(-9)).toBe(-3); });
  test('goal shows the matrix only from the partial rule on; assist explains counting', () => {
    expect(goalText([[2, 0], [0, 1]], 'assist')).toContain('Count');
    expect(goalText([[2, 0], [0, 1]], 'abstract')).toContain('[[2, 0], [0, 1]]');
  });
  test('abstract checklist is empty', () => expect(checklist([[2, 0], [0, 1]], 1, 'abstract')).toEqual([]));
  test('params validator', () => { expect(validateSquashParams({ matrix: [[1, 0], [0, 1]] })).toBeNull(); expect(validateSquashParams({})).not.toBeNull(); });
  test('every bundled answer is reachable with the slider (step 0.5, within ±3)', () => {
    const c = loadContent().cabinets.squash!;
    for (const w of allPlayableWaves(c)) {
      const d = areaFactor((w.params as { matrix: Mat2 }).matrix);
      expect(snapBet(d), w.id).toBeCloseTo(d, 9);
    }
  });
});
