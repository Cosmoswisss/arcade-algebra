import { CABINETS } from '../engine/types';
import type { CabinetId } from '../engine/types';
import type { CabinetContent, LessonPlay, Question } from './types';

export const DIAGNOSED: CabinetId[] = CABINETS.slice(0, 5);

/** One placement item: the last lesson of a course, as a wave to play (`play`) or a question (`question`). */
export interface DiagnosticItem { cabinet: CabinetId; play?: LessonPlay; question?: Question }

/**
 * The placement test: the last lesson of cabinets 1–5 (the ones a beginner might already know).
 * A played lesson is played (at the abstract rule, by the screen); a question lesson asks its question.
 */
export function diagnosticQuestions(cabinets: Partial<Record<CabinetId, CabinetContent>>): DiagnosticItem[] {
  return DIAGNOSED.flatMap((id): DiagnosticItem[] => {
    const last = cabinets[id]?.course.at(-1);
    if (last?.play) return [{ cabinet: id, play: last.play }];
    if (last?.check) return [{ cabinet: id, question: last.check }];
    return [];
  });
}
