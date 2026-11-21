import type { Diagnosis } from '../../../engine/diagnoseKinds';
import { apply, det } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';

const SIN3 = Math.sin((3 * Math.PI) / 180);
const norm = (v: Vec2) => Math.hypot(v[0], v[1]);
const mstr = (m: Mat2) => `[[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`;

/** The laser is aimed by angle, in 15° steps; its direction vector has length 2. */
export function angleToDir(deg: number): Vec2 {
  const a = (Math.round(deg / 15) * 15 * Math.PI) / 180;
  return [2 * Math.cos(a) + 0, 2 * Math.sin(a) + 0];
}

/** v keeps its line through the lens: A·v is parallel (or anti-parallel) to v, or zero. */
export function isEigen(m: Mat2, v: Vec2): boolean {
  if (norm(v) < 1e-9) return false;
  const w = apply(m, v);
  if (norm(w) < 1e-9) return true;
  return Math.abs(v[0] * w[1] - v[1] * w[0]) / (norm(v) * norm(w)) <= SIN3;
}

/** Real eigen-directions (unit vectors). Empty when the lens turns every direction (e.g. a rotation). */
export function realEigenvectors(m: Mat2): Vec2[] {
  const tr = m[0][0] + m[1][1], disc = tr * tr - 4 * det(m);
  if (disc < -1e-12) return [];
  const out: Vec2[] = [];
  for (const lam of [...new Set([(tr + Math.sqrt(Math.max(0, disc))) / 2, (tr - Math.sqrt(Math.max(0, disc))) / 2])]) {
    // (A − λI)v = 0
    const a = m[0][0] - lam, b = m[0][1], c = m[1][0], d = m[1][1] - lam;
    let v: Vec2 = Math.abs(b) > 1e-9 || Math.abs(a) > 1e-9 ? [-b, a] : Math.abs(d) > 1e-9 || Math.abs(c) > 1e-9 ? [-d, c] : [1, 0];
    if (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9 && Math.abs(d) < 1e-9) { out.push([1, 0], [0, 1]); continue; }
    const n = norm(v); v = [v[0] / n, v[1] / n];
    if (!out.some((u) => Math.abs(u[0] * v[1] - u[1] * v[0]) < 1e-9)) out.push(v);
  }
  return out;
}

export function evaluateLaser(m: Mat2, v: Vec2, saidNone: boolean): { correct: boolean; diagnosis: Diagnosis | null } {
  const none = realEigenvectors(m).length === 0;
  if (saidNone) return none ? { correct: true, diagnosis: null } : { correct: false, diagnosis: { kind: 'missed-none', text: 'There was a straight path: look for a direction the grid lines keep after the lens.', wrongParts: [true] } };
  if (isEigen(m, v)) return { correct: true, diagnosis: null };
  if (none) return { correct: false, diagnosis: { kind: 'same-length-not-direction', text: 'This lens turns every direction (it is a rotation): no beam can come out straight. Press NO STRAIGHT PATH.', wrongParts: [true] } };
  const w = apply(m, v);
  if (Math.abs(norm(w) - norm(v)) < 0.05) return { correct: false, diagnosis: { kind: 'same-length-not-direction', text: 'The beam kept its length but turned. We want it to keep its direction.', wrongParts: [true] } };
  return { correct: false, diagnosis: { kind: 'other', text: 'The beam came out at an angle. Try the directions where the warped grid lines stay put.', wrongParts: [true] } };
}

export function goalText(m: Mat2, rule: Rule): string {
  if (rule === 'assist') return 'Aim the laser so the beam comes out of the lens on the same line (the dashed exit beam must line up). Or press NO STRAIGHT PATH.';
  if (rule === 'partial') return 'Same goal, but the exit beam is hidden until you fire. Watch how the lens bends the grid.';
  return `The lens is ${mstr(m)}. Aim at a direction it does not turn — or press NO STRAIGHT PATH.`;
}

export function checklist(m: Mat2, v: Vec2, rule: Rule): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  if (rule === 'partial') return [{ label: `aiming at ${Math.round((Math.atan2(v[1], v[0]) * 180) / Math.PI)}°`, ok: false }];
  return [{ label: 'exit beam on the same line', ok: isEigen(m, v) }];
}
