import { describe, expect, test } from 'vitest';
import { checkAnswer } from '../../src/content/checkAnswer';
import type { Question } from '../../src/content/types';

describe('checkAnswer', () => {
  const basis: Question = { kind: 'basis', prompt: 'p', given: { matrix: [[2, 0], [1, 1]] }, answer: [[2, 0], [1, 1]], tolerance: 0.1 };
  test('basis: right → correct, swapped → swapped-columns', () => {
    expect(checkAnswer(basis, [[2, 0], [1, 1]])).toEqual({ correct: true, kind: null, text: '' });
    expect(checkAnswer(basis, [[0, 2], [1, 1]]).kind).toBe('swapped-columns');
  });
  const point: Question = { kind: 'point', prompt: 'p', given: {}, answer: [3, 2], tolerance: 0.1 };
  test('point: within tolerance, swapped xy diagnosed', () => {
    expect(checkAnswer(point, [3.05, 2]).correct).toBe(true);
    expect(checkAnswer(point, [2, 3]).kind).toBe('swapped-xy');
  });
  const num: Question = { kind: 'number', prompt: 'p', given: { matrix: [[2, 0], [0, -1]] }, answer: -2, tolerance: 0.1 };
  test('number: sign diagnosed', () => {
    expect(checkAnswer(num, -2).correct).toBe(true);
    expect(checkAnswer(num, 2).kind).toBe('wrong-sign');
  });
  const choice: Question = { kind: 'choice', prompt: 'p', options: ['a', 'b', 'c'], answer: 1 };
  test('choice', () => {
    expect(checkAnswer(choice, 1).correct).toBe(true);
    expect(checkAnswer(choice, 2)).toMatchObject({ correct: false, kind: 'other' });
  });
  test('a wrong answer type never throws', () => {
    expect(checkAnswer(basis, 3 as never).correct).toBe(false);
    expect(checkAnswer(num, 'x' as never).correct).toBe(false);
  });
});
