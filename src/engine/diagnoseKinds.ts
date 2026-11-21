import { maxAbsDiff, scale, swapColumns } from './matrix';
import type { Mat2, Vec2 } from './types';

export interface Diagnosis {
  kind: string;
  /** Short, player-facing English explanation with coordinates. */
  text: string;
  /** Which parts were wrong: [column 1, column 2] for matrices, [x, y] for vectors, [value] for numbers. */
  wrongParts: boolean[];
}

const fmt = (x: number) => (Math.abs(x) < 1e-9 ? '0' : String(Math.round(x * 100) / 100));
export const vstr = (v: Vec2) => `(${fmt(v[0])}, ${fmt(v[1])})`;
const col = (m: Mat2, c: 0 | 1): Vec2 => [m[0][c], m[1][c]];
const near = (a: Vec2, b: Vec2, tol: number) => Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;
const neg = (v: Vec2): Vec2 => [-v[0], -v[1]];
const frob = (m: Mat2) => Math.hypot(m[0][0], m[0][1], m[1][0], m[1][1]);

/** Compares the player's basis (columns = where î and ĵ land) with the target. */
export function diagnoseBasis(player: Mat2, target: Mat2, tol: number): Diagnosis | null {
  if (maxAbsDiff(player, target) <= tol) return null;
  const [pi, pj, ti, tj] = [col(player, 0), col(player, 1), col(target, 0), col(target, 1)];
  const wrongParts = [!near(pi, ti, tol), !near(pj, tj, tol)];
  if (maxAbsDiff(swapColumns(player), target) <= tol)
    return { kind: 'swapped-columns', wrongParts, text: `You swapped î and ĵ: column 1 is where î lands, ${vstr(ti)}.` };
  if ((near(pi, neg(ti), tol) && !wrongParts[1]) || (near(pj, neg(tj), tol) && !wrongParts[0])) {
    const which = wrongParts[0] ? 'î' : 'ĵ';
    return { kind: 'sign-flip', wrongParts, text: `${which} points backwards: it should land on ${vstr(wrongParts[0] ? ti : tj)}.` };
  }
  const ft = frob(target);
  if (ft > 1e-9) {
    const k = frob(player) / ft;
    if ((k < 0.9 || k > 1.1) && maxAbsDiff(scale(player, 1 / k), target) <= tol)
      return { kind: 'scale', wrongParts, text: `Right directions, wrong length: î should land on ${vstr(ti)} and ĵ on ${vstr(tj)}.` };
  }
  if (wrongParts[0] !== wrongParts[1]) {
    const which = wrongParts[0] ? 'î' : 'ĵ';
    return { kind: 'one-column', wrongParts, text: `${wrongParts[0] ? 'ĵ' : 'î'} is right; ${which} should land on ${vstr(wrongParts[0] ? ti : tj)}.` };
  }
  return { kind: 'other', wrongParts, text: `î should land on ${vstr(ti)} and ĵ on ${vstr(tj)}.` };
}

export function diagnoseVector(player: Vec2, target: Vec2, tol: number): Diagnosis | null {
  if (near(player, target, tol)) return null;
  const wrongParts = [Math.abs(player[0] - target[0]) > tol, Math.abs(player[1] - target[1]) > tol];
  if (near([player[1], player[0]], target, tol)) return { kind: 'swapped-xy', wrongParts, text: `You swapped x and y: the target is ${vstr(target)}, x first.` };
  if (Math.abs(player[0] + target[0]) <= tol && !wrongParts[1] && target[0] !== 0) return { kind: 'sign-x', wrongParts, text: `Wrong way on x: the target is ${vstr(target)}.` };
  if (Math.abs(player[1] + target[1]) <= tol && !wrongParts[0] && target[1] !== 0) return { kind: 'sign-y', wrongParts, text: `Wrong way on y: the target is ${vstr(target)}.` };
  return { kind: 'other', wrongParts, text: `The target is ${vstr(target)}; you were at ${vstr(player)}.` };
}

export function diagnoseNumber(player: number, target: number, tol: number): Diagnosis | null {
  if (Number.isFinite(player) && Math.abs(player - target) <= tol) return null;
  if (!Number.isFinite(player)) return { kind: 'other', wrongParts: [true], text: `The answer was ${fmt(target)}.` };
  if (Math.abs(target) <= tol) return { kind: 'missed-zero', wrongParts: [true], text: `It was 0: the plane is squashed flat.` };
  if (Math.abs(player + target) <= tol) return { kind: 'wrong-sign', wrongParts: [true], text: `Right size, wrong sign: it was ${fmt(target)}${target < 0 ? ' (the plane is flipped)' : ''}.` };
  return { kind: 'other', wrongParts: [true], text: `The answer was ${fmt(target)}, you said ${fmt(player)}.` };
}
