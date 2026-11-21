import { diagnoseVector, vstr } from '../../../engine/diagnoseKinds';
import type { Diagnosis } from '../../../engine/diagnoseKinds';
import type { Rule, Vec2 } from '../../../engine/types';
import type { GolfParams } from './params';

export const HOLE_R = 0.25;
const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];

export const endPoint = (start: Vec2, shots: Vec2[]): Vec2 => shots.reduce(add, start);
export function pathPoints(start: Vec2, shots: Vec2[]): Vec2[] {
  const pts: Vec2[] = [start];
  for (const s of shots) pts.push(add(pts[pts.length - 1], s));
  return pts;
}

const cross = (o: Vec2, a: Vec2, b: Vec2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
/** Proper segment intersection (touching endpoints count as a hit). */
export function segmentsIntersect(p1: Vec2, p2: Vec2, q1: Vec2, q2: Vec2): boolean {
  const d1 = cross(q1, q2, p1), d2 = cross(q1, q2, p2), d3 = cross(p1, p2, q1), d4 = cross(p1, p2, q2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  const on = (a: Vec2, b: Vec2, c: Vec2) => Math.abs(cross(a, b, c)) < 1e-9 && Math.min(a[0], b[0]) - 1e-9 <= c[0] && c[0] <= Math.max(a[0], b[0]) + 1e-9 && Math.min(a[1], b[1]) - 1e-9 <= c[1] && c[1] <= Math.max(a[1], b[1]) + 1e-9;
  return on(q1, q2, p1) || on(q1, q2, p2) || on(p1, p2, q1) || on(p1, p2, q2);
}
export function hitsWall(path: Vec2[], walls: [Vec2, Vec2][]): boolean {
  for (let k = 1; k < path.length; k++) {
    if (path[k][0] === path[k - 1][0] && path[k][1] === path[k - 1][1]) continue;
    for (const [a, b] of walls) if (segmentsIntersect(path[k - 1], path[k], a, b)) return true;
  }
  return false;
}

/** Build mode (assist/partial): the player sets the shots. Abstract mode: the shots are given and the player predicts the landing point. */
export function evaluateGolf(p: GolfParams, rule: Rule, playerShots: Vec2[], predicted: Vec2 | null): { correct: boolean; diagnosis: Diagnosis | null } {
  if (rule === 'abstract') {
    const real = endPoint(p.start, p.shots);
    if (!predicted) return { correct: false, diagnosis: { kind: 'other', text: `The ball stops at ${vstr(real)}.`, wrongParts: [true, true] } };
    const d = diagnoseVector(sub(predicted, p.start), sub(real, p.start), HOLE_R);
    return d ? { correct: false, diagnosis: { ...d, text: `The ball stops at ${vstr(real)}: add the shots one after the other.` } } : { correct: true, diagnosis: null };
  }
  const path = pathPoints(p.start, playerShots);
  if (hitsWall(path, p.walls)) return { correct: false, diagnosis: { kind: 'hit-wall', text: 'Bonk! The ball hit a wall. Split the move into shots that go around it.', wrongParts: [true, true] } };
  const end = path[path.length - 1];
  const d = diagnoseVector(sub(end, p.start), sub(p.hole, p.start), HOLE_R);
  return d ? { correct: false, diagnosis: { ...d, text: `The hole is ${vstr(sub(p.hole, p.start))} away from the start; your shots add up to ${vstr(sub(end, p.start))}.` } } : { correct: true, diagnosis: null };
}

export function goalText(p: GolfParams, rule: Rule): string {
  const n = p.shots.length;
  if (rule === 'assist') return `From ${vstr(p.start)} to the flag at ${vstr(p.hole)}: ${n} shot${n > 1 ? 's' : ''}.`;
  if (rule === 'partial') return `From ${vstr(p.start)} to the flag at ${vstr(p.hole)}: ${n} shot${n > 1 ? 's' : ''}, path hidden.`;
  return `Shots ${p.shots.map(vstr).join(' then ')}: where does the ball stop?`;
}

export function checklist(p: GolfParams, rule: Rule, playerShots: Vec2[]): { label: string; ok: boolean }[] {
  if (rule === 'abstract') return [];
  const end = endPoint(p.start, playerShots);
  const total = { label: `total move ${vstr(sub(end, p.start))}`, ok: Math.hypot(end[0] - p.hole[0], end[1] - p.hole[1]) <= HOLE_R };
  if (rule === 'partial') return [total];
  return [total, { label: 'no wall in the way', ok: !hitsWall(pathPoints(p.start, playerShots), p.walls) }];
}
