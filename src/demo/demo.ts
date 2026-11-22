import type { CabinetId } from '../engine/types';

/**
 * Live-demo mode. Opened with `?demo` in the address (e.g. http://localhost:5173/?demo#/).
 * It changes nothing for a normal player: it only adds a hidden scene switcher, saves under its own key
 * and makes the waves repeat from one rehearsal to the next.
 */
export const isDemo = (): boolean => {
  try { return new URLSearchParams(globalThis.location?.search ?? '').has('demo'); } catch { return false; }
};

export const DEMO_PROGRESS_KEY = 'arcade-algebra.demo.progress';

/** A Storage that keeps the demo's progress apart: every key is rewritten under the demo's own prefix. */
export function demoStorage(base?: Storage): Storage | undefined {
  let real: Storage | undefined = base;
  if (!real) { try { real = globalThis.localStorage; } catch { return undefined; } }
  if (!real) return undefined;
  const k = (key: string) => `${DEMO_PROGRESS_KEY}:${key}`;
  const r = real;
  return {
    getItem: (key: string) => r.getItem(k(key)),
    setItem: (key: string, value: string) => r.setItem(k(key), value),
    removeItem: (key: string) => r.removeItem(k(key)),
    clear: () => {}, key: () => null, length: 0,
  } as Storage;
}

/** A small deterministic random source (mulberry32), seeded from a string: same seed, same waves. */
export function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The tier the next run of a cabinet starts at, set by a demo scene (null: the normal rule). */
/** `nonce` grows with each scene loaded, so a scene reloaded on the same screen starts that screen afresh. */
export const demoRun: { cabinet: CabinetId | null; startTier: 0 | 1 | 2 | null; nonce: number } = { cabinet: null, startTier: null, nonce: 0 };
