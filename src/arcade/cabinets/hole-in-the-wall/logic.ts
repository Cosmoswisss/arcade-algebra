import { diagnoseBasis, vstr } from '../../../engine/diagnoseKinds';
import type { Diagnosis } from '../../../engine/diagnoseKinds';
import { fromBasis } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';

export const TOL = 0.11;
const col = (m: Mat2, c: 0 | 1): Vec2 => [m[0][c], m[1][c]];
const on = (a: Vec2, b: Vec2) => Math.abs(a[0] - b[0]) <= TOL && Math.abs(a[1] - b[1]) <= TOL;

export function goalText(target: Mat2, rule: Rule): string {
  if (rule === 'assist') return `Send î to ${vstr(col(target, 0))} and ĵ to ${vstr(col(target, 1))}.`;
  if (rule === 'partial') return 'Find where the corners (1, 0) and (0, 1) sit in the hole: î and ĵ must land there.';
  return 'Read the matrix on the wall: column 1 is where î lands, column 2 is where ĵ lands.';
}

export function checklist(target: Mat2, i: Vec2, j: Vec2, rule: Rule): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  if (rule === 'partial') return [{ label: `î at ${vstr(i)}`, ok: false }, { label: `ĵ at ${vstr(j)}`, ok: false }];
  return [
    { label: `î on ${vstr(col(target, 0))}`, ok: on(i, col(target, 0)) },
    { label: `ĵ on ${vstr(col(target, 1))}`, ok: on(j, col(target, 1)) },
  ];
}

export function evaluate(i: Vec2, j: Vec2, target: Mat2): { correct: boolean; diagnosis: Diagnosis | null } {
  const d = diagnoseBasis(fromBasis(i, j), target, TOL);
  return { correct: d === null, diagnosis: d };
}
