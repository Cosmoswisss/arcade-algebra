import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadContent, type LoadedContent as Loaded } from './content/load';
import {
  applyWaveResult, defaultProgress, loadProgressV2, placeFromDiagnostic, resetProgressV2, saveProgressV2,
  type Applied, type ProgressV2, type WaveResult,
} from './engine/progression';
import type { CabinetId, Mode, Theme } from './engine/types';

interface Store {
  progress: ProgressV2;
  content: Loaded;
  setProfile: (mode: Mode, theme: Theme) => void;
  /** Called from the game (outside React's render), so it reads the latest progress from a ref. */
  applyWave: (id: CabinetId, r: WaveResult) => Applied;
  /** The latest progress, for callbacks that run outside React (the game). */
  latest: () => ProgressV2;
  setModeOverride: (id: CabinetId, mode: Mode) => void;
  placement: (passed: CabinetId[]) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);
const content = loadContent();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressV2>(() => loadProgressV2());
  const ref = useRef(progress);
  const commit = useCallback((p: ProgressV2) => { ref.current = p; setProgress(p); saveProgressV2(p); }, []);

  const store = useMemo<Store>(() => ({
    progress, content,
    latest: () => ref.current,
    setProfile: (mode, theme) => commit({ ...ref.current, profile: { mode, theme } }),
    applyWave: (id, r) => { const a = applyWaveResult(ref.current, id, r); commit(a.next); return a; },
    setModeOverride: (id, mode) => commit({ ...ref.current, modeOverride: { ...ref.current.modeOverride, [id]: mode } }),
    placement: (passed) => commit(placeFromDiagnostic(ref.current, passed)),
    reset: () => { const p = resetProgressV2(); ref.current = p; setProgress(p); },
  }), [progress, commit]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export { defaultProgress };
