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
  story: { intro: 'The wall lost its rule.', cleared: 'The wall works again.' },
};
const lesson = (id: string, over: Record<string, unknown> = {}) => ({
  id, title: 'Two arrows', text: { guided: 'g', fast: 'f' }, examples: { games: 'x', physics: 'y', sport: 'z' },
  robot: 'Watch the arrows. Then you try.',
  demo: { wave: 'w1', rule: 'assist' },
  play: { wave: { id: `lesson-${id}`, concept: 'stretch', params: { matrix: [[2, 0], [0, 1]] } }, rule: 'assist', mission: { games: 'a', physics: 'b', sport: 'c' } },
  ...over,
});
const check = { kind: 'basis', prompt: 'Where do î and ĵ land?', given: { matrix: [[2, 0], [0, 1]] }, answer: [[2, 0], [0, 1]], tolerance: 0.1 };
const course = [lesson('c1'), lesson('c2'), { ...lesson('c3'), play: undefined, check }];
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
    const old = [{ ...course[0], examples: { games: 'x', physics: 'y', ai: 'z' } }, course[1], course[2]];
    const r = validateCabinet('03-hole-in-the-wall', files({ 'course.json': old }), validateHoleParams);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toContain('games, physics and sport');
  });
  const errs = (over: Record<string, unknown>) => {
    const r = validateCabinet('03-hole-in-the-wall', files(over), validateHoleParams);
    return r.ok ? '' : r.errors.join('\n');
  };
  test('a lesson needs a demo', () => expect(errs({ 'course.json': [{ ...lesson('c1'), demo: undefined }, lesson('c2'), course[2]] })).toContain('course.json#c1: demo is required'));
  test('a lesson has exactly one of play or check', () => {
    expect(errs({ 'course.json': [{ ...lesson('c1'), check }, lesson('c2'), course[2]] })).toContain('exactly one of play or check');
    expect(errs({ 'course.json': [{ ...lesson('c1'), play: undefined }, lesson('c2'), course[2]] })).toContain('exactly one of play or check');
  });
  test('the demo wave must exist', () => expect(errs({ 'course.json': [lesson('c1', { demo: { wave: 'nope', rule: 'assist' } }), lesson('c2'), course[2]] })).toContain('demo wave "nope" not found'));
  test('play params go through the cabinet validator and name the lesson', () => {
    const bad = lesson('c1', { play: { wave: { id: 'x', concept: 'stretch', params: { matrix: [[1, 2]] } }, rule: 'assist', mission: { games: 'a', physics: 'b', sport: 'c' } } });
    expect(errs({ 'course.json': [bad, lesson('c2'), course[2]] })).toMatch(/course\.json#c1.*play/);
  });
  test('a play mission needs the three themes', () => {
    const bad = lesson('c1', { play: { ...lesson('c1').play, mission: { games: 'a', physics: 'b' } } });
    expect(errs({ 'course.json': [bad, lesson('c2'), course[2]] })).toContain('mission');
  });
  test('a play wave without a solution is refused at load and names the lesson (Review Focus 2)', () => {
    const bad = lesson('c1', { play: { ...lesson('c1').play, wave: { id: 'x', concept: 'stretch', params: { matrix: [[0.3, 0], [0, 1]] } } } });
    expect(errs({ 'course.json': [bad, lesson('c2'), course[2]] })).toMatch(/course\.json#c1.*no solution/);
  });
  test('a robot line is 2 sentences at most', () => expect(errs({ 'course.json': [lesson('c1', { robot: 'One. Two. Three.' }), lesson('c2'), course[2]] })).toContain('robot line: 2 sentences max'));
  test('cabinet.json needs a story', () => expect(errs({ 'cabinet.json': { ...meta, story: { intro: 'x' } } })).toContain('story'));
  test('at least 2 lessons must be play', () => expect(errs({ 'course.json': [lesson('c1'), course[2], { ...course[2], id: 'c4' }] })).toContain('at least 2 lessons must be play'));
  test('a play concept needs a Dex card', () => {
    const bad = lesson('c1', { play: { ...lesson('c1').play, wave: { id: 'x', concept: 'mystery', params: { matrix: [[2, 0], [0, 1]] } } } });
    expect(errs({ 'course.json': [bad, lesson('c2'), course[2]] })).toContain('mystery');
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
