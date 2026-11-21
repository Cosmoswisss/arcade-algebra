import { describe, expect, test } from 'vitest';
import { endPoint, evaluateGolf, goalText, hitsWall, pathPoints } from '../../src/arcade/cabinets/vector-golf/logic';
import { validateGolfParams } from '../../src/arcade/cabinets/vector-golf/params';
import type { GolfParams } from '../../src/arcade/cabinets/vector-golf/params';
import { loadContent } from '../../src/content/load';
import { allPlayableWaves } from '../../src/content/lessons';

const P: GolfParams = { start: [-2, -1], shots: [[0, 3], [3, 0]], hole: [1, 2], walls: [[[-1, -2], [-1, 1.5]]] };

describe('vector golf logic', () => {
  test('endPoint adds the shots tip to tail', () => expect(endPoint([-2, -1], [[2, 0], [1, 3]])).toEqual([1, 2]));
  test('pathPoints lists every stop', () => expect(pathPoints([0, 0], [[1, 0], [0, 2]])).toEqual([[0, 0], [1, 0], [1, 2]]));
  test('a diagonal shot through the wall is blocked', () => expect(hitsWall(pathPoints(P.start, [[3, 3]]), P.walls)).toBe(true));
  test('the detour does not hit the wall', () => expect(hitsWall(pathPoints(P.start, P.shots), P.walls)).toBe(false));
  test('build mode: reaching the hole around the wall is correct', () => {
    expect(evaluateGolf(P, 'assist', [[0, 3], [3, 0]], null).correct).toBe(true);
    expect(evaluateGolf(P, 'assist', [[3, 0], [0, 3]], null).diagnosis?.kind).toBe('hit-wall'); // same total, but this order crosses the wall
  });
  test('build mode: hitting the wall is a hit-wall error', () => expect(evaluateGolf(P, 'assist', [[3, 3], [0, 0]], null).diagnosis?.kind).toBe('hit-wall'));
  test('build mode: swapped x/y is diagnosed on the total move', () => {
    const p: GolfParams = { start: [0, 0], shots: [[3, 1]], hole: [3, 1], walls: [] };
    expect(evaluateGolf(p, 'partial', [[1, 3]], null).diagnosis?.kind).toBe('swapped-xy');
  });
  test('abstract mode judges the predicted landing point', () => {
    expect(evaluateGolf(P, 'abstract', [], [1, 2]).correct).toBe(true);
    expect(evaluateGolf(P, 'abstract', [], [2, 1]).correct).toBe(false);
  });
  test('assist goal gives the hole coordinates', () => expect(goalText(P, 'assist')).toContain('(1, 2)'));
  test('params validator', () => {
    expect(validateGolfParams(P)).toBeNull();
    expect(validateGolfParams({ ...P, shots: [] })).not.toBeNull();
    expect(validateGolfParams({ ...P, walls: [[[0, 0]]] })).not.toBeNull();
  });
  test('every bundled wave is solvable as written and stays on the field', () => {
    const c = loadContent().cabinets['vector-golf']!;
    for (const w of allPlayableWaves(c)) {
      const p = w.params as GolfParams;
      expect(evaluateGolf(p, 'assist', p.shots, null).correct, w.id).toBe(true);
      for (const q of pathPoints(p.start, p.shots)) { expect(q[0] >= -3 && q[0] <= 3 && q[1] >= -2 && q[1] <= 3, `${w.id} ${q}`).toBe(true); }
    }
  });
});

describe('vector golf: no shortcut through a zero shot', () => {
  const open: GolfParams = { start: [-2, -1], shots: [[2, 1], [1, 2]], hole: [1, 2], walls: [] };
  test('without walls, only the first shot is free: the next ones are given by the level', async () => {
    const { fixedShots } = await import('../../src/arcade/cabinets/vector-golf/logic');
    expect(fixedShots(open)).toEqual([false, true]);
    expect(fixedShots(P)).toEqual([false, false]);                  // walls: every shot is the player's (the order matters)
    expect(fixedShots({ ...open, shots: [[3, 3]] })).toEqual([false]);
  });
  test('putting the whole move in shot 1 fails: shot 2 is still added', () => {
    expect(evaluateGolf(open, 'assist', [[3, 3], [1, 2]], null).correct).toBe(false);
    expect(evaluateGolf(open, 'assist', [[2, 1], [1, 2]], null).correct).toBe(true);
  });
  test('a shot that does not move the ball is refused, with a named reason', () => {
    const r = evaluateGolf(P, 'assist', [[3, 3], [0, 0]], null);
    expect(r.correct).toBe(false);
    const free: GolfParams = { start: [0, 0], shots: [[1, 0], [0, 1]], hole: [1, 1], walls: [[[2, 2], [3, 3]]] };
    const z = evaluateGolf(free, 'assist', [[1, 1], [0, 0]], null);
    expect(z.correct).toBe(false); expect(z.diagnosis?.text).toMatch(/every shot must move/i);
  });
  test('the goal names the fixed shot', () => expect(goalText(open, 'assist')).toMatch(/shot 2 is fixed.*\(1, 2\)/i));
});
