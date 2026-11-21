import { updateMastery } from './mastery';
import { CABINETS, MODES, RULES, THEMES } from './types';
import type { CabinetId, Mode, Rule, Theme } from './types';

export const PROGRESS_KEY = 'linear-arcade.progress.v2';
export const MASTERED = 0.6;
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
}

export interface WaveResult { correct: boolean; rule: Rule; firstTry: boolean; concept: string; boss: boolean; cleared?: boolean }

/** Dex entries are per cabinet: the same concept can have a card in two cabinets. */
export const dexKey = (cabinet: CabinetId, concept: string) => `${cabinet}:${concept}`;

export const defaultProgress = (): ProgressV2 => ({
  profile: null,
  mastery: Object.fromEntries(CABINETS.map((c) => [c, START])) as Record<CabinetId, number>,
  finished: [], xp: 0, dex: [], modeOverride: {}, everMastered: [],
  streak: { cabinet: null, fails: 0, firstTryWins: 0 },
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

/** Aids make a win weaker evidence: treated like hints in the v1 mastery model. */
const HINTS_FOR_RULE: Record<Rule, number> = { assist: 2, partial: 1, abstract: 0 };

export interface Applied {
  next: ProgressV2;
  xpGained: number;
  /** Concept whose Dex card was just unlocked, if any. */
  newDex: string | null;
  /** A pace change to propose to the player (never imposed). */
  suggestMode: Mode | null;
}

export function applyWaveResult(p: ProgressV2, id: CabinetId, r: WaveResult): Applied {
  const xpGained = r.correct ? 10 + (r.rule === 'abstract' ? 5 : 0) + (r.boss ? 50 : 0) : 0;
  const mastery = { ...p.mastery, [id]: updateMastery(p.mastery[id], r.correct, HINTS_FOR_RULE[r.rule]) };
  const key = dexKey(id, r.concept);
  const newDex = r.correct && !p.dex.includes(key) ? r.concept : null;
  const finished = r.correct && r.cleared && !p.finished.includes(id) ? [...p.finished, id] : p.finished;
  const everMastered = mastery[id] >= MASTERED - 1e-9 && !p.everMastered.includes(id) ? [...p.everMastered, id] : p.everMastered;

  const same = p.streak.cabinet === id;
  let fails = r.correct ? 0 : (same ? p.streak.fails : 0) + 1;
  let firstTryWins = r.correct && r.firstTry ? (same ? p.streak.firstTryWins : 0) + 1 : 0;
  const mode = modeFor(p, id);
  let suggestMode: Mode | null = null;
  if (mode === 'fast' && fails >= 2) { suggestMode = 'guided'; fails = 0; }
  if (mode === 'guided' && firstTryWins >= 3) { suggestMode = 'fast'; firstTryWins = 0; }

  return {
    next: { ...p, mastery, finished, everMastered, xp: p.xp + xpGained, dex: newDex ? [...p.dex, key] : p.dex, streak: { cabinet: id, fails, firstTryWins } },
    xpGained, newDex, suggestMode,
  };
}

export function placeFromDiagnostic(p: ProgressV2, passed: CabinetId[]): ProgressV2 {
  const mastery = { ...p.mastery };
  for (const c of passed) mastery[c] = Math.max(mastery[c], 0.7);
  return { ...p, mastery, everMastered: [...new Set([...p.everMastered, ...passed])] };
}

/** The cabinet to highlight: an open, unfinished, available one; the weakest first, then the earliest. */
export function recommendedCabinet(p: ProgressV2, available: (c: CabinetId) => boolean = () => true): CabinetId | null {
  const candidates = CABINETS.filter((c) => available(c) && !p.finished.includes(c) && cabinetState(p, c, available) !== 'locked');
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (p.mastery[b] < p.mastery[a] ? b : a));
}

// ---------- storage ----------
const store = (s?: Storage): Storage | undefined => { if (s) return s; try { return globalThis.localStorage; } catch { return undefined; } };

export function loadProgressV2(storage?: Storage): ProgressV2 {
  const p = defaultProgress();
  try {
    const raw = store(storage)?.getItem(PROGRESS_KEY);
    if (!raw) return p;
    const o = JSON.parse(raw);
    if (o?.profile && MODES.includes(o.profile.mode) && THEMES.includes(o.profile.theme)) p.profile = { mode: o.profile.mode, theme: o.profile.theme };
    if (o?.mastery && typeof o.mastery === 'object') for (const c of CABINETS) { const v = o.mastery[c]; if (typeof v === 'number' && v >= 0 && v <= 1) p.mastery[c] = v; }
    if (Array.isArray(o?.finished)) p.finished = o.finished.filter((c: unknown) => CABINETS.includes(c as CabinetId));
    if (typeof o?.xp === 'number' && Number.isFinite(o.xp) && o.xp >= 0) p.xp = o.xp;
    if (Array.isArray(o?.dex)) p.dex = o.dex.filter((d: unknown) => typeof d === 'string');
    if (Array.isArray(o?.everMastered)) p.everMastered = o.everMastered.filter((c: unknown) => CABINETS.includes(c as CabinetId));
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
