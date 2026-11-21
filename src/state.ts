import { createContext, useContext } from 'react';
import type { LoadedContent } from './content/load';
import type { ProgressV2 } from './engine/progression';

export interface AppState {
  content: LoadedContent;
  progress: ProgressV2;
  setProgress: (p: ProgressV2 | ((p: ProgressV2) => ProgressV2)) => void;
}
export const AppCtx = createContext<AppState | null>(null);
export const useApp = () => { const s = useContext(AppCtx); if (!s) throw new Error('AppCtx missing'); return s; };
