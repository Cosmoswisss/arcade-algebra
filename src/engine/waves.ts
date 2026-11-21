import type { CabinetContent, CabinetMeta, Wave } from '../content/types';
import type { Mode } from './types';

export interface RunState {
  mode: Mode;
  waveIndex: number;
  tierIndex: number;
  /** Error kind to train on next, set after a mistake. */
  focus: string | null;
  lastWaveId: string | null;
  lives: number;
  score: number;
  combo: number;
}

const tierEnds = (meta: CabinetMeta, mode: Mode) => {
  let acc = 0;
  return meta.tiers.map((t) => (acc += t.waves[mode]));
};

/** Waves already counted as played when the run starts `startTier` tiers up (placement test). */
const skipped = (meta: CabinetMeta, mode: Mode, startTier: number) => meta.tiers.slice(0, startTier).reduce((n, t) => n + t.waves[mode], 0);

/** Tier (0..2) for a wave index; boss waves stay on the last tier. `startTier` counts the tiers before it as played. */
export function tierFor(meta: CabinetMeta, mode: Mode, waveIndex: number, startTier = 0): number {
  const ends = tierEnds(meta, mode);
  const i = waveIndex + skipped(meta, mode, startTier);
  const k = ends.findIndex((e) => i < e);
  return k === -1 ? meta.tiers.length - 1 : k;
}

export function isBossWave(meta: CabinetMeta, mode: Mode, waveIndex: number, startTier = 0): boolean {
  const ends = tierEnds(meta, mode);
  return waveIndex + skipped(meta, mode, startTier) >= ends[ends.length - 1];
}

/** Seconds a wave lasts: the first tier uses meta.waveSeconds, then ×0.85 per tier, never below 6. */
export function waveSeconds(meta: CabinetMeta, mode: Mode, tierIndex: number): number {
  return Math.max(6, meta.waveSeconds[mode] * Math.pow(0.85, tierIndex));
}

function pick(pool: Wave[], lastId: string | null, rand: () => number): Wave {
  const choices = pool.length > 1 ? pool.filter((w) => w.id !== lastId) : pool;
  return choices[Math.min(choices.length - 1, Math.floor(rand() * choices.length))];
}

/** Next wave: a drill on the last mistake when there is one, otherwise a random wave from the pool. */
export function nextWave(content: CabinetContent, run: RunState, rand: () => number): { wave: Wave; isDrill: boolean; drillLabel?: string } {
  const drill = run.focus ? content.drills.find((d) => d.errorKind === run.focus && d.waves.length > 0) : undefined;
  if (drill) return { wave: pick(drill.waves, run.lastWaveId, rand), isDrill: true, drillLabel: drill.label };
  // Concepts are introduced in dex.json order: one new concept every 2 waves.
  const order = content.dex.map((d) => d.concept);
  const allowed = new Set(order.slice(0, 1 + Math.floor(Math.max(0, run.waveIndex) / 2)));
  const pool = content.waves.filter((w) => allowed.has(w.concept));
  return { wave: pick(pool.length ? pool : content.waves, run.lastWaveId, rand), isDrill: false };
}
