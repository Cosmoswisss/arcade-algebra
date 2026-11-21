import { diagnoseBasis } from '../../../engine/diagnoseKinds';
import type { Diagnosis } from '../../../engine/diagnoseKinds';
import { det, inverse } from '../../../engine/matrix';
import type { Mat2, Rule } from '../../../engine/types';

export const TOL = 0.11;

/** The move that undoes `warp`, or 'cant-repair' when the picture was squashed flat (det = 0). */
export function solution(warp: Mat2): Mat2 | 'cant-repair' {
  if (Math.abs(det(warp)) < 1e-9) return 'cant-repair';
  return inverse(warp)!;
}

export function evaluateRewind(warp: Mat2, player: Mat2, saidCantRepair: boolean): { correct: boolean; diagnosis: Diagnosis | null } {
  const s = solution(warp);
  if (s === 'cant-repair') {
    return saidCantRepair ? { correct: true, diagnosis: null }
      : { correct: false, diagnosis: { kind: 'repaired-flat', text: 'This picture was squashed flat (det = 0): whole lines of it landed on the same points. Nothing can bring it back.', wrongParts: [true, true] } };
  }
  if (saidCantRepair) return { correct: false, diagnosis: { kind: 'missed-repairable', text: `This one could be repaired: det = ${det(warp)} is not 0, so the warp can be undone.`, wrongParts: [true, true] } };
  const d = diagnoseBasis(player, s, TOL);
  return d ? { correct: false, diagnosis: d } : { correct: true, diagnosis: null };
}

const mstr = (m: Mat2) => `[[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`;
export function goalText(warp: Mat2, rule: Rule): string {
  if (rule === 'assist') return 'Move î and ĵ to put the picture back in its frame.';
  if (rule === 'partial') return 'Straighten the picture. No frame this time.';
  return `Warp ${mstr(warp)}: build the move that undoes it.`;
}

export function checklist(warp: Mat2, player: Mat2, rule: Rule): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  const s = solution(warp);
  const fixed = s !== 'cant-repair' && diagnoseBasis(player, s, TOL) === null;
  return [{ label: 'picture back in its frame', ok: fixed }];
}
