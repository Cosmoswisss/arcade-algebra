import { diagnoseBasis, vstr } from '../../../engine/diagnoseKinds';
import type { Diagnosis } from '../../../engine/diagnoseKinds';
import { identity, maxAbsDiff, mul } from '../../../engine/matrix';
import type { Mat2, Rule } from '../../../engine/types';
import type { FactoryParams } from './params';

export const TOL = 0.11;
const col = (m: Mat2, c: 0 | 1) => [m[0][c], m[1][c]] as [number, number];

/** Machines act in belt order: the result is M_last · … · M_first. */
export const compose = (ms: Mat2[]): Mat2 => ms.reduce((acc, m) => mul(m, acc), identity());
export const orderMatters = (a: Mat2, b: Mat2) => maxAbsDiff(mul(a, b), mul(b, a)) > 1e-9;

export function evaluateFactory(p: FactoryParams, order: number[]): { correct: boolean; diagnosis: Diagnosis | null } {
  if (order.length !== p.machines.length) return { correct: false, diagnosis: { kind: 'other', text: `Use all ${p.machines.length} machines.`, wrongParts: [true, true] } };
  const result = compose(order.map((k) => p.machines[k].matrix));
  if (maxAbsDiff(result, p.target) <= TOL) return { correct: true, diagnosis: null };
  const rev = compose([...order].reverse().map((k) => p.machines[k].matrix));
  if (maxAbsDiff(rev, p.target) <= TOL) return { correct: false, diagnosis: { kind: 'composition-order', text: 'Right machines, wrong order: each machine acts on what the previous one produced.', wrongParts: [true, true] } };
  return { correct: false, diagnosis: diagnoseBasis(result, p.target, TOL) };
}

export function goalText(p: FactoryParams, rule: Rule): string {
  if (rule === 'assist') return `Order the machines: î must end at ${vstr(col(p.target, 0))}, ĵ at ${vstr(col(p.target, 1))}.`;
  if (rule === 'partial') return `Same goal: î at ${vstr(col(p.target, 0))}, ĵ at ${vstr(col(p.target, 1))}. Only the final part is shown.`;
  return 'Order the matrices so their product makes the target.';
}

export function checklist(p: FactoryParams, order: number[], rule: Rule): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  const full = order.length === p.machines.length;
  const res = compose(order.map((k) => p.machines[k].matrix));
  return [
    { label: `${order.length}/${p.machines.length} machines on the belt`, ok: full },
    { label: 'part matches the outline', ok: full && maxAbsDiff(res, p.target) <= TOL },
  ];
}
