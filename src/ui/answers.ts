import { checkAnswer as checkRaw } from '../content/checkAnswer';
import type { Question } from '../content/types';
import type { Mat2, Vec2 } from '../engine/types';

/** What the question panel hands back: the kind of input and its value. */
export type Answer =
  | { kind: 'point'; value: Vec2 }
  | { kind: 'basis'; value: Mat2 }
  | { kind: 'number'; value: number }
  | { kind: 'choice'; value: number };

/** A named mistake: `kind` picks the remedial lesson, `text` is shown to the player. */
export interface Mistake { kind: string; text: string }

/** Judges a lesson answer with the engine's checker and names the mistake, if any. */
export function checkAnswer(q: Question, a: Answer): { correct: boolean; diagnosis: Mistake | null } {
  if (q.kind !== a.kind) return { correct: false, diagnosis: { kind: 'other', text: 'Not this one. Read the question again and look at the coordinates.' } };
  const r = checkRaw(q, a.value);
  return r.correct ? { correct: true, diagnosis: null } : { correct: false, diagnosis: { kind: r.kind ?? 'other', text: r.text } };
}
