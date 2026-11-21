import { diagnoseBasis, vstr } from '../../../engine/diagnoseKinds';
import type { Diagnosis } from '../../../engine/diagnoseKinds';
import { apply, fromBasis } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';

/**
 * Constellation (cabinet 3, id kept as 'hole-in-the-wall' so saves and content stay valid).
 * Each star is where a known point of the plane lands under the target matrix. The player places î and ĵ:
 * the whole grid follows them, and a star lights up when the player's image of its point lands on it.
 */

export const TOL = 0.11;
const col = (m: Mat2, c: 0 | 1): Vec2 => [m[0][c], m[1][c]];
const on = (a: Vec2, b: Vec2) => Math.abs(a[0] - b[0]) <= TOL && Math.abs(a[1] - b[1]) <= TOL;
const inView = ([x, y]: Vec2) => x >= -3 && x <= 3 && y >= -2 && y <= 3;

/** Points tried after (1, 0) and (0, 1): sums and differences of î and ĵ, so the stars show that the grid moves as a whole. */
const EXTRA: Vec2[] = [[1, 1], [-1, 1], [2, 1], [1, 2], [1, -1], [-1, -1]];
const MAX_STARS = 5;

/** The known points whose images are the stars: (1, 0) and (0, 1) first, then up to 3 more that land on the visible plane. */
export function starAnchors(target: Mat2): Vec2[] {
  const out: Vec2[] = [[1, 0], [0, 1]];
  for (const p of EXTRA) {
    if (out.length >= MAX_STARS) break;
    const s = apply(target, p);
    if (inView(s) && !out.some((q) => on(apply(target, q), s))) out.push(p);
  }
  return out;
}

export const starPoint = (target: Mat2, anchor: Vec2): Vec2 => apply(target, anchor);

/** Which stars the player's î and ĵ light up: the player's image of each anchor lands on its star. */
export function litStars(target: Mat2, i: Vec2, j: Vec2): boolean[] {
  const m = fromBasis(i, j);
  return starAnchors(target).map((p) => on(apply(m, p), apply(target, p)));
}

/**
 * The two stars given as clues in the partial rule: two points other than (1, 0) and (0, 1), independent,
 * whose stars are on the visible plane. The player deduces î and ĵ from them (linearity). Falls back to a basis point.
 */
export function clueAnchors(target: Mat2): [Vec2, Vec2] {
  const pool: Vec2[] = [...starAnchors(target).slice(2), ...EXTRA.filter((p) => inView(apply(target, p))), [1, 0], [0, 1]];
  for (let a = 0; a < pool.length; a++)
    for (let b = a + 1; b < pool.length; b++)
      if (pool[a][0] * pool[b][1] - pool[a][1] * pool[b][0] !== 0) return [pool[a], pool[b]];
  return [[1, 0], [0, 1]];
}

/** "★ (1, 1) → (2, 2)": a known point and where its star is. */
const clue = (target: Mat2, p: Vec2) => `★ ${vstr(p)} → ${vstr(apply(target, p))}`;

/**
 * Like Vector Golf: the stars are not drawn while aiming, only their coordinates are given here.
 * assist: the stars of (1, 0) and (0, 1); partial: two other stars, find î and ĵ from them; abstract: the star map (matrix).
 */
export function goalText(target: Mat2, rule: Rule): string {
  if (rule === 'assist') return `${clue(target, [1, 0])}   ${clue(target, [0, 1])}\nPlace î and ĵ on their stars`;
  if (rule === 'partial') { const [a, b] = clueAnchors(target); return `${clue(target, a)}   ${clue(target, b)}\nFind î and ĵ`; }
  return 'Read the star map: column 1 is î, column 2 is ĵ.';
}

/** The player's arrows as numbers only: never ticked or coloured, the player checks them against the stars himself. */
export function checklist(_target: Mat2, i: Vec2, j: Vec2, rule: Rule): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  return [{ label: `î ${vstr(i)}   ĵ ${vstr(j)}`, ok: false }];
}

export function evaluate(i: Vec2, j: Vec2, target: Mat2): { correct: boolean; diagnosis: Diagnosis | null } {
  const d = diagnoseBasis(fromBasis(i, j), target, TOL);
  return { correct: d === null, diagnosis: d };
}
