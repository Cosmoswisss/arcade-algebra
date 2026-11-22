import { expect, test } from 'vitest';
import { loadContent } from '../../src/content/load';
import { CABINETS } from '../../src/engine/types';

test('every game is a short run: one wave per tier and one boss wave, 4 waves in both paces', () => {
  const c = loadContent();
  for (const id of CABINETS) {
    const meta = c.cabinets[id]!.meta;
    for (const mode of ['guided', 'fast'] as const) {
      const total = meta.tiers.reduce((n, t) => n + t.waves[mode], 0) + meta.boss.waves;
      expect(total, `${id} ${mode}`).toBe(4);
    }
  }
});
