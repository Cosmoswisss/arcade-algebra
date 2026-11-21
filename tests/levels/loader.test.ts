import { describe, expect, test } from 'vitest';
import { loadLevels, validateLevel } from '../../src/levels/loader';

const specExample = {
  id: 'transform-01',
  skill: 'matrix-transform',
  title: 'Fit the square',
  prompt: 'Drag î and ĵ so the square lands in the hole.',
  shape: [[0, 0], [1, 0], [1, 1], [0, 1]],
  target: { type: 'shape', matrix: [[2, 0], [1, 1]] },
  movable: ['i', 'j'],
  hints: ['Where should the corner (1,0) go?'],
};

describe('validateLevel', () => {
  test('accepts the spec example and fills defaults', () => {
    const { snap, tolerance, ...minimal } = { snap: 0, tolerance: 0, ...specExample };
    const r = validateLevel(minimal);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.level.snap).toBe(0.5);
    expect(r.level.tolerance).toBe(0.1);
    expect(r.level.start).toEqual([[1, 0], [0, 1]]);
  });
  test('rejects an unknown skill', () => {
    const r = validateLevel({ ...specExample, skill: 'magic' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('skill');
  });
  test('rejects an empty shape', () => {
    const r = validateLevel({ ...specExample, shape: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('shape');
  });
  test('rejects a target without a 2x2 matrix', () => {
    expect(validateLevel({ ...specExample, target: { type: 'shape', matrix: [[1, 2]] } }).ok).toBe(false);
  });
  test("rejects movable outside 'i' | 'j' | 'v'", () => {
    expect(validateLevel({ ...specExample, movable: ['k'] }).ok).toBe(false);
  });
  test('error message names the level id', () => {
    const r = validateLevel({ ...specExample, shape: [] });
    if (!r.ok) expect(r.error).toContain('transform-01');
  });
  test('never throws on garbage', () => {
    expect(validateLevel(null).ok).toBe(false);
    expect(validateLevel('hello').ok).toBe(false);
  });
});

describe('loadLevels', () => {
  test('loads the bundled levels without errors', () => {
    const { levels, errors } = loadLevels();
    expect(errors).toEqual([]);
    expect(levels.map((l) => l.id)).toContain('transform-01');
    expect(levels.map((l) => l.id)).toContain('transform-02-swap');
  });
});

import { checkLevel } from '../../src/engine/checkLevel';
import { SKILLS } from '../../src/engine/types';
import type { ErrorKind } from '../../src/engine/types';

describe('bundled content', () => {
  const { levels, errors } = loadLevels();
  test('loads with no errors', () => expect(errors).toEqual([]));
  test('every skill has at least 2 levels', () => {
    for (const s of SKILLS) expect(levels.filter((l) => l.skill === s).length, s).toBeGreaterThanOrEqual(2);
  });
  test('every error kind except other has a targeted level', () => {
    const kinds: ErrorKind[] = ['swapped-columns', 'sign-flip', 'scale', 'one-column', 'composition-order'];
    for (const k of kinds) expect(levels.some((l) => l.targetsError === k), k).toBe(true);
  });
  test('no level is already solved at its starting position', () => {
    for (const l of levels) expect(checkLevel(l, l.start, [-1, 2]), l.id).toBe(false);
  });
});

describe('every bundled level is solvable on the 0.5 snap grid', () => {
  const { levels } = loadLevels();
  const SOLUTIONS: Record<string, { m?: [[number, number], [number, number]]; v?: [number, number] }> = {
    'vectors-01': { m: [[3, 0], [2, 1]] },
    'vectors-02': { m: [[-2, 0], [1, 1]] },
    'combinations-01': { m: [[1.5, 1], [1, 1]] },
    'combinations-02': { m: [[1, 1], [1, -1]] },
    'transform-01': { m: [[2, 0], [1, 1]] },
    'transform-02-swap': { m: [[0, 1], [2, 0]] },
    'transform-03-sign': { m: [[-1, 0], [0, 1]] },
    'error-scale': { m: [[1.5, 0], [0, 1.5]] },
    'error-one-column': { m: [[1, 1], [0, 1]] },
    'composition-01': { m: [[2, 0], [0, 1]] },
    'composition-02-order': { m: [[0, -1], [1, 0]] },
    'det-01': { m: [[2, 0], [0, 1]] },
    'det-02': { m: [[1, 1], [0, 0]] },
    'det-03': { m: [[0, 1], [1, 0]] },
    'inverse-01': { m: [[0.5, 0], [0, 0.5]] },
    'inverse-02': { m: [[1, -1], [0, 1]] },
    'eigen-01': { v: [1, 0] },
    'eigen-02': { v: [1, 1] },
  };
  for (const l of levels) {
    test(l.id, () => {
      const s = SOLUTIONS[l.id];
      expect(s, `add a solution for ${l.id}`).toBeDefined();
      const onGrid = (x: number) => Math.abs(x / l.snap - Math.round(x / l.snap)) < 1e-9;
      if (s.m) expect(s.m.flat().every(onGrid)).toBe(true);
      expect(checkLevel(l, s.m ?? l.start, s.v)).toBe(true);
    });
  }
});
