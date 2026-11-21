import { apply, det, maxAbsDiff, mul } from './matrix';
import type { Level, Mat2, Vec2 } from './types';

/** The transformation actually applied to the shape: the player's matrix after `pre`, if any. */
export const effectiveMatrix = (level: Level, m: Mat2): Mat2 => (level.pre ? mul(m, level.pre) : m);

const norm = (v: Vec2) => Math.hypot(v[0], v[1]);

export function checkLevel(level: Level, m: Mat2, v?: Vec2): boolean {
  const t = level.target;
  const tol = level.tolerance;
  switch (t.type) {
    case 'shape':
      return maxAbsDiff(effectiveMatrix(level, m), t.matrix) <= tol;
    case 'point': {
      const p = apply(effectiveMatrix(level, m), t.from);
      return Math.hypot(p[0] - t.point[0], p[1] - t.point[1]) <= tol;
    }
    case 'area':
      return Math.abs(det(effectiveMatrix(level, m)) - t.det) <= tol;
    case 'direction': {
      if (!v || norm(v) < 0.5) return false;
      const w = apply(level.start, v);
      const nw = norm(w);
      if (nw < 1e-9) return true; // eigenvalue 0
      return Math.abs(v[0] * w[1] - v[1] * w[0]) / (norm(v) * nw) <= 0.05;
    }
  }
}
