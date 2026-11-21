import { describe, expect, test } from 'vitest';
import { defaultProgress, recommendedCabinet } from '../../src/engine/progression';

describe('recommendedCabinet', () => {
  test('a new player is pointed at the first cabinet', () => {
    expect(recommendedCabinet(defaultProgress())).toBe('vector-golf');
  });
  test('finished cabinets are skipped', () => {
    const p = { ...defaultProgress(), finished: ['vector-golf' as const] };
    expect(recommendedCabinet(p)).toBe('drone');
  });
  test('among open cabinets, the weakest one wins', () => {
    const p = defaultProgress();
    p.mastery = { ...p.mastery, 'vector-golf': 0.9, drone: 0.7, 'hole-in-the-wall': 0.25 };
    expect(recommendedCabinet(p)).toBe('hole-in-the-wall');
  });
  test('unavailable cabinets are never recommended, and do not block later ones', () => {
    expect(recommendedCabinet(defaultProgress(), (c) => c !== 'vector-golf')).toBe('drone');
    expect(recommendedCabinet(defaultProgress(), () => false)).toBeNull();
  });
});
