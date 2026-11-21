import { isMat2, isObj, isStr } from '../../../content/check';
import type { ParamsValidator } from '../../../content/types';
import type { Mat2 } from '../../../engine/types';
import { evaluateFactory } from './logic';

export interface Machine { name: string; matrix: Mat2 }
export interface FactoryParams { machines: Machine[]; target: Mat2 }
const shape: ParamsValidator = (p) => {
  if (!isObj(p) || !isMat2(p.target)) return 'params.target must be a 2x2 matrix';
  if (!Array.isArray(p.machines) || p.machines.length < 2 || p.machines.length > 3 || !p.machines.every((m) => isObj(m) && isStr(m.name) && isMat2(m.matrix)))
    return 'params.machines must be 2 or 3 items { name, matrix }, listed in the solution order';
  return null;
};

/** The listed order is the solution, and the reversed order must not also work (the cabinet is about order). */
export const validateFactoryParams: ParamsValidator = (p) => {
  const bad = shape(p);
  if (bad) return bad;
  const f = p as FactoryParams;
  const order = f.machines.map((_, k) => k);
  if (!evaluateFactory(f, order).correct) return 'no solution: the machines in the listed order do not build the target';
  if (evaluateFactory(f, [...order].reverse()).correct) return 'no solution to learn from: the reversed order builds the target too';
  return null;
};
