import { isMat2, isObj, onHalfGrid } from '../../../content/check';
import { solution } from './logic';
import type { ParamsValidator } from '../../../content/types';
import type { Mat2 } from '../../../engine/types';

export const IMAGES = ['mountains', 'city', 'face'] as const;
export type ImageId = (typeof IMAGES)[number];
export interface RewindParams { matrix: Mat2; image: ImageId }
const shape: ParamsValidator = (p) => {
  if (!isObj(p) || !isMat2(p.matrix)) return 'params.matrix must be a 2x2 matrix';
  return IMAGES.includes(p.image as ImageId) ? null : `params.image must be one of ${IMAGES.join(', ')}`;
};

/** The undo move (the inverse) must be buildable with î and ĵ (0.5 steps, within ±3), unless the warp is flat. */
export const validateRewindParams: ParamsValidator = (p) => {
  const bad = shape(p);
  if (bad) return bad;
  const s = solution((p as RewindParams).matrix);
  if (s !== 'cant-repair' && !s.flat().every((v) => onHalfGrid(v))) return 'no solution: the undo move needs values off the 0.5 steps or beyond ±3';
  return null;
};
