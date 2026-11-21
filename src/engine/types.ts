export type Vec2 = [number, number];
/** Stored row by row: [[a, b], [c, d]]. Column 1 (a, c) is where î lands, column 2 (b, d) is where ĵ lands. */
export type Mat2 = [[number, number], [number, number]];

export type SkillId =
  | 'vectors' | 'combinations' | 'matrix-transform' | 'composition'
  | 'determinant' | 'inverse' | 'eigen';

export const SKILLS: SkillId[] = [
  'vectors', 'combinations', 'matrix-transform', 'composition', 'determinant', 'inverse', 'eigen',
];

export type ErrorKind =
  | 'swapped-columns' | 'sign-flip' | 'scale' | 'one-column' | 'composition-order' | 'other';

export type Target =
  | { type: 'shape'; matrix: Mat2 }
  | { type: 'point'; from: Vec2; point: Vec2 }
  | { type: 'area'; det: number }
  | { type: 'direction' }; // the player moves v; the matrix is `start`

export type Movable = 'i' | 'j' | 'v';

export interface Level {
  id: string;
  skill: SkillId;
  title: string;
  prompt: string;
  shape: Vec2[];
  target: Target;
  movable: Movable[];
  start: Mat2;
  /** Composition: fixed transformation applied BEFORE the player's. */
  pre?: Mat2;
  snap: number;
  tolerance: number;
  hints: string[];
  targetsError?: ErrorKind;
}

export interface Progress {
  mastery: Record<SkillId, number>;
  completed: string[];
  lastError: ErrorKind | null;
}
