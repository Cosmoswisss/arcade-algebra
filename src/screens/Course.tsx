import { useState } from 'react';
import MiniScene from '../arcade/kit/MiniScene';
import { checkAnswer } from '../content/checkAnswer';
import type { Answer } from '../content/checkAnswer';
import type { Remedial } from '../content/types';
import { modeFor } from '../engine/progression';
import type { CabinetId } from '../engine/types';
import { go } from '../router';
import { useApp } from '../state';
import RichText from './RichText';

/** KaTeX for a matrix with column 1 green (î) and column 2 red (ĵ). */
const matrixTex = (m: [[number, number], [number, number]]) =>
  String.raw`\begin{bmatrix}\color{#4ade80}{${m[0][0]}} & \color{#f87171}{${m[0][1]}} \\ \color{#4ade80}{${m[1][0]}} & \color{#f87171}{${m[1][1]}}\end{bmatrix}`;

type Feedback = null | { correct: true } | { correct: false; text: string; remedial: Remedial | null };

/** A short Codédex-style course before each cabinet: text, a scene to watch and play with, then a prediction. */
export default function Course({ id }: { id: CabinetId }) {
  const { content, progress } = useApp();
  const c = content.cabinets[id];
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [caption, setCaption] = useState('');
  const [playKey, setPlayKey] = useState(0);
  if (!c) return <main className="screen narrow"><p className="lead">This course is not available.</p></main>;
  const mode = modeFor(progress, id);
  const theme = progress.profile?.theme ?? 'games';
  const s = c.course[step];
  const q = s.check;
  const last = step === c.course.length - 1;
  const showingRemedial = feedback && !feedback.correct && feedback.remedial;

  const submit = () => {
    if (answer === null) return;
    const r = checkAnswer(q, answer);
    if (r.correct) setFeedback({ correct: true });
    else setFeedback({ correct: false, text: r.text, remedial: content.remedial[r.kind ?? 'other'] ?? content.remedial.other ?? null });
    setPlayKey((k) => k + 1);
  };
  const next = () => { setStep(step + 1); setAnswer(null); setFeedback(null); setPlayKey((k) => k + 1); };
  const retry = () => { setAnswer(null); setFeedback(null); setPlayKey((k) => k + 1); };

  return (
    <main className="screen course">
      <header className="course-head">
        <button className="btn btn-quiet" onClick={() => go('/hall')}>← Arcade</button>
        <p className="kicker">Course · {c.meta.name}</p>
        <ol className="dots" aria-label={`Step ${step + 1} of ${c.course.length}`}>
          {c.course.map((st, k) => <li key={st.id} className={k < step ? 'done' : k === step ? 'current' : ''} />)}
        </ol>
      </header>
      <div className="course-grid">
        <section className="course-text panel">
          {showingRemedial ? (
            <>
              <p className="kicker remedial-kicker">Let's look again</p>
              <h1 className="h2">{feedback.remedial!.title}</h1>
              <p className="feedback-bad">{feedback.text}</p>
              <RichText className="lead" text={feedback.remedial!.text[mode]} />
              <button className="btn btn-primary" onClick={retry}>Try again</button>
            </>
          ) : (
            <>
              <h1 className="h2">{s.title}</h1>
              <RichText className="lead" text={s.text[mode]} />
              <blockquote className="example">{s.examples[theme]}</blockquote>
              <button className="btn btn-quiet" onClick={() => setPlayKey((k) => k + 1)}>↻ Replay the animation</button>
            </>
          )}
        </section>
        <section className="course-play">
          <MiniScene
            playKey={`${step}-${playKey}`}
            scene={showingRemedial ? feedback.remedial!.scene : s.scene}
            input={showingRemedial || feedback?.correct ? 'none' : q.kind === 'basis' || q.kind === 'point' ? q.kind : 'none'}
            shown={feedback?.correct && q.kind === 'basis' ? q.answer : q.kind === 'number' ? q.given.matrix : undefined}
            vectors={q.kind === 'point' ? q.given.vectors : undefined}
            onBasis={(m) => setAnswer(m)} onPoint={(p) => setAnswer(p)} onCaption={setCaption}
          />
          <p className="scene-caption mono">{caption || ' '}</p>
          {!showingRemedial && (
            <div className="check panel">
              <p className="kicker">Predict</p>
              <p className="check-prompt">{q.prompt}</p>
              {(q.kind === 'basis' || q.kind === 'number' || (q.kind === 'point' && q.given.matrix)) && (
                <RichText className="check-matrix" text={`$${matrixTex(q.given.matrix!)}$`} />
              )}
              {q.kind === 'number' && (
                <label className="slider">
                  <input type="range" min={-6} max={6} step={0.5} value={typeof answer === 'number' ? answer : 0} onChange={(e) => setAnswer(Number(e.target.value))} disabled={!!feedback} />
                  <output className="mono">{typeof answer === 'number' ? answer : 0}</output>
                </label>
              )}
              {q.kind === 'choice' && (
                <div className="choices">
                  {q.options.map((o, k) => <button key={o} className={`choice ${answer === k ? 'selected' : ''}`} onClick={() => setAnswer(k)} disabled={!!feedback}><span className="choice-label">{o}</span></button>)}
                </div>
              )}
              {(q.kind === 'basis' || q.kind === 'point') && !feedback && <p className="muted small">Drag the {q.kind === 'basis' ? 'green and red arrows' : 'yellow point'} in the scene above.</p>}
              {feedback?.correct ? (
                <div className="feedback-good">
                  <p>Correct ✓</p>
                  {last
                    ? <button className="btn btn-primary btn-big" onClick={() => go(`/play/${id}`)}>Enter the cabinet</button>
                    : <button className="btn btn-primary" onClick={next}>Next</button>}
                </div>
              ) : (
                <button className="btn btn-primary" onClick={() => { if (q.kind === 'number' && answer === null) setAnswer(0); submit(); }} disabled={answer === null && q.kind !== 'number'}>Check</button>
              )}
            </div>
          )}
        </section>
      </div>
      {mode === 'fast' && <p className="skip"><button className="btn btn-quiet" onClick={() => go(`/play/${id}`)}>Skip the course →</button></p>}
    </main>
  );
}
