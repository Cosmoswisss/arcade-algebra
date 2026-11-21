import type { CabinetContent } from '../../content/types';
import type { Mode } from '../../engine/types';
import ArcadeStage from './ArcadeStage';
import type { GameFactory } from './ArcadeStage';
import type { WaveOutcome } from './runner';

export interface CabinetViewProps {
  content: CabinetContent;
  createGame: GameFactory;
  mode: Mode;
  /** 1 starts at the partial rule (placement test). */
  startTier?: 0 | 1;
  onWaveResult: (o: WaveOutcome) => { newDex: string | null };
  dex: () => { count: number; total: number; isNew: (concept: string) => boolean };
  onExit: () => void;
}

/** A full cabinet run: the arcade stage driven by the Runner, with the in-game HUD. */
export default function CabinetView({ content, createGame, mode, startTier, onWaveResult, dex, onExit }: CabinetViewProps) {
  return (
    <ArcadeStage
      content={content}
      createGame={createGame}
      label={`${content.meta.name}. Press space to lock in or continue. Tab picks an arrow, the arrow keys move it.`}
      mode={{ kind: 'run', mode, startTier, onWaveResult, dex, onExit }}
    />
  );
}
