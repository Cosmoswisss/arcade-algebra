import type { CabinetContent } from '../content/types';
import type { CabinetId } from '../engine/types';
import ArcadeStage from './kit/ArcadeStage';
import type { ArcadeStageProps } from './kit/ArcadeStage';
import { GAMES } from './registry';

/** The arcade stage for a cabinet by id. Loaded lazily (see `LazyStage` in playable.ts) so PixiJS stays out of the main bundle. */
export default function CabinetStage({ cabinet, ...rest }: Omit<ArcadeStageProps, 'createGame' | 'content'> & { cabinet: CabinetId; content: CabinetContent }) {
  const make = GAMES[cabinet];
  if (!make) return <p className="lead">This game is not available.</p>;
  return <ArcadeStage createGame={make} {...rest} />;
}
