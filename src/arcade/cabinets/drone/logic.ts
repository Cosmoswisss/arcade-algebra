import { diagnoseVector, vstr } from '../../../engine/diagnoseKinds';
import type { Diagnosis } from '../../../engine/diagnoseKinds';
import type { Rule, Vec2 } from '../../../engine/types';
import type { DroneParams } from './params';

export const POS_TOL = 0.25;
export type ReachAnswer = 'reachable' | 'unreachable' | null;

export const position = (p: DroneParams, a: number, b: number): Vec2 => [a * p.u[0] + b * p.v[0] + 0, a * p.u[1] + b * p.v[1] + 0];

/** Cramer's rule; null when u and v are on the same line (no unique mix). */
export function solveCoeffs(u: Vec2, v: Vec2, t: Vec2): [number, number] | null {
  const d = u[0] * v[1] - u[1] * v[0];
  if (Math.abs(d) < 1e-9) return null;
  return [(t[0] * v[1] - t[1] * v[0]) / d + 0, (u[0] * t[1] - u[1] * t[0]) / d + 0];
}

/** A target is reachable if u, v span the plane, or if it lies on their common line. */
export function isReachable(p: DroneParams): boolean {
  if (solveCoeffs(p.u, p.v, p.target)) return true;
  const dir = Math.hypot(...p.u) > 1e-9 ? p.u : p.v;
  return Math.abs(dir[0] * p.target[1] - dir[1] * p.target[0]) < 1e-9;
}

const SPAN_MSG = (p: DroneParams) => (isReachable(p)
  ? `u and v point in different directions, so a mix of them can reach every point — including ${vstr(p.target)}.`
  : `u and v lie on the same line, so every mix a·u + b·v stays on that line. ${vstr(p.target)} is off it.`);

export function evaluateDrone(p: DroneParams, rule: Rule, a: number, b: number, answer: ReachAnswer): { correct: boolean; diagnosis: Diagnosis | null } {
  const reach = isReachable(p);
  const span = (): Diagnosis => ({ kind: 'wrong-span', text: SPAN_MSG(p), wrongParts: [true, true] });
  if (answer === 'unreachable') return reach ? { correct: false, diagnosis: span() } : { correct: true, diagnosis: null };
  if (rule === 'abstract') return answer === 'reachable' && reach ? { correct: true, diagnosis: null } : { correct: false, diagnosis: span() };
  if (!reach) return { correct: false, diagnosis: span() };
  const pos = position(p, a, b);
  if (Math.hypot(pos[0] - p.target[0], pos[1] - p.target[1]) <= POS_TOL) return { correct: true, diagnosis: null };
  const want = solveCoeffs(p.u, p.v, p.target);
  const d = want ? diagnoseVector([a, b], want, 0.1) : null;
  return { correct: false, diagnosis: d ? { ...d, text: `You flew to ${vstr(pos)}. The mix needed was a = ${want![0]}, b = ${want![1]}.` } : span() };
}

export function goalText(p: DroneParams, rule: Rule): string {
  if (rule === 'abstract') return `Thrusters u = ${vstr(p.u)} and v = ${vstr(p.v)}. Can the drone reach ${vstr(p.target)}? Answer before it flies.`;
  return `Mix the thrusters u = ${vstr(p.u)} and v = ${vstr(p.v)} to reach ${vstr(p.target)} — or press CAN'T REACH.`;
}

export function checklist(p: DroneParams, rule: Rule, a: number, b: number): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  if (rule === 'partial') return [{ label: `a = ${a}, b = ${b}`, ok: false }];
  const pos = position(p, a, b);
  return [{ label: `a·u + b·v = ${vstr(pos)}`, ok: Math.hypot(pos[0] - p.target[0], pos[1] - p.target[1]) <= POS_TOL }];
}
