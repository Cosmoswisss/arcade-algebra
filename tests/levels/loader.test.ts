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
