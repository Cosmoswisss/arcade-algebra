import { expect, test } from 'vitest';
import { diagnosticQuestions } from '../../src/content/diagnostic';
import { loadContent } from '../../src/content/load';

test('one question per cabinet 1 to 5 whose last lesson is a question, in order (play lessons join in Task 6)', () => {
  const c = loadContent();
  const qs = diagnosticQuestions(c.cabinets);
  expect(qs.map((q) => q.cabinet)).toEqual(['vector-golf', 'drone', 'hole-in-the-wall', 'squash']);
  for (const q of qs) { const course = c.cabinets[q.cabinet]!.course; expect(q.question).toEqual(course[course.length - 1].check); }
});
test('missing cabinets are skipped', () => {
  const c = loadContent();
  expect(diagnosticQuestions({ squash: c.cabinets.squash }).map((q) => q.cabinet)).toEqual(['squash']);
});
