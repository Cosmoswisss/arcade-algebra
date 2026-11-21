import { describe, expect, test } from 'vitest';
import { diagnoseBasis, diagnoseNumber, diagnoseVector } from '../../src/engine/diagnoseKinds';

const T: [[number, number], [number, number]] = [[2, 0], [1, 1]];
describe('diagnoseBasis', () => {
  test('correct → null', () => expect(diagnoseBasis(T, T, 0.1)).toBeNull());
  test('swapped', () => expect(diagnoseBasis([[0, 2], [1, 1]], T, 0.1)?.kind).toBe('swapped-columns'));
  test('sign', () => expect(diagnoseBasis([[-2, 0], [-1, 1]], T, 0.1)?.kind).toBe('sign-flip'));
  test('scale', () => expect(diagnoseBasis([[4, 0], [2, 2]], T, 0.1)?.kind).toBe('scale'));
  test('one column, with the wrong part flagged', () => {
    const d = diagnoseBasis([[2, 0], [1, 3]], T, 0.1)!;
    expect(d.kind).toBe('one-column'); expect(d.wrongParts).toEqual([false, true]);
  });
  test('other', () => expect(diagnoseBasis([[0, 3], [-1, 2]], T, 0.1)?.kind).toBe('other'));
  test('messages mention coordinates', () => expect(diagnoseBasis([[2, 0], [1, 3]], T, 0.1)!.text).toContain('(0, 1)'));
});
describe('diagnoseVector', () => {
  test('correct → null', () => expect(diagnoseVector([3, 2], [3, 2], 0.1)).toBeNull());
  test('swapped xy', () => expect(diagnoseVector([2, 3], [3, 2], 0.1)?.kind).toBe('swapped-xy'));
  test('sign x', () => expect(diagnoseVector([-3, 2], [3, 2], 0.1)?.kind).toBe('sign-x'));
  test('sign y', () => expect(diagnoseVector([3, -2], [3, 2], 0.1)?.kind).toBe('sign-y'));
  test('other', () => expect(diagnoseVector([0, 0], [3, 2], 0.1)?.kind).toBe('other'));
});
describe('diagnoseNumber', () => {
  test('correct → null', () => expect(diagnoseNumber(2, 2, 0.1)).toBeNull());
  test('wrong sign', () => expect(diagnoseNumber(-2, 2, 0.1)?.kind).toBe('wrong-sign'));
  test('missed zero', () => expect(diagnoseNumber(1, 0, 0.1)?.kind).toBe('missed-zero'));
  test('NaN does not throw', () => expect(diagnoseNumber(NaN, 2, 0.1)?.kind).toBe('other'));
});
