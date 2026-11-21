import { describe, expect, test } from 'vitest';
import { beliefKey } from '../../src/engine/belief';
import { applyCourseResult, applyWaveResult, cabinetState, defaultProgress, errorKey, loadProgressV2, MASTERED, placeFromDiagnostic, PROGRESS_KEY, saveProgressV2 } from '../../src/engine/progression';
import type { WaveResult } from '../../src/engine/progression';
import { nextWave } from '../../src/engine/waves';
import type { Learner, RunState } from '../../src/engine/waves';
import { loadContent } from '../../src/content/load';
import { weakSpots } from '../../src/ui/LearnerReport';

const content = loadContent().cabinets['hole-in-the-wall']!;
const concepts = content.dex.map((d) => d.concept);
const win = (concept: string, rule: WaveResult['rule'] = 'abstract'): WaveResult => ({ correct: true, rule, firstTry: true, concept, boss: false });
const miss = (concept: string, kind: string, rule: WaveResult['rule'] = 'assist'): WaveResult => ({ correct: false, rule, firstTry: false, concept, boss: false, errorKind: kind });
const run = (over: Partial<RunState> = {}): RunState => ({ mode: 'guided', waveIndex: 4, tierIndex: 0, focus: null, lastWaveId: null, lives: 3, score: 0, combo: 0, ...over });
const seq = (seed = 1) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
class Mem { d = new Map<string, string>(); getItem(k: string) { return this.d.get(k) ?? null; } setItem(k: string, v: string) { this.d.set(k, v); } removeItem(k: string) { this.d.delete(k); } }

describe('mastery of a cabinet', () => {
  test('two aided wins no longer master a cabinet (they did before)', () => {
    let p = defaultProgress();
    for (let k = 0; k < 2; k++) p = applyWaveResult(p, 'vector-golf', win(concepts[0], 'assist'), concepts).next;
    expect(p.mastery['vector-golf']).toBeLessThan(MASTERED);
    expect(cabinetState(p, 'drone')).toBe('locked');
  });
  test('every concept won with no aid, three times, masters the cabinet', () => {
    let p = defaultProgress();
    for (const c of concepts) for (let k = 0; k < 3; k++) p = applyWaveResult(p, 'hole-in-the-wall', win(c), concepts).next;
    expect(p.mastery['hole-in-the-wall']).toBeGreaterThanOrEqual(MASTERED);
    expect(p.everMastered).toContain('hole-in-the-wall');
  });
  test('misses are visible: three misses with aids pull a concept well under the start (the old model floored at 0.19)', () => {
    let p = defaultProgress();
    for (let k = 0; k < 3; k++) p = applyWaveResult(p, 'drone', miss(concepts[0], 'other'), [concepts[0]]).next;
    expect(p.mastery.drone).toBeLessThan(0.15);
  });
});

describe('lesson evidence', () => {
  test('a lesson question now moves the estimate', () => {
    const p = applyCourseResult(defaultProgress(), 'drone', { correct: true, choice: false, retry: false });
    expect(p.beliefs[beliefKey('drone', '@course')]).toBeDefined();
    expect(p.mastery.drone).toBeGreaterThan(0.2);
  });
  test('a lucky multiple choice counts for less than an open question, and a retry for less than a first try', () => {
    const f = (choice: boolean, retry: boolean) => applyCourseResult(defaultProgress(), 'drone', { correct: true, choice, retry }).mastery.drone;
    expect(f(false, false)).toBeGreaterThan(f(true, false));
    expect(f(false, false)).toBeGreaterThan(f(false, true));
  });
  test('a missed lesson question records the mistake', () => {
    const p = applyCourseResult(defaultProgress(), 'hole-in-the-wall', { correct: false, choice: false, retry: false, kind: 'swapped-columns' });
    expect(p.mistakes[errorKey('hole-in-the-wall', 'swapped-columns')]).toBeGreaterThan(0);
    expect(p.mastery['hole-in-the-wall']).toBeLessThan(0.2);
  });
});

describe('placement', () => {
  const conceptsOf = (c: string) => (c === 'hole-in-the-wall' ? concepts : undefined);
  test('a passed cabinet opens, its concepts count as known, but it is not mastered', () => {
    const p = placeFromDiagnostic(defaultProgress(), ['hole-in-the-wall'], [], conceptsOf);
    expect(p.everMastered).toContain('hole-in-the-wall');
    expect(p.mastery['hole-in-the-wall']).toBeLessThan(MASTERED);
    expect(p.beliefs[beliefKey('hole-in-the-wall', concepts[0])]).toBeDefined();
  });
  test('a missed cabinet is evidence too: its estimate goes down', () => {
    const p = placeFromDiagnostic(defaultProgress(), [], ['hole-in-the-wall'], conceptsOf);
    expect(p.mastery['hole-in-the-wall']).toBeLessThan(0.2);
    expect(p.everMastered).toEqual([]);
  });
  test('after placement, the waves skip ahead through the known concepts', () => {
    const p = placeFromDiagnostic(defaultProgress(), ['hole-in-the-wall'], [], conceptsOf);
    const learner: Learner = { belief: (c) => p.beliefs[beliefKey('hole-in-the-wall', c)], errors: () => ({}) };
    const seen = new Set<string>();
    const rand = seq(3);
    for (let k = 0; k < 300; k++) seen.add(nextWave(content, run({ waveIndex: 0 }), rand, learner).wave.concept);
    expect(seen.size).toBeGreaterThan(1);
  });
  test('without placement, wave 0 only offers the first concept', () => {
    const learner: Learner = { belief: () => undefined, errors: () => ({}) };
    const rand = seq(3);
    for (let k = 0; k < 100; k++) expect(nextWave(content, run({ waveIndex: 0 }), rand, learner).wave.concept).toBe(concepts[0]);
  });
});

describe('recurring mistakes', () => {
  test('mistakes accumulate across waves and a won training wave halves them', () => {
    let p = defaultProgress();
    p = applyWaveResult(p, 'hole-in-the-wall', miss(concepts[0], 'sign-flip'), concepts).next;
    p = applyWaveResult(p, 'hole-in-the-wall', miss(concepts[0], 'sign-flip'), concepts).next;
    expect(p.mistakes[errorKey('hole-in-the-wall', 'sign-flip')]).toBe(2);
    p = applyWaveResult(p, 'hole-in-the-wall', { ...win(concepts[0]), drillKind: 'sign-flip' }, concepts).next;
    expect(p.mistakes[errorKey('hole-in-the-wall', 'sign-flip')]).toBe(1);
  });
  test('the profile survives a reload (beliefs and errors are stored)', () => {
    const s = new Mem() as unknown as Storage;
    let p = defaultProgress();
    p = applyWaveResult(p, 'drone', miss('x', 'swapped-xy'), ['x']).next;
    saveProgressV2(p, s);
    const q = loadProgressV2(s);
    expect(q.beliefs[beliefKey('drone', 'x')]).toEqual(p.beliefs[beliefKey('drone', 'x')]);
    expect(q.mistakes).toEqual(p.mistakes);
    expect(q.mastery.drone).toBeCloseTo(p.mastery.drone, 10);
  });
  test('an older save with no beliefs still loads', () => {
    const s = new Mem(); s.setItem(PROGRESS_KEY, JSON.stringify({ xp: 40, mastery: { drone: 0.5 } }));
    const q = loadProgressV2(s as unknown as Storage);
    expect(q.xp).toBe(40); expect(q.beliefs).toEqual({}); expect(q.mistakes).toEqual({}); expect(q.mastery.drone).toBe(0.5);
  });
  test('corrupt beliefs and errors are ignored field by field', () => {
    const s = new Mem(); s.setItem(PROGRESS_KEY, JSON.stringify({ beliefs: { 'drone:x': { a: 'no' }, 'drone:y': { a: 1, b: 1, abs: 0, last: 0 } }, mistakes: { 'drone:z': 'many', 'drone:w': 2 } }));
    const q = loadProgressV2(s as unknown as Storage);
    expect(Object.keys(q.beliefs)).toEqual(['drone:y']); expect(q.mistakes).toEqual({ 'drone:w': 2 });
  });
  test('weakSpots lists patterns only, strongest first', () => {
    const p = { ...defaultProgress(), mistakes: { [errorKey('drone', 'a')]: 1, [errorKey('drone', 'b')]: 3, [errorKey('squash', 'c')]: 2 } };
    expect(weakSpots(p).map((w) => w.kind)).toEqual(['b', 'c']);
  });
});

describe('adaptive waves', () => {
  test('the concept the learner is weakest at is drawn more often', () => {
    const [first, second] = concepts;
    const learner: Learner = {
      belief: (c) => c === first ? { a: 8, b: 1, abs: 4, last: 1 } : c === second ? { a: 1, b: 6, abs: 0, last: 1 } : { a: 4, b: 2, abs: 1, last: 1 },
      errors: () => ({}), now: 1,
    };
    const rand = seq(11); const count: Record<string, number> = {};
    for (let k = 0; k < 600; k++) { const c = nextWave(content, run({ waveIndex: 20 }), rand, learner).wave.concept; count[c] = (count[c] ?? 0) + 1; }
    expect(count[second]).toBeGreaterThan(count[first] * 2);
  });
  test('a recurring mistake brings its training wave back in a later session, with its kind', () => {
    const kind = content.drills.find((d) => d.waves.length > 0)!.errorKind;
    const learner: Learner = { belief: () => undefined, errors: () => ({ [kind]: 3 }) };
    const rand = seq(5); let drills = 0;
    for (let k = 0; k < 400; k++) { const r = nextWave(content, run(), rand, learner); if (r.isDrill) { drills++; expect(r.drillKind).toBe(kind); } }
    expect(drills).toBeGreaterThan(60); expect(drills).toBeLessThan(200);
  });
  test('a single slip does not trigger training; neither does the very start of a run', () => {
    const kind = content.drills[0].errorKind;
    const rand = seq(9);
    for (let k = 0; k < 200; k++) expect(nextWave(content, run(), rand, { belief: () => undefined, errors: () => ({ [kind]: 1 }) }).isDrill).toBe(false);
    for (let k = 0; k < 200; k++) expect(nextWave(content, run({ waveIndex: 0 }), rand, { belief: () => undefined, errors: () => ({ [kind]: 5 }) }).isDrill).toBe(false);
  });
  test('the mistake just made still comes first', () => {
    const kind = content.drills.find((d) => d.waves.length > 0)!.errorKind;
    const r = nextWave(content, run({ focus: kind }), seq(), { belief: () => undefined, errors: () => ({}) });
    expect(r.isDrill).toBe(true); expect(r.drillKind).toBe(kind);
  });
});
