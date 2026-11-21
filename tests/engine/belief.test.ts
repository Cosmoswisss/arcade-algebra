import { describe, expect, test } from 'vitest';
import { addEvidence, cabinetEstimate, evidence, isBelief, isConceptKnown, mean, observe, priorBelief, reportedMastery, spread } from '../../src/engine/belief';
import type { Belief } from '../../src/engine/belief';

const run = (rule: 'assist' | 'partial' | 'abstract', results: boolean[]) => results.reduce((b, ok) => observe(b, ok, rule, 1), priorBelief());

describe('belief', () => {
  test('prior: mean 0.2, wide, no evidence', () => {
    const b = priorBelief();
    expect(mean(b)).toBeCloseTo(0.2, 5);
    expect(spread(b)).toBeGreaterThan(0.2);
    expect(evidence(b)).toBe(0);
  });
  test('uncertainty shrinks as evidence comes in', () => {
    expect(spread(run('abstract', [true, true, true, true, true, true]))).toBeLessThan(spread(run('abstract', [true])));
  });
  test('a win with nothing but the numbers weighs more than one with aids', () => {
    expect(mean(run('abstract', [true]))).toBeGreaterThan(mean(run('partial', [true])));
    expect(mean(run('partial', [true]))).toBeGreaterThan(mean(run('assist', [true])));
  });
  test('a miss under an aid hurts more than the same miss with nothing but the numbers', () => {
    expect(mean(run('assist', [false]))).toBeLessThan(mean(run('abstract', [false])));
  });
  test('three misses really lower the estimate (the old model floored at 0.19)', () => {
    expect(mean(run('assist', [false, false, false]))).toBeLessThan(0.1);
  });
  test('two wins with aids do not reach the known line; wins with no aid do', () => {
    expect(isConceptKnown(run('assist', [true, true]))).toBe(false);
    expect(isConceptKnown(run('abstract', [true, true]))).toBe(true);
  });
  test('only abstract wins count as proof', () => {
    expect(run('assist', [true, true, true]).abs).toBe(0);
    expect(run('abstract', [true]).abs).toBe(1);
  });
  test('a cabinet is not mastered from aided wins, however many', () => {
    const b = run('assist', Array(20).fill(true));
    const e = cabinetEstimate({ 'drone:x': b }, 'drone', ['x']);
    expect(e.mean).toBeGreaterThan(0.6);
    expect(e.proof).toBe(false);
    expect(reportedMastery(e, 0.6)).toBeLessThan(0.6);
  });
  test('unseen concepts count at the prior, so two good concepts out of four do not master a cabinet', () => {
    const good = run('abstract', [true, true, true]);
    const e = cabinetEstimate({ 'drone:a': good, 'drone:b': good }, 'drone', ['a', 'b', 'c', 'd']);
    expect(e.mean).toBeLessThan(0.6);
    expect(cabinetEstimate({ 'drone:a': good, 'drone:b': good }, 'drone', ['a', 'b']).mean).toBeGreaterThan(0.6);
  });
  test('lesson evidence counts as an entry of the cabinet', () => {
    const e0 = cabinetEstimate({}, 'drone', ['a']);
    const e1 = cabinetEstimate({ 'drone:@course': addEvidence(priorBelief(), 2, 0, 1) }, 'drone', ['a']);
    expect(e1.mean).toBeGreaterThan(e0.mean);
  });
  test('isBelief rejects junk', () => {
    expect(isBelief({ a: 1, b: 2, abs: 0, last: 0 })).toBe(true);
    for (const bad of [null, 3, {}, { a: -1, b: 1, abs: 0, last: 0 }, { a: 'x', b: 1, abs: 0, last: 0 }, { a: 0, b: 0, abs: 0, last: 0 }, { a: NaN, b: 1, abs: 0, last: 0 }]) expect(isBelief(bad as Belief)).toBe(false);
  });
});
