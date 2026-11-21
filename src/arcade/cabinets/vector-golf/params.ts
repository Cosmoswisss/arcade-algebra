import { isObj, isVec2 } from '../../../content/check';
import { evaluateGolf, pathPoints } from './logic';
import type { ParamsValidator } from '../../../content/types';
import type { Vec2 } from '../../../engine/types';

export interface GolfParams { start: Vec2; shots: Vec2[]; hole: Vec2; walls: [Vec2, Vec2][] }

const shape: ParamsValidator = (p) => {
  if (!isObj(p)) return 'params must be an object';
  if (!isVec2(p.start) || !isVec2(p.hole)) return 'params.start and params.hole must be [x, y]';
  if (!Array.isArray(p.shots) || p.shots.length < 1 || p.shots.length > 3 || !p.shots.every(isVec2)) return 'params.shots must be 1 to 3 vectors [dx, dy] (the solution)';
  if (!Array.isArray(p.walls) || !p.walls.every((w) => Array.isArray(w) && w.length === 2 && w.every(isVec2))) return 'params.walls must be a list of segments [[x1, y1], [x2, y2]]';
  return null;
};

/** The listed shots are the solution: they must reach the hole and keep the ball on the field. */
export const validateGolfParams: ParamsValidator = (p) => {
  const bad = shape(p);
  if (bad) return bad;
  const g = p as GolfParams;
  if (!evaluateGolf(g, 'assist', g.shots, null).correct) return 'no solution: the listed shots do not reach the hole (or hit a wall)';
  if (pathPoints(g.start, g.shots).some(([x, y]) => x < -3 || x > 3 || y < -2 || y > 3)) return 'no solution: the path leaves the field (x in [-3, 3], y in [-2, 3])';
  return null;
};
