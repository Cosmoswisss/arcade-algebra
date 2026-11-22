import type { CabinetContent, Wave } from './types';

/** A wave of this cabinet by id: waves.json first, then the drills. */
export function findWave(c: CabinetContent, id: string): Wave | null {
  return c.waves.find((w) => w.id === id) ?? c.drills.flatMap((d) => d.waves).find((w) => w.id === id) ?? null;
}

/** Every wave a player can meet in this cabinet: the pool, the drills and the lessons' "Your turn" waves. */
export function allPlayableWaves(c: CabinetContent): Wave[] {
  return [...c.waves, ...c.drills.flatMap((d) => d.waves), ...c.course.flatMap((s) => (s.play ? [s.play.wave] : []))];
}

/**
 * Another wave on the same idea, for a retry after a miss: the miss revealed this wave's answer,
 * so trying it again would test memory, not understanding. Cycles with `n`; falls back to `wave`.
 */
export function siblingWave(c: CabinetContent, wave: Wave, n: number): Wave {
  const pool = c.waves.filter((w) => w.concept === wave.concept && w.id !== wave.id);
  return pool.length ? pool[n % pool.length] : wave;
}
