import { addEvidence, beliefKey, cabinetEstimate, COURSE_CONCEPT, isBelief, observe, priorBelief, reportedMastery, TRANSFER_CONCEPT } from './belief';
import type { Belief } from './belief';
import { CABINETS, MODES, RULES, THEMES } from './types';
import type { CabinetId, Mode, Rule, Theme } from './types';

export const PROGRESS_KEY = 'linear-arcade.progress.v2';
export const MASTERED = 0.5;
const START = 0.2;

export interface ProgressV2 {
  profile: { mode: Mode; theme: Theme } | null;
  mastery: Record<CabinetId, number>;
  finished: CabinetId[];
  xp: number;
  /** Concepts whose Dex card is unlocked. */
  dex: string[];
  modeOverride: Partial<Record<CabinetId, Mode>>;
  /** Cabinets that were mastered at least once: they keep later cabinets unlocked. */
  everMastered: CabinetId[];
  streak: { cabinet: CabinetId | null; fails: number; firstTryWins: number };
  /** How often each error kind was diagnosed (lessons and cabinets): the robot's memory of your mistakes. */
  errors: Record<string, number>;
  /** Cabinets passed in the placement test: their lessons are skipped and their game starts one tier up. */
  placed: CabinetId[];
  /** Cleared zones whose "repaired" line the robot already said on the map. */
  celebrated: CabinetId[];
  /** Learning method: what the game believes per concept (`cabinet:concept`), with its uncertainty. `cabinet:@course` holds lesson evidence. */
  beliefs: Record<string, Belief>;
  /** Learning method: recurring mistakes, a weight per `cabinet:errorKind`. Grows on a miss, halves when its training wave is won. */
  mistakes: Record<string, number>;
  /** Learning method: how each cabinet was placed by the placement test (the "before" of the transfer check). */
  placementResult: Partial<Record<CabinetId, 'known' | 'missed'>>;
  /** Learning method: the last transfer checks, oldest first. */
  transfers: TransferAttempt[];
}

/** One cabinet's part of a transfer check: the score on new cases, and the estimate before and after. */
export interface TransferResult { cabinet: CabinetId; correct: number; total: number; before: number; beforeSd: number; after: number; afterSd: number }
export interface TransferAttempt { at: number; results: TransferResult[] }
export const MAX_TRANSFERS = 5;
/** A transfer answer (new case, no help) counts this many times a game answer. */
export const TRANSFER_WEIGHT = 1.5;

export interface WaveResult {
  correct: boolean; rule: Rule; firstTry: boolean; concept: string; boss: boolean; cleared?: boolean;
  /** Named mistake on a miss. */
  errorKind?: string;
  /** The mistake this wave was a training for, if it was one. */
  drillKind?: string | null;
}

export const errorKey = (cabinet: CabinetId, kind: string) => `${cabinet}:${kind}`;

/** Dex entries are per cabinet: the same concept can have a card in two cabinets. */
export const dexKey = (cabinet: CabinetId, concept: string) => `${cabinet}:${concept}`;

export const defaultProgress = (): ProgressV2 => ({
  profile: null,
  mastery: Object.fromEntries(CABINETS.map((c) => [c, START])) as Record<CabinetId, number>,
  finished: [], xp: 0, dex: [], modeOverride: {}, everMastered: [],
  streak: { cabinet: null, fails: 0, firstTryWins: 0 },
  errors: {}, placed: [], celebrated: [],
  beliefs: {}, mistakes: {}, placementResult: {}, transfers: [],
});

export const levelOf = (xp: number) => Math.floor(xp / 100) + 1;

export const modeFor = (p: ProgressV2, id: CabinetId): Mode => p.modeOverride[id] ?? p.profile?.mode ?? 'guided';

const isMastered = (p: ProgressV2, id: CabinetId) => p.mastery[id] >= MASTERED - 1e-9;

/** Alias used by the screens. */
export const effectiveMode = modeFor;

export type CabinetState = 'locked' | 'open' | 'mastered' | 'finished';

/** `available` tells which cabinets are playable; earlier cabinets that are not built yet never block the next ones. */
export function cabinetState(p: ProgressV2, id: CabinetId, available: (c: CabinetId) => boolean = () => true): CabinetState {
  if (p.finished.includes(id)) return 'finished';
  if (isMastered(p, id)) return 'mastered';
  const earlier = CABINETS.slice(0, CABINETS.indexOf(id)).filter(available);
  return earlier.every((c) => p.finished.includes(c) || isMastered(p, c) || p.everMastered.includes(c)) ? 'open' : 'locked';
}

export interface Applied {
  next: ProgressV2;
  xpGained: number;
  /** Concept whose Dex card was just unlocked, if any. */
  newDex: string | null;
  /** A pace change to propose to the player (never imposed). */
  suggestMode: Mode | null;
}

/** Folds new evidence into the beliefs and refreshes the cabinet's mastery number. */
function withBeliefs(p: ProgressV2, id: CabinetId, beliefs: Record<string, Belief>, concepts?: string[]): Pick<ProgressV2, 'beliefs' | 'mastery'> {
  return { beliefs, mastery: { ...p.mastery, [id]: reportedMastery(cabinetEstimate(beliefs, id, concepts), MASTERED) } };
}

/** Recurring-mistake weights (`mistakes`) after one more result. */
function withMistakes(mistakes: Record<string, number>, id: CabinetId, r: { correct: boolean; kind?: string | null; drillKind?: string | null }, bump = 1): Record<string, number> {
  const next = { ...mistakes };
  if (!r.correct && r.kind) next[errorKey(id, r.kind)] = (next[errorKey(id, r.kind)] ?? 0) + bump;
  if (r.correct && r.drillKind && next[errorKey(id, r.drillKind)] !== undefined) {
    const k = errorKey(id, r.drillKind); const v = next[k] / 2;
    if (v < 0.25) delete next[k]; else next[k] = v;
  }
  return next;
}

/** `concepts` is the cabinet's full concept list (from its Dex): unseen concepts count at the prior. */
export function applyWaveResult(p: ProgressV2, id: CabinetId, r: WaveResult, concepts?: string[], now = Date.now()): Applied {
  const xpGained = r.correct ? 10 + (r.rule === 'abstract' ? 5 : 0) + (r.boss ? 50 : 0) : 0;
  const key = dexKey(id, r.concept);
  const beliefs = { ...p.beliefs, [key]: observe(p.beliefs[key] ?? priorBelief(), r.correct, r.rule, now) };
  const { mastery } = withBeliefs(p, id, beliefs, concepts);
  const newDex = r.correct && !p.dex.includes(key) ? r.concept : null;
  const finished = r.correct && r.cleared && !p.finished.includes(id) ? [...p.finished, id] : p.finished;
  const everMastered = mastery[id] >= MASTERED - 1e-9 && !p.everMastered.includes(id) ? [...p.everMastered, id] : p.everMastered;

  const errors = !r.correct && r.errorKind ? { ...p.errors, [r.errorKind]: (p.errors[r.errorKind] ?? 0) + 1 } : p.errors;

  const same = p.streak.cabinet === id;
  let fails = r.correct ? 0 : (same ? p.streak.fails : 0) + 1;
  let firstTryWins = r.correct && r.firstTry ? (same ? p.streak.firstTryWins : 0) + 1 : 0;
  const mode = modeFor(p, id);
  let suggestMode: Mode | null = null;
  if (mode === 'fast' && fails >= 2) { suggestMode = 'guided'; fails = 0; }
  if (mode === 'guided' && firstTryWins >= 3) { suggestMode = 'fast'; firstTryWins = 0; }

  return {
    next: { ...p, mastery, beliefs, mistakes: withMistakes(p.mistakes, id, { correct: r.correct, kind: r.errorKind, drillKind: r.drillKind }), finished, everMastered, xp: p.xp + xpGained, dex: newDex ? [...p.dex, key] : p.dex, streak: { cabinet: id, fails, firstTryWins }, errors },
    xpGained, newDex, suggestMode,
  };
}

/** Evidence from one lesson question. A guessable multiple choice counts for less; a retry after a miss counts for less. */
export interface CourseResult { correct: boolean; choice: boolean; retry: boolean; kind?: string | null }

export function applyCourseResult(p: ProgressV2, id: CabinetId, r: CourseResult, concepts?: string[], now = Date.now()): ProgressV2 {
  const key = beliefKey(id, COURSE_CONCEPT);
  const wins = r.correct ? (r.choice ? 0.35 : 0.7) * (r.retry ? 0.5 : 1) : 0;
  const misses = r.correct ? 0 : r.choice ? 0.5 : 0.8;
  const beliefs = { ...p.beliefs, [key]: addEvidence(p.beliefs[key] ?? priorBelief(), wins, misses, now) };
  return { ...p, ...withBeliefs(p, id, beliefs, concepts), mistakes: withMistakes(p.mistakes, id, r, 0.5) };
}

/**
 * Placement: passing a cabinet is strong prior knowledge of all its concepts (it opens the next cabinet and lets the
 * waves skip ahead), but it is not "mastered": only a win with no aid inside the game proves that.
 * `inferred` are cabinets that were not asked but come before a passed one: placed the same way, on half the evidence.
 */
export function placeFromDiagnostic(p: ProgressV2, passed: CabinetId[], failed: CabinetId[] = [], conceptsOf: (c: CabinetId) => string[] | undefined = () => undefined, now = Date.now(), inferred: CabinetId[] = []): ProgressV2 {
  const known = [...passed, ...inferred];
  let next: ProgressV2 = { ...p, everMastered: [...new Set([...p.everMastered, ...known])], placed: [...new Set([...p.placed, ...known])], placementResult: { ...p.placementResult, ...Object.fromEntries(known.map((c) => [c, 'known'])), ...Object.fromEntries(failed.map((c) => [c, 'missed'])) } };
  for (const c of [...known, ...failed]) {
    const ok = !failed.includes(c);
    const half = inferred.includes(c) ? 0.5 : 1;
    const concepts = conceptsOf(c);
    const beliefs = { ...next.beliefs };
    for (const name of concepts ?? []) { const k = beliefKey(c, name); beliefs[k] = addEvidence(beliefs[k] ?? priorBelief(), ok ? 2 * half : 0, 0, now); }
    const ck = beliefKey(c, COURSE_CONCEPT);
    beliefs[ck] = addEvidence(beliefs[ck] ?? priorBelief(), ok ? 1.5 * half : 0, ok ? 0 : 1.5, now);
    next = { ...next, ...withBeliefs(next, c, beliefs, concepts) };
  }
  return next;
}

/** The cabinet to highlight: an open, unfinished, available one; the weakest first, then the earliest. */
export function recommendedCabinet(p: ProgressV2, available: (c: CabinetId) => boolean = () => true): CabinetId | null {
  const candidates = CABINETS.filter((c) => available(c) && !p.finished.includes(c) && cabinetState(p, c, available) !== 'locked');
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (p.mastery[b] < p.mastery[a] ? b : a));
}

/** The first cleared zone (in cabinet order) the map has not celebrated yet: the robot says its `story.cleared`. */
export function pendingCelebration(p: ProgressV2): CabinetId | null {
  return CABINETS.find((c) => p.finished.includes(c) && !p.celebrated.includes(c)) ?? null;
}

export function celebrate(p: ProgressV2, id: CabinetId): ProgressV2 {
  return p.celebrated.includes(id) ? p : { ...p, celebrated: [...p.celebrated, id] };
}

const isTransferAttempt = (x: unknown): x is TransferAttempt => {
  const a = x as TransferAttempt;
  return !!a && typeof a.at === 'number' && Array.isArray(a.results) && a.results.every((r) => CABINETS.includes(r?.cabinet) && [r.correct, r.total, r.before, r.beforeSd, r.after, r.afterSd].every((n) => typeof n === 'number' && Number.isFinite(n)));
};

/** One cabinet's transfer answers: unaided, on new cases. Each is strong evidence, and a win is proof of mastery. */
export interface TransferAnswers { cabinet: CabinetId; outcomes: { correct: boolean; kind?: string | null }[] }

/** Applies a whole transfer check, and records the attempt with the estimates before and after. */
export function applyTransfer(p: ProgressV2, answers: TransferAnswers[], conceptsOf: (c: CabinetId) => string[] | undefined = () => undefined, now = Date.now()): { next: ProgressV2; attempt: TransferAttempt } {
  let next = p;
  const results: TransferResult[] = [];
  for (const { cabinet, outcomes } of answers) {
    const concepts = conceptsOf(cabinet);
    const before = cabinetEstimate(next.beliefs, cabinet, concepts);
    const key = beliefKey(cabinet, TRANSFER_CONCEPT);
    let belief = next.beliefs[key] ?? priorBelief();
    let mistakes = next.mistakes;
    for (const o of outcomes) { belief = observe(belief, o.correct, 'abstract', now, TRANSFER_WEIGHT); mistakes = withMistakes(mistakes, cabinet, o, 0.5); }
    const beliefs = { ...next.beliefs, [key]: belief };
    next = { ...next, ...withBeliefs(next, cabinet, beliefs, concepts), mistakes };
    const after = cabinetEstimate(beliefs, cabinet, concepts);
    results.push({ cabinet, correct: outcomes.filter((o) => o.correct).length, total: outcomes.length, before: before.mean, beforeSd: before.sd, after: after.mean, afterSd: after.sd });
  }
  const attempt: TransferAttempt = { at: now, results };
  return { next: { ...next, transfers: [...next.transfers, attempt].slice(-MAX_TRANSFERS) }, attempt };
}

/** Cabinets worth testing: playable, open, and with something to transfer (placed as known, evidence, or finished). */
export function transferCabinets(p: ProgressV2, available: (c: CabinetId) => boolean = () => true): CabinetId[] {
  return CABINETS.filter((c) => available(c) && cabinetState(p, c, available) !== 'locked'
    && (p.finished.includes(c) || p.placementResult[c] === 'known' || Object.keys(p.beliefs).some((k) => k.startsWith(`${c}:`))));
}

// ---------- storage ----------
const store = (s?: Storage): Storage | undefined => { if (s) return s; try { return globalThis.localStorage; } catch { return undefined; } };

export function loadProgressV2(storage?: Storage): ProgressV2 {
  const p = defaultProgress();
  try {
    const raw = store(storage)?.getItem(PROGRESS_KEY);
    if (!raw) return p;
    const o = JSON.parse(raw);
    // the 'ai' theme was replaced by 'sport': an old save keeps its mode and falls back to 'games'
    const theme = o?.profile?.theme === 'ai' ? 'games' : o?.profile?.theme;
    if (o?.profile && MODES.includes(o.profile.mode) && THEMES.includes(theme)) p.profile = { mode: o.profile.mode, theme };
    if (o?.mastery && typeof o.mastery === 'object') for (const c of CABINETS) { const v = o.mastery[c]; if (typeof v === 'number' && v >= 0 && v <= 1) p.mastery[c] = v; }
    if (Array.isArray(o?.finished)) p.finished = o.finished.filter((c: unknown) => CABINETS.includes(c as CabinetId));
    if (typeof o?.xp === 'number' && Number.isFinite(o.xp) && o.xp >= 0) p.xp = o.xp;
    if (Array.isArray(o?.dex)) p.dex = o.dex.filter((d: unknown) => typeof d === 'string');
    if (Array.isArray(o?.everMastered)) p.everMastered = o.everMastered.filter((c: unknown) => CABINETS.includes(c as CabinetId));
    if (o?.errors && typeof o.errors === 'object') for (const [k, v] of Object.entries(o.errors)) if (typeof v === 'number' && Number.isInteger(v) && v > 0) p.errors[k] = v;
    if (Array.isArray(o?.placed)) p.placed = o.placed.filter((c: unknown) => CABINETS.includes(c as CabinetId));
    if (Array.isArray(o?.celebrated)) p.celebrated = o.celebrated.filter((c: unknown) => CABINETS.includes(c as CabinetId));
    if (o?.beliefs && typeof o.beliefs === 'object') for (const [k, v] of Object.entries(o.beliefs)) if (isBelief(v)) p.beliefs[k] = { a: v.a, b: v.b, abs: v.abs, last: v.last };
    if (o?.mistakes && typeof o.mistakes === 'object') for (const [k, v] of Object.entries(o.mistakes)) if (typeof v === 'number' && Number.isFinite(v) && v > 0) p.mistakes[k] = v;
    if (o?.placementResult && typeof o.placementResult === 'object') for (const c of CABINETS) if (o.placementResult[c] === 'known' || o.placementResult[c] === 'missed') p.placementResult[c] = o.placementResult[c];
    if (Array.isArray(o?.transfers)) p.transfers = o.transfers.filter(isTransferAttempt).slice(-MAX_TRANSFERS);
    if (o?.modeOverride && typeof o.modeOverride === 'object') for (const c of CABINETS) if (MODES.includes(o.modeOverride[c])) p.modeOverride[c] = o.modeOverride[c];
    return p;
  } catch {
    return defaultProgress();
  }
}

export function saveProgressV2(p: ProgressV2, storage?: Storage): void {
  try { store(storage)?.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* storage unavailable: keep progress in memory */ }
}

export function resetProgressV2(storage?: Storage): ProgressV2 {
  try { store(storage)?.removeItem(PROGRESS_KEY); } catch { /* ignore */ }
  return defaultProgress();
}

export { RULES };
