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
  streak: { cabinet: CabinetId | null; fails: number; firstTryWins: number };
}

export interface WaveResult { correct: boolean; rule: Rule; firstTry: boolean; concept: string; boss: boolean }

export const defaultProgress = (): ProgressV2 => ({
  profile: null,
  mastery: Object.fromEntries(CABINETS.map((c) => [c, START])) as Record<CabinetId, number>,
  finished: [], xp: 0, dex: [], modeOverride: {},
  streak: { cabinet: null, fails: 0, firstTryWins: 0 },
});

export const levelOf = (xp: number) => Math.floor(xp / 100) + 1;

export const modeFor = (p: ProgressV2, id: CabinetId): Mode => p.modeOverride[id] ?? p.profile?.mode ?? 'guided';

const isMastered = (p: ProgressV2, id: CabinetId) => p.mastery[id] >= MASTERED - 1e-9;

export function cabinetState(p: ProgressV2, id: CabinetId): 'locked' | 'open' | 'mastered' | 'finished' {
  if (p.finished.includes(id)) return 'finished';
  if (isMastered(p, id)) return 'mastered';
  const earlier = CABINETS.slice(0, CABINETS.indexOf(id));
  return earlier.every((c) => p.finished.includes(c) || isMastered(p, c)) ? 'open' : 'locked';
}

/** Aids make a win weaker evidence: treated like hints in the v1 mastery model. */
const HINTS_FOR_RULE: Record<Rule, number> = { assist: 2, partial: 1, abstract: 0 };

export function applyWaveResult(p: ProgressV2, id: CabinetId, r: WaveResult): { next: ProgressV2; xpGained: number; newDex: string | null; suggestMode: Mode | null } {
  const xpGained = r.correct ? 10 + (r.rule === 'abstract' ? 5 : 0) + (r.boss ? 50 : 0) : 0;
  const mastery = { ...p.mastery, [id]: updateMastery(p.mastery[id], r.correct, HINTS_FOR_RULE[r.rule]) };
  const newDex = r.correct && !p.dex.includes(r.concept) ? r.concept : null;
  const finished = r.correct && r.boss && !p.finished.includes(id) ? [...p.finished, id] : p.finished;

  const same = p.streak.cabinet === id;
  let fails = r.correct ? 0 : (same ? p.streak.fails : 0) + 1;
  let firstTryWins = r.correct && r.firstTry ? (same ? p.streak.firstTryWins : 0) + 1 : 0;
  const mode = modeFor(p, id);
  let suggestMode: Mode | null = null;
  if (mode === 'fast' && fails >= 2) { suggestMode = 'guided'; fails = 0; }
  if (mode === 'guided' && firstTryWins >= 3) { suggestMode = 'fast'; firstTryWins = 0; }

  return {
    next: { ...p, mastery, finished, xp: p.xp + xpGained, dex: newDex ? [...p.dex, newDex] : p.dex, streak: { cabinet: id, fails, firstTryWins } },
    xpGained, newDex, suggestMode,
  };
}

export function placeFromDiagnostic(p: ProgressV2, passed: CabinetId[]): ProgressV2 {
  const mastery = { ...p.mastery };
  for (const c of passed) mastery[c] = Math.max(mastery[c], 0.7);
  return { ...p, mastery };
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
