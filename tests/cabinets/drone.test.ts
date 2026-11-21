import { describe, expect, test } from 'vitest';
import { checklist, evaluateDrone, goalText, isReachable, position, solveCoeffs } from '../../src/arcade/cabinets/drone/logic';
import { validateDroneParams } from '../../src/arcade/cabinets/drone/params';
import type { DroneParams } from '../../src/arcade/cabinets/drone/params';
import { loadContent } from '../../src/content/load';

const P: DroneParams = { u: [1, 0], v: [1, 1], target: [2, 1], reachable: true };
const FLAT: DroneParams = { u: [1, 1], v: [2, 2], target: [1, 0], reachable: false };

describe('drone logic', () => {
  test('position = a·u + b·v', () => expect(position(P, 1, 1)).toEqual([2, 1]));
  test('solveCoeffs uses Cramer and returns null for aligned u, v', () => {
    expect(solveCoeffs([1, 0], [1, 1], [2, 1])).toEqual([1, 1]);
    expect(solveCoeffs([1, 1], [2, 2], [1, 0])).toBeNull();
  });
  test('isReachable', () => { expect(isReachable(P)).toBe(true); expect(isReachable(FLAT)).toBe(false); });
  test('right coefficients win', () => expect(evaluateDrone(P, 'assist', 1, 1, null).correct).toBe(true));
  test('swapped coefficients are diagnosed', () => {
    const q: DroneParams = { u: [1, 0], v: [0, 1], target: [2, 1], reachable: true };
    expect(evaluateDrone(q, 'assist', 1, 2, null).diagnosis?.kind).toBe('swapped-xy');
  });
  test('trying to reach an unreachable target is wrong-span', () => expect(evaluateDrone(FLAT, 'assist', 1, 0, null).diagnosis?.kind).toBe('wrong-span'));
  test('saying unreachable on an unreachable target wins', () => expect(evaluateDrone(FLAT, 'partial', 0, 0, 'unreachable').correct).toBe(true));
  test('saying unreachable on a reachable target is wrong-span', () => expect(evaluateDrone(P, 'assist', 0, 0, 'unreachable').diagnosis?.kind).toBe('wrong-span'));
  test('abstract: the reachability answer decides', () => {
    expect(evaluateDrone(P, 'abstract', 0, 0, 'reachable').correct).toBe(true);
    expect(evaluateDrone(P, 'abstract', 0, 0, null).correct).toBe(false);
  });
  test('goal shows u, v and target', () => { const t = goalText(P, 'assist'); expect(t).toContain('(1, 0)'); expect(t).toContain('(2, 1)'); });
  test('abstract checklist is empty', () => expect(checklist(P, 'abstract', 0, 0)).toEqual([]));
  test('params validator', () => { expect(validateDroneParams(P)).toBeNull(); expect(validateDroneParams({ ...P, reachable: 'yes' })).not.toBeNull(); });
  test('content: reachable flag is right and the coefficients fit the sliders', () => {
    const c = loadContent().cabinets.drone!;
    for (const w of [...c.waves, ...c.drills.flatMap((d) => d.waves)]) {
      const p = w.params as DroneParams;
      expect(isReachable(p), w.id).toBe(p.reachable);
      const s = solveCoeffs(p.u, p.v, p.target);
      if (s) for (const x of s) { expect(Math.abs(x * 2 - Math.round(x * 2)), w.id).toBeLessThan(1e-9); expect(Math.abs(x), w.id).toBeLessThanOrEqual(3); }
    }
  });
});
