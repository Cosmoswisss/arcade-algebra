import { describe, expect, test } from 'vitest';
import { loadContent } from '../../src/content/load';
import { siblingWave } from '../../src/content/lessons';

const { cabinets } = loadContent();

describe('siblingWave', () => {
  const squash = cabinets.squash!;
  const scale = squash.waves.filter((w) => w.concept === 'scale');
  test('gives another wave of the same concept, never the one just missed', () => {
    for (let n = 0; n < 6; n++) {
      const w = siblingWave(squash, scale[0], n);
      expect(w.concept).toBe('scale');
      expect(w.id).not.toBe(scale[0].id);
    }
  });
  test('cycles through the siblings with the attempt number', () => {
    const ids = new Set([0, 1, 2, 3].map((n) => siblingWave(squash, scale[0], n).id));
    expect(ids.size).toBe(Math.min(2, scale.length - 1));
  });
  test('falls back to the same wave when the concept has no other wave', () => {
    const lone = { id: 'lone', concept: 'nothing-else', params: {} };
    expect(siblingWave(squash, lone, 0)).toBe(lone);
  });
  test('every lesson wave has a sibling, so a retry never replays a revealed answer', () => {
    for (const c of Object.values(cabinets)) for (const s of c!.course) {
      if (!s.play) continue;
      const w = siblingWave(c!, s.play.wave, 0);
      expect(w.id, `${c!.meta.id}/${s.id}`).not.toBe(s.play.wave.id);
      expect(JSON.stringify(w.params), `${c!.meta.id}/${s.id}: same numbers as the lesson`).not.toBe(JSON.stringify(s.play.wave.params));
    }
  });
});
