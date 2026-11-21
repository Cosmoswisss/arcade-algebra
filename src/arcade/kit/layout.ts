import type { Vec2 } from '../../engine/types';

export interface Layout {
  w: number; h: number;
  /** Pixels per unit of the play plane. */
  U: number;
  /** Screen position of the plane's origin (where the player's arrows start). */
  O: Vec2;
  horizon: number;
  /** Vanishing point. */
  V: Vec2;
}

export function computeLayout(w: number, h: number): Layout {
  const U = Math.min(w, h) / 10.5;
  const horizon = h * 0.3;
  return { w, h, U, O: [w / 2 - U * 0.5, h * 0.74], horizon, V: [w / 2, horizon] };
}

export const toScreen = (L: Layout, p: Vec2, origin: Vec2 = L.O, s = 1): Vec2 => [origin[0] + p[0] * L.U * s, origin[1] - p[1] * L.U * s];
export const toPlane = (L: Layout, x: number, y: number, origin: Vec2 = L.O): Vec2 => [(x - origin[0]) / L.U, (origin[1] - y) / L.U];
