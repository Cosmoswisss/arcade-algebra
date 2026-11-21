import { isMat2, isObj } from '../../../content/check';
import type { Mat2 } from '../../../engine/types';
import type { ParamsValidator } from '../../../content/types';

export interface HoleParams { matrix: Mat2 }

export const validateHoleParams: ParamsValidator = (p) =>
  isObj(p) && isMat2(p.matrix) ? null : 'params.matrix must be a 2x2 matrix like [[2,0],[0,1]]';
