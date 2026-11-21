import { motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { checkAnswer, type Answer } from '../ui/answers';
import { diagnosticQuestions } from '../content/diagnostic';
import type { CabinetId } from '../engine/types';
import { go, href } from '../router';
import { useStore } from '../store';
import { ArrowRight, Check } from '../ui/icons';
import { LessonPlay } from '../ui/LessonPlay';
import { QuestionPanel } from '../ui/QuestionPanel';

/**
 * A short, skippable test: the last lesson of cabinets 1 to 5, played at the abstract rule (or asked, for a question lesson),
 * one attempt each and no feedback. Passing one marks its cabinet as placed: its known lessons are skipped and its game
 * starts at the partial rule. "Skip the test" keeps the answers already given.
 */
export function Diagnostic() {
  const { content, placement, progress } = useStore();
  const items = useMemo(() => diagnosticQuestions(content.cabinets).map(({ cabinet, play, question }) => ({ id: cabinet, name: content.cabinets[cabinet]!.meta.name, play, question })), [content]);
  const theme = progress.profile?.theme ?? 'games';
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [passed, setPassed] = useState<CabinetId[]>([]);
  const [saved, setSaved] = useState(false);

  const finish = (result: CabinetId[]) => { placement(result); setSaved(true); };
  const record = (ok: boolean) => {
    const item = items[index];
    const next = ok ? [...passed, item.id] : passed;
    setPassed(next);
    if (index + 1 >= items.length) finish(next);
    else setIndex(index + 1);
  };
  const answer = (a: Answer) => { const q = items[index].question; if (q) record(checkAnswer(q, a).correct); };
  // skipping keeps what was already answered (spec §5.7, placement precisions)
  const skip = () => { placement(passed); go(href.hall); };

  if (items.length === 0) {
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
        <h1>{passed.length === 0 ? 'You start from the first game' : 'Some games are already unlocked'}</h1>
        <p className="lead">
          {passed.length === 0
            ? 'No problem: the first game opens with a short lesson, and the game adapts as you play.'
            : 'You already predicted these correctly: they open as mastered, their course keeps one review lesson, and their game starts at the harder rule. Clear their boss to earn the badge.'}
        </p>
        <ul className="placed">
          {items.map((it, i) => {
            const ok = passed.includes(it.id);
            return (
              <motion.li key={it.id} className={ok ? 'is-ok' : ''}
                initial={reduce ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduce ? 0 : 0.25 * i }}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span>{it.name}</span>
                <span className="placed-state">{ok ? <><Check size={16} /> mastered</> : 'to learn'}</span>
              </motion.li>
            );
          })}
        </ul>
        <div className="actions"><a className="btn btn-primary" href={href.hall}>Enter the arcade hall <ArrowRight size={18} /></a></div>
      </main>
    );
  }

  const item = items[index];
  return (
    <main className="course">
      <header className="course-head">
        <div>
          <p className="eyebrow">Placement test · {item.play ? 'wave' : 'question'} {index + 1} of {items.length}</p>
          <h1>{item.name}</h1>
        </div>
        <button className="linklike" onClick={skip}>Skip the test</button>
      </header>
      <ol className="ticks" aria-label="Test progress">
        {items.map((it, i) => <li key={it.id} className={i < index ? 'done' : i === index ? 'now' : ''}>{i + 1}</li>)}
      </ol>
      <div className="narrow-card">
        <p className="tiny">No feedback during the test: it only decides which games are unlocked.</p>
        {item.play && (
          <LessonPlay key={item.id} cabinet={item.id} play={item.play} theme={theme} variant="single" rule="abstract" talk={false}
            onDone={(r) => record(r.correct)} />
        )}
        {item.question && <QuestionPanel q={item.question} resetKey={item.id} onSubmit={answer} submitLabel={index + 1 >= items.length ? 'Finish' : 'Next question'} />}
      </div>
    </main>
  );
}
