import { describe, expect, test } from 'vitest';
import { validateCabinet } from '../../src/content/schema';
import { validateHoleParams } from '../../src/arcade/cabinets/hole-in-the-wall/params';

const meta = {
  id: 'hole-in-the-wall', order: 3, name: 'Hole in the Wall', notion: 'A matrix is where î and ĵ land.',
  tiers: [
    { rule: 'assist', banner: 'b1', waves: { guided: 3, fast: 2 } },
    { rule: 'partial', banner: 'b2', waves: { guided: 3, fast: 2 } },
    { rule: 'abstract', banner: 'b3', waves: { guided: 4, fast: 3 } },
  ],
  waveSeconds: { guided: 16, fast: 12 },
  boss: { waves: 2 },
};
const course = [{
  id: 'c1', title: 'Two arrows', text: { guided: 'g', fast: 'f' }, examples: { games: 'x', physics: 'y', sport: 'z' },
  scene: [{ matrix: [[2, 0], [0, 1]], caption: 'stretch', ms: 1200 }],
  check: { kind: 'basis', prompt: 'Where do î and ĵ land?', given: { matrix: [[2, 0], [0, 1]] }, answer: [[2, 0], [0, 1]], tolerance: 0.1 },
}];
const waves = [{ id: 'w1', concept: 'stretch', params: { matrix: [[2, 0], [0, 1]] } }];
const drills = [{ errorKind: 'swapped-columns', label: 'swapped arrows', waves: [{ id: 'd1', concept: 'stretch', params: { matrix: [[2, 0], [1, 1]] } }] }];
const dex = [{ concept: 'stretch', name: 'STRETCH', body: 'Longer arrow, stretched plane.', demo: [[2, 0], [0, 1]] }];
const files = (over: Record<string, unknown> = {}) => ({ 'cabinet.json': meta, 'course.json': course, 'waves.json': waves, 'drills.json': drills, 'dex.json': dex, ...over });

describe('validateCabinet', () => {
  test('accepts a complete cabinet', () => {
    const r = validateCabinet('03-hole-in-the-wall', files(), validateHoleParams);
    expect(r.ok ? [] : r.errors).toEqual([]);
  });
  test('rejects a 1×2 matrix and names the file and the wave id', () => {
    const r = validateCabinet('03-hole-in-the-wall', files({ 'waves.json': [{ id: 'w9', concept: 'stretch', params: { matrix: [[1, 2]] } }] }), validateHoleParams);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toMatch(/waves\.json.*w9/);
  });
  test('lesson examples need games, physics and sport', () => {
    const old = [{ ...course[0], examples: { games: 'x', physics: 'y', ai: 'z' } }];
    const r = validateCabinet('03-hole-in-the-wall', files({ 'course.json': old }), validateHoleParams);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toContain('games, physics and sport');
  });
  test('rejects tiers that are not exactly assist, partial, abstract', () => {
    const r = validateCabinet('03-hole-in-the-wall', files({ 'cabinet.json': { ...meta, tiers: meta.tiers.slice(0, 2) } }), validateHoleParams);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toContain('tiers');
  });
  test('rejects a missing file', () => {
    const { 'dex.json': _, ...rest } = files();
    const r = validateCabinet('03-hole-in-the-wall', rest, validateHoleParams);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toContain('dex.json');
  });
  test('rejects a wave concept that has no Dex card', () => {
    const r = validateCabinet('03-hole-in-the-wall', files({ 'waves.json': [{ id: 'w2', concept: 'shear', params: { matrix: [[1, 1], [0, 1]] } }] }), validateHoleParams);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toContain('shear');
  });
  test('rejects a folder id that does not match cabinet.json', () => {
    expect(validateCabinet('05-squash', files(), validateHoleParams).ok).toBe(false);
  });
  test('rejects an invalid question', () => {
    const bad = [{ ...course[0], check: { kind: 'number', prompt: 'p', given: { matrix: [[1, 0], [0, 1]] }, answer: 'two', tolerance: 0.1 } }];
    expect(validateCabinet('03-hole-in-the-wall', files({ 'course.json': bad }), validateHoleParams).ok).toBe(false);
  });
});
