import { SKILLS } from './types';
import type { Level, Progress, SkillId } from './types';

export const ACQUIRED = 0.6;

/** Every skill requires all the skills before it in SKILLS. */
export const PREREQS = Object.fromEntries(
  SKILLS.map((s, k) => [s, SKILLS.slice(0, k)]),
) as Record<SkillId, SkillId[]>;

export function recommend(levels: Level[], progress: Progress): Level | undefined {
  const todo = levels.filter((l) => !progress.completed.includes(l.id));
  if (progress.lastError) {
    const targeted = todo.find((l) => l.targetsError === progress.lastError);
    if (targeted) return targeted;
  }
  const eligible = SKILLS.filter(
    (s) => PREREQS[s].every((p) => progress.mastery[p] >= ACQUIRED) && todo.some((l) => l.skill === s),
  );
  if (eligible.length > 0) {
    const weakest = eligible.reduce((a, b) => (progress.mastery[b] < progress.mastery[a] ? b : a));
    return todo.find((l) => l.skill === weakest);
  }
  return todo[0];
}
