import type { CabinetContent, Wave } from '../content/types';
import { CABINETS } from './types';
import type { CabinetId } from './types';
import { cabinetState } from './progression';
import type { ProgressV2 } from './progression';

/**
 * Adaptivity rules (spec 2026-11-21-course-as-game §5.7). Pure: the screens decide what to show,
 * these functions decide what the player gets.
 */

/** The rung of the hint ladder after `failures` misses on the same lesson wave. */
export type HintStep = 'named' | 'hint' | 'replay-then-drill' | 'drill';
export function nextHintStep(failures: number): HintStep {
  if (failures <= 1) return 'named';
  if (failures === 2) return 'hint';
  if (failures === 3) return 'replay-then-drill';
  return 'drill';
}

/** The player's most frequent mistake (ties: alphabetical), optionally only among `among`. */
export function topError(p: ProgressV2, among?: string[]): string | null {
  const entries = Object.entries(p.errors).filter(([k, n]) => n > 0 && (!among || among.includes(k)));
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries[0][0];
}

/** The mistake the robot reminds you of when you open this cabinet: your top error, if this cabinet trains it. */
export function reminderFor(p: ProgressV2, c: CabinetContent): string | null {
  const trained = c.drills.filter((d) => d.waves.length > 0 && d.errorKind !== 'other').map((d) => d.errorKind);
  return topError(p, trained);
}

const lastPlayWave = (c: CabinetContent): Wave | null => c.course.filter((s) => s.play).at(-1)?.play?.wave ?? null;

/**
 * The warm-up before a cabinet's lessons: a wave from an earlier, open cabinet.
 * Your top error, when an earlier open cabinet has a drill for it; otherwise the weakest earlier open cabinet.
 */
export function warmUpPick(p: ProgressV2, id: CabinetId, cabinets: Partial<Record<CabinetId, CabinetContent>>): { cabinet: CabinetId; wave: Wave } | null {
  const available = (c: CabinetId) => !!cabinets[c];
  const earlier = CABINETS.slice(0, CABINETS.indexOf(id)).filter((c) => available(c) && cabinetState(p, c, available) !== 'locked');
  if (earlier.length === 0) return null;
  const err = topError(p);
  if (err) {
    for (const c of earlier) {
      const drill = cabinets[c]!.drills.find((d) => d.errorKind === err && d.waves.length > 0);
      if (drill) return { cabinet: c, wave: drill.waves[(p.errors[err] ?? 0) % drill.waves.length] };
    }
  }
  const weakest = earlier.reduce((a, b) => (p.mastery[b] < p.mastery[a] ? b : a));
  const wave = lastPlayWave(cabinets[weakest]!);
  return wave ? { cabinet: weakest, wave } : null;
}

/** Which lessons to show: all of them, or only the last one when the placement test already proved this cabinet. */
export function lessonPlan(p: ProgressV2, id: CabinetId, c: CabinetContent): { steps: number[]; skipped: number } {
  const n = c.course.length;
  if (p.placed.includes(id) && n > 1) return { steps: [n - 1], skipped: n - 1 };
  return { steps: c.course.map((_, k) => k), skipped: 0 };
}

/** The tier a cabinet's game starts at: one up for a cabinet passed in the placement test. */
export const startTier = (p: ProgressV2, id: CabinetId): 0 | 1 => (p.placed.includes(id) ? 1 : 0);
