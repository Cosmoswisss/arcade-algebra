import { isObj, isVec2, onHalfGrid } from '../../../content/check';
import { isReachable, solveCoeffs } from './logic';
import type { ParamsValidator } from '../../../content/types';
import type { Vec2 } from '../../../engine/types';

export interface DroneParams { u: Vec2; v: Vec2; target: Vec2; reachable: boolean }
const shape: ParamsValidator = (p) => {
  if (!isObj(p) || !isVec2(p.u) || !isVec2(p.v) || !isVec2(p.target)) return 'params.u, params.v and params.target must be [x, y]';
  return typeof p.reachable === 'boolean' ? null : 'params.reachable must be true or false';
};

/** `reachable` must match the geometry, and a reachable mix must be settable on the sliders (step 0.5, within ±3). */
export const validateDroneParams: ParamsValidator = (p) => {
  const bad = shape(p);
  if (bad) return bad;
  const d = p as DroneParams;
  if (isReachable(d) !== d.reachable) return `params.reachable contradicts u, v and the target (it is ${isReachable(d) ? '' : 'not '}reachable)`;
  const s = solveCoeffs(d.u, d.v, d.target);
  if (s && !s.every((x) => onHalfGrid(x))) return 'no solution on the sliders: the mix needs coefficients off the 0.5 steps or beyond ±3';
  return null;
};
