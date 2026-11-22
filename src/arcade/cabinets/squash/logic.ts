import { diagnoseNumber } from '../../../engine/diagnoseKinds';
import type { Diagnosis } from '../../../engine/diagnoseKinds';
import { det } from '../../../engine/matrix';
import type { Mat2, Rule } from '../../../engine/types';

export const BET_TOL = 0.25;
export const BET_MAX = 3;

/** How much the press multiplies areas: the determinant. (+0 normalises -0.) */
export const areaFactor = (m: Mat2) => det(m) + 0;
export const snapBet = (x: number) => Math.max(-BET_MAX, Math.min(BET_MAX, Math.round(x * 2) / 2)) + 0;
const mstr = (m: Mat2) => `[[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`;

export function evaluateSquash(m: Mat2, bet: number): { correct: boolean; diagnosis: Diagnosis | null } {
  const target = areaFactor(m);
  const d = diagnoseNumber(bet, target, BET_TOL);
  if (!d) return { correct: true, diagnosis: null };
  // a bet of the wrong size: the press's own mistake, trained by its own drill and catch-up lesson
  if (d.kind === 'other') return { correct: false, diagnosis: { kind: 'area-off', wrongParts: [true], text: `The unit square now covers ${target} squares, not ${bet}.` } };
  return { correct: false, diagnosis: d };
}

export function goalText(m: Mat2, rule: Rule): string {
  if (rule === 'assist') return 'Count the squares and bet on the new area. Flipped = negative.';
  if (rule === 'partial') return `Matrix ${mstr(m)}: bet on the new area.`;
  return `Press ${mstr(m)}: bet on the area factor.`;
}

export function checklist(m: Mat2, bet: number, rule: Rule): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  if (rule === 'partial') return [{ label: `your bet: ${bet}`, ok: false }];
  return [{ label: `your bet: ${bet}`, ok: Math.abs(bet - areaFactor(m)) <= BET_TOL }];
}
