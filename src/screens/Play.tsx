import { useRef, useState } from 'react';
import CabinetView from '../arcade/kit/CabinetView';
import { GAMES } from '../arcade/registry';
import { applyWaveResult, dexKey, modeFor } from '../engine/progression';
import type { CabinetId, Mode } from '../engine/types';
import { go } from '../router';
import { useApp } from '../state';

export default function Play({ id }: { id: CabinetId }) {
  const { content, progress, setProgress } = useApp();
  const c = content.cabinets[id], make = GAMES[id];
  const latest = useRef(progress);
  latest.current = progress;
  const [suggest, setSuggest] = useState<Mode | null>(null);
  // the mode is fixed for the whole run; a suggestion accepted mid-run applies to the next run
  const [mode] = useState<Mode>(() => modeFor(progress, id));
  if (!c || !make) return <main className="screen narrow"><p className="lead">This cabinet is not ready yet.</p><button className="btn btn-secondary" onClick={() => go('/hall')}>Back to the arcade</button></main>;
  return (
    <div className="play-screen">
      <CabinetView
        key={`${id}-${mode}`}
        content={c} createGame={make} mode={mode}
        onWaveResult={(o) => {
          const r = applyWaveResult(latest.current, id, o);
          latest.current = r.next; setProgress(r.next);
          if (r.suggestMode) setSuggest(r.suggestMode);
          return { newDex: r.newDex };
        }}
        dex={() => ({ count: c.dex.filter((d) => latest.current.dex.includes(dexKey(id, d.concept))).length, total: c.dex.length, isNew: (k) => !latest.current.dex.includes(dexKey(id, k)) })}
        onExit={() => go('/hall')}
      />
      {suggest && (
        <div className="toast" role="status">
          <p>{suggest === 'guided' ? 'Want more step-by-step help on this cabinet?' : 'You are on a roll. Switch to the faster pace?'}</p>
          <div className="toast-actions">
            <button className="btn btn-primary" onClick={() => { setProgress((p) => ({ ...p, modeOverride: { ...p.modeOverride, [id]: suggest } })); setSuggest(null); }}>
              {suggest === 'guided' ? 'Yes, guide me' : 'Go faster'}
            </button>
            <button className="btn btn-quiet" onClick={() => setSuggest(null)}>Keep going</button>
          </div>
          <p className="small muted">Applies from your next run.</p>
        </div>
      )}
    </div>
  );
}
