import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadContent, type LoadedContent as Loaded } from './content/load';
import {
  applyCourseResult, applyTransfer, applyWaveResult, celebrate as celebrateZone, defaultProgress, loadProgressV2, placeFromDiagnostic, resetProgressV2, saveProgressV2,
  type Applied, type CourseResult, type ProgressV2, type TransferAnswers, type TransferAttempt, type WaveResult,
} from './engine/progression';
import type { CabinetId, Mode, Theme } from './engine/types';
import { demoStorage, isDemo } from './demo/demo';

/** In the live-demo mode the progress lives under its own key: a real player's save is never touched. */
const storage = isDemo() ? demoStorage() : undefined;

interface Store {
  progress: ProgressV2;
  content: Loaded;
  setProfile: (mode: Mode, theme: Theme) => void;
  /** Called from the game (outside React's render), so it reads the latest progress from a ref. */
  applyWave: (id: CabinetId, r: WaveResult) => Applied;
  /** The latest progress, for callbacks that run outside React (the game). */
  latest: () => ProgressV2;
  setModeOverride: (id: CabinetId, mode: Mode) => void;
  /** Evidence from a lesson question (the cabinet's lesson screens). */
  recordCourse: (id: CabinetId, r: CourseResult) => void;
  /** Records a finished transfer check and returns it with the estimates before and after. */
  finishTransfer: (answers: TransferAnswers[]) => TransferAttempt;
  placement: (passed: CabinetId[], failed?: CabinetId[], inferred?: CabinetId[]) => void;
  /** The robot said this cleared zone's line on the map: do not say it again. */
  celebrate: (id: CabinetId) => void;
  reset: () => void;
  /** Live-demo mode: replace the whole progress with a prepared scene. */
  loadScene: (p: ProgressV2) => void;
}

const Ctx = createContext<Store | null>(null);
const content = loadContent();
const conceptsOf = (id: CabinetId) => content.cabinets[id]?.dex.map((d) => d.concept);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressV2>(() => loadProgressV2(storage));
  const ref = useRef(progress);
  const commit = useCallback((p: ProgressV2) => { ref.current = p; setProgress(p); saveProgressV2(p, storage); }, []);

  const store = useMemo<Store>(() => ({
    progress, content,
    latest: () => ref.current,
    setProfile: (mode, theme) => commit({ ...ref.current, profile: { mode, theme } }),
    applyWave: (id, r) => { const a = applyWaveResult(ref.current, id, r, conceptsOf(id)); commit(a.next); return a; },
    recordCourse: (id, r) => commit(applyCourseResult(ref.current, id, r, conceptsOf(id))),
    setModeOverride: (id, mode) => commit({ ...ref.current, modeOverride: { ...ref.current.modeOverride, [id]: mode } }),
    finishTransfer: (answers) => { const r = applyTransfer(ref.current, answers, conceptsOf); commit(r.next); return r.attempt; },
    placement: (passed, failed = [], inferred = []) => commit(placeFromDiagnostic(ref.current, passed, failed, conceptsOf, Date.now(), inferred)),
    celebrate: (id) => commit(celebrateZone(ref.current, id)),
    reset: () => { const p = resetProgressV2(storage); ref.current = p; setProgress(p); },
    loadScene: (p) => commit(p),
  }), [progress, commit]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export { defaultProgress };
