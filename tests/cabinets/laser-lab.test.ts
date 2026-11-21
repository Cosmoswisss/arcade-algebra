import { describe, expect, test } from 'vitest';
import { angleToDir, checklist, evaluateLaser, goalText, isEigen, realEigenvectors } from '../../src/arcade/cabinets/laser-lab/logic';
import { validateLaserParams } from '../../src/arcade/cabinets/laser-lab/params';
import { loadContent } from '../../src/content/load';
import { allPlayableWaves } from '../../src/content/lessons';
import type { Mat2 } from '../../src/engine/types';

const A: Mat2 = [[2, 1], [0, 3]];
describe('laser lab logic', () => {
  test('isEigen within 3°, including a flipped exit', () => {
    expect(isEigen(A, [1, 0])).toBe(true);
    expect(isEigen(A, [1, 1])).toBe(true);
    expect(isEigen(A, [0, 1])).toBe(false);
    expect(isEigen([[1, 2], [2, 1]], [1, -1])).toBe(true); // eigenvalue −1
  });
  test('a zero vector is never an answer', () => expect(isEigen(A, [0, 0])).toBe(false));
  test('rotations have no real eigenvector', () => expect(realEigenvectors([[0, -1], [1, 0]])).toEqual([]));
  test('real eigenvectors of a symmetric matrix', () => expect(realEigenvectors([[2, 1], [1, 2]]).length).toBe(2));
  test('angleToDir snaps to 15° and has length 2', () => {
    const d = angleToDir(44); expect(Math.hypot(...d)).toBeCloseTo(2); expect(d[0]).toBeCloseTo(d[1]);
  });
  test('right direction wins', () => expect(evaluateLaser(A, [1, 1], false).correct).toBe(true));
  test('pressing NO STRAIGHT PATH on a rotation wins', () => expect(evaluateLaser([[0, -1], [1, 0]], [1, 0], true).correct).toBe(true));
  test('pressing it when a straight path exists is missed-none', () => expect(evaluateLaser(A, [1, 0], true).diagnosis?.kind).toBe('missed-none'));
  test('a direction that keeps its length but turns', () => expect(evaluateLaser([[0, -1], [1, 0]], [1, 0], false).diagnosis?.kind).toBe('same-length-not-direction'));
  test('goal mentions the matrix only in abstract', () => expect(goalText(A, 'abstract')).toContain('[[2, 1], [0, 3]]'));
  test('abstract checklist is empty', () => expect(checklist(A, [1, 0], 'abstract')).toEqual([]));
  test('params validator', () => { expect(validateLaserParams({ matrix: A })).toBeNull(); expect(validateLaserParams({ matrix: 3 })).not.toBeNull(); });
  test('content: every straight path is at a multiple of 15°', () => {
    const c = loadContent().cabinets['laser-lab']!;
    for (const w of allPlayableWaves(c)) {
      const m = (w.params as { matrix: Mat2 }).matrix;
      for (const v of realEigenvectors(m)) {
        const ang = ((Math.atan2(v[1], v[0]) * 180) / Math.PI + 360) % 15;
        expect(Math.min(ang, 15 - ang), w.id).toBeLessThan(1e-6);
      }
    }
  });
});
