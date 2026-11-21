import type { CabinetId } from '../engine/types';
import { validateHoleParams } from '../arcade/cabinets/hole-in-the-wall/params';
import { validateGolfParams } from '../arcade/cabinets/vector-golf/params';
import { validateSquashParams } from '../arcade/cabinets/squash/params';
import { validateRewindParams } from '../arcade/cabinets/rewind/params';
import { validateDroneParams } from '../arcade/cabinets/drone/params';
import { validateFactoryParams } from '../arcade/cabinets/factory/params';
import { validateLaserParams } from '../arcade/cabinets/laser-lab/params';
import type { ParamsValidator } from './types';

export const PARAMS_VALIDATORS: Record<CabinetId, ParamsValidator> = {
  'vector-golf': validateGolfParams,
  drone: validateDroneParams,
  'hole-in-the-wall': validateHoleParams,
  factory: validateFactoryParams,
  squash: validateSquashParams,
  rewind: validateRewindParams,
  'laser-lab': validateLaserParams,
};
