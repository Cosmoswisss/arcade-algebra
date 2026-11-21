import { isMat2, isObj, onHalfGrid } from '../../../content/check';
import type { Mat2 } from '../../../engine/types';
import type { ParamsValidator } from '../../../content/types';

export interface HoleParams { matrix: Mat2 }

/** The arrow tips snap to 0.5 inside the plane: the target matrix must be reachable with them. */
export const validateHoleParams: ParamsValidator = (p) => {
  if (!isObj(p) || !isMat2(p.matrix)) return 'params.matrix must be a 2x2 matrix like [[2,0],[0,1]]';
  const m = p.matrix as Mat2;
  if (!m.flat().every((v) => onHalfGrid(v)) || m[1][0] < -2 || m[1][1] < -2) return 'no solution: î and ĵ snap to 0.5 steps, x in [-3, 3] and y in [-2, 3]';
  return null;
};
