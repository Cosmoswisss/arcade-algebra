import { Suspense, useEffect, useRef, useState } from 'react';
import type { StageControls, StageStatus } from '../arcade/kit/ArcadeStage';
import type { ChallengeResult } from '../arcade/kit/drivers';
import { LazyStage } from '../arcade/playable';
import type { DexCard, LessonPlay as LessonPlayData, Wave } from '../content/types';
import { nextHintStep } from '../engine/adapt';
import type { HintStep } from '../engine/adapt';
import type { CabinetId, Rule, Theme } from '../engine/types';
import { useStore } from '../store';
import { MiniScene } from './MiniScene';
import { RichText } from './RichText';
import { Robot } from './Robot';
import type { RobotMood } from './Robot';
import { robotLine } from './robotLines';

export interface LessonPlayProps {
  cabinet: CabinetId;
  play: LessonPlayData;
  theme: Theme;
  /**
   * 'lesson': the hint ladder until the wave (or its drill) is solved.
   * 'single': one attempt, no help (placement test, warm-up); `rule` can override the lesson's rule.
   */
  variant?: 'lesson' | 'single';
  rule?: Rule;
  /** Called when the lesson wave is solved ('lesson'), or after the one attempt ('single'). */
  onDone: (r: { correct: boolean; firstTry: boolean }) => void;
  /** 'lesson' only: the player wants to read the lesson again. */
  onBack?: () => void;
  /** Speak through the robot (false for the placement test: no feedback there). */
  talk?: boolean;
}

type Feedback = { step: HintStep | 'right'; text: string; mood: RobotMood; kind: string | null };

/** "Your turn": one wave of the real game, untimed, with the robot and the hint ladder (spec §5.7, idea 2). */
export function LessonPlay({ cabinet, play, theme, variant = 'lesson', rule, onDone, onBack, talk = true }: LessonPlayProps) {
  const { content, applyWave } = useStore();
  const cab = content.cabinets[cabinet];
  const baseRule = rule ?? play.rule;
  const [wave, setWave] = useState<Wave>(play.wave);
  const [waveRule, setWaveRule] = useState<Rule>(baseRule);
  const [attempt, setAttempt] = useState(0);
  const [failures, setFailures] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [status, setStatus] = useState<StageStatus | null>(null);
  const [card, setCard] = useState<DexCard | null>(null);
  const [gain, setGain] = useState('');
  const controls = useRef<StageControls | null>(null);
  const robotRef = useRef<HTMLDivElement>(null);
  const firstTry = useRef(true);
  const [onDrill, setOnDrill] = useState(false);

  // The verdict appears above the stage while the player's eyes (and the LOCK IN button) are below it:
  // bring the robot's bubble back into view so the named mistake is actually read.
  useEffect(() => {
    if (!feedback || !talk) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    robotRef.current?.scrollIntoView?.({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [feedback, talk]);
  const lines = content.robot;

  const drillFor = (kind: string | null): Wave | null => {
    const d = cab?.drills.find((x) => x.errorKind === kind && x.waves.length > 0);
    return d ? d.waves[failures % d.waves.length] : null;
  };

  const onResult = (r: ChallengeResult) => {
    const kind = r.diagnosis?.kind ?? null;
    const applied = applyWave(cabinet, { correct: r.correct, rule: waveRule, firstTry: r.correct && firstTry.current, concept: wave.concept, boss: false, errorKind: kind ?? undefined });
    setGain(applied.xpGained > 0 ? `+${applied.xpGained} XP` : '');
    if (applied.newDex) setCard(cab?.dex.find((c) => c.concept === applied.newDex) ?? null);
    if (variant === 'single') { onDone({ correct: r.correct, firstTry: r.correct }); return; }
    if (r.correct) {
      setFeedback({ step: 'right', mood: 'happy', kind: null, text: robotLine(lines, 'right') });
      return;
    }
    firstTry.current = false;
    const n = failures + 1;
    setFailures(n);
    const step = nextHintStep(n);
    const named = `${robotLine(lines, 'wrong', { errorKind: kind ?? undefined })} ${r.diagnosis?.text ?? ''}`.trim();
    if (step === 'named') setFeedback({ step, mood: 'oops', kind, text: named });
    else if (step === 'hint') setFeedback({ step, mood: 'thinking', kind, text: robotLine(lines, 'hint') });
    else if (step === 'replay-then-drill') { setFeedback({ step, mood: 'thinking', kind, text: named }); controls.current?.showReplay(); }
    // on the training wave, keep naming the mistake: the player must know what to fix
    else setFeedback({ step, mood: 'oops', kind, text: `${robotLine(lines, 'retry')} ${r.diagnosis?.text ?? ''}`.trim() });
  };

  const retry = (next: { wave?: Wave; rule?: Rule }) => {
    if (next.wave) { setWave(next.wave); setOnDrill(next.wave.id !== play.wave.id); }
    if (next.rule) setWaveRule(next.rule);
    setFeedback(null); setCard(null); setGain(''); setStatus(null);
    setAttempt((a) => a + 1);
  };

  const remedial = feedback?.step === 'hint' ? (content.remedial[feedback.kind ?? 'other'] ?? content.remedial.other) : undefined;
  const drill = feedback && (feedback.step === 'replay-then-drill' || feedback.step === 'drill') ? drillFor(feedback.kind) : null;
  const mode = { kind: 'challenge' as const, wave, rule: waveRule, onDone: onResult };
  const playing = status && (status.phase === 'play' || status.phase === 'impact');

  if (!cab) return <p className="lead">This game is not available.</p>;
  return (
    <div className="lesson-play">
      {talk && <div ref={robotRef} className="lesson-robot"><Robot name={lines.name} mood={feedback?.mood ?? 'idle'} line={feedback?.text ?? play.mission[theme]} /></div>}
      <div className="stage-frame">
        <Suspense fallback={<p className="stage-loading">Powering up…</p>}>
          <LazyStage key={`${wave.id}-${attempt}`} cabinet={cabinet} content={cab} className="stage" mode={mode}
            label={`${cab.meta.name}: ${play.mission[theme]}`} onStatus={setStatus} onReady={(c) => { controls.current = c; }} />
        </Suspense>
        {gain && <p className="stage-gain mono" role="status">{gain}</p>}
      </div>
      {status && status.goal && (
        <div className="stage-mission">
          <p className="mono">{status.goal}</p>
          {status.checklist.length > 0 && <ul className="checklist">{status.checklist.map((c) => <li key={c.label} className={c.ok ? 'ok' : ''}>{c.ok ? '✓' : '○'} {c.label}</li>)}</ul>}
        </div>
      )}
      {status?.phase === 'replay' && <p className="stage-caption mono" aria-live="polite">{status.caption}</p>}
      <div className="actions">
        {playing && <button className="btn btn-primary" disabled={status?.locked} onClick={() => controls.current?.lock()}>Lock in <kbd>Space</kbd></button>}
        {feedback?.step === 'right' && <button className="btn btn-primary" onClick={() => onDone({ correct: true, firstTry: firstTry.current })}>Continue</button>}
        {feedback?.step === 'named' && <button className="btn btn-primary" onClick={() => retry({})}>Try again</button>}
        {feedback?.step === 'hint' && <button className="btn btn-primary" onClick={() => retry({ rule: 'assist' })}>Try again with the aids</button>}
        {(feedback?.step === 'replay-then-drill' || feedback?.step === 'drill') && (
          <button className="btn btn-primary" disabled={status?.phase === 'replay'} onClick={() => retry({ wave: drill ?? play.wave, rule: 'assist' })}>
            {drill && !onDrill ? 'Training wave' : 'Try again'}
          </button>
        )}
        {feedback && feedback.step !== 'right' && onBack && <button className="btn btn-secondary" onClick={onBack}>Back to the lesson</button>}
      </div>
      {remedial && (
        <article className="remedial">
          <h3>{remedial.title}</h3>
          <RichText text={remedial.text.guided} />
          {remedial.scene && <MiniScene frames={remedial.scene} label={`Catch-up scene: ${remedial.title}`} />}
        </article>
      )}
      {card && (
        <aside className="dex-card" role="status">
          <p className="eyebrow">New Transform Dex card</p>
          <h3>{card.name}</h3>
          <p>{card.body}</p>
        </aside>
      )}
    </div>
  );
}
