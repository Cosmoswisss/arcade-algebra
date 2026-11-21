import { describe, expect, test } from 'vitest';
import { lessonPlan, nextHintStep, reminderFor, startTier, topError, warmUpPick } from '../../src/engine/adapt';
import { defaultProgress, placeFromDiagnostic } from '../../src/engine/progression';
import type { ProgressV2 } from '../../src/engine/progression';
import { loadContent } from '../../src/content/load';

const { cabinets } = loadContent();
const golf = cabinets['vector-golf']!;
const withErrors = (errors: Record<string, number>): ProgressV2 => ({ ...defaultProgress(), errors });

describe('hint ladder', () => {
  test('each failure climbs one rung, then stays on the drill', () => {
    expect([1, 2, 3, 4, 5].map(nextHintStep)).toEqual(['named', 'hint', 'replay-then-drill', 'drill', 'drill']);
  });
});

describe('error memory', () => {
  test('topError is the most frequent mistake, ties broken alphabetically', () => {
    const p = withErrors({ 'swapped-xy': 3, 'sign-x': 3, scale: 1 });
    expect(topError(p)).toBe('sign-x');
    expect(topError(p, ['scale'])).toBe('scale');
    expect(topError(defaultProgress())).toBeNull();
  });
  test('the reminder only names a mistake this cabinet trains', () => {
    expect(reminderFor(withErrors({ 'swapped-xy': 2 }), golf)).toBe('swapped-xy');
    expect(reminderFor(withErrors({ 'composition-order': 4 }), golf)).toBeNull();
    expect(reminderFor(defaultProgress(), golf)).toBeNull();
  });
});

describe('warm-up', () => {
  test('nothing before the first cabinet', () => expect(warmUpPick(defaultProgress(), 'vector-golf', cabinets)).toBeNull());
  test('otherwise the weakest earlier open cabinet, with its last play lesson', () => {
    const w = warmUpPick(defaultProgress(), 'drone', cabinets);
    const lastPlay = golf.course.filter((s) => s.play).at(-1)!.play!.wave;
    expect(w).toEqual({ cabinet: 'vector-golf', wave: lastPlay });
  });
  test('a frequent mistake picks a drill wave for it', () => {
    const w = warmUpPick(withErrors({ 'swapped-xy': 2 }), 'drone', cabinets);
    const drill = golf.drills.find((d) => d.errorKind === 'swapped-xy')!;
    expect(w?.cabinet).toBe('vector-golf');
    expect(drill.waves.map((x) => x.id)).toContain(w?.wave.id);
  });
  test('locked earlier cabinets are never used', () => {
    // with everything locked after golf, the factory warm-up can only come from golf (open from the start)
    const w = warmUpPick(defaultProgress(), 'factory', cabinets);
    expect(w?.cabinet).toBe('vector-golf');
  });
});

describe('placement', () => {
  test('a placed cabinet keeps only its last lesson and starts one tier up', () => {
    const p = placeFromDiagnostic(defaultProgress(), ['vector-golf']);
    expect(lessonPlan(defaultProgress(), 'vector-golf', golf)).toEqual({ steps: [0, 1, 2], skipped: 0 });
    expect(lessonPlan(p, 'vector-golf', golf)).toEqual({ steps: [2], skipped: 2 });
    expect(startTier(p, 'vector-golf')).toBe(1);
    expect(startTier(p, 'drone')).toBe(0);
  });
});
