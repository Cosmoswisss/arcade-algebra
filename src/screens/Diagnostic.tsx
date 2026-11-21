import { useMemo, useState } from 'react';
import MiniScene from '../arcade/kit/MiniScene';
import { checkAnswer } from '../content/checkAnswer';
import type { Answer } from '../content/checkAnswer';
import { diagnosticQuestions } from '../content/diagnostic';
import { placeFromDiagnostic } from '../engine/progression';
import type { CabinetId } from '../engine/types';
import { go } from '../router';
import { useApp } from '../state';
import RichText from './RichText';

const matrixTex = (m: [[number, number], [number, number]]) =>
  String.raw`\begin{bmatrix}\color{#4ade80}{${m[0][0]}} & \color{#f87171}{${m[0][1]}} \\ \color{#4ade80}{${m[1][0]}} & \color{#f87171}{${m[1][1]}}\end{bmatrix}`;

/** A 2-minute placement test: one prediction per cabinet 1–5. No feedback during the test; passed cabinets open as "mastered". */
export default function Diagnostic() {
  const { content, setProgress } = useApp();
  const qs = useMemo(() => diagnosticQuestions(content.cabinets), [content]);
  const [k, setK] = useState(-1);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [passed, setPassed] = useState<CabinetId[]>([]);
  const [done, setDone] = useState(false);

  const finish = (list: CabinetId[]) => { setProgress((p) => placeFromDiagnostic(p, list)); setDone(true); };
  const advance = (list: CabinetId[]) => { setAnswer(null); if (k + 1 >= qs.length) finish(list); else setK(k + 1); };
  const submit = () => {
    const q = qs[k];
    const a = answer ?? (q.question.kind === 'number' ? 0 : null);
    const ok = a !== null && checkAnswer(q.question, a).correct;
    const next = ok ? [...passed, q.cabinet] : passed;
    setPassed(next);
    advance(next);
  };

  if (done) return (
    <main className="screen narrow">
      <p className="kicker">Placement done</p>
      <h1 className="h1">{passed.length ? 'You already know some of this' : 'Fresh start'}</h1>
      <p className="lead">{passed.length
        ? `These cabinets are marked as mastered and open right away: ${passed.map((id) => content.cabinets[id]?.meta.name).join(', ')}. You can still play them for the badge.`
        : 'No problem — the arcade starts at the very first idea and builds up from there.'}</p>
      <button className="btn btn-primary btn-big" onClick={() => go('/hall')}>Enter the arcade</button>
    </main>
  );

  if (k < 0) return (
    <main className="screen narrow">
      <p className="kicker">Placement · about 2 minutes</p>
      <h1 className="h1">What do you already know?</h1>
      <p className="lead">{qs.length} quick predictions, one per idea. No score, no feedback: it only opens the cabinets you already master, so you don't repeat what you know.</p>
      <div className="actions-row">
        <button className="btn btn-primary btn-big" onClick={() => setK(0)}>Start the placement</button>
        <button className="btn btn-quiet" onClick={() => finish([])}>Skip — start from zero</button>
      </div>
    </main>
  );

  const { question: q, cabinet } = qs[k];
  return (
    <main className="screen course">
      <header className="course-head">
        <p className="kicker">Placement · {k + 1}/{qs.length} · {content.cabinets[cabinet]?.meta.name}</p>
        <ol className="dots">{qs.map((x, i) => <li key={x.cabinet} className={i < k ? 'done' : i === k ? 'current' : ''} />)}</ol>
      </header>
      <div className="course-grid">
        <section className="panel">
          <p className="kicker">Predict</p>
          <p className="check-prompt">{q.prompt}</p>
          {(q.kind === 'basis' || q.kind === 'number' || (q.kind === 'point' && q.given.matrix)) && <RichText className="check-matrix" text={`$${matrixTex(q.given.matrix!)}$`} />}
          {q.kind === 'number' && (
            <label className="slider">
              <input type="range" min={-6} max={6} step={0.5} value={typeof answer === 'number' ? answer : 0} onChange={(e) => setAnswer(Number(e.target.value))} />
              <output className="mono">{typeof answer === 'number' ? answer : 0}</output>
            </label>
          )}
          {q.kind === 'choice' && <div className="choices">{q.options.map((o, i) => <button key={o} className={`choice ${answer === i ? 'selected' : ''}`} onClick={() => setAnswer(i)}><span className="choice-label">{o}</span></button>)}</div>}
          <div className="actions-row">
            <button className="btn btn-primary" onClick={submit} disabled={answer === null && q.kind !== 'number'}>Next</button>
            <button className="btn btn-quiet" onClick={() => advance(passed)}>I don't know</button>
          </div>
        </section>
        {(q.kind === 'basis' || q.kind === 'point') && (
          <section className="course-play">
            <MiniScene playKey={k} input={q.kind} vectors={q.kind === 'point' ? q.given.vectors : undefined} onBasis={setAnswer} onPoint={setAnswer} />
            <p className="muted small">Drag the {q.kind === 'basis' ? 'green and red arrows' : 'yellow point'}.</p>
          </section>
        )}
      </div>
    </main>
  );
}
