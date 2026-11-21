import type { CabinetId } from '../engine/types';
import type { KitContext } from './kit/context';
import type { CabinetGame } from './kit/runner';
import { createHoleInTheWall } from './cabinets/hole-in-the-wall/game';
import { createVectorGolf } from './cabinets/vector-golf/game';

export type GameFactory = () => CabinetGame & { setup(ctx: KitContext): void };

/** Cabinets whose mini-game exists. The others show "coming soon" on the map. */
export const GAMES: Partial<Record<CabinetId, GameFactory>> = {
  'vector-golf': createVectorGolf,
  'hole-in-the-wall': createHoleInTheWall,
};
