import { SKILLS } from './types';
import type { SkillId } from './types';

export const initialMastery = (): Record<SkillId, number> =>
  Object.fromEntries(SKILLS.map((s) => [s, 0.2])) as Record<SkillId, number>;

const SLIP = 0.1;
const LEARN = 0.15;

/** Simplified Bayesian Knowledge Tracing. A success that needed hints counts as weaker evidence. */
export function updateMastery(p: number, correct: boolean, hintsUsed: number): number {
  const guess = Math.min(0.2 + 0.15 * hintsUsed, 0.6);
  const posterior = correct
    ? (p * (1 - SLIP)) / (p * (1 - SLIP) + (1 - p) * guess)
    : (p * SLIP) / (p * SLIP + (1 - p) * (1 - guess));
  const next = posterior + (1 - posterior) * LEARN;
  return Number.isFinite(next) ? Math.min(1, Math.max(0, next)) : p;
}
