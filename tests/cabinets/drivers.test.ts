import { describe, expect, test } from 'vitest';
import { ChallengeDriver, DemoDriver } from '../../src/arcade/kit/drivers';
import type { CabinetGame } from '../../src/arcade/kit/runner';
import type { Wave } from '../../src/content/types';

const wave: Wave = { id: 'w', concept: 'stretch', params: { matrix: [[2, 0], [0, 1]] } };

function fake(correct = true) {
  const log = { started: 0, replays: [] as number[], updates: [] as number[], evaluated: 0 };
  let locked = false;
  const game: CabinetGame = {
    setup() {}, destroy() {},
    startWave() { log.started++; locked = false; },
    update(_dt, t) { log.updates.push(t); },
    isLocked: () => locked, lock() { locked = true; },
    evaluate() { log.evaluated++; return correct ? { correct: true, diagnosis: null } : { correct: false, diagnosis: { kind: 'swapped-columns', text: 'x', wrongParts: [true, true] } }; },
    goalText: () => 'goal', checklist: () => [],
    replay(k) { log.replays.push(k); return `caption ${k.toFixed(2)}`; },
  };
  return { game, log };
}
const run = (d: { tick(ms: number): void }, ms: number) => { for (let k = 0; k < ms / 50; k++) d.tick(50); };

describe('DemoDriver', () => {
  test('starts the wave once, replays with a growing k, loops after 5 s, and restarts on demand', () => {
    const { game, log } = fake();
    const d = new DemoDriver(game, wave, 'assist');
    expect(log.started).toBe(1);
    run(d, 2000);
    expect(d.k).toBeGreaterThan(0.3);
    expect(log.replays.every((k, i) => i === 0 || k >= log.replays[i - 1])).toBe(true);
    expect(d.caption).toMatch(/^caption/);
    run(d, 4600);
    expect(d.k).toBeLessThan(0.5); // looped (a short pause at k = 1 is allowed)
    run(d, 1000);
    d.restart();
    expect(d.k).toBe(0);
    expect(log.started).toBe(1);
  });
});

describe('ChallengeDriver', () => {
  test('no clock: nothing is judged until the player locks, even after 60 s', () => {
    const { game, log } = fake();
    const done: boolean[] = [];
    const d = new ChallengeDriver(game, wave, 'assist', (r) => done.push(r.correct));
    run(d, 60_000);
    expect(log.evaluated).toBe(0);
    expect(d.phase).toBe('play');
    expect(log.updates.every((t) => t === 0.12)).toBe(true);
  });
  test('after lock, the impact plays in 0.6 s and the result is reported once', () => {
    const { game, log } = fake(false);
    const done: { correct: boolean; kind?: string }[] = [];
    const d = new ChallengeDriver(game, wave, 'assist', (r) => done.push({ correct: r.correct, kind: r.diagnosis?.kind }));
    run(d, 500); d.lock();
    run(d, 400);
    expect(done).toEqual([]);
    run(d, 300);
    expect(done).toEqual([{ correct: false, kind: 'swapped-columns' }]);
    run(d, 5000);
    expect(log.evaluated).toBe(1);
    expect(d.phase).toBe('done');
  });
  test('showReplay plays the right answer, then ends', () => {
    const { game, log } = fake(false);
    const d = new ChallengeDriver(game, wave, 'assist', () => {});
    d.lock(); run(d, 700);
    d.showReplay();
    expect(d.phase).toBe('replay');
    run(d, 5200);
    expect(log.replays.at(-1)).toBe(1);
    expect(d.phase).toBe('done');
  });
});
