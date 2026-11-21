import type { CabinetId } from '../engine/types';
import { validateHoleParams } from '../arcade/cabinets/hole-in-the-wall/params';
import { validateGolfParams } from '../arcade/cabinets/vector-golf/params';
import { validateSquashParams } from '../arcade/cabinets/squash/params';
import { validateRewindParams } from '../arcade/cabinets/rewind/params';
import type { ParamsValidator } from './types';

/** Temporary validator for cabinets whose game is not built yet: accepts any object. */
const pending: ParamsValidator = (p) => (typeof p === 'object' && p !== null ? null : 'params must be an object');

export const PARAMS_VALIDATORS: Record<CabinetId, ParamsValidator> = {
  'vector-golf': validateGolfParams,
  drone: pending,
  'hole-in-the-wall': validateHoleParams,
  factory: pending,
  squash: validateSquashParams,
  rewind: validateRewindParams,
  'laser-lab': pending,
};
