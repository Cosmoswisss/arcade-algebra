import { lazy } from 'react';
import { CABINETS, type CabinetId } from '../engine/types';

/**
 * Cabinets that have a playable game. Kept apart from `registry.ts` so the hall and the lessons
 * do not pull PixiJS in: the game itself is loaded only when a cabinet is opened.
 * Keep it in step with the keys of GAMES in `registry.ts`.
 */
export const PLAYABLE: ReadonlySet<CabinetId> = new Set<CabinetId>(CABINETS);

/** The arcade stage, loaded on demand: PixiJS and the cabinet games arrive only when a stage is shown. */
export const LazyStage = lazy(() => import('./CabinetStage'));
