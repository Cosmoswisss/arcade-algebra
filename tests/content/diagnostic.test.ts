import { expect, test } from 'vitest';
import { diagnosticQuestions } from '../../src/content/diagnostic';
import { loadContent } from '../../src/content/load';

test('one item per cabinet 1 to 5, in order: the last lesson of each course', () => {
  const c = loadContent();
  const items = diagnosticQuestions(c.cabinets);
  expect(items.map((q) => q.cabinet)).toEqual(['vector-golf', 'drone', 'hole-in-the-wall', 'factory', 'squash']);
  for (const it of items) {
    const last = c.cabinets[it.cabinet]!.course.at(-1)!;
    if (last.play) expect(it.play).toEqual(last.play); else expect(it.question).toEqual(last.check);
  }
});

test('a cabinet whose last lesson is played gives a wave to play, not a question', () => {
  const c = loadContent();
  const factory = diagnosticQuestions(c.cabinets).find((q) => q.cabinet === 'factory')!;
  expect(c.cabinets.factory!.course.at(-1)!.play).toBeDefined();
  expect(factory.play).toBeDefined();
  expect(factory.question).toBeUndefined();
});

test('missing cabinets are skipped', () => {
  const c = loadContent();
  expect(diagnosticQuestions({ squash: c.cabinets.squash }).map((q) => q.cabinet)).toEqual(['squash']);
});
