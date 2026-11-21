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
  const d = diagnoseNumber(bet, areaFactor(m), BET_TOL);
  return d ? { correct: false, diagnosis: d } : { correct: true, diagnosis: null };
}

export function goalText(m: Mat2, rule: Rule): string {
  if (rule === 'assist') return 'The press will reshape the yellow square (area 1). Count the squares it will cover and bet on the new area. Flipped over = negative.';
  if (rule === 'partial') return `Only î and ĵ after the press are shown. Bet on the new area of the square (matrix ${mstr(m)}).`;
  return `The press applies ${mstr(m)}. Bet on the area factor before it hits.`;
}

export function checklist(m: Mat2, bet: number, rule: Rule): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  if (rule === 'partial') return [{ label: `your bet: ${bet}`, ok: false }];
  return [{ label: `your bet: ${bet}`, ok: Math.abs(bet - areaFactor(m)) <= BET_TOL }];
}
