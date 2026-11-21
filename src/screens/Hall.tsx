import { useEffect, useState } from 'react';
import { CABINETS, type CabinetId } from '../engine/types';
import { cabinetState, levelOf, pendingCelebration, recommendedCabinet } from '../engine/progression';
import type { CabinetState } from '../engine/progression';
import { PLAYABLE } from '../arcade/playable';
import { go, href } from '../router';
import { useStore } from '../store';
import { CABINET_INFO } from '../ui/Cabinet';
import { GridMap } from '../ui/GridMap';
import { Robot } from '../ui/Robot';

export function Hall() {
  const { progress, content, reset, celebrate } = useStore();
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const isAvailable = (id: CabinetId) => !!content.cabinets[id] && PLAYABLE.has(id);
  const rec = recommendedCabinet(progress, isAvailable);
  const dexTotal = Object.values(content.cabinets).reduce((n, c) => n + (c?.dex.length ?? 0), 0);
  const level = levelOf(progress.xp);
  const into = progress.xp % 100;
  const mode = progress.profile?.mode === 'fast' ? 'University' : 'High school';
  const states = Object.fromEntries(CABINETS.map((id) => [id, cabinetState(progress, id, isAvailable)])) as Record<CabinetId, CabinetState>;
  const names = Object.fromEntries(CABINETS.map((id) => [id, content.cabinets[id]?.meta.name ?? CABINET_INFO[id].name])) as Record<CabinetId, string>;

  // the first time a zone shows up cleared, the robot says its "repaired" line (once: it is then remembered)
  const [celebration] = useState(() => pendingCelebration(progress));
  useEffect(() => { if (celebration) celebrate(celebration); }, [celebration, celebrate]);
  const clearedLine = celebration ? content.cabinets[celebration]?.meta.story.cleared : undefined;
  const robotSays = clearedLine ?? (rec ? `Next stop: ${names[rec]}. Follow the glowing path.` : undefined);

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

      {robotSays && <div className="hall-robot"><Robot name={content.robot.name} mood={celebration ? 'happy' : 'idle'} line={robotSays} /></div>}

      <GridMap states={states} available={isAvailable} recommended={rec} names={names} placed={progress.placed}
        onOpen={(id) => go(href.course(id))}
        onLocked={(id) => {
          const k = CABINETS.indexOf(id);
          setMessage(!isAvailable(id) ? `${names[id]} is not built yet.` : `${names[id]} opens when you clear zone ${k} or pass the placement test.`);
        }} />
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
