import { isMat2, isObj } from '../../../content/check';
import type { ParamsValidator } from '../../../content/types';
import type { Mat2 } from '../../../engine/types';

export interface SquashParams { matrix: Mat2 }
export const validateSquashParams: ParamsValidator = (p) => (isObj(p) && isMat2(p.matrix) ? null : 'params.matrix must be a 2x2 matrix');
