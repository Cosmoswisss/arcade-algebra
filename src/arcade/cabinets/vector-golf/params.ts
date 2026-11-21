import { isObj, isVec2 } from '../../../content/check';
import type { ParamsValidator } from '../../../content/types';
import type { Vec2 } from '../../../engine/types';

export interface GolfParams { start: Vec2; shots: Vec2[]; hole: Vec2; walls: [Vec2, Vec2][] }

export const validateGolfParams: ParamsValidator = (p) => {
  if (!isObj(p)) return 'params must be an object';
  if (!isVec2(p.start) || !isVec2(p.hole)) return 'params.start and params.hole must be [x, y]';
  if (!Array.isArray(p.shots) || p.shots.length < 1 || p.shots.length > 3 || !p.shots.every(isVec2)) return 'params.shots must be 1 to 3 vectors [dx, dy] (the solution)';
  if (!Array.isArray(p.walls) || !p.walls.every((w) => Array.isArray(w) && w.length === 2 && w.every(isVec2))) return 'params.walls must be a list of segments [[x1, y1], [x2, y2]]';
  return null;
};
