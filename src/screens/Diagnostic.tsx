import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { checkAnswer, type Answer } from '../ui/answers';
import { answerPlacement, currentProbe, diagnosticPlan, startPlacement } from '../content/diagnostic';
import { go, href } from '../router';
import { useStore } from '../store';
import { ArrowRight, Check } from '../ui/icons';
import { LessonPlay } from '../ui/LessonPlay';
import { QuestionPanel } from '../ui/QuestionPanel';

/**
 * A short, skippable, adaptive test: a binary search along the chain of games, about three games asked for seven. Each one gets
 * two probes you cannot pass by luck (its last lesson, played or asked, then a new case); one slip is forgiven with a spare
 * question. A game passed also unlocks the ones before it (not placed: their lessons stay). A game placed is: its known lessons are skipped, its game starts at the partial rule and its concepts count as known.
 * "Skip the test" keeps the answers already given.
 */
/** A played probe keeps its stage on screen this long after the impact, so the swing and the ball finish before the next one. */
const PLAY_SETTLE_MS = 2400;

export function Diagnostic() {
  const { content, placement, progress } = useStore();
  const plan = useMemo(() => diagnosticPlan(content.cabinets, String(Date.now())).map((p) => ({ ...p, name: content.cabinets[p.cabinet]!.meta.name })), [content]);
  const theme = progress.profile?.theme ?? 'games';
  const reduce = useReducedMotion();
  const [state, setState] = useState(() => startPlacement(plan));
  const [saved, setSaved] = useState(false);
  const { passed, failed, inferred } = state;

  const record = (ok: boolean) => {
    const next = answerPlacement(plan, state, ok);
    setState(next);
    if (next.done) { placement(next.passed, next.failed, next.inferred); setSaved(true); }
  };
  const settle = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(settle.current), []);
  const afterPlay = (ok: boolean) => {
    if (settle.current !== undefined) return;
    settle.current = window.setTimeout(() => { settle.current = undefined; record(ok); }, PLAY_SETTLE_MS);
  };
  const answer = (a: Answer) => { const q = currentProbe(state)?.question; if (q) record(checkAnswer(q, a).correct); };
  // skipping keeps what was already answered (spec §5.7, placement precisions)
  const skip = () => { placement(passed, failed, inferred); go(href.hall); };

  if (plan.length === 0) {
    return (
      <main className="narrow">
        <h1>No placement test yet</h1>
        <p className="lead">No game content is available to build it from.</p>
        <a className="btn btn-primary" href={href.hall}>Go to the hall</a>
      </main>
    );
  }

  if (saved) {
    return (
      <main className="narrow">
        <p className="eyebrow">Placement test · done</p>
        <h1>{passed.length + inferred.length === 0 ? 'You start from the first game' : 'Some games are already unlocked'}</h1>
        <p className="lead">
          {passed.length + inferred.length === 0
            ? 'No problem: the first game opens with a short lesson, and the game adapts as you play.'
            : 'You got these right, so they open now: their course keeps one review lesson and their game starts at the harder rule. Only wins with no help, on the numbers alone, earn the “mastered” mark.'}
        </p>
        <ul className="placed">
          {plan.map((it, i) => {
            const ok = passed.includes(it.cabinet) || inferred.includes(it.cabinet);
            return (
              <motion.li key={it.cabinet} className={ok ? 'is-ok' : ''}
                initial={reduce ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduce ? 0 : 0.2 * i }}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span>{it.name}</span>
                <span className="placed-state">{ok ? <><Check size={16} /> known</> : 'to learn'}</span>
              </motion.li>
            );
          })}
        </ul>
        <div className="actions"><a className="btn btn-primary" href={href.hall}>Enter the arcade hall <ArrowRight size={18} /></a></div>
      </main>
    );
  }

  const item = plan[state.cab];
  const probe = currentProbe(state);
  if (!probe) return null;
  return (
    <main className="course course--test">
      <header className="course-head">
        <div>
          <p className="eyebrow">Placement test · question {state.asked + 1}</p>
          <h1>{item.name}</h1>
        </div>
        <button className="linklike" onClick={skip}>Skip the test</button>
      </header>
      <div className="narrow-card">
        <p className="tiny">No feedback during the test. It is short: a few questions are enough to place you, and one slip is forgiven.</p>
        {probe.play && (
          <LessonPlay key={`${item.cabinet}-${state.asked}`} cabinet={item.cabinet} play={probe.play} theme={theme} variant="single" rule="abstract" talk={false}
            onDone={(r) => afterPlay(r.correct)} />
        )}
        {probe.question && <QuestionPanel q={probe.question} resetKey={`${item.cabinet}-${state.asked}`} onSubmit={answer} submitLabel="Next question" />}
      </div>
    </main>
  );
}
