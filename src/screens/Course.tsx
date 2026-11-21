import { useMemo, useState } from 'react';
import { checkAnswer, type Answer, type Mistake } from '../ui/answers';
import type { CourseStep } from '../content/types';
import { effectiveMode } from '../engine/progression';
import type { CabinetId, Mat2, Mode } from '../engine/types';
import { PLAYABLE } from '../arcade/playable';
import { href } from '../router';
import { useStore } from '../store';
import { ArrowLeft, ArrowRight, Check } from '../ui/icons';
import { MiniScene } from '../ui/MiniScene';
import { QuestionPanel } from '../ui/QuestionPanel';
import { RichText } from '../ui/RichText';

type View = 'learn' | 'ask' | 'wrong' | 'right';
const IDENTITY: Mat2 = [[1, 0], [0, 1]];
const THEME_NAME = { games: 'Games', physics: 'Physics', sport: 'Sport' } as const;

export function Course({ id }: { id: CabinetId }) {
  const { progress, content } = useStore();
  const cabinet = content.cabinets[id];
  const [mode, setMode] = useState<Mode>(effectiveMode(progress, id));
  const [stepIndex, setStepIndex] = useState(0);
  const [view, setView] = useState<View>('learn');
  const [diagnosis, setDiagnosis] = useState<Mistake | null>(null);
  const [attempt, setAttempt] = useState(0);

  const theme = progress.profile?.theme ?? 'games';
  const steps = cabinet?.course ?? [];
  const step: CourseStep | undefined = steps[stepIndex];
  const frames = useMemo(() => step?.scene, [step]);
  const hasScene = !!frames && frames.length > 0;
  /** Bumped to restart the lesson scene from its first frame. */
  const [replay, setReplay] = useState(0);
  const watchAgain = () => { setReplay((n) => n + 1); setView('learn'); };

  if (!cabinet || !step) {
    return (
      <main className="narrow">
        <h1>This lesson is not available</h1>
        <p className="lead">Its content is missing or broken. The hall lists what is wrong.</p>
        <a className="btn btn-primary" href={href.hall}>Back to the hall</a>
      </main>
    );
  }

  const last = stepIndex === steps.length - 1;
  const playable = PLAYABLE.has(id);
  const nextStep = () => { setStepIndex((i) => i + 1); setView('learn'); setDiagnosis(null); window.scrollTo(0, 0); };
  const submit = (a: Answer) => {
    const res = checkAnswer(step.check, a);
    setDiagnosis(res.diagnosis);
    setView(res.correct ? 'right' : 'wrong');
  };
  const remedial = diagnosis ? (content.remedial[diagnosis.kind] ?? content.remedial.other) : undefined;

  return (
    <main className="course">
      <a className="back" href={href.hall}><ArrowLeft size={16} /> Arcade hall</a>
      <header className="course-head">
        <div>
          <p className="eyebrow">Game {cabinet.meta.order} · {cabinet.meta.name} · lesson {stepIndex + 1} of {steps.length}</p>
          <h1>{step.title}</h1>
        </div>
        <div className="seg" role="group" aria-label="Lesson pace">
          {(['guided', 'fast'] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => setMode(m)}>
              {m === 'guided' ? 'Step by step' : 'Short'}
            </button>
          ))}
        </div>
      </header>
      <ol className="ticks" aria-label="Lesson progress">
        {steps.map((s, i) => <li key={s.id} className={i < stepIndex ? 'done' : i === stepIndex ? 'now' : ''} aria-current={i === stepIndex ? 'step' : undefined}>{i + 1}</li>)}
      </ol>

      <div className="course-grid">
        <section className="course-text" aria-label="Lesson">
          <RichText text={step.text[mode]} />
          <aside className="example"><b>{THEME_NAME[theme]} example</b><span>{step.examples[theme]}</span></aside>
        </section>

        <section className="course-side" aria-label={view === 'learn' ? 'Scene' : 'Your turn'}>
          {view === 'learn' && (
            <>
              {hasScene && <MiniScene key={`${step.id}-${replay}`} frames={frames} matrix={IDENTITY} label={`Animated scene for the lesson “${step.title}”`} />}
              <div className="actions">
                <button className="btn btn-primary" onClick={() => setView('ask')}>Your turn: predict it <ArrowRight size={18} /></button>
                {hasScene && <button className="linklike" onClick={() => setReplay((n) => n + 1)}>Replay from the start</button>}
              </div>
            </>
          )}

          {view === 'ask' && (
            <>
              <h2 id="q-title">Your turn</h2>
              <QuestionPanel q={step.check} resetKey={`${step.id}-${attempt}`} onSubmit={submit}>
                {hasScene ? <button className="linklike" onClick={watchAgain}>Watch the scene again</button>
                  : <button className="linklike" onClick={() => setView('learn')}>Back to the lesson</button>}
              </QuestionPanel>
            </>
          )}

          {view === 'wrong' && (
            <div className="wrong" role="status">
              <p className="verdict-ko"><b>Not yet.</b> {diagnosis?.text}</p>
              {remedial && (
                <article className="remedial">
                  <h2>{remedial.title}</h2>
                  <RichText text={remedial.text[mode]} />
                  {remedial.scene && <MiniScene frames={remedial.scene} label={`Catch-up scene: ${remedial.title}`} />}
                </article>
              )}
              <div className="actions"><button className="btn btn-primary" onClick={() => { setAttempt((n) => n + 1); setView('ask'); }}>Try the question again</button></div>
            </div>
          )}

          {view === 'right' && (
            <div className="right" role="status">
              <p className="verdict-ok"><Check size={20} /> <b>Yes.</b> That is the idea{last ? ' — you are ready for the game.' : '.'}</p>
              <div className="actions">
                {!last && <button className="btn btn-primary" onClick={nextStep}>Next lesson <ArrowRight size={18} /></button>}
                {last && playable && <a className="btn btn-primary" href={href.play(id)}>Play the game <ArrowRight size={18} /></a>}
                {last && !playable && <a className="btn btn-primary" href={href.hall}>Back to the hall</a>}
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="course-foot">
        {playable && <a href={href.play(id)}>Skip to the game</a>}
        <a href={href.hall}>Back to the hall</a>
      </footer>
    </main>
  );
}
