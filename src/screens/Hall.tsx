import { useState } from 'react';
import { CABINETS, type CabinetId } from '../engine/types';
import { cabinetState, levelOf, recommendedCabinet } from '../engine/progression';
import { PLAYABLE } from '../arcade/playable';
import { href } from '../router';
import { useStore } from '../store';
import { CABINET_INFO, Cabinet, STATE_LABEL } from '../ui/Cabinet';

export function Hall() {
  const { progress, content, reset } = useStore();
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const isAvailable = (id: CabinetId) => !!content.cabinets[id] && PLAYABLE.has(id);
  const rec = recommendedCabinet(progress, isAvailable);
  const dexTotal = Object.values(content.cabinets).reduce((n, c) => n + (c?.dex.length ?? 0), 0);
  const level = levelOf(progress.xp);
  const into = progress.xp % 100;
  const mode = progress.profile?.mode === 'fast' ? 'University' : 'High school';

  const note = (id: CabinetId, available: boolean): string => {
    const s = cabinetState(progress, id, isAvailable);
    if (!available) return 'Coming soon';
    if (id === rec) return 'Recommended';
    return STATE_LABEL[s];
  };

  return (
    <main className="hall">
      <header className="hall-head">
        <div>
          <p className="eyebrow">The arcade hall</p>
          <h1>Pick a game</h1>
          <p className="lead">
            {rec ? <>Next up: <strong>{CABINET_INFO[rec].name}</strong> — {CABINET_INFO[rec].notion.toLowerCase()}.</> : <>Every game is cleared. Replay any of them to beat your score.</>}
          </p>
        </div>
        <section className="player" aria-label="Your progress">
          <div className="player-level"><span className="mono big">{level}</span><span>level</span></div>
          <div className="player-meter">
            <div className="meter" role="progressbar" aria-valuenow={into} aria-valuemin={0} aria-valuemax={100} aria-label="XP to next level"><i style={{ width: `${into}%` }} /></div>
            <p className="tiny mono">{into} / 100 XP</p>
          </div>
          <dl className="player-stats">
            <div><dt>Badges</dt><dd className="mono">{progress.finished.length}/{CABINETS.length}</dd></div>
            <div><dt>Transform Dex</dt><dd className="mono">{progress.dex.length}/{dexTotal || '?'}</dd></div>
            <div><dt>Pace</dt><dd>{mode}</dd></div>
          </dl>
        </section>
      </header>

      <ol className="floor">
        {CABINETS.map((id, k) => {
          const state = cabinetState(progress, id, isAvailable);
          const available = isAvailable(id);
          const open = available && state !== 'locked';
          const name = content.cabinets[id]?.meta.name ?? CABINET_INFO[id].name;
          const label = `Cabinet ${k + 1}, ${name}. ${note(id, available)}.`;
          const body = (
            <>
              <Cabinet id={id} order={k + 1} state={state} recommended={id === rec && available} available={available} />
              <span className="cab-name">{name}</span>
              <span className={`cab-note ${id === rec && available ? 'is-rec' : ''}`}>{note(id, available)}</span>
            </>
          );
          return (
            <li key={id} className="floor-slot">
              {open
                ? <a className="cab-link" href={href.course(id)} aria-label={label}>{body}</a>
                : <button type="button" className="cab-link" aria-label={label} aria-disabled="true"
                    onClick={() => setMessage(!available ? `${name} is not built yet.` : `${name} opens when you clear cabinet ${k} or pass the placement test.`)}>{body}</button>}
            </li>
          );
        })}
      </ol>
      <p className="floor-msg" role="status">{message}</p>

      {content.errors.length > 0 && (
        <details className="problems">
          <summary>{content.errors.length} content problem{content.errors.length > 1 ? 's' : ''} (affected games are switched off)</summary>
          <ul>{content.errors.map((e) => <li key={e} className="mono">{e}</li>)}</ul>
        </details>
      )}

      <footer className="hall-foot">
        <a href={href.profile}>Change level or theme</a>
        <a href={href.diagnostic}>Take the placement test</a>
        {confirm
          ? <span>Erase all progress? <button className="linklike" onClick={() => { reset(); setConfirm(false); }}>Yes, erase</button> · <button className="linklike" onClick={() => setConfirm(false)}>Cancel</button></span>
          : <button className="linklike" onClick={() => setConfirm(true)}>Reset progress</button>}
      </footer>
    </main>
  );
}
