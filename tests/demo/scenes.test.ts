import { describe, expect, test } from 'vitest';
import { loadContent } from '../../src/content/load';
import { DEMO_SCENES } from '../../src/demo/scenes';
import { demoStorage, seeded } from '../../src/demo/demo';
import { cabinetState, loadProgressV2, PROGRESS_KEY, pendingCelebration, recommendedCabinet, saveProgressV2 } from '../../src/engine/progression';

const { cabinets } = loadContent();
const conceptsOf = (id: keyof typeof cabinets) => cabinets[id]?.dex.map((d) => d.concept);
const scene = (key: string) => DEMO_SCENES.find((s) => s.key === key)!;
class Mem { d = new Map<string, string>(); getItem(k: string) { return this.d.get(k) ?? null; } setItem(k: string, v: string) { this.d.set(k, v); } removeItem(k: string) { this.d.delete(k); } }

describe('demo scenes', () => {
  test('five scenes, keyed 1 to 5, each with a target screen', () => {
    expect(DEMO_SCENES.map((s) => s.key)).toEqual(['1', '2', '3', '4', '5']);
    for (const s of DEMO_SCENES) expect(s.hash).toMatch(/^#\//);
  });
  test('1: a brand-new player, no profile', () => {
    expect(scene('1').build(conceptsOf).profile).toBeNull();
  });
  test('2: Vector Golf and the Drone cleared, Constellation is next', () => {
    const p = scene('2').build(conceptsOf);
    expect(p.profile).toEqual({ mode: 'guided', theme: 'sport' });
    expect(p.finished).toEqual(['vector-golf', 'drone']);
    expect(cabinetState(p, 'hole-in-the-wall')).not.toBe('locked');
    expect(recommendedCabinet(p)).toBe('hole-in-the-wall');
    expect(pendingCelebration(p)).toBeNull();
  });
  test('3: the Constellation game starts at the numbers-only rule', () => {
    const s = scene('3');
    expect(s.startTier).toBe(2);
    expect(s.hash).toBe('#/play/hole-in-the-wall');
  });
  test('4: Constellation just cleared, the map has not celebrated it yet', () => {
    const p = scene('4').build(conceptsOf);
    expect(p.finished).toContain('hole-in-the-wall');
    expect(pendingCelebration(p)).toBe('hole-in-the-wall');
  });
  test('5: a recurring mistake to show on My knowledge', () => {
    const p = scene('5').build(conceptsOf);
    expect(p.errors['swapped-columns']).toBeGreaterThan(0);
    expect(Object.keys(p.beliefs).length).toBeGreaterThan(0);
  });
  test('every scene survives a save and a reload', () => {
    for (const s of DEMO_SCENES) {
      const m = new Mem() as unknown as Storage;
      const p = s.build(conceptsOf);
      saveProgressV2(p, m);
      expect(loadProgressV2(m).finished).toEqual(p.finished);
    }
  });
});

describe('demo plumbing', () => {
  test('the demo saves under its own key and never touches the real save', () => {
    const real = new Mem();
    real.setItem(PROGRESS_KEY, '{"xp":999}');
    const s = demoStorage(real as unknown as Storage)!;
    s.setItem(PROGRESS_KEY, '{"xp":5}');
    expect(real.getItem(PROGRESS_KEY)).toBe('{"xp":999}');
    expect(s.getItem(PROGRESS_KEY)).toBe('{"xp":5}');
    s.removeItem(PROGRESS_KEY);
    expect(real.getItem(PROGRESS_KEY)).toBe('{"xp":999}');
  });
  test('seeded randomness repeats exactly, so a rehearsal and the live run match', () => {
    const a = seeded('hole-in-the-wall'), b = seeded('hole-in-the-wall');
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(seeded('squash')()).not.toBe(xs[0]);
  });
});
