import { describe, expect, test } from 'vitest';
import { answerPlacement, currentProbe, diagnosticPlan, diagnosticQuestions, MAX_MISSES, PLACEMENT_CABINETS, startPlacement } from '../../src/content/diagnostic';
import type { PlanItem, PlacementState, Probe } from '../../src/content/diagnostic';
import { loadContent } from '../../src/content/load';
import { CABINETS } from '../../src/engine/types';

const c = loadContent();

// ---- the placement items of the lessons (existing behaviour) ----

test('one item per cabinet 1 to 5, in order: the last lesson of each course', () => {
  const items = diagnosticQuestions(c.cabinets);
  expect(items.map((q) => q.cabinet)).toEqual(['vector-golf', 'drone', 'hole-in-the-wall', 'factory', 'squash']);
  for (const it of items) {
    const last = c.cabinets[it.cabinet]!.course.at(-1)!;
    if (last.play) expect(it.play).toEqual(last.play); else expect(it.question).toEqual(last.check);
  }
});

test('a cabinet whose last lesson is played gives a wave to play, not a question', () => {
  const factory = diagnosticQuestions(c.cabinets).find((q) => q.cabinet === 'factory')!;
  expect(c.cabinets.factory!.course.at(-1)!.play).toBeDefined();
  expect(factory.play).toBeDefined();
  expect(factory.question).toBeUndefined();
});

test('missing cabinets are skipped', () => {
  expect(diagnosticQuestions({ squash: c.cabinets.squash }).map((q) => q.cabinet)).toEqual(['squash']);
});

// ---- the adaptive placement (learning method) ----

const plan = diagnosticPlan(c.cabinets, 't');
const questionsOf = (p: PlanItem): Probe[] => [...p.probes, ...(p.spare ? [p.spare] : [])];

/** Plays the test with a function deciding each answer from (cabinet index, question number in the test). */
function play(decide: (cab: number, n: number) => boolean, p: PlanItem[] = plan): PlacementState {
  let s = startPlacement(p); let n = 0;
  while (!s.done && n < 200) { s = answerPlacement(p, s, decide(s.cab, n)); n++; }
  return s;
}

describe('plan', () => {
  test('every cabinet is placed, in order', () => {
    expect(PLACEMENT_CABINETS).toEqual(CABINETS);
    expect(plan.map((p) => p.cabinet)).toEqual(CABINETS);
  });
  test('nothing can be passed by luck: no multiple choice anywhere in the test', () => {
    for (const p of plan) for (const probe of questionsOf(p)) {
      expect(Boolean(probe.play) !== Boolean(probe.question)).toBe(true);
      if (probe.question) expect(probe.question.kind).not.toBe('choice');
    }
  });
  test('two probes and a spare for every cabinet', () => {
    for (const p of plan) { expect(p.probes).toHaveLength(2); expect(p.spare).not.toBeNull(); }
  });
  test('the first probe is the last playable or open lesson of the cabinet when there is one', () => {
    for (const p of plan) {
      const lesson = [...c.cabinets[p.cabinet]!.course].reverse().find((s) => s.play || (s.check && s.check.kind !== 'choice'));
      if (!lesson) continue;
      if (lesson.play) expect(p.probes[0].play).toEqual(lesson.play); else expect(p.probes[0].question).toEqual(lesson.check);
    }
  });
  test('generated questions are new cases, never a lesson question', () => {
    for (const p of plan) {
      const met = c.cabinets[p.cabinet]!.course.map((s) => s.check?.prompt).filter(Boolean);
      for (const probe of questionsOf(p)) if (probe.question && !c.cabinets[p.cabinet]!.course.some((s) => s.check === probe.question)) expect(met).not.toContain(probe.question.prompt);
    }
  });
  test('a different seed gives different generated questions', () => {
    const a = diagnosticPlan(c.cabinets, 'a'), b = diagnosticPlan(c.cabinets, 'b');
    expect(a.map((p) => p.spare?.question?.prompt)).not.toEqual(b.map((p) => p.spare?.question?.prompt));
  });
});

describe('the test flow: a binary search along the chain', () => {
  const [c0, c1, c2, c3, c4, c5, c6] = CABINETS;
  test('all right: three cabinets asked (4th, 6th, 7th), the others inferred', () => {
    const s = play(() => true);
    expect(s.passed).toEqual([c3, c5, c6]);
    expect(s.inferred).toEqual([c0, c1, c2, c4]);
    expect(s.failed).toEqual([]);
    expect(s.asked).toBe(6);
  });
  test('all wrong: three cabinets asked (4th, 2nd, 1st), nothing placed', () => {
    const s = play(() => false);
    expect(s.failed).toEqual([c3, c1, c0]);
    expect(s.passed).toEqual([]); expect(s.inferred).toEqual([]);
    expect(s.asked).toBe(6); // two misses a cabinet: the spare is asked once
  });
  test('one slip is forgiven: the spare is asked, and the cabinet still passes', () => {
    const s = play((cab, n) => n !== 0);
    expect(s.passed).toContain(c3); expect(s.asked).toBe(7);
  });
  test('a cabinet that is passed places the ones before it, a miss leaves the ones after it untested', () => {
    const s = play((cab) => cab <= 3);
    expect(s.passed).toEqual([c3]); expect(s.inferred).toEqual([c0, c1, c2]); expect(s.failed).toEqual([c5, c4]);
    expect([...s.passed, ...s.inferred, ...s.failed]).not.toContain(c6);
  });
  test('the test never asks more than four cabinets (a dozen questions at most)', () => {
    for (let seed = 0; seed < 200; seed++) {
      let x = seed + 1; const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
      const s = play(() => rnd() < 0.6);
      expect(s.passed.length + s.failed.length).toBeLessThanOrEqual(4);
      expect(s.asked).toBeLessThanOrEqual(12);
      expect(s.done).toBe(true);
    }
  });
  test('every cabinet ends in exactly one place, or untested', () => {
    for (let seed = 0; seed < 100; seed++) {
      let x = seed + 7; const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
      const s = play(() => rnd() < 0.5);
      const all = [...s.passed, ...s.inferred, ...s.failed];
      expect(new Set(all).size).toBe(all.length);
    }
  });
  test('answers after the end change nothing', () => {
    const s = play(() => true);
    expect(answerPlacement(plan, s, false)).toEqual(s);
    expect(currentProbe(s)).toBeNull();
  });
  test('a lucky guess alone does not pass a cabinet: it takes two right answers', () => {
    expect(MAX_MISSES).toBe(1);
    const s = play((cab, n) => n === 0);
    expect(s.passed).not.toContain(c3);
  });
  test('a missing plan is done at once', () => expect(startPlacement([]).done).toBe(true));
});
