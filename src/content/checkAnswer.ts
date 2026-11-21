import { diagnoseBasis, diagnoseNumber, diagnoseVector } from '../engine/diagnoseKinds';
import type { Mat2, Vec2 } from '../engine/types';
import { isMat2, isNum, isVec2 } from './check';
import type { Question } from './types';

export type Answer = Mat2 | Vec2 | number;

/** Checks a course answer. `kind` is the error kind used to pick the remedial lesson. Never throws. */
export function checkAnswer(q: Question, a: Answer): { correct: boolean; kind: string | null; text: string } {
  const ok = { correct: true, kind: null, text: '' };
  switch (q.kind) {
    case 'basis': {
      if (!isMat2(a)) return { correct: false, kind: 'other', text: 'Place both arrows.' };
      const d = diagnoseBasis(a, q.answer, q.tolerance);
      return d ? { correct: false, kind: d.kind, text: d.text } : ok;
    }
    case 'point': {
      if (!isVec2(a)) return { correct: false, kind: 'other', text: 'Place the point.' };
      const d = diagnoseVector(a, q.answer, q.tolerance);
      return d ? { correct: false, kind: d.kind, text: d.text } : ok;
    }
    case 'number': {
      if (!isNum(a)) return { correct: false, kind: 'other', text: 'Pick a value.' };
      const d = diagnoseNumber(a, q.answer, q.tolerance);
      return d ? { correct: false, kind: d.kind, text: d.text } : ok;
    }
    case 'choice':
      return a === q.answer ? ok : { correct: false, kind: 'other', text: `The answer was: ${q.options[q.answer]}.` };
  }
}
