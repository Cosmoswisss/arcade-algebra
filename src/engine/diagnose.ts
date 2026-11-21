import { checkLevel, effectiveMatrix } from './checkLevel';
import { basis, maxAbsDiff, mul, scale, swapColumns } from './matrix';
import type { ErrorKind, Level, Mat2, Vec2 } from './types';

export const ERROR_MESSAGES: Record<ErrorKind, string> = {
  'swapped-columns': 'You swapped î and ĵ: the first column is where î lands.',
  'sign-flip': 'One arrow points the wrong way.',
  scale: 'Right directions, wrong size.',
  'one-column': 'One arrow is right. Fix the other one.',
  'composition-order': 'Order matters: this transformation happens after the first one.',
  other: 'Not quite. Compare your grid with the ghost.',
};

const close = (a: Vec2, b: Vec2, tol: number) => Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;
const frob = (m: Mat2) => Math.hypot(m[0][0], m[0][1], m[1][0], m[1][1]);

/** Returns null when the level is solved, otherwise the most specific error kind. */
export function diagnose(level: Level, m: Mat2, v?: Vec2): ErrorKind | null {
  if (checkLevel(level, m, v)) return null;
  if (level.target.type !== 'shape') return 'other';

  const tol = level.tolerance;
  const target = level.target.matrix;
  const e = effectiveMatrix(level, m);
  const same = (a: Mat2) => maxAbsDiff(a, target) <= tol;

  if (level.pre && same(mul(level.pre, m))) return 'composition-order';
  if (same(swapColumns(e))) return 'swapped-columns';

  const [ei, ej] = basis(e);
  const [ti, tj] = basis(target);
  const neg = (x: Vec2): Vec2 => [-x[0], -x[1]];
  const iOk = close(ei, ti, tol);
  const jOk = close(ej, tj, tol);
  if ((close(ei, neg(ti), tol) && jOk) || (close(ej, neg(tj), tol) && iOk)) return 'sign-flip';

  const ft = frob(target);
  if (ft > 1e-9) {
    const k = frob(e) / ft;
    if ((k < 0.9 || k > 1.1) && same(scale(e, 1 / k))) return 'scale';
  }
  if (iOk !== jOk) return 'one-column';
  return 'other';
}
