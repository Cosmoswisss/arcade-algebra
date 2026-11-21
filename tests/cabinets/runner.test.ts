import { describe, expect, test } from 'vitest';
import { clampDt, Runner } from '../../src/arcade/kit/runner';
import type { CabinetGame, WaveOutcome } from '../../src/arcade/kit/runner';
import { loadContent } from '../../src/content/load';
import type { Rule } from '../../src/engine/types';

const content = loadContent().cabinets['hole-in-the-wall']!;

function fakeGame(answer: () => boolean, kind = 'swapped-columns') {
  const log: { started: string[]; rules: Rule[] } = { started: [], rules: [] };
  let locked = false;
  const game: CabinetGame = {
    setup() {}, destroy() {},
    startWave(w, r) { log.started.push(w.id); log.rules.push(r); locked = false; },
    update() {}, isLocked: () => locked, lock() { locked = true; },
    evaluate: () => (answer() ? { correct: true, diagnosis: null } : { correct: false, diagnosis: { kind, text: 'x', wrongParts: [true, false] } }),
    goalText: () => 'goal', checklist: () => [], replay: () => 'caption',
  };
  return { game, log };
}

function make(answer: () => boolean, opts: { newDex?: (o: WaveOutcome) => string | null } = {}) {
  const { game, log } = fakeGame(answer);
  const results: WaveOutcome[] = [];
  let s = 1;
  const r = new Runner(content, game, {
    mode: 'guided', rand: () => ((s = (s * 16807) % 2147483647) / 2147483647),
    onWaveResult: (o) => { results.push(o); return { newDex: opts.newDex ? opts.newDex(o) : null }; },
  });
  r.start();
  return { r, log, results };
}
const wait = (r: Runner, ms: number) => { for (let k = 0; k < ms / 50; k++) r.tick(50); };
const play = (r: Runner) => { wait(r, 500); r.click(); };       // close the brief
const finishWave = (r: Runner) => { for (let k = 0; k < 2000 && r.phase === 'play'; k++) r.tick(50); };
const toNext = (r: Runner) => { for (let k = 0; k < 200 && r.phase === 'result'; k++) r.tick(50); r.click(); };

describe('runner', () => {
  test('clampDt caps a background-tab frame', () => { expect(clampDt(5000)).toBe(0.05); expect(clampDt(16)).toBeCloseTo(0.016); });
  test('the brief waits for a click, even after 60s', () => {
    const { r } = make(() => true);
    for (let k = 0; k < 1200; k++) r.tick(50);
    expect(r.phase).toBe('brief');
    expect(r.goal).toBe('goal');
  });
  test('a miss costs a life, sets the focus and the next wave is a drill', () => {
    const { r, log } = make(() => false);
    play(r); finishWave(r);
    expect(r.phase).toBe('result'); expect(r.run.lives).toBe(2); expect(r.run.focus).toBe('swapped-columns');
    toNext(r);
    expect(r.phase).toBe('brief'); expect(r.isDrill).toBe(true);
    expect(log.started[1].startsWith('drill-swapped-columns')).toBe(true);
    expect(r.banner).toContain('TRAINING');
  });
  test('the replay does not end on its own', () => {
    const { r } = make(() => true);
    play(r); finishWave(r);
    for (let k = 0; k < 400; k++) r.tick(50);
    expect(r.phase).toBe('replay'); expect(r.replayK).toBe(1); expect(r.caption).toBe('caption');
  });
  test('a new Dex concept goes through the card phase', () => {
    const { r } = make(() => true, { newDex: (o) => o.concept });
    play(r); finishWave(r); toNext(r);
    expect(r.phase).toBe('card'); expect(r.card).toBeTruthy();
    wait(r, 600); r.click();
    expect(r.phase).toBe('brief');
  });
  test('locking in early ends the wave sooner and earns a bonus', () => {
    const { r } = make(() => true);
    play(r); r.tick(50); r.lock();
    let n = 0; while (r.phase === 'play' && n < 2000) { r.tick(50); n++; }
    expect(n).toBeLessThan(80);
    expect(r.run.score).toBeGreaterThan(100);
  });
  test('three misses end the run', () => {
    const { r } = make(() => false);
    for (let w = 0; w < 3; w++) { play(r); finishWave(r); toNext(r); }
    expect(r.phase).toBe('over');
  });
  test('rules follow the tiers, then boss waves, and beating the boss finishes the cabinet', () => {
    const { r, log, results } = make(() => true);
    for (let w = 0; w < 12 && r.phase !== 'done'; w++) { play(r); finishWave(r); toNext(r); }
    expect(log.rules.slice(0, 10)).toEqual(['assist', 'assist', 'assist', 'partial', 'partial', 'partial', 'abstract', 'abstract', 'abstract', 'abstract']);
    expect(r.phase).toBe('done');
    expect(results.filter((o) => o.boss)).toHaveLength(2);
    expect(results.filter((o) => o.boss).every((o) => o.rule === 'abstract')).toBe(true);
  });
  test('a new tier shows its banner', () => {
    const { r } = make(() => true);
    for (let w = 0; w < 3; w++) { play(r); finishWave(r); toNext(r); }
    expect(r.banner).toContain('NEW RULE');
  });
});

describe('review fixes', () => {
  test('a drill wave during the boss stage does not count as a boss win', () => {
    let calls = 0;
    const { r, results } = make(() => { calls++; return calls !== 11; }); // first boss wave missed → drill
    for (let w = 0; w < 16 && r.phase !== 'done' && r.phase !== 'over'; w++) { play(r); finishWave(r); toNext(r); }
    const drillDuringBoss = results.filter((o) => o.boss && !o.correct);
    expect(drillDuringBoss.length).toBe(1);
    expect(results.filter((o) => o.cleared)).toHaveLength(1);
    expect(results.find((o) => o.cleared)).toBe(results[results.length - 1]);
  });
  test('answering with an in-game button (game locks itself) still earns the early bonus', () => {
    const { game } = fakeGame(() => true);
    const r = new Runner(content, game, { mode: 'guided', onWaveResult: () => ({ newDex: null }) });
    r.start(); wait(r, 500); r.click(); r.tick(50);
    game.lock(); r.tick(50);
    expect(r.lockBonus).toBeGreaterThan(90);
    expect(r.locked).toBe(true);
  });
});
