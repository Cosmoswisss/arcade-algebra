import { describe, expect, test } from 'vitest';
import {
  apply, basis, det, fromBasis, identity, inverse, maxAbsDiff, mul, scale, swapColumns,
} from '../../src/engine/matrix';
import { SKILLS } from '../../src/engine/types';

describe('matrix', () => {
  test('identity', () => expect(identity()).toEqual([[1, 0], [0, 1]]));
  test('fromBasis puts î and ĵ in columns', () => expect(fromBasis([2, 1], [0, 1])).toEqual([[2, 0], [1, 1]]));
  test('basis reads the columns', () => expect(basis([[2, 0], [1, 1]])).toEqual([[2, 1], [0, 1]]));
  test('apply', () => expect(apply([[2, 0], [1, 1]], [1, 1])).toEqual([2, 2]));
  test('mul applies b then a', () => expect(mul([[0, -1], [1, 0]], [[2, 0], [0, 1]])).toEqual([[0, -1], [2, 0]]));
  test('det', () => {
    expect(det([[2, 0], [1, 1]])).toBe(2);
    expect(det([[1, 2], [2, 4]])).toBe(0);
  });
  test('inverse of singular matrix is null', () => expect(inverse([[1, 2], [2, 4]])).toBeNull());
  test('inverse', () => expect(inverse([[2, 0], [0, 4]])).toEqual([[0.5, 0], [0, 0.25]]));
  test('swapColumns', () => expect(swapColumns([[2, 0], [1, 1]])).toEqual([[0, 2], [1, 1]]));
  test('scale', () => expect(scale([[2, 0], [1, 1]], 2)).toEqual([[4, 0], [2, 2]]));
  test('maxAbsDiff', () => expect(maxAbsDiff([[1, 0], [0, 1]], [[1, 0.05], [0, 1]])).toBeCloseTo(0.05));
  test('SKILLS order', () => expect(SKILLS).toEqual(
    ['vectors', 'combinations', 'matrix-transform', 'composition', 'determinant', 'inverse', 'eigen'],
  ));
});
