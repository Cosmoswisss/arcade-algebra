import type { Mat2, Vec2 } from '../engine/types';

export const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
export const isStr = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;
export const isVec2 = (x: unknown): x is Vec2 => Array.isArray(x) && x.length === 2 && x.every(isNum);
export const isMat2 = (x: unknown): x is Mat2 => Array.isArray(x) && x.length === 2 && x.every(isVec2);
export const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** On the 0.5 grid the handles and sliders snap to, and within ±max: a value the player can actually set. */
export const onHalfGrid = (x: number, max = 3) => Math.abs(x * 2 - Math.round(x * 2)) < 1e-9 && Math.abs(x) <= max + 1e-9;
