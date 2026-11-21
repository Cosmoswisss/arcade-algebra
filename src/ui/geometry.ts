import type { Vec2 } from '../engine/types';

/**
 * The player's shape in the lesson scenes. Deliberately asymmetric (an "L"):
 * a square would look the same when î and ĵ are swapped, and the mistake would be invisible.
 */
export const SHAPE: Vec2[] = [[0, 0], [0.3, 0], [0.3, 0.55], [1, 0.55], [1, 1], [0, 1]];

/** Round to the snap grid and keep inside [-limit, limit]. NaN falls back to 0. */
export function snapTo(x: number, step: number, limit: number): number {
  if (!Number.isFinite(x)) return 0;
  const s = Math.max(-limit, Math.min(limit, Math.round(x / step) * step));
  return s === 0 ? 0 : s; // avoid -0
}

/** Number format for labels: one decimal, never "-0". */
export const fmtN = (x: number): string => (Math.abs(x) < 1e-9 ? '0' : String(Math.round(x * 10) / 10));

/** The lesson plane (MiniScene): pixels per unit, origin and size of the SVG viewBox. */
export const U = 44;
export const OX = 154, OY = 154;
export const W = 352, H = 264;
/** The part of the plane a player can see and click: [xMin, xMax, yMin, yMax]. */
export const VISIBLE = [-OX / U, (W - OX) / U, -(H - OY) / U, OY / U] as const;
/** Draggable arrows snap to this step and stay within ±ARROW_LIMIT. */
export const ARROW_STEP = 0.5, ARROW_LIMIT = 3;
/** A clicked point snaps to ARROW_STEP and stays within ±POINT_LIMIT on each axis (x, y). */
export const POINT_LIMIT = [4, 3.5] as const;
/** The number slider of a lesson question. */
export const SLIDER = { min: -4, max: 4, step: 0.5 } as const;
