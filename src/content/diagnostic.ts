import { CABINETS } from '../engine/types';
import type { CabinetId } from '../engine/types';
import type { CabinetContent, LessonPlay, Question } from './types';
import { transferQuestions } from './transfer';

export const DIAGNOSED: CabinetId[] = CABINETS.slice(0, 5);

/** One placement item: the last lesson of a course, as a wave to play (`play`) or a question (`question`). */
export interface DiagnosticItem { cabinet: CabinetId; play?: LessonPlay; question?: Question }

/**
 * The placement test: the last lesson of cabinets 1–5 (the ones a beginner might already know).
 * A played lesson is played (at the abstract rule, by the screen); a question lesson asks its question.
 */
export function diagnosticQuestions(cabinets: Partial<Record<CabinetId, CabinetContent>>): DiagnosticItem[] {
  return DIAGNOSED.flatMap((id): DiagnosticItem[] => {
    const last = cabinets[id]?.course.at(-1);
    if (last?.play) return [{ cabinet: id, play: last.play }];
    if (last?.check) return [{ cabinet: id, question: last.check }];
    return [];
  });
}

// ---------- the adaptive placement (learning method) ----------

/** Every cabinet is placed by the adaptive test, the last two included. */
export const PLACEMENT_CABINETS: CabinetId[] = [...CABINETS];

/** One thing to ask: a lesson wave to play, or a question. */
export interface Probe { play?: LessonPlay; question?: Question }

export interface PlanItem {
  cabinet: CabinetId;
  /** Two probes with nothing to guess: the cabinet's last open lesson item, completed with generated questions. */
  probes: Probe[];
  /** Asked instead of the first miss, once: one slip must not send an expert back to the start of a cabinet. */
  spare: Probe | null;
}

/**
 * The probes for one cabinet. A multiple choice is passed by luck a third of the time, so it is never asked:
 * the last lesson that is a played wave or an open question comes first, then generated open questions (new cases).
 */
export function probesFor(content: CabinetContent, seed = 'placement'): { probes: Probe[]; spare: Probe | null } {
  const lesson = [...content.course].reverse().find((s) => s.play || (s.check && s.check.kind !== 'choice'));
  const met = new Set(content.course.map((s) => s.check?.prompt).filter((p): p is string => !!p));
  const generated: Probe[] = transferQuestions(content.meta.id, 4, `${seed}|${content.meta.id}`, met).map((question) => ({ question }));
  const probes: Probe[] = lesson ? [lesson.play ? { play: lesson.play } : { question: lesson.check! }] : [];
  while (probes.length < 2 && generated.length > 0) probes.push(generated.shift()!);
  return { probes, spare: generated.shift() ?? null };
}

export function diagnosticPlan(cabinets: Partial<Record<CabinetId, CabinetContent>>, seed = 'placement'): PlanItem[] {
  return PLACEMENT_CABINETS.filter((id) => cabinets[id]?.course.length).map((id) => ({ cabinet: id, ...probesFor(cabinets[id]!, seed) }));
}

/** A cabinet is passed with at most this many misses (the spare question replaces the first one). */
export const MAX_MISSES = 1;

/**
 * The cabinets form a chain: what comes later needs what comes before. So the test is a binary search along the chain:
 * it asks the middle cabinet, then the middle of what is left, about three cabinets for seven. Passing a cabinet places
 * the ones before it too (they were not asked: they count as `inferred`); missing one leaves the ones after it untested.
 */
export interface PlacementState {
  /** Index in the plan of the cabinet being asked. */
  cab: number;
  /** Probes still to ask for this cabinet. */
  queue: Probe[];
  misses: number;
  /** Cabinets asked and passed / asked and missed. */
  passed: CabinetId[];
  failed: CabinetId[];
  /** Cabinets not asked, placed because a later one was passed. */
  inferred: CabinetId[];
  /** The part of the chain still undecided: plan indexes lo .. hi - 1. */
  lo: number;
  hi: number;
  asked: number;
  done: boolean;
}

const middle = (lo: number, hi: number) => Math.floor((lo + hi) / 2);

export function startPlacement(plan: PlanItem[]): PlacementState {
  const cab = middle(0, plan.length);
  return { cab, queue: plan[cab] ? [...plan[cab].probes] : [], misses: 0, passed: [], failed: [], inferred: [], lo: 0, hi: plan.length, asked: 0, done: plan.length === 0 };
}

export const currentProbe = (s: PlacementState): Probe | null => (s.done ? null : s.queue[0] ?? null);

/** Settles the cabinet being asked, then moves to the middle of what is left (or ends the test). */
function next(plan: PlanItem[], s: PlacementState, ok: boolean): PlacementState {
  const cabinet = plan[s.cab].cabinet;
  const passed = ok ? [...s.passed, cabinet] : s.passed;
  const failed = ok ? s.failed : [...s.failed, cabinet];
  const inferred = ok ? [...s.inferred, ...plan.slice(s.lo, s.cab).map((p) => p.cabinet)] : s.inferred;
  const lo = ok ? s.cab + 1 : s.lo;
  const hi = ok ? s.hi : s.cab;
  if (lo >= hi) return { ...s, passed, failed, inferred, lo, hi, done: true, queue: [] };
  const cab = middle(lo, hi);
  return { ...s, cab, queue: [...plan[cab].probes], misses: 0, passed, failed, inferred, lo, hi };
}

/** Feeds one answer into the test. Pure: the screen and the simulator both use it. */
export function answerPlacement(plan: PlanItem[], s: PlacementState, correct: boolean): PlacementState {
  if (s.done || s.queue.length === 0) return s;
  const rest = s.queue.slice(1);
  const asked = s.asked + 1;
  if (correct) return rest.length === 0 ? next(plan, { ...s, asked, queue: [] }, true) : { ...s, asked, queue: rest };
  const misses = s.misses + 1;
  if (misses > MAX_MISSES) return next(plan, { ...s, asked, misses, queue: [] }, false);
  const spare = plan[s.cab].spare;
  const queue = spare ? [spare, ...rest] : rest;
  // one miss is tolerated: with nothing left to ask, the cabinet is passed
  return queue.length === 0 ? next(plan, { ...s, asked, misses, queue: [] }, true) : { ...s, asked, misses, queue };
}
