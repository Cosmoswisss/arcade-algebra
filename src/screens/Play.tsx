import { useState } from 'react';
import CabinetView from '../arcade/kit/CabinetView';
import type { WaveOutcome } from '../arcade/kit/runner';
import { GAMES } from '../arcade/registry';
import { dexKey, effectiveMode } from '../engine/progression';
import type { CabinetId, Mode } from '../engine/types';
import { go, href } from '../router';
import { useStore } from '../store';

export function Play({ id }: { id: CabinetId }) {
  const { progress, content, applyWave, latest, setModeOverride } = useStore();
  const cabinet = content.cabinets[id];
  const make = GAMES[id];
  const [toast, setToast] = useState('');
  const [suggest, setSuggest] = useState<Mode | null>(null);
  // The pace is fixed for the whole run; a suggestion accepted mid-run applies to the next run.
  const [mode] = useState<Mode>(() => effectiveMode(progress, id));

  if (!cabinet || !make) {
    return (
      <main className="narrow">
        <h1>This game is not available</h1>
        <p className="lead">Its game or its content is missing or broken. The hall lists what is wrong.</p>
        <a className="btn btn-primary" href={href.hall}>Back to the hall</a>
      </main>
    );
  }

  const onWave = (o: WaveOutcome) => {
    const a = applyWave(id, o);
    const parts: string[] = [];
    if (a.xpGained > 0) parts.push(`+${a.xpGained} XP`);
    if (a.newDex) parts.push('new Transform Dex card');
    if (o.correct && o.cleared) parts.push('badge earned');
    setToast(parts.join(' · '));
    if (a.suggestMode) setSuggest(a.suggestMode);
    return { newDex: a.newDex };
  };

  const dex = () => {
    const owned = latest().dex;
    return {
      count: cabinet.dex.filter((d) => owned.includes(dexKey(id, d.concept))).length,
      total: cabinet.dex.length,
      isNew: (concept: string) => !owned.includes(dexKey(id, concept)),
    };
  };

  return (
    <div className="play">
      <CabinetView
        key={`${id}-${mode}`}
        content={cabinet}
        createGame={make}
        mode={mode}
        onWaveResult={onWave}
        dex={dex}
        onExit={() => go(href.hall)}
      />
      <p className="toast" role="status">{toast}</p>
      {suggest && (
        <div className="suggest" role="dialog" aria-label="Pace suggestion">
          <p>{suggest === 'guided' ? 'Two misses in a row. Want more step-by-step help on this game?' : 'Three clean wins in a row. Want shorter lessons and faster rules on this game?'}</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => { setModeOverride(id, suggest); setSuggest(null); }}>
              {suggest === 'guided' ? 'Yes, guide me' : 'Yes, speed up'}
            </button>
            <button className="btn btn-secondary" onClick={() => setSuggest(null)}>No thanks</button>
          </div>
          <p className="tiny">Applies from your next run.</p>
        </div>
      )}
    </div>
  );
}
