import { describe, expect, test } from 'vitest';
import { initialMastery, updateMastery } from '../../src/engine/mastery';

describe('mastery', () => {
  test('starts at 0.2 for every skill', () => {
    const m = initialMastery();
    expect(Object.values(m)).toHaveLength(7);
    expect(Object.values(m).every((p) => p === 0.2)).toBe(true);
  });
  test('success raises, failure lowers', () => {
    expect(updateMastery(0.5, true, 0)).toBeGreaterThan(0.5);
    expect(updateMastery(0.5, false, 0)).toBeLessThan(0.5);
  });
  test('success with 2 hints raises less than without hints', () =>
    expect(updateMastery(0.5, true, 2)).toBeLessThan(updateMastery(0.5, true, 0)));
  test('stays in [0,1] after 50 successes', () => {
    let p = 0.2;
    for (let k = 0; k < 50; k++) p = updateMastery(p, true, 0);
    expect(p).toBeLessThanOrEqual(1);
    expect(p).toBeGreaterThan(0.95);
    expect(Number.isNaN(updateMastery(1, false, 0))).toBe(false);
    expect(Number.isNaN(updateMastery(0, true, 0))).toBe(false);
  });
});
