import { describe, expect, test } from 'vitest';
import { beliefKey, cabinetEstimate, TRANSFER_CONCEPT } from '../../src/engine/belief';
import { applyTransfer, applyWaveResult, defaultProgress, errorKey, loadProgressV2, MAX_TRANSFERS, placeFromDiagnostic, saveProgressV2, transferCabinets, PROGRESS_KEY } from '../../src/engine/progression';
import type { ProgressV2 } from '../../src/engine/progression';

class Mem { d = new Map<string, string>(); getItem(k: string) { return this.d.get(k) ?? null; } setItem(k: string, v: string) { this.d.set(k, v); } removeItem(k: string) { this.d.delete(k); } }
const concepts = ['a', 'b'];
const withEvidence = (): ProgressV2 => applyWaveResult(defaultProgress(), 'vector-golf', { correct: true, rule: 'assist', firstTry: true, concept: 'a', boss: false }, concepts).next;

describe('transfer check', () => {
  test('wins on new cases raise the estimate and count as proof of mastery', () => {
    const p = withEvidence();
    const { next, attempt } = applyTransfer(p, [{ cabinet: 'vector-golf', outcomes: [{ correct: true }, { correct: true }] }], () => concepts);
    expect(next.beliefs[beliefKey('vector-golf', TRANSFER_CONCEPT)].abs).toBe(2);
    expect(cabinetEstimate(next.beliefs, 'vector-golf', concepts).proof).toBe(true);
    expect(attempt.results[0].after).toBeGreaterThan(attempt.results[0].before);
    expect(attempt.results[0].correct).toBe(2);
  });
  test('misses lower the estimate, give no proof, and record the named mistake', () => {
    const p = withEvidence();
    const { next, attempt } = applyTransfer(p, [{ cabinet: 'vector-golf', outcomes: [{ correct: false, kind: 'swapped-xy' }, { correct: false, kind: 'swapped-xy' }] }], () => concepts);
    expect(attempt.results[0].after).toBeLessThan(attempt.results[0].before);
    expect(cabinetEstimate(next.beliefs, 'vector-golf', concepts).proof).toBe(false);
    expect(next.mistakes[errorKey('vector-golf', 'swapped-xy')]).toBe(1);
  });
  test('the transfer entry is not mistaken for a concept', () => {
    const { next } = applyTransfer(defaultProgress(), [{ cabinet: 'drone', outcomes: [{ correct: true }] }]);
    expect(cabinetEstimate(next.beliefs, 'drone').evidence).toBeGreaterThan(0);
    expect(next.mastery.drone).toBeGreaterThan(0.2);
  });
  test('the attempt is kept in the history, which keeps only the last few', () => {
    let p = defaultProgress();
    for (let k = 0; k < MAX_TRANSFERS + 2; k++) p = applyTransfer(p, [{ cabinet: 'drone', outcomes: [{ correct: true }] }], undefined, 1000 + k).next;
    expect(p.transfers).toHaveLength(MAX_TRANSFERS);
    expect(p.transfers[MAX_TRANSFERS - 1].at).toBe(1000 + MAX_TRANSFERS + 1);
  });
  test('the history survives a reload; junk attempts are dropped', () => {
    const s = new Mem() as unknown as Storage;
    const { next } = applyTransfer(withEvidence(), [{ cabinet: 'vector-golf', outcomes: [{ correct: true }] }], () => concepts, 5);
    saveProgressV2(next, s);
    expect(loadProgressV2(s).transfers).toEqual(next.transfers);
    const raw = new Mem(); raw.setItem(PROGRESS_KEY, JSON.stringify({ transfers: [{ at: 'x' }, { at: 1, results: [{ cabinet: 'nope' }] }, next.transfers[0]] }));
    expect(loadProgressV2(raw as unknown as Storage).transfers).toEqual(next.transfers);
  });
  test('placement is remembered as the before', () => {
    const p = placeFromDiagnostic(defaultProgress(), ['vector-golf'], ['drone']);
    expect(p.placementResult).toEqual({ 'vector-golf': 'known', drone: 'missed' });
    expect(p.placed).toEqual(['vector-golf']);
  });
});

describe('which cabinets are checked', () => {
  test('a fresh learner has nothing to check', () => expect(transferCabinets(defaultProgress())).toEqual([]));
  test('a cabinet with evidence is checked; a locked one is not, even with evidence', () => {
    expect(transferCabinets(withEvidence())).toEqual(['vector-golf']);
    const locked = applyWaveResult(defaultProgress(), 'squash', { correct: true, rule: 'assist', firstTry: true, concept: 'a', boss: false }).next;
    expect(transferCabinets(locked)).toEqual([]);
  });
  test('a cabinet placed as known is checked, and unavailable cabinets are skipped', () => {
    const p = placeFromDiagnostic(defaultProgress(), ['vector-golf']);
    expect(transferCabinets(p)).toEqual(['vector-golf', 'drone'].filter((c) => c === 'vector-golf'));
    expect(transferCabinets(p, () => false)).toEqual([]);
  });
});
