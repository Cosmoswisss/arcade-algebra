import { describe, expect, test } from 'vitest';
import { isBossWave, nextWave, tierFor, waveSeconds } from '../../src/engine/waves';
import type { RunState } from '../../src/engine/waves';
import { loadContent } from '../../src/content/load';

const content = loadContent().cabinets['hole-in-the-wall']!;
const meta = content.meta; // tiers guided 3,3,4 ; boss 2
const run = (over: Partial<RunState> = {}): RunState => ({ mode: 'guided', waveIndex: 0, tierIndex: 0, focus: null, lastWaveId: null, lives: 3, score: 0, combo: 0, ...over });
const seq = (seed = 1) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

describe('tiers', () => {
  test('guided tiers {3,3,4}: wave 0→0, 3→1, 6→2, 10→2', () => {
    expect([0, 2, 3, 5, 6, 9, 10].map((w) => tierFor(meta, 'guided', w))).toEqual([0, 0, 1, 1, 2, 2, 2]);
  });
  test('fast mode moves on sooner', () => expect(tierFor(meta, 'fast', 2)).toBe(1));
  test('a start tier counts the skipped tier as already played (tier and boss)', () => {
    expect(tierFor(meta, 'guided', 0, 1)).toBe(1);
    expect(isBossWave(meta, 'guided', 6, 1)).toBe(false);
    expect(isBossWave(meta, 'guided', 7, 1)).toBe(true);
  });
  test('boss waves come right after the last tier', () => {
    expect(isBossWave(meta, 'guided', 9)).toBe(false);
    expect(isBossWave(meta, 'guided', 10)).toBe(true);
    expect(isBossWave(meta, 'guided', 11)).toBe(true);
  });
  test('waveSeconds starts at meta.waveSeconds, decreases, never below 6', () => {
    const s = [0, 1, 2].map((t) => waveSeconds(meta, 'guided', t));
    expect(s[0]).toBe(16);
    expect(s[1]).toBeLessThan(s[0]); expect(s[2]).toBeLessThan(s[1]);
    expect(waveSeconds({ ...meta, waveSeconds: { guided: 6.5, fast: 6 } }, 'guided', 2)).toBe(6);
  });
});

describe('nextWave', () => {
  test('a focus picks a drill wave with its label', () => {
    const r = nextWave(content, run({ focus: 'swapped-columns' }), seq());
    expect(r.isDrill).toBe(true);
    expect(r.drillLabel).toBe('swapped arrows');
    expect(r.wave.id.startsWith('drill-swapped-columns')).toBe(true);
  });
  test('a focus without a drill falls back to the normal pool', () => {
    expect(nextWave(content, run({ focus: 'missed-zero' }), seq()).isDrill).toBe(false);
  });
  test('never the same wave twice in a row (200 draws)', () => {
    const rand = seq(7); let last: string | null = null;
    for (let k = 0; k < 200; k++) {
      const r = nextWave(content, run({ lastWaveId: last, focus: k % 3 === 0 ? 'sign-flip' : null }), rand);
      expect(r.wave.id).not.toBe(last); last = r.wave.id;
    }
  });
});

describe('concept progression', () => {
  test('early waves only use the first concepts of dex.json; a new concept every 2 waves', () => {
    const order = content.dex.map((d) => d.concept);
    for (let w = 0; w < 12; w++) {
      const allowed = order.slice(0, 1 + Math.floor(w / 2));
      for (let k = 0; k < 30; k++) {
        const r = nextWave(content, run({ waveIndex: w }), Math.random);
        expect(allowed, `wave ${w}`).toContain(r.wave.concept);
      }
    }
  });
});
