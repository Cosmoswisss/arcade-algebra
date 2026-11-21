import { beliefKey, cabinetEstimate, evidence, mean, priorBelief, spread } from './belief';
import type { Belief } from './belief';
import { cabinetState } from './progression';
import type { ProgressV2 } from './progression';
import { CABINETS } from './types';
import type { CabinetId } from './types';
import { conceptNeed } from './waves';

/** The part of the loaded content the profile needs: each cabinet's concepts, in teaching order. */
export type Concepts = Partial<Record<CabinetId, { concept: string; name: string }[]>>;

export interface ConceptRow { cabinet: CabinetId; concept: string; name: string; mean: number; sd: number; evidence: number; wins: number; seen: boolean }

export function conceptRows(p: ProgressV2, concepts: Concepts, cabinet: CabinetId): ConceptRow[] {
  return (concepts[cabinet] ?? []).map(({ concept, name }) => {
    const b: Belief | undefined = p.beliefs[beliefKey(cabinet, concept)];
    return { cabinet, concept, name, mean: mean(b ?? priorBelief()), sd: spread(b ?? priorBelief()), evidence: b ? evidence(b) : 0, wins: b?.abs ?? 0, seen: !!b && evidence(b) > 0 };
  });
}

export interface Target extends ConceptRow { why: string }

/**
 * The gap the next lesson is built around: among the cabinets the learner can play, the concept that needs work most
 * (weak, unsure or long unseen). Same measure the wave picker uses, so what is shown is what will be trained.
 */
export function nextTarget(p: ProgressV2, concepts: Concepts, available: (c: CabinetId) => boolean, now = Date.now()): Target | null {
  let best: { row: ConceptRow; need: number } | null = null;
  for (const c of CABINETS) {
    if (!available(c) || cabinetState(p, c, available) === 'locked' || p.finished.includes(c)) continue;
    for (const row of conceptRows(p, concepts, c)) {
      const need = conceptNeed(p.beliefs[beliefKey(c, row.concept)], now);
      if (!best || need > best.need + 1e-9) best = { row, need };
    }
  }
  if (!best) return null;
  const r = best.row;
  return { ...r, why: !r.seen ? 'Not tested yet' : r.mean < 0.4 ? 'Weak so far' : r.sd > 0.17 ? 'Still unsure' : 'Due for a revisit' };
}

export const pct = (x: number) => Math.round(x * 100);
export const estimate = (mean_: number, sd: number) => `${pct(mean_)}% ± ${pct(sd)}`;

/** One line telling the learner what an answer just did to the estimate. */
export function changeLine(label: string, before: { mean: number; evidence: number }, after: { mean: number; sd: number }): string {
  const from = before.evidence === 0 ? 'no data' : `${pct(before.mean)}%`;
  return `Evidence logged · ${label}: ${from} → ${pct(after.mean)}% (± ${pct(after.sd)})`;
}

export { cabinetEstimate };
