import { Suspense, useMemo, useRef, useState } from 'react';
import type { StageControls } from '../arcade/kit/ArcadeStage';
import { LazyStage, PLAYABLE } from '../arcade/playable';
import { findWave } from '../content/lessons';
import type { CourseStep } from '../content/types';
import { lessonPlan, reminderFor, warmUpPick } from '../engine/adapt';
import { effectiveMode } from '../engine/progression';
import type { CabinetId, Mode } from '../engine/types';
import { href } from '../router';
import { useStore } from '../store';
import { checkAnswer, type Answer, type Mistake } from '../ui/answers';
import { ArrowLeft, ArrowRight, Check } from '../ui/icons';
import { LessonPlay } from '../ui/LessonPlay';
import { MiniScene } from '../ui/MiniScene';
import { QuestionPanel } from '../ui/QuestionPanel';
import { RichText } from '../ui/RichText';
import { Robot } from '../ui/Robot';
import { robotLine } from '../ui/robotLines';

type View = 'learn' | 'ask' | 'wrong' | 'right';
type Phase = 'intro' | 'warmup' | 'lesson';
const THEME_NAME = { games: 'Games', physics: 'Physics', sport: 'Sport' } as const;

/** The scene of a lesson: the replay of a wave of this cabinet, on a loop, with its caption. */
function LessonScene({ id, step }: { id: CabinetId; step: CourseStep }) {
  const { content } = useStore();
  const cabinet = content.cabinets[id]!;
  const wave = findWave(cabinet, step.demo.wave);
  const controls = useRef<StageControls | null>(null);
  const [caption, setCaption] = useState('');
  if (!wave) return null;
  return (
    <figure className="lesson-scene">
      <div className="stage-frame">
        <Suspense fallback={<p className="stage-loading">Powering up…</p>}>
          <LazyStage key={step.id} cabinet={id} content={cabinet} className="stage" label={`Replay for the lesson “${step.title}”`}
            mode={{ kind: 'demo', wave, rule: step.demo.rule }} onStatus={(s) => setCaption(s.caption)} onReady={(c) => { controls.current = c; }} />
        </Suspense>
      </div>
      <figcaption className="stage-caption mono" aria-live="polite">{caption}</figcaption>
      <button className="linklike" onClick={() => controls.current?.restart()}>Replay from the start</button>
    </figure>
  );
}

export function Course({ id }: { id: CabinetId }) {
  const { progress, content } = useStore();
  const cabinet = content.cabinets[id];
  // decided once when the course opens: what to skip, what to remind, what to warm up on
  const [plan] = useState(() => (cabinet ? lessonPlan(progress, id, cabinet) : { steps: [], skipped: 0 }));
  const [reminder] = useState(() => (cabinet ? reminderFor(progress, cabinet) : null));
  const [warmUp] = useState(() => warmUpPick(progress, id, content.cabinets));
  const [phase, setPhase] = useState<Phase>('intro');
  const [mode, setMode] = useState<Mode>(effectiveMode(progress, id));
  const [stepIndex, setStepIndex] = useState(plan.steps[0] ?? 0);
  const [view, setView] = useState<View>('learn');
  const [diagnosis, setDiagnosis] = useState<Mistake | null>(null);
  const [attempt, setAttempt] = useState(0);
  const lines = content.robot;

  const theme = progress.profile?.theme ?? 'games';
  const steps = cabinet?.course ?? [];
  const step: CourseStep | undefined = steps[stepIndex];
  const introLines = useMemo(() => {
    if (!cabinet) return [];
    const out = [cabinet.meta.story.intro];
    if (plan.skipped > 0) out.push(`${robotLine(lines, 'placementSkip')} (${plan.skipped} lesson${plan.skipped > 1 ? 's' : ''} skipped)`);
    if (reminder) out.push(`${robotLine(lines, 'reminder')} ${lines.errors[reminder]?.[0] ?? ''}`.trim());
    return out;
  }, [cabinet, plan.skipped, reminder, lines]);

  if (!cabinet || !step) {
    return (
      <main className="narrow">
        <h1>This lesson is not available</h1>
        <p className="lead">Its content is missing or broken. The map lists what is wrong.</p>
        <a className="btn btn-primary" href={href.hall}>Back to the map</a>
      </main>
    );
  }

  const last = stepIndex === steps.length - 1;
  const playable = PLAYABLE.has(id);
  const goTo = (k: number) => { setStepIndex(k); setView('learn'); setDiagnosis(null); setAttempt(0); setPhase('lesson'); window.scrollTo(0, 0); };
  const solved = (firstTry: boolean) => {
    // a first-try success shortens the next lesson (the pace switch stays available)
    if (firstTry) setMode('fast');
    setView('right');
  };
  const submit = (a: Answer) => {
    if (!step.check) return;
    const res = checkAnswer(step.check, a);
    setDiagnosis(res.diagnosis);
    if (res.correct) solved(attempt === 0); else setView('wrong');
  };
  const remedial = diagnosis ? (content.remedial[diagnosis.kind] ?? content.remedial.other) : undefined;
  const header = (
    <header className="course-head">
      <div>
        <p className="eyebrow">Game {cabinet.meta.order} · {cabinet.meta.name} · lesson {stepIndex + 1} of {steps.length}</p>
        <h1>{phase === 'lesson' ? step.title : cabinet.meta.name}</h1>
      </div>
      <div className="seg" role="group" aria-label="Lesson pace">
        {(['guided', 'fast'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => setMode(m)}>
            {m === 'guided' ? 'Step by step' : 'Short'}
          </button>
        ))}
      </div>
    </header>
  );

  if (phase === 'intro' || phase === 'warmup') {
    const warm = warmUp && content.cabinets[warmUp.cabinet];
    return (
      <main className="course">
        <a className="back" href={href.hall}><ArrowLeft size={16} /> Map</a>
        {header}
        {phase === 'intro' && (
          <section className="course-intro">
            {introLines.map((l, k) => <Robot key={k} name={lines.name} mood={k === 0 ? 'idle' : 'thinking'} line={l} />)}
            <div className="actions">
              {warm
                ? <button className="btn btn-primary" onClick={() => setPhase('warmup')}>Warm-up: {warm.meta.name} <ArrowRight size={18} /></button>
                : <button className="btn btn-primary" onClick={() => goTo(stepIndex)}>Start the lesson <ArrowRight size={18} /></button>}
              {warm && <button className="btn btn-secondary" onClick={() => goTo(stepIndex)}>Skip the warm-up</button>}
            </div>
          </section>
        )}
        {phase === 'warmup' && warmUp && warm && (
          <section className="course-warmup" aria-label="Warm-up">
            <Robot name={lines.name} line={robotLine(lines, 'warmup')} />
            <LessonPlay key="warmup" cabinet={warmUp.cabinet} theme={theme} variant="single" talk={false}
              play={{ wave: warmUp.wave, rule: 'partial', mission: { games: '', physics: '', sport: '' } }}
              onDone={() => goTo(stepIndex)} />
            <div className="actions"><button className="btn btn-secondary" onClick={() => goTo(stepIndex)}>Skip the warm-up</button></div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="course">
      <a className="back" href={href.hall}><ArrowLeft size={16} /> Map</a>
      {header}
      <ol className="ticks" aria-label="Lessons">
        {steps.map((s, i) => (
          <li key={s.id} className={i < stepIndex ? 'done' : i === stepIndex ? 'now' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
            <button type="button" onClick={() => goTo(i)} aria-label={`Lesson ${i + 1}: ${s.title}${plan.steps.includes(i) ? '' : ' (skipped)'}`}>{i + 1}</button>
          </li>
        ))}
      </ol>

      <div className="course-grid">
        <section className="course-text" aria-label="Lesson">
          {view === 'learn' && <Robot name={lines.name} line={step.robot} />}
          <RichText text={step.text[mode]} />
          <aside className="example"><b>{THEME_NAME[theme]} example</b><span>{step.examples[theme]}</span></aside>
        </section>

        <section className="course-side" aria-label={view === 'learn' ? 'Scene' : 'Your turn'}>
          {view === 'learn' && (
            <>
              <LessonScene id={id} step={step} />
              <div className="actions"><button className="btn btn-primary" onClick={() => setView('ask')}>Your turn <ArrowRight size={18} /></button></div>
            </>
          )}

          {view === 'ask' && step.play && (
            <>
              <h2 id="q-title">Your turn</h2>
              <LessonPlay key={step.id} cabinet={id} play={step.play} theme={theme} onDone={(r) => solved(r.firstTry)} onBack={() => setView('learn')} />
            </>
          )}

          {view === 'ask' && step.check && (
            <>
              <h2 id="q-title">Your turn</h2>
              <Robot name={lines.name} mood="thinking" line="Predict it before you see it." />
              <QuestionPanel q={step.check} resetKey={`${step.id}-${attempt}`} onSubmit={submit}>
                <button className="linklike" onClick={() => setView('learn')}>Watch the scene again</button>
              </QuestionPanel>
            </>
          )}

          {view === 'wrong' && (
            <div className="wrong" role="status">
              <Robot name={lines.name} mood="oops" line={`${robotLine(lines, 'wrong', { errorKind: diagnosis?.kind })} ${diagnosis?.text ?? ''}`.trim()} />
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
              <Robot name={lines.name} mood="happy" line={robotLine(lines, 'right')} />
              <p className="verdict-ok"><Check size={20} /> <b>Yes.</b> {last ? 'You are ready for the game.' : 'On to the next one.'}</p>
              <div className="actions">
                {!last && <button className="btn btn-primary" onClick={() => goTo(stepIndex + 1)}>Next lesson <ArrowRight size={18} /></button>}
                {last && playable && <a className="btn btn-primary" href={href.play(id)}>Play the game <ArrowRight size={18} /></a>}
                {last && !playable && <a className="btn btn-primary" href={href.hall}>Back to the map</a>}
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="course-foot">
        {playable && <a href={href.play(id)}>Skip to the game</a>}
        <a href={href.hall}>Back to the map</a>
      </footer>
    </main>
  );
}
