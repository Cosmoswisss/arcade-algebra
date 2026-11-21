import { isMat2, isObj } from '../../../content/check';
import type { ParamsValidator } from '../../../content/types';
import type { Mat2 } from '../../../engine/types';

export const IMAGES = ['mountains', 'city', 'face'] as const;
export type ImageId = (typeof IMAGES)[number];
export interface RewindParams { matrix: Mat2; image: ImageId }
export const validateRewindParams: ParamsValidator = (p) => {
  if (!isObj(p) || !isMat2(p.matrix)) return 'params.matrix must be a 2x2 matrix';
  return IMAGES.includes(p.image as ImageId) ? null : `params.image must be one of ${IMAGES.join(', ')}`;
};
