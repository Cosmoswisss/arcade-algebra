import { describe, expect, test } from 'vitest';
import { loadContent, parseContentFiles } from '../../src/content/load';

describe('parseContentFiles', () => {
  test('a file with broken JSON is reported and other cabinets still load', () => {
    const real = loadContent();
    // take the real bundled hole-in-the-wall files as raw text and add a broken cabinet
    const raw = Object.fromEntries(Object.entries(real.raw).filter(([p]) => p.includes('03-hole-in-the-wall')));
    raw['/content/cabinets/05-squash/cabinet.json'] = '{ "id": }';
    const r = parseContentFiles(raw);
    expect(r.cabinets['hole-in-the-wall']).toBeDefined();
    expect(r.cabinets.squash).toBeUndefined();
    expect(r.errors.join('\n')).toMatch(/05-squash\/cabinet\.json.*invalid JSON/);
  });
});

describe('robot.json', () => {
  test('a broken robot file is reported and the robot stays silent', () => {
    const out = parseContentFiles({ '/content/robot.json': JSON.stringify({ name: 'Bit', events: {}, errors: {} }) });
    expect(out.errors.join('\n')).toContain('robot.json');
    expect(out.robot.events.right).toEqual([]);
  });
  test('a robot line of 3 sentences is refused', () => {
    const events = Object.fromEntries(['right', 'wrong', 'hint', 'retry', 'warmup', 'reminder', 'placementSkip', 'attract'].map((e) => [e, ['Nice.']]));
    const out = parseContentFiles({ '/content/robot.json': JSON.stringify({ name: 'Bit', events: { ...events, right: ['One. Two. Three.'] }, errors: {} }) });
    expect(out.errors.join('\n')).toContain('2 sentences max');
  });
});

describe('bundled content', () => {
  test('loads with no errors', () => expect(loadContent().errors).toEqual([]));
  test('has the hole-in-the-wall cabinet and the shared remedial lessons', () => {
    const c = loadContent();
    expect(c.cabinets['hole-in-the-wall']?.waves.length).toBeGreaterThanOrEqual(6);
    for (const k of ['swapped-columns', 'sign-flip', 'one-column', 'scale', 'composition-order', 'other']) expect(c.remedial[k], k).toBeDefined();
  });
});
