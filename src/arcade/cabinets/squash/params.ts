import { isMat2, isObj } from '../../../content/check';
import { areaFactor, snapBet } from './logic';
import type { ParamsValidator } from '../../../content/types';
import type { Mat2 } from '../../../engine/types';

export interface SquashParams { matrix: Mat2 }
/** The answer (det) must be a value the bet slider can show: step 0.5, within ±3. */
export const validateSquashParams: ParamsValidator = (p) => {
  if (!isObj(p) || !isMat2(p.matrix)) return 'params.matrix must be a 2x2 matrix';
  const d = areaFactor(p.matrix as Mat2);
  return Math.abs(snapBet(d) - d) < 1e-9 ? null : `no solution on the slider: det = ${d} is not a 0.5 step within ±3`;
};
