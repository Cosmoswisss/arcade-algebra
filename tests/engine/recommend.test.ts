import { describe, expect, test } from 'vitest';
import { initialMastery } from '../../src/engine/mastery';
import { recommend } from '../../src/engine/recommend';
import type { Level, Progress, SkillId } from '../../src/engine/types';

const lvl = (id: string, skill: SkillId, extra: Partial<Level> = {}): Level => ({
  id, skill, title: id, prompt: 'p', shape: [[0, 0], [1, 0]], target: { type: 'area', det: 1 },
  movable: ['i'], start: [[1, 0], [0, 1]], snap: 0.5, tolerance: 0.1, hints: [], ...extra,
});
const levels = [
  lvl('v1', 'vectors'), lvl('c1', 'combinations'),
  lvl('t1', 'matrix-transform'), lvl('t2', 'matrix-transform', { targetsError: 'swapped-columns' }),
  lvl('d1', 'determinant'),
];
const progress = (over: Partial<Progress> = {}): Progress => ({ mastery: initialMastery(), completed: [], lastError: null, ...over });

describe('recommend', () => {
  test('targeted level after swapped-columns', () =>
    expect(recommend(levels, progress({ lastError: 'swapped-columns' }))?.id).toBe('t2'));
  test('does not propose determinant while matrix-transform < 0.6', () => {
    const mastery = { ...initialMastery(), vectors: 0.9, combinations: 0.9, 'matrix-transform': 0.5, composition: 0.9 };
    expect(recommend(levels, progress({ mastery, completed: ['v1', 'c1'] }))?.skill).toBe('matrix-transform');
  });
  test('starts at the first skill for a new player', () => expect(recommend(levels, progress())?.id).toBe('v1'));
  test('undefined when everything is done', () =>
    expect(recommend(levels, progress({ completed: levels.map((l) => l.id) }))).toBeUndefined());
});
