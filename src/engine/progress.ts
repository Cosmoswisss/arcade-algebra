import { initialMastery } from './mastery';
import { SKILLS } from './types';
import type { ErrorKind, Progress } from './types';

const ERROR_KINDS: ErrorKind[] = ['swapped-columns', 'sign-flip', 'scale', 'one-column', 'composition-order', 'other'];

export const STORAGE_KEY = 'lag.progress.v1';

const defaults = (): Progress => ({ mastery: initialMastery(), completed: [], lastError: null });

const getStorage = (s?: Storage): Storage | undefined => {
  if (s) return s;
  try { return globalThis.localStorage; } catch { return undefined; }
};

export function loadProgress(storage?: Storage): Progress {
  try {
    const raw = getStorage(storage)?.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const o = JSON.parse(raw);
    const p = defaults();
    if (o && typeof o.mastery === 'object' && o.mastery) {
      for (const s of SKILLS) {
        const v = o.mastery[s];
        if (typeof v === 'number' && v >= 0 && v <= 1) p.mastery[s] = v;
      }
    }
    if (Array.isArray(o?.completed)) p.completed = o.completed.filter((x: unknown) => typeof x === 'string');
    if (ERROR_KINDS.includes(o?.lastError)) p.lastError = o.lastError;
    return p;
  } catch {
    return defaults();
  }
}

export function saveProgress(p: Progress, storage?: Storage): void {
  try { getStorage(storage)?.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* storage unavailable: progress stays in memory */ }
}

export function resetProgress(storage?: Storage): Progress {
  try { getStorage(storage)?.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  return defaults();
}
