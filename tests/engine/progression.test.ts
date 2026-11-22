import { describe, expect, test } from 'vitest';
import { applyWaveResult, cabinetState, defaultProgress, dexKey, levelOf, placeFromDiagnostic } from '../../src/engine/progression';
import type { ProgressV2 } from '../../src/engine/progression';

const win = { correct: true, rule: 'assist' as const, firstTry: true, concept: 'stretch', boss: false };

describe('progression', () => {
  test('levelOf', () => { expect(levelOf(0)).toBe(1); expect(levelOf(99)).toBe(1); expect(levelOf(250)).toBe(3); });
  test('xp: +10 per win, +5 more under the abstract rule, +50 for a boss, 0 for a miss', () => {
    const p = defaultProgress();
    expect(applyWaveResult(p, 'hole-in-the-wall', win).xpGained).toBe(10);
    expect(applyWaveResult(p, 'hole-in-the-wall', { ...win, rule: 'abstract' }).xpGained).toBe(15);
    expect(applyWaveResult(p, 'hole-in-the-wall', { ...win, rule: 'abstract', boss: true }).xpGained).toBe(65);
    expect(applyWaveResult(p, 'hole-in-the-wall', { ...win, correct: false }).xpGained).toBe(0);
  });
  test('a win under the abstract rule raises mastery more than one with aids', () => {
    const p = defaultProgress();
    const a = applyWaveResult(p, 'squash', { ...win, rule: 'abstract' }).next.mastery.squash;
    const b = applyWaveResult(p, 'squash', win).next.mastery.squash;
    expect(a).toBeGreaterThan(b);
  });
  test('a miss lowers mastery', () => {
    expect(applyWaveResult(defaultProgress(), 'squash', { ...win, correct: false }).next.mastery.squash).toBeLessThan(0.2);
  });
  test('the first win of a concept unlocks its Dex card once', () => {
    const r1 = applyWaveResult(defaultProgress(), 'hole-in-the-wall', win);
    expect(r1.newDex).toBe('stretch');
    expect(applyWaveResult(r1.next, 'hole-in-the-wall', win).newDex).toBeNull();
    expect(applyWaveResult(defaultProgress(), 'hole-in-the-wall', { ...win, correct: false }).newDex).toBeNull();
  });
  test('a boss win finishes the cabinet', () => {
    const r = applyWaveResult(defaultProgress(), 'vector-golf', { ...win, boss: true, cleared: true });
    expect(r.next.finished).toContain('vector-golf');
    expect(cabinetState(r.next, 'vector-golf')).toBe('finished');
  });
  test('2 misses in a row in fast mode suggest guided', () => {
    let p = { ...defaultProgress(), profile: { mode: 'fast' as const, theme: 'games' as const } };
    const miss = { ...win, correct: false };
    const r1 = applyWaveResult(p, 'drone', miss); expect(r1.suggestMode).toBeNull();
    const r2 = applyWaveResult(r1.next, 'drone', miss); expect(r2.suggestMode).toBe('guided');
  });
  test('3 first-try wins in a row in guided mode suggest fast', () => {
    let p: ProgressV2 = { ...defaultProgress(), profile: { mode: 'guided', theme: 'sport' } };
    let last = null as null | string;
    for (let k = 0; k < 3; k++) { const r = applyWaveResult(p, 'drone', win); p = r.next; last = r.suggestMode; }
    expect(last).toBe('fast');
  });
  test('modeOverride is respected for the dynamic mode', () => {
    const p = { ...defaultProgress(), profile: { mode: 'fast' as const, theme: 'games' as const }, modeOverride: { drone: 'guided' as const } };
    const miss = { ...win, correct: false };
    expect(applyWaveResult(applyWaveResult(p, 'drone', miss).next, 'drone', miss).suggestMode).toBeNull();
  });
  test('a fresh player: vector-golf open, drone locked', () => {
    const p = defaultProgress();
    expect(cabinetState(p, 'vector-golf')).toBe('open');
    expect(cabinetState(p, 'drone')).toBe('locked');
  });
  test('diagnostic placement opens the next cabinet but does not mark the cabinet mastered', () => {
    const p = placeFromDiagnostic(defaultProgress(), ['vector-golf']);
    expect(p.mastery['vector-golf']).toBeGreaterThan(0.2);
    expect(p.mastery['vector-golf']).toBeLessThan(0.6);
    expect(cabinetState(p, 'vector-golf')).toBe('open');
    expect(cabinetState(p, 'drone')).toBe('open');
    expect(cabinetState(p, 'hole-in-the-wall')).toBe('locked');
  });
  test('a cabinet opens when every earlier one is finished or mastered', () => {
    const p = placeFromDiagnostic(defaultProgress(), ['vector-golf']);
    expect(cabinetState(p, 'drone')).toBe('open');
  });
});

describe('unavailable cabinets', () => {
  test('a cabinet that is not built yet does not block the next ones', () => {
    const available = (id: string) => id === 'hole-in-the-wall';
    expect(cabinetState(defaultProgress(), 'hole-in-the-wall', available)).toBe('open');
    expect(cabinetState(defaultProgress(), 'factory', available)).toBe('locked');
  });
});

describe('review fixes', () => {
  test('a boss win only finishes the cabinet when the run is cleared', () => {
    const r = applyWaveResult(defaultProgress(), 'vector-golf', { ...win, boss: true, cleared: false });
    expect(r.next.finished).not.toContain('vector-golf');
    expect(applyWaveResult(r.next, 'vector-golf', { ...win, boss: true, cleared: true }).next.finished).toContain('vector-golf');
  });
  test('unlocks are sticky: a later miss does not re-lock the next cabinets', () => {
    let p = placeFromDiagnostic(defaultProgress(), ['vector-golf']);
    expect(cabinetState(p, 'drone')).toBe('open');
    for (let k = 0; k < 3; k++) p = applyWaveResult(p, 'vector-golf', { ...win, correct: false }).next;
    expect(p.mastery['vector-golf']).toBeLessThan(0.6);
    expect(cabinetState(p, 'drone')).toBe('open');
  });
  test('the Dex is keyed per cabinet: the same concept in two cabinets gives two cards', () => {
    const a = applyWaveResult(defaultProgress(), 'vector-golf', { ...win, concept: 'negative' });
    expect(a.newDex).toBe('negative');
    expect(applyWaveResult(a.next, 'drone', { ...win, concept: 'negative' }).newDex).toBe('negative');
    expect(dexKey('drone', 'negative')).toBe('drone:negative');
  });
  test('a miss with a named error is remembered', () => {
    const r = applyWaveResult(defaultProgress(), 'drone', { ...win, correct: false, errorKind: 'swapped-xy' });
    expect(r.next.errors['swapped-xy']).toBe(1);
    expect(applyWaveResult(r.next, 'drone', { ...win, correct: false, errorKind: 'swapped-xy' }).next.errors['swapped-xy']).toBe(2);
    expect(applyWaveResult(defaultProgress(), 'drone', { ...win, errorKind: 'swapped-xy' }).next.errors).toEqual({});
  });
  test('placement remembers the placed cabinets', () => {
    const p = placeFromDiagnostic(placeFromDiagnostic(defaultProgress(), ['drone']), ['drone', 'squash']);
    expect(p.placed).toEqual(['drone', 'squash']);
  });
  test('placement: cabinets only inferred from a later pass are unlocked, but not placed (their lessons are not skipped)', () => {
    const p = placeFromDiagnostic(defaultProgress(), ['factory'], [], () => undefined, 0, ['vector-golf', 'drone']);
    expect(p.placed).toEqual(['factory']);
    expect(p.everMastered).toEqual(expect.arrayContaining(['factory', 'vector-golf', 'drone']));
  });
});
