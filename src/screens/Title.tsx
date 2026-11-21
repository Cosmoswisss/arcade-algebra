import { Suspense, useEffect, useMemo, useState } from 'react';
import { LazyStage, PLAYABLE } from '../arcade/playable';
import { findWave } from '../content/lessons';
import { CABINETS } from '../engine/types';
import { href } from '../router';
import { useStore } from '../store';
import { ArrowRight } from '../ui/icons';
import { Robot } from '../ui/Robot';

/** One full replay (DemoDriver: 5 s) plus its 1.2 s hold on the last frame, then the next cabinet. */
const SLOT_MS = 6200;

/** Attract mode: the cabinets take turns replaying the demo wave of their first lesson, like machines waiting for players. */
function AttractMode() {
  const { content } = useStore();
  const reel = useMemo(() => CABINETS.flatMap((id) => {
    const c = content.cabinets[id];
    const demo = c?.course[0]?.demo;
    const wave = c && demo ? findWave(c, demo.wave) : null;
    return c && demo && wave && PLAYABLE.has(id) ? [{ id, content: c, wave, rule: demo.rule }] : [];
  }), [content]);
  const [k, setK] = useState(0);
  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState('');
  // the slot timer starts once the stage is on screen, so slow loading never cuts a replay short
  useEffect(() => {
    if (!ready || reel.length < 2) return;
    const t = setTimeout(() => { setReady(false); setK((n) => (n + 1) % reel.length); }, SLOT_MS);
    return () => clearTimeout(t);
  }, [ready, k, reel.length]);
  if (reel.length === 0) return null;
  const slot = reel[k];
  const attract = content.robot.events.attract;
  return (
    <div className="attract">
      <p className="attract-marquee" aria-live="polite"><span className="mono">{String(slot.content.meta.order).padStart(2, '0')}</span> {slot.content.meta.name}</p>
      <div className="stage-frame">
        <Suspense fallback={<p className="stage-loading">Powering up…</p>}>
          <LazyStage key={slot.id} cabinet={slot.id} content={slot.content} className="stage" mode={{ kind: 'demo', wave: slot.wave, rule: slot.rule }}
            label={`Demo of ${slot.content.meta.name}`} onStatus={(s) => setCaption(s.caption)} onReady={() => setReady(true)} />
        </Suspense>
      </div>
      <p className="stage-caption mono">{caption}</p>
      {attract.length > 0 && <Robot name={content.robot.name} line={attract[k % attract.length]} />}
    </div>
  );
}

export function Title() {
  const { progress } = useStore();
  const returning = progress.profile !== null;
  return (
    <main className="title">
      <div className="title-copy">
        <p className="eyebrow">7 arcade games · from vectors to eigenvectors</p>
        <h1>Linear Arcade</h1>
        <p className="lead">
          Learn linear algebra by playing. Drag two arrows, bend the plane until every star lights up, and see
          why a matrix is nothing more than <strong>where î and ĵ land</strong>.
        </p>
        <div className="actions">
          <a className="btn btn-primary" href={returning ? href.hall : href.profile}>
            {returning ? 'Back to the hall' : 'Insert coin'} <ArrowRight size={18} />
          </a>
          <a className="btn btn-secondary" href="#how">How it works</a>
        </div>
        <ol id="how" className="steps">
          <li><b>Learn</b><span>A one-minute lesson that replays a real wave of the game. Then your turn: the same game, untimed, with a guide robot.</span></li>
          <li><b>Play</b><span>A different arcade game for every idea. The first wave waits for you; then the clock runs, and you read coordinates, then the matrix alone.</span></li>
          <li><b>Be tracked, openly</b><span>Every answer, in lessons and in games, updates an estimate of what you know, with how sure it is. Your weak spots become the next lessons.</span></li>
          <li><b>See your mistakes</b><span>Every miss is named — “you swapped î and ĵ” — replayed step by step, and trained on in the next wave.</span></li>
        </ol>
      </div>
      <div className="title-scene">
        <AttractMode />
      </div>
    </main>
  );
}
