import type { CabinetId } from '../engine/types';
import { validateHoleParams } from '../arcade/cabinets/hole-in-the-wall/params';
import type { ParamsValidator } from './types';

/** Temporary validator for cabinets whose game is not built yet: accepts any object. */
const pending: ParamsValidator = (p) => (typeof p === 'object' && p !== null ? null : 'params must be an object');

export const PARAMS_VALIDATORS: Record<CabinetId, ParamsValidator> = {
  'vector-golf': pending,
  drone: pending,
  'hole-in-the-wall': validateHoleParams,
  factory: pending,
  squash: pending,
  rewind: pending,
  'laser-lab': pending,
};
