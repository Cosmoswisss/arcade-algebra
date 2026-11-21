import { useState } from 'react';
import CabinetView from '../arcade/kit/CabinetView';
import type { WaveOutcome } from '../arcade/kit/runner';
import { GAMES } from '../arcade/registry';
import { startTier } from '../engine/adapt';
import { beliefKey, evidence, mean, priorBelief, spread } from '../engine/belief';
import { changeLine } from '../engine/insight';
import { dexKey, effectiveMode } from '../engine/progression';
import type { CabinetId, Mode } from '../engine/types';
import type { Learner } from '../engine/waves';
import { go, href } from '../router';
import { useStore } from '../store';

export function Play({ id }: { id: CabinetId }) {
  const { progress, content, applyWave, latest, setModeOverride } = useStore();
  const cabinet = content.cabinets[id];
  const make = GAMES[id];
  const [toast, setToast] = useState('');
  const [logged, setLogged] = useState('');
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

  // Read through `latest()` so the Runner always sees the beliefs updated by the previous wave.
  const learner: Learner = {
    belief: (concept) => latest().beliefs[beliefKey(id, concept)],
    errors: () => Object.fromEntries(Object.entries(latest().mistakes).filter(([k]) => k.startsWith(`${id}:`)).map(([k, v]) => [k.slice(id.length + 1), v])),
  };

  const onWave = (o: WaveOutcome) => {
    const key = beliefKey(id, o.concept);
    const before = latest().beliefs[key] ?? priorBelief();
    const a = applyWave(id, { ...o, errorKind: o.diagnosis?.kind });
    const after = latest().beliefs[key];
    if (after) setLogged(changeLine(cabinet.dex.find((d) => d.concept === o.concept)?.name ?? o.concept, { mean: mean(before), evidence: evidence(before) }, { mean: mean(after), sd: spread(after) }));
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
        startTier={startTier(progress, id)}
        learner={learner}
        onWaveResult={onWave}
        dex={dex}
        onExit={() => go(href.hall)}
        onProve={() => go(href.transferFor(id))}
      />
      <p className="toast" role="status">{toast}</p>
      <p className="toast evidence-line" role="status">{logged}</p>
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
