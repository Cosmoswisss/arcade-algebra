import { isMat2, isObj, isStr } from '../../../content/check';
import type { ParamsValidator } from '../../../content/types';
import type { Mat2 } from '../../../engine/types';

export interface Machine { name: string; matrix: Mat2 }
export interface FactoryParams { machines: Machine[]; target: Mat2 }
export const validateFactoryParams: ParamsValidator = (p) => {
  if (!isObj(p) || !isMat2(p.target)) return 'params.target must be a 2x2 matrix';
  if (!Array.isArray(p.machines) || p.machines.length < 2 || p.machines.length > 3 || !p.machines.every((m) => isObj(m) && isStr(m.name) && isMat2(m.matrix)))
    return 'params.machines must be 2 or 3 items { name, matrix }, listed in the solution order';
  return null;
};
