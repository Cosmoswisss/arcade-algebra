import type { CabinetContent, CabinetMeta, Drill, Wave } from '../content/types';
import { evidence, isConceptKnown, mean, spread } from './belief';
import type { Belief } from './belief';
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
  /** Waves a tier was held back because the learner was not ready to move up (see planWave). */
  hold?: number;
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

/** Tier of the first wave of a tier. */
export function tierStart(meta: CabinetMeta, mode: Mode, tier: number): number {
  return meta.tiers.slice(0, tier).reduce((n, t) => n + t.waves[mode], 0);
}

/** Total extra waves a run may spend holding tiers back. */
export const MAX_HOLD = 2;
/** Mean belief needed on the concepts met so far to move up: to partial, to abstract, to the boss. */
export const GATE = [0.25, 0.3, 0.35];

export interface WavePlan { waveIndex: number; tierIndex: number; boss: boolean; hold: number }

/**
 * The tier of the next wave. The plan is by wave count (tiers of 3 waves, then the boss), but the rules only get harder when
 * the learner is ready: before moving up, the concepts met so far must have a belief above the gate. Otherwise the tier is held
 * for one more wave, a few times at most (MAX_HOLD), so nobody is stuck. Without a learner the plan is the plain one.
 */
export function planWave(content: CabinetContent, run: RunState, learner?: Learner, startTier = 0): WavePlan {
  const { meta } = content;
  const waveIndex = run.waveIndex + 1;
  let hold = run.hold ?? 0;
  const stageAt = (index: number) => (isBossWave(meta, run.mode, index, startTier) ? meta.tiers.length : tierFor(meta, run.mode, index, startTier));
  if (learner && waveIndex > 0 && hold < MAX_HOLD) {
    const next = stageAt(waveIndex - hold);
    const prev = stageAt(waveIndex - 1 - hold);
    if (next > prev) {
      const met = content.dex.slice(0, Math.max(1, 1 + Math.floor(waveIndex / 2))).map((d) => learner.belief(d.concept)).filter((b): b is Belief => !!b && evidence(b) > 0);
      const ready = met.length === 0 || met.reduce((s, b) => s + mean(b), 0) / met.length >= GATE[Math.min(GATE.length, next) - 1];
      if (!ready) hold += 1;
    }
  }
  const index = waveIndex - hold;
  return { waveIndex, tierIndex: tierFor(meta, run.mode, index, startTier), boss: isBossWave(meta, run.mode, index, startTier), hold };
}

/** Extra time on every wave: learners said the walls came too fast. */
export const TIME_FACTOR = 1.5;
export const MIN_WAVE_SECONDS = 10;
/** Seconds a wave lasts: 1.5 × meta.waveSeconds on the first tier, then ×0.85 per tier, never below 10. */
export function waveSeconds(meta: CabinetMeta, mode: Mode, tierIndex: number): number {
  return Math.max(MIN_WAVE_SECONDS, meta.waveSeconds[mode] * TIME_FACTOR * Math.pow(0.85, tierIndex));
}

function pick(pool: Wave[], lastId: string | null, rand: () => number): Wave {
  const choices = pool.length > 1 ? pool.filter((w) => w.id !== lastId) : pool;
  return choices[Math.min(choices.length - 1, Math.floor(rand() * choices.length))];
}

/** What the wave picker may know about the learner. Everything is optional: without it the picker is the plain v2 one. */
export interface Learner {
  belief(concept: string): Belief | undefined;
  /** Recurring-mistake weights for this cabinet, by error kind. */
  errors(): Record<string, number>;
  /** ms, injectable for tests. */
  now?: number;
}

const DAY = 86_400_000;
/** Below this weight a mistake is a slip, not a pattern. */
const RECURRING = 1.5;
const RECURRING_CHANCE = 0.3;

/** How much a concept deserves another wave: weak, unsure and long-unseen concepts first. */
export function conceptNeed(b: Belief | undefined, now: number): number {
  if (!b || evidence(b) === 0) return 0.9; // never seen: introduce it
  const staleDays = b.last > 0 ? Math.min(7, Math.max(0, (now - b.last) / DAY)) : 0;
  return 0.1 + (1 - mean(b)) + spread(b) + 0.05 * staleDays;
}

function pickWeighted<T>(items: T[], weight: (t: T) => number, rand: () => number): T {
  const w = items.map((t) => Math.max(0.01, weight(t)));
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let k = 0; k < items.length; k++) { r -= w[k]; if (r <= 0) return items[k]; }
  return items[items.length - 1];
}

/**
 * Next wave:
 *  1. a drill on the mistake just made;
 *  2. otherwise, now and then, a drill on a mistake this learner keeps making (across sessions);
 *  3. otherwise a wave on the concept the learner needs most among the ones introduced so far.
 * Concepts are introduced in dex.json order, one every 2 waves, or sooner when the previous one is already known.
 */
export function nextWave(content: CabinetContent, run: RunState, rand: () => number, learner?: Learner): { wave: Wave; isDrill: boolean; drillLabel?: string; drillKind?: string; recurring?: boolean } {
  const drillFor = (kind: string) => content.drills.find((d) => d.errorKind === kind && d.waves.length > 0);
  const asDrill = (d: Drill, recurring = false) => ({ wave: pick(d.waves, run.lastWaveId, rand), isDrill: true, drillLabel: d.label, drillKind: d.errorKind, recurring });

  const now = learner?.now ?? Date.now();
  const focusDrill = run.focus ? drillFor(run.focus) : undefined;
  if (focusDrill) return asDrill(focusDrill);

  if (learner && run.waveIndex >= 2 && rand() < RECURRING_CHANCE) {
    const worst = Object.entries(learner.errors()).filter(([k, v]) => k !== 'other' && v >= RECURRING && drillFor(k)).sort((a, b) => b[1] - a[1])[0];
    if (worst) return asDrill(drillFor(worst[0])!, true);
  }

  const order = content.dex.map((d) => d.concept);
  const unlocked = 1 + Math.floor(Math.max(0, run.waveIndex) / 2);
  const allowed = new Set(order.filter((c, k) => k < unlocked || order.slice(0, k).every((e) => isConceptKnown(learner?.belief(e)))));
  const pool = content.waves.filter((w) => allowed.has(w.concept));
  const candidates = pool.length ? pool : content.waves;
  if (!learner) return { wave: pick(candidates, run.lastWaveId, rand), isDrill: false };
  const concepts = [...new Set(candidates.map((w) => w.concept))];
  const concept = pickWeighted(concepts, (c) => conceptNeed(learner.belief(c), now), rand);
  return { wave: pick(candidates.filter((w) => w.concept === concept), run.lastWaveId, rand), isDrill: false };
}
