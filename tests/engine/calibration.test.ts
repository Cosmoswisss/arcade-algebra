import { describe, expect, test } from 'vitest';
import { addEvidence, cabinetEstimate, DECAY, mean, observe, PROOF_WINS, priorBelief } from '../../src/engine/belief';
import { MASTERED, applyTransfer, applyWaveResult, defaultProgress, TRANSFER_WEIGHT } from '../../src/engine/progression';
import type { WaveResult } from '../../src/engine/progression';
import { GATE, MAX_HOLD, nextWave, planWave, tierStart } from '../../src/engine/waves';
import type { Learner, RunState } from '../../src/engine/waves';
import { loadContent } from '../../src/content/load';
import { weakSpots } from '../../src/ui/LearnerReport';
import { Runner, START_LIVES } from '../../src/arcade/kit/runner';
import type { CabinetGame } from '../../src/arcade/kit/runner';

const real = loadContent().cabinets['hole-in-the-wall']!;
// the run logic is calibrated on the long plan (tiers 3/3/4, boss 2): the bundled games are now short runs (1/1/1, boss 1)
const LONG = [{ guided: 3, fast: 2 }, { guided: 3, fast: 2 }, { guided: 4, fast: 3 }];
const content = { ...real, meta: { ...real.meta, tiers: real.meta.tiers.map((t, k) => ({ ...t, waves: LONG[k] })), boss: { waves: 2 } } };
const meta = content.meta;
const concepts = content.dex.map((d) => d.concept);
const win = (concept: string, rule: WaveResult['rule'] = 'abstract'): WaveResult => ({ correct: true, rule, firstTry: true, concept, boss: false });
const run = (over: Partial<RunState> = {}): RunState => ({ mode: 'guided', waveIndex: -1, tierIndex: 0, focus: null, lastWaveId: null, lives: 3, score: 0, combo: 0, hold: 0, ...over });
const seq = (seed = 1) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

describe('recalibrated mastery', () => {
  test('old evidence fades: early misses stop weighing forever', () => {
    let early = priorBelief();
    for (let k = 0; k < 3; k++) early = observe(early, false, 'abstract', 1);
    let b = early;
    for (let k = 0; k < 12; k++) b = observe(b, true, 'abstract', 1);
    expect(DECAY).toBeLessThan(1);
    expect(mean(b)).toBeGreaterThan(0.7);
  });
  test('the prior is light: one answer moves the estimate clearly', () => {
    expect(mean(observe(priorBelief(), true, 'abstract', 1))).toBeGreaterThan(0.5);
  });
  test('a transfer answer counts more than a game answer', () => {
    expect(TRANSFER_WEIGHT).toBeGreaterThan(1);
    expect(mean(observe(priorBelief(), true, 'abstract', 1, TRANSFER_WEIGHT))).toBeGreaterThan(mean(observe(priorBelief(), true, 'abstract', 1)));
  });
  test('one lucky unaided win is not proof of mastery; two are', () => {
    const one = { 'drone:a': observe(priorBelief(), true, 'abstract', 1) };
    expect(cabinetEstimate(one, 'drone', ['a']).proof).toBe(false);
    expect(PROOF_WINS).toBe(2);
    const two = { 'drone:a': observe(observe(priorBelief(), true, 'abstract', 1), true, 'abstract', 2) };
    expect(cabinetEstimate(two, 'drone', ['a']).proof).toBe(true);
  });
  test('lesson evidence counts for less than the transfer check', () => {
    const base = { 'drone:a': observe(priorBelief(), true, 'abstract', 1) };
    const lowCourse = cabinetEstimate({ ...base, 'drone:@course': addEvidence(priorBelief(), 0, 4, 1) }, 'drone', ['a']).mean;
    const lowTransfer = cabinetEstimate({ ...base, 'drone:@transfer': addEvidence(priorBelief(), 0, 4, 1) }, 'drone', ['a']).mean;
    expect(lowTransfer).toBeLessThan(lowCourse);
  });
  test('a student who really wins everything unaided reaches mastered on a cabinet', () => {
    let p = defaultProgress();
    for (let round = 0; round < 3; round++) for (const c of concepts) p = applyWaveResult(p, 'hole-in-the-wall', win(c), concepts).next;
    expect(p.mastery['hole-in-the-wall']).toBeGreaterThanOrEqual(MASTERED);
  });
  test('a transfer check of 3 right answers lifts the estimate clearly', () => {
    const p = applyWaveResult(defaultProgress(), 'drone', win('a'), ['a']).next;
    const { attempt } = applyTransfer(p, [{ cabinet: 'drone', outcomes: [{ correct: true }, { correct: true }, { correct: true }] }], () => ['a']);
    expect(attempt.results[0].after - attempt.results[0].before).toBeGreaterThan(0.1);
  });
});

describe('tiers follow knowledge', () => {
  const strong: Learner = { belief: () => ({ a: 4, b: 1, abs: 2, last: 1 }), errors: () => ({}), now: 1 };
  const weak: Learner = { belief: () => ({ a: 0.4, b: 5, abs: 0, last: 1 }), errors: () => ({}), now: 1 };
  /** Plays the plan only (no answers) and returns the tier of each wave. */
  const tiers = (learner?: Learner, waves = 16) => {
    let s = run(); const out: { tier: number; boss: boolean }[] = [];
    for (let k = 0; k < waves; k++) { const p = planWave(content, s, learner); out.push({ tier: p.tierIndex, boss: p.boss }); s = { ...s, waveIndex: p.waveIndex, tierIndex: p.tierIndex, hold: p.hold }; }
    return out;
  };
  const planned = meta.tiers.reduce((n, t) => n + t.waves.guided, 0);
  test('without a learner the plan is the plain one', () => {
    const plain = tiers(undefined);
    expect(plain.slice(0, meta.tiers[0].waves.guided).every((w) => w.tier === 0)).toBe(true);
    expect(plain[meta.tiers[0].waves.guided].tier).toBe(1);
    expect(plain.findIndex((w) => w.boss)).toBe(planned);
  });
  test('a learner who knows the concepts moves up on schedule', () => {
    expect(tiers(strong).map((w) => w.tier)).toEqual(tiers(undefined).map((w) => w.tier));
  });
  test('a learner who does not is held back, a few waves at most', () => {
    const held = tiers(weak, 24); const plain = tiers(undefined, 24);
    expect(held.findIndex((w) => w.boss)).toBeGreaterThan(plain.findIndex((w) => w.boss));
    expect(held.findIndex((w) => w.boss)).toBeLessThanOrEqual(plain.findIndex((w) => w.boss) + MAX_HOLD);
  });
  test('the hold never exceeds MAX_HOLD, and the gates are ordered', () => {
    let s = run({ hold: MAX_HOLD });
    for (let k = 0; k < 12; k++) { const p = planWave(content, s, weak); s = { ...s, waveIndex: p.waveIndex, tierIndex: p.tierIndex, hold: p.hold }; expect(p.hold).toBe(MAX_HOLD); }
    expect(GATE[0]).toBeLessThanOrEqual(GATE[1]); expect(GATE[1]).toBeLessThanOrEqual(GATE[2]);
  });
  test('tierStart gives the first wave of a tier', () => {
    expect(tierStart(meta, 'guided', 0)).toBe(0);
    expect(tierStart(meta, 'guided', 1)).toBe(meta.tiers[0].waves.guided);
    expect(tierStart(meta, 'guided', 2)).toBe(meta.tiers[0].waves.guided + meta.tiers[1].waves.guided);
  });
});

describe('training waves', () => {
  test("'other' is never a recurring mistake: no recurring drill, nothing in the report", () => {
    const learner: Learner = { belief: () => undefined, errors: () => ({ other: 5 }) };
    const r = seq(2);
    for (let k = 0; k < 200; k++) expect(nextWave(content, run({ waveIndex: 6 }), r, learner).isDrill).toBe(false);
    const p = { ...defaultProgress(), mistakes: { 'drone:other': 4, 'drone:wrong-span': 2 } };
    expect(weakSpots(p).map((w) => w.kind)).toEqual(['wrong-span']);
  });
});

describe('after a lost run', () => {
  function player(answer: () => boolean) {
    let locked = false;
    const game: CabinetGame = {
      setup() {}, destroy() {}, startWave() { locked = false; }, update() {}, isLocked: () => locked, lock() { locked = true; },
      evaluate: () => (answer() ? { correct: true, diagnosis: null } : { correct: false, diagnosis: { kind: 'sign-flip', text: 'x', wrongParts: [true, false] } }),
      goalText: () => '', checklist: () => [], replay: () => '',
    };
    const r = new Runner(content, game, { mode: 'guided', rand: seq(4), onWaveResult: () => ({ newDex: null }) });
    r.start();
    return r;
  }
  const advance = (r: Runner) => {
    for (let k = 0; k < 10; k++) r.tick(50);
    r.click();
    r.lock(); // the first wave is untimed: it waits for LOCK IN
    for (let k = 0; k < 2000 && r.phase === 'play'; k++) r.tick(50);
    for (let k = 0; k < 400 && r.phase === 'result'; k++) r.tick(50);
    r.click();
  };

  test('the mistake that cost the last life is still the one to train on the next run', () => {
    const r = player(() => false);
    for (let k = 0; k < START_LIVES; k++) advance(r);
    expect(r.phase).toBe('over');
    expect(r.run.focus).toBe('sign-flip');
    r.start();
    expect(r.run.focus).toBe('sign-flip');
  });

  test('a run lost in the first tier restarts from the start', () => {
    const r = player(() => false);
    for (let k = 0; k < START_LIVES; k++) advance(r);
    r.start();
    expect(r.run.waveIndex).toBe(0);
  });

  test('a run lost in a later tier restarts one tier below, not from the aids', () => {
    let wins = tierStart(meta, 'guided', 2) + 1;  // win until the third tier has started, then miss everything
    const r = player(() => (wins-- > 0));
    for (let k = 0; k < 40 && r.phase !== 'over'; k++) advance(r);
    expect(r.phase).toBe('over');
    r.start();
    expect(r.run.waveIndex).toBe(tierStart(meta, 'guided', 1));
    expect(r.run.lives).toBe(START_LIVES);
  });
});
