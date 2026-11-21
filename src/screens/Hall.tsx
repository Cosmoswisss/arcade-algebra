import { GAMES } from '../arcade/registry';
import { cabinetState, levelOf, resetProgressV2 } from '../engine/progression';
import { CABINETS } from '../engine/types';
import type { CabinetId } from '../engine/types';
import { go } from '../router';
import { useApp } from '../state';
import { CabinetIcon } from './icons';

const STATE_LABEL = { locked: 'Locked', open: 'Open', mastered: 'Mastered', finished: 'Cleared' } as const;

/** The arcade hall: the course map. One cabinet per idea, in order. */
export default function Hall() {
  const { content, progress, setProgress } = useApp();
  const totalDex = Object.values(content.cabinets).reduce((n, c) => n + (c?.dex.length ?? 0), 0);
  const xpInLevel = progress.xp % 100;
  const isAvail = (id: CabinetId) => !!content.cabinets[id] && !!GAMES[id];
  const suggested = CABINETS.find((id) => isAvail(id) && ['open', 'mastered'].includes(cabinetState(progress, id, isAvail)));

  const available = (id: CabinetId) => !!content.cabinets[id] && !!GAMES[id];
  const open = (id: CabinetId) => {
    if (cabinetState(progress, id, available) === 'locked' || !content.cabinets[id]) return;
    go(`/course/${id}`);
  };

  return (
    <main className="screen hall">
      <header className="hall-head">
        <div>
          <p className="kicker">The arcade</p>
          <h1 className="h1">Pick a cabinet</h1>
        </div>
        <dl className="stats">
          <div><dt>Level</dt><dd className="mono">{levelOf(progress.xp)}</dd></div>
          <div className="xp"><dt>XP</dt><dd><span className="bar" role="meter" aria-valuenow={xpInLevel} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${xpInLevel}%` }} /></span><span className="mono small">{progress.xp}</span></dd></div>
          <div><dt>Badges</dt><dd className="mono">{progress.finished.length}/7</dd></div>
          <div><dt>Transform Dex</dt><dd className="mono">{progress.dex.length}/{totalDex}</dd></div>
        </dl>
      </header>

      <ol className="cabinets">
        {CABINETS.map((id, k) => {
          const st = cabinetState(progress, id, isAvail);
          const c = content.cabinets[id];
          const playable = !!c && !!GAMES[id];
          const isSuggested = id === suggested;
          return (
            <li key={id}>
              <button
                className={`cabinet ${st} ${isSuggested ? 'suggested' : ''} ${playable ? '' : 'soon'}`}
                onClick={() => open(id)} disabled={st === 'locked' || !c}
                aria-label={`${c?.meta.name ?? id}: ${STATE_LABEL[st]}`}
              >
                <span className="cab-num mono">{String(k + 1).padStart(2, '0')}</span>
                <span className="cab-screen"><CabinetIcon id={id} color={st === 'locked' ? '#8b8fc7' : isSuggested ? '#f0abfc' : '#22d3ee'} /></span>
                <span className="cab-name">{c?.meta.name ?? id.replace(/-/g, ' ')}</span>
                <span className="cab-state mono">{!c ? 'Coming soon' : isSuggested ? '▶ Play' : STATE_LABEL[st]}</span>
                {st === 'finished' && <span className="badge" aria-hidden="true" />}
              </button>
              {c && <p className="cab-notion">{c.meta.notion}</p>}
            </li>
          );
        })}
      </ol>

      <footer className="hall-foot">
        <div className="mode">
          Mode: <strong>{progress.profile?.mode === 'fast' ? 'Fast' : 'Guided'}</strong>
          <button className="btn btn-quiet" onClick={() => go('/profile')}>Change</button>
        </div>
        {content.errors.length > 0 && (
          <details className="load-errors">
            <summary>{content.errors.length} content problem(s) — affected cabinets are disabled</summary>
            <ul>{content.errors.map((e) => <li key={e} className="mono small">{e}</li>)}</ul>
          </details>
        )}
        <button className="btn btn-quiet danger-link" onClick={() => { if (confirm('Reset all progress? This cannot be undone.')) setProgress(resetProgressV2()); }}>Reset progress</button>
      </footer>
    </main>
  );
}
