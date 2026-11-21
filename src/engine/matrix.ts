import type { Mat2, Vec2 } from './types';

export const identity = (): Mat2 => [[1, 0], [0, 1]];

export const fromBasis = (i: Vec2, j: Vec2): Mat2 => [[i[0], j[0]], [i[1], j[1]]];

export const basis = (m: Mat2): [Vec2, Vec2] => [[m[0][0], m[1][0]], [m[0][1], m[1][1]]];

export const apply = (m: Mat2, v: Vec2): Vec2 => [
  m[0][0] * v[0] + m[0][1] * v[1],
  m[1][0] * v[0] + m[1][1] * v[1],
];

/** Composition: applies b first, then a. */
export const mul = (a: Mat2, b: Mat2): Mat2 => {
  const [bi, bj] = basis(b);
  return fromBasis(apply(a, bi), apply(a, bj));
};

export const det = (m: Mat2): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];

export const inverse = (m: Mat2): Mat2 | null => {
  const d = det(m);
  if (Math.abs(d) < 1e-9) return null;
  const z = (x: number) => (x === 0 ? 0 : x); // avoid -0
  return [[z(m[1][1] / d), z(-m[0][1] / d)], [z(-m[1][0] / d), z(m[0][0] / d)]];
};

export const swapColumns = (m: Mat2): Mat2 => [[m[0][1], m[0][0]], [m[1][1], m[1][0]]];

export const scale = (m: Mat2, k: number): Mat2 => [[m[0][0] * k, m[0][1] * k], [m[1][0] * k, m[1][1] * k]];

export const maxAbsDiff = (a: Mat2, b: Mat2): number => Math.max(
  Math.abs(a[0][0] - b[0][0]), Math.abs(a[0][1] - b[0][1]),
  Math.abs(a[1][0] - b[1][0]), Math.abs(a[1][1] - b[1][1]),
);
