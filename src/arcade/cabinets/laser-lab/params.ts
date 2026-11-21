import { isMat2, isObj } from '../../../content/check';
import { realEigenvectors } from './logic';
import type { ParamsValidator } from '../../../content/types';
import type { Mat2 } from '../../../engine/types';

export interface LaserParams { matrix: Mat2 }
/** The laser turns by 15°: every straight path of the lens must be on that dial. */
export const validateLaserParams: ParamsValidator = (p) => {
  if (!isObj(p) || !isMat2(p.matrix)) return 'params.matrix must be a 2x2 matrix';
  const offDial = realEigenvectors(p.matrix as Mat2).some((v) => { const a = (((Math.atan2(v[1], v[0]) * 180) / Math.PI) % 15 + 15) % 15; return Math.min(a, 15 - a) > 1e-6; });
  return offDial ? 'no solution on the dial: a straight path of this lens is not a multiple of 15°' : null;
};
