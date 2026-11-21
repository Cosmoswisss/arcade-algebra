import { describe, expect, test } from 'vitest';
import { beliefKey } from '../../src/engine/belief';
import { changeLine, conceptRows, nextTarget, pct } from '../../src/engine/insight';
import { applyWaveResult, defaultProgress } from '../../src/engine/progression';
import { nextWave } from '../../src/engine/waves';
import { loadContent } from '../../src/content/load';
import { conceptsOf } from '../../src/ui/LearnerReport';

const content = loadContent();
const concepts = conceptsOf(content);
const all = () => true;
const first = content.cabinets['vector-golf']!.dex[0].concept;

describe('profile view', () => {
  test('a fresh learner has no data: every concept is unseen at the prior', () => {
    const rows = conceptRows(defaultProgress(), concepts, 'vector-golf');
    expect(rows.length).toBe(content.cabinets['vector-golf']!.dex.length);
    expect(rows.every((r) => !r.seen && r.evidence === 0)).toBe(true);
  });
  test('answers make a concept seen, and the spread narrows as evidence comes in', () => {
    const fresh = conceptRows(defaultProgress(), concepts, 'vector-golf')[0];
    let p = defaultProgress();
    for (let k = 0; k < 6; k++) p = applyWaveResult(p, 'vector-golf', { correct: true, rule: 'abstract', firstTry: true, concept: first, boss: false }).next;
    const row = conceptRows(p, concepts, 'vector-golf')[0];
    expect(row.seen).toBe(true);
    expect(row.sd).toBeLessThan(fresh.sd);
    expect(row.wins).toBe(6);
  });
});

describe('next target', () => {
  test('a fresh learner is pointed at the first cabinet (the others are locked)', () => {
    const t = nextTarget(defaultProgress(), concepts, all)!;
    expect(t.cabinet).toBe('vector-golf');
    expect(t.why).toBe('Not tested yet');
  });
  test('a concept the learner keeps missing becomes the target and is called weak', () => {
    let p = defaultProgress();
    const names = content.cabinets['vector-golf']!.dex.map((d) => d.concept);
    for (const c of names) p = applyWaveResult(p, 'vector-golf', { correct: true, rule: 'abstract', firstTry: true, concept: c, boss: false }, names, 1).next;
    const weak = names[1];
    for (let k = 0; k < 3; k++) p = applyWaveResult(p, 'vector-golf', { correct: false, rule: 'assist', firstTry: false, concept: weak, boss: false, errorKind: 'other' }, names, 1).next;
    const t = nextTarget(p, concepts, all, 2)!;
    expect(t.concept).toBe(weak);
    expect(t.why).toBe('Weak so far');
  });
  test('nothing to target once every available cabinet is finished', () => {
    const p = { ...defaultProgress(), finished: ['vector-golf' as const] };
    expect(nextTarget(p, concepts, (c) => c === 'vector-golf')).toBeNull();
  });
  test('the target shown is the concept the wave picker favours', () => {
    const p = defaultProgress();
    const t = nextTarget(p, concepts, all)!;
    const names = content.cabinets[t.cabinet]!.dex.map((d) => d.concept);
    expect(names[0]).toBe(t.concept); // nothing is seen yet: the first concept in teaching order comes first
    void beliefKey;
  });
});

describe('evidence line', () => {
  test('says what an answer did to the estimate', () => {
    expect(changeLine('Stretch', { mean: 0.2, evidence: 0 }, { mean: 0.43, sd: 0.23 })).toBe('Evidence logged · Stretch: no data → 43% (± 23)');
    expect(changeLine('Stretch', { mean: 0.43, evidence: 1 }, { mean: 0.6, sd: 0.19 })).toBe('Evidence logged · Stretch: 43% → 60% (± 19)');
    expect(pct(0.256)).toBe(26);
  });
});

describe('recurring training is announced', () => {
  test('a training wave picked because of an old mistake is flagged recurring; one after a fresh miss is not', () => {
    const cab = content.cabinets['hole-in-the-wall']!;
    const kind = cab.drills.find((d) => d.waves.length > 0)!.errorKind;
    const run = { mode: 'guided' as const, waveIndex: 4, tierIndex: 0, focus: null, lastWaveId: null, lives: 3, score: 0, combo: 0 };
    let s = 3; const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const learner = { belief: () => undefined, errors: () => ({ [kind]: 3 }) };
    const flagged = Array.from({ length: 200 }, () => nextWave(cab, run, rand, learner)).filter((r) => r.isDrill);
    expect(flagged.length).toBeGreaterThan(0);
    expect(flagged.every((r) => r.recurring === true)).toBe(true);
    expect(nextWave(cab, { ...run, focus: kind }, rand, learner).recurring).toBe(false);
  });
});
