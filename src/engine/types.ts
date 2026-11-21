export type Vec2 = [number, number];
/** Stored row by row: [[a, b], [c, d]]. Column 1 (a, c) is where î lands, column 2 (b, d) is where ĵ lands. */
export type Mat2 = [[number, number], [number, number]];

export type SkillId =
  | 'vectors' | 'combinations' | 'matrix-transform' | 'composition'
  | 'determinant' | 'inverse' | 'eigen';

export const SKILLS: SkillId[] = [
  'vectors', 'combinations', 'matrix-transform', 'composition', 'determinant', 'inverse', 'eigen',
];
