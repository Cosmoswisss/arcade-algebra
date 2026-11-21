import { isObj, isVec2 } from '../../../content/check';
import type { ParamsValidator } from '../../../content/types';
import type { Vec2 } from '../../../engine/types';

export interface DroneParams { u: Vec2; v: Vec2; target: Vec2; reachable: boolean }
export const validateDroneParams: ParamsValidator = (p) => {
  if (!isObj(p) || !isVec2(p.u) || !isVec2(p.v) || !isVec2(p.target)) return 'params.u, params.v and params.target must be [x, y]';
  return typeof p.reachable === 'boolean' ? null : 'params.reachable must be true or false';
};
