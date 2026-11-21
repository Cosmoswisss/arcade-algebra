import { isMat2, isObj } from '../../../content/check';
import type { ParamsValidator } from '../../../content/types';
import type { Mat2 } from '../../../engine/types';

export interface LaserParams { matrix: Mat2 }
export const validateLaserParams: ParamsValidator = (p) => (isObj(p) && isMat2(p.matrix) ? null : 'params.matrix must be a 2x2 matrix');
