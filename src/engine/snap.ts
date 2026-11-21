import type { Vec2 } from './types';

/** The visible part of the plane (Mafs viewBox). Keep level targets inside it. */
export const VIEW = { x: [-3, 4.5] as Vec2, y: [-2, 3.5] as Vec2 };

const clamp = (v: number, [lo, hi]: Vec2) => Math.min(hi, Math.max(lo, v));

/** Snaps a dragged point to the grid step and keeps it on screen, so it can always be grabbed again. */
export const snapInView = (step: number) => (p: Vec2): Vec2 => {
  const s = step > 0 ? [Math.round(p[0] / step) * step, Math.round(p[1] / step) * step] : p;
  return [clamp(s[0], VIEW.x), clamp(s[1], VIEW.y)];
};
