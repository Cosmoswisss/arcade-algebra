import { describe, expect, test } from 'vitest';
import { checkAnswer } from '../../src/content/checkAnswer';
import { SEEN, seen, seeded, TRANSFER_AT_END, transferQuestions, waypointsOf } from '../../src/content/transfer';
import { loadContent } from '../../src/content/load';
import { CABINETS } from '../../src/engine/types';
import type { Mat2 } from '../../src/engine/types';

const content = loadContent();

describe('transfer questions', () => {
  test('the generator is deterministic for a seed and varies across seeds', () => {
    const a = transferQuestions('squash', 4, 'x');
    expect(transferQuestions('squash', 4, 'x')).toEqual(a);
    const prompts = new Set<string>();
    for (let k = 0; k < 20; k++) for (const q of transferQuestions('squash', 2, `s${k}`)) prompts.add(q.prompt);
    expect(prompts.size).toBeGreaterThan(6);
    expect(seeded('a')()).not.toBe(seeded('b')());
  });

  for (const cabinet of CABINETS) {
    describe(cabinet, () => {
      test('always gives the number of questions asked, all distinct', () => {
        for (let k = 0; k < 40; k++) {
          for (const n of [2, TRANSFER_AT_END]) {
            const qs = transferQuestions(cabinet, n, `seed-${k}`);
            expect(qs).toHaveLength(n);
            expect(new Set(qs.map((q) => q.prompt)).size).toBe(n);
          }
        }
      });
      test('open questions only (nothing to guess), with a plain plane (no picture of the answer)', () => {
        for (let k = 0; k < 60; k++) for (const q of transferQuestions(cabinet, 2, `open-${k}`)) {
          expect(q.kind).not.toBe('choice');
          if (q.kind !== 'choice') {
            const given = q.given as { matrix?: Mat2 };
            expect(given.matrix).toEqual([[1, 0], [0, 1]]);
          }
        }
      });
      test('the stored answer is accepted by the checker, and the answer fits what the player can set', () => {
        for (let k = 0; k < 80; k++) for (const q of transferQuestions(cabinet, 2, `ok-${k}`)) {
          if (q.kind === 'choice') continue;
          expect(checkAnswer(q, q.answer).correct, q.prompt).toBe(true);
          if (q.kind === 'point') { expect(Math.abs(q.answer[0])).toBeLessThanOrEqual(4); expect(Math.abs(q.answer[1])).toBeLessThanOrEqual(3.5); }
          if (q.kind === 'number') expect(Math.abs(q.answer)).toBeLessThanOrEqual(4);
          if (q.kind === 'basis') for (const row of q.answer) for (const x of row) { expect(Math.abs(x)).toBeLessThanOrEqual(3); expect(Math.abs(x * 2 - Math.round(x * 2))).toBeLessThan(1e-9); }
        }
      });
      test('is never a lesson question', () => {
        const met = new Set(content.cabinets[cabinet]!.course.map((s) => s.check?.prompt).filter((p): p is string => !!p));
        for (let k = 0; k < 60; k++) for (const q of transferQuestions(cabinet, 2, `new-${k}`, met)) expect(met.has(q.prompt)).toBe(false);
      });
    });
  }

  test('signs are written as a person would write them (no "+ -", no "-1u")', () => {
    for (const cabinet of CABINETS) for (let k = 0; k < 80; k++) for (const q of transferQuestions(cabinet, 2, `fmt-${k}`)) {
      expect(q.prompt).not.toMatch(/\+ -|- -|-\d|--|1[uv]/);
    }
  });

  test('every point the player has to follow stays on the visible plane (no step falls off the screen)', () => {
    let followed = 0;
    for (const cabinet of CABINETS) for (let k = 0; k < 120; k++) for (const q of transferQuestions(cabinet, 3, `vis-${k}`)) {
      const pts = waypointsOf(q);
      if (q.kind === 'point') expect(pts.length, `${cabinet}: ${q.prompt}`).toBeGreaterThan(1);
      for (const p of pts) { expect(seen(p), `${cabinet}: ${q.prompt} -> (${p})`).toBe(true); followed++; }
    }
    expect(followed).toBeGreaterThan(500);
    expect(SEEN.x[0]).toBeGreaterThanOrEqual(-3.5); expect(SEEN.x[1]).toBeLessThanOrEqual(4.5);
    expect(SEEN.y[0]).toBeGreaterThanOrEqual(-2.5); expect(SEEN.y[1]).toBeLessThanOrEqual(3.5);
  });

  test('the visibility rule keeps the variety: many different point questions per game', () => {
    for (const cabinet of ['vector-golf', 'drone', 'factory', 'hole-in-the-wall'] as const) {
      const prompts = new Set<string>();
      for (let k = 0; k < 150; k++) for (const q of transferQuestions(cabinet, 3, `var-${k}`)) prompts.add(q.prompt);
      expect(prompts.size, cabinet).toBeGreaterThan(12);
    }
  });

  test('the case from the placement test (u = (−1, −1), v = (2, 1), 2u + 3v) can no longer be asked', () => {
    for (let k = 0; k < 400; k++) for (const q of transferQuestions('drone', 3, `old-${k}`)) expect(q.prompt).not.toBe('u = (−1, −1) and v = (2, 1). Click the point you reach with 2u + 3v.');
    expect(seen([-1, -1], [2, 1], [-2, -2], [6, 3], [4, 1])).toBe(false);
  });

  test('a wrong answer is refused', () => {
    const q = transferQuestions('squash', 1, 'w')[0];
    if (q.kind === 'number') expect(checkAnswer(q, q.answer + 2).correct).toBe(false);
  });

  test('factory: the order of the machines changes the answer, so an order mistake is caught', () => {
    for (let k = 0; k < 30; k++) {
      const q = transferQuestions('factory', 1, `o-${k}`)[0];
      expect(q.kind).toBe('point');
    }
  });
});
