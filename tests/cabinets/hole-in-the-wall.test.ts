import { describe, expect, test } from 'vitest';
import { checklist, evaluate, goalText } from '../../src/arcade/cabinets/hole-in-the-wall/logic';
import { validateHoleParams } from '../../src/arcade/cabinets/hole-in-the-wall/params';
import { loadContent } from '../../src/content/load';
import { allPlayableWaves } from '../../src/content/lessons';
import type { Mat2 } from '../../src/engine/types';

const T: Mat2 = [[2, 0], [1, 1]];
describe('hole in the wall logic', () => {
  test('assist goal gives both target columns as coordinates', () => {
    const g = goalText(T, 'assist'); expect(g).toContain('(2, 1)'); expect(g).toContain('(0, 1)');
  });
  test('partial and abstract goals do not give the answer away', () => {
    expect(goalText(T, 'partial')).not.toContain('(2, 1)');
    expect(goalText(T, 'abstract')).not.toContain('(2, 1)');
  });
  test('assist checklist ticks each arrow on its target', () => {
    expect(checklist(T, [2, 1], [0, 0], 'assist').map((c) => c.ok)).toEqual([true, false]);
  });
  test('abstract checklist is empty', () => expect(checklist(T, [2, 1], [0, 1], 'abstract')).toEqual([]));
  test('swapped arrows are diagnosed', () => expect(evaluate([0, 1], [2, 1], T).diagnosis?.kind).toBe('swapped-columns'));
  test('the right arrows pass', () => expect(evaluate([2, 1], [0, 1], T)).toEqual({ correct: true, diagnosis: null }));
  test('params validator', () => {
    expect(validateHoleParams({ matrix: [[1, 2]] })).not.toBeNull();
    expect(validateHoleParams({ matrix: [[1, 0], [0, 1]] })).toBeNull();
  });
  test('every bundled wave and drill is reachable with 0.5 snapping inside the handle limits', () => {
    const c = loadContent().cabinets['hole-in-the-wall']!;
    for (const w of allPlayableWaves(c)) {
      const m = (w.params as { matrix: Mat2 }).matrix;
      for (const v of m.flat()) { expect(Math.abs(v * 2 - Math.round(v * 2)), w.id).toBeLessThan(1e-9); expect(Math.abs(v), w.id).toBeLessThanOrEqual(3); }
      expect(m[1][0] >= -2 && m[1][1] >= -2, w.id).toBe(true);
    }
  });
});

describe('constellation stars', () => {
  test('the stars always include where (1, 0) and (0, 1) land, first', async () => {
    const { starAnchors } = await import('../../src/arcade/cabinets/hole-in-the-wall/logic');
    const a = starAnchors(T);
    expect(a[0]).toEqual([1, 0]); expect(a[1]).toEqual([0, 1]);
    expect(a.length).toBeGreaterThanOrEqual(3); expect(a.length).toBeLessThanOrEqual(5);
  });
  test('every star of every bundled wave is on the visible plane', async () => {
    const { starAnchors, starPoint } = await import('../../src/arcade/cabinets/hole-in-the-wall/logic');
    const c = loadContent().cabinets['hole-in-the-wall']!;
    for (const w of allPlayableWaves(c)) {
      const m = (w.params as { matrix: Mat2 }).matrix;
      for (const p of starAnchors(m)) { const s = starPoint(m, p); expect(s[0] >= -3 && s[0] <= 3 && s[1] >= -2 && s[1] <= 3, `${w.id} ${p} → ${s}`).toBe(true); }
    }
  });
  test('a star lights when the player\'s grid point for its anchor lands on it', async () => {
    const { litStars, starAnchors } = await import('../../src/arcade/cabinets/hole-in-the-wall/logic');
    const anchors = starAnchors(T);
    expect(litStars(T, [2, 1], [0, 1]).every(Boolean)).toBe(true);
    const half = litStars(T, [2, 1], [0, 0]); // î right, ĵ wrong: (1, 0) lit, (0, 1) dark
    expect(half[0]).toBe(true); expect(half[1]).toBe(false);
    expect(half).toHaveLength(anchors.length);
  });
  test('checklist counts the lit stars from the partial rule on', () => {
    const c = checklist(T, [2, 1], [0, 0], 'partial');
    expect(c).toHaveLength(1); expect(c[0].label).toMatch(/stars? lit 1\/\d/); expect(c[0].ok).toBe(false);
  });
});
