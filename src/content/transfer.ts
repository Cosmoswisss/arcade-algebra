import type { Mat2, Vec2 } from '../engine/types';
import type { CabinetId } from '../engine/types';
import type { Question } from './types';

/**
 * The transfer check: new cases, built on the spot, for each cabinet. Open questions only (a point, arrows, a number):
 * a multiple choice can be passed by luck. The matrix is written in the prompt and the plane stays plain, so there is no
 * picture to read the answer from. Answers stay inside what the lesson plane can show and click.
 */

type Rand = () => number;

/** Small seeded generator (mulberry32), so a seed always gives the same questions. */
export function seeded(seed: string): Rand {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const choose = <T,>(r: Rand, xs: T[]): T => xs[Math.floor(r() * xs.length)];
const IDENTITY: Mat2 = [[1, 0], [0, 1]];
const half = (x: number) => Math.abs(x * 2 - Math.round(x * 2)) < 1e-9;
/** What the lesson plane lets the player click or set. */
const inPlane = (v: Vec2) => Math.abs(v[0]) <= 4 && Math.abs(v[1]) <= 3.5 && v.every(half);
const inArrows = (m: Mat2) => m.every((row) => row.every((x) => Math.abs(x) <= 3 && half(x)));
const fmt = (x: number) => (x < 0 ? `−${Math.abs(x)}` : String(x));
const v2 = (v: Vec2) => `(${fmt(v[0])}, ${fmt(v[1])})`;
const apply = (m: Mat2, v: Vec2): Vec2 => [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];
const mul = (a: Mat2, b: Mat2): Mat2 => [[a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]], [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]]];
const cols = (m: Mat2) => `î → ${v2([m[0][0], m[1][0]])} and ĵ → ${v2([m[0][1], m[1][1]])}`;
const det = (m: Mat2) => m[0][0] * m[1][1] - m[0][1] * m[1][0];

/** "2u − v", "−u + 3v": signs written as a person would write them. */
const term = (k: number, name: string) => `${Math.abs(k) === 1 ? '' : Math.abs(k)}${name}`;
const combo = (p: number, q: number) => `${p < 0 ? '−' : ''}${term(p, 'u')} ${q < 0 ? '−' : '+'} ${term(q, 'v')}`;

const TOL = { point: 0.26, basis: 0.11, number: 0.25 };

const point = (prompt: string, answer: Vec2, marker?: Vec2): Question => ({ kind: 'point', prompt, given: { matrix: IDENTITY, ...(marker ? { vectors: [marker] } : {}) }, answer, tolerance: TOL.point });
const basis = (prompt: string, answer: Mat2): Question => ({ kind: 'basis', prompt, given: { matrix: IDENTITY }, answer, tolerance: TOL.basis });
const number = (prompt: string, answer: number): Question => ({ kind: 'number', prompt, given: { matrix: IDENTITY }, answer, tolerance: TOL.number });

const MACHINES: { name: string; m: Mat2 }[] = [
  { name: 'TURN (a quarter turn left)', m: [[0, -1], [1, 0]] },
  { name: 'STRETCH (×2 along x)', m: [[2, 0], [0, 1]] },
  { name: 'SHEAR (î stays, ĵ goes to (1, 1))', m: [[1, 1], [0, 1]] },
  { name: 'FLIP (upside down)', m: [[1, 0], [0, -1]] },
];

/** One generator per cabinet. Each returns a question; the caller retries when it repeats or fails (null). */
const MAKERS: Record<CabinetId, (r: Rand) => Question | null> = {
  'vector-golf': (r) => {
    const s: Vec2 = [int(r, -2, 2), int(r, -2, 2)];
    const a: Vec2 = [int(r, -3, 3), int(r, -3, 3)];
    const b: Vec2 = [int(r, -2, 2), int(r, -2, 2)];
    const k = choose(r, [-1, 2, 3]);
    const end: Vec2 = [s[0] + a[0] + k * b[0], s[1] + a[1] + k * b[1]];
    if (!inPlane(end) || (b[0] === 0 && b[1] === 0) || (a[0] === 0 && a[1] === 0)) return null;
    return point(`The ball starts at the marked point ${v2(s)}. Shot 1 = ${v2(a)}, then shot 2 = ${fmt(k)} × ${v2(b)}. Click where it lands.`, end, s);
  },
  drone: (r) => {
    const u: Vec2 = [int(r, -2, 2), int(r, -2, 2)];
    const v: Vec2 = [int(r, -2, 2), int(r, -2, 2)];
    const p = int(r, -2, 3), q = int(r, -2, 3);
    const end: Vec2 = [p * u[0] + q * v[0], p * u[1] + q * v[1]];
    if (u[0] * v[1] - u[1] * v[0] === 0 || !inPlane(end) || p === 0 || q === 0) return null;
    return point(`u = ${v2(u)} and v = ${v2(v)}. Click the point you reach with ${combo(p, q)}.`, end);
  },
  'hole-in-the-wall': (r) => {
    if (r() < 0.5) {
      const m: Mat2 = [[int(r, -1, 2), int(r, -1, 2)], [int(r, -1, 2), int(r, -1, 2)]];
      const x: Vec2 = [int(r, -2, 2), int(r, -2, 2)];
      const end = apply(m, x);
      if (det(m) === 0 || (x[0] === 0 && x[1] === 0) || !inPlane(end)) return null;
      return point(`A matrix sends ${cols(m)}. Place the point where ${v2(x)} lands.`, end);
    }
    const kind = int(r, 0, 3);
    if (kind === 0) { const kx = choose(r, [0.5, 1.5, 3, -1, -2]), ky = choose(r, [0.5, 1.5, 2, -1]); return basis(`Stretch the plane by ${fmt(kx)} along x and by ${fmt(ky)} along y. Drag î and ĵ to the right spots.`, [[kx, 0], [0, ky]]); }
    if (kind === 1) { const s = choose(r, [-2, -1, 1, 2]); return basis(`Lean the plane: î stays where it is and ĵ lands on ${v2([s, 1])}. Drag the arrows.`, [[1, s], [0, 1]]); }
    if (kind === 2) return basis('Turn the plane a quarter turn to the right (clockwise). Drag the arrows.', [[0, 1], [-1, 0]]);
    return basis('Mirror the plane left to right (x becomes −x, y stays). Drag the arrows.', [[-1, 0], [0, 1]]);
  },
  factory: (r) => {
    const i = int(r, 0, MACHINES.length - 1);
    let j = int(r, 0, MACHINES.length - 1);
    if (j === i) j = (j + 1) % MACHINES.length;
    const [first, second] = [MACHINES[i], MACHINES[j]];
    const x: Vec2 = [int(r, -2, 2), int(r, -2, 2)];
    const end = apply(mul(second.m, first.m), x);
    const swapped = apply(mul(first.m, second.m), x);
    if ((x[0] === 0 && x[1] === 0) || !inPlane(end) || (end[0] === swapped[0] && end[1] === swapped[1])) return null;
    return point(`The point ${v2(x)} goes through ${first.name} first, then ${second.name}. Where does it come out?`, end);
  },
  squash: (r) => {
    const m: Mat2 = [[int(r, -2, 3), int(r, -2, 3)], [int(r, -2, 3), int(r, -2, 3)]];
    const d = det(m);
    if (Math.abs(d) > 4 || d === 3 || d === -1) return null;
    return number(`A matrix sends ${cols(m)}. What is its determinant?`, d);
  },
  rewind: (r) => {
    const t = choose(r, [-2, -1, 1, 2]);
    const pool: { m: Mat2; inv: Mat2 }[] = [
      { m: [[1, t], [0, 1]], inv: [[1, -t], [0, 1]] },
      { m: [[1, 0], [t, 1]], inv: [[1, 0], [-t, 1]] },
      { m: [[2, 0], [0, -1]], inv: [[0.5, 0], [0, -1]] },
      { m: [[0, 1], [-1, 0]], inv: [[0, -1], [1, 0]] },
      { m: [[-2, 0], [0, 2]], inv: [[-0.5, 0], [0, 0.5]] },
    ];
    const c = choose(r, pool);
    if (!inArrows(c.inv)) return null;
    return basis(`A matrix sends ${cols(c.m)}. Drag the arrows to build its inverse, the matrix that undoes it.`, c.inv);
  },
  'laser-lab': (r) => {
    const a = int(r, -3, 3), d = int(r, -3, 3), b = choose(r, [-2, -1, 1, 2]);
    if (a === 0 || d === 0 || a === d) return null;
    if (r() < 0.5) return number(`A matrix sends ${cols([[a, b], [0, d]])}. By what factor is a vector along the x axis stretched?`, a);
    return number(`A matrix sends ${cols([[a, 0], [b, d]])}. By what factor is a vector along the y axis stretched?`, d);
  },
};

/**
 * `n` new, distinct questions for a cabinet. `avoid` holds prompts the learner has already met (the lesson questions),
 * so a transfer question is never a lesson question.
 */
export function transferQuestions(cabinet: CabinetId, n: number, seed: string, avoid: ReadonlySet<string> = new Set()): Question[] {
  const r = seeded(`${cabinet}|${seed}`);
  const out: Question[] = [];
  const seen = new Set(avoid);
  for (let tries = 0; out.length < n && tries < 400; tries++) {
    const q = MAKERS[cabinet](r);
    if (!q || seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}

export const TRANSFER_PER_CABINET = 2;
/** At the end of one cabinet there is only one cabinet to check, so a few more questions. */
export const TRANSFER_AT_END = 3;
