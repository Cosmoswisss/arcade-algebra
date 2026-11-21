import { CABINETS } from '../engine/types';
import type { CabinetId } from '../engine/types';
import type { CabinetContent, Question } from './types';

export const DIAGNOSED: CabinetId[] = CABINETS.slice(0, 5);

/** The placement test: the last course question of cabinets 1–5 (the ones a beginner might already know). */
export function diagnosticQuestions(cabinets: Partial<Record<CabinetId, CabinetContent>>): { cabinet: CabinetId; question: Question }[] {
  return DIAGNOSED.flatMap((id) => {
    const last = cabinets[id]?.course.at(-1);
    return last?.check ? [{ cabinet: id, question: last.check }] : [];
  });
}
