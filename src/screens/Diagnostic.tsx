import { motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { checkAnswer, type Answer } from '../ui/answers';
import { diagnosticQuestions } from '../content/diagnostic';
import type { CabinetId } from '../engine/types';
import { go, href } from '../router';
import { useStore } from '../store';
import { ArrowRight, Check } from '../ui/icons';
import { QuestionPanel } from '../ui/QuestionPanel';

/** A short, skippable test: five predictions, one per cabinet 1 to 5. Passing one lights its cabinet up. */
export function Diagnostic() {
  const { content, placement } = useStore();
  const items = useMemo(() => diagnosticQuestions(content.cabinets).map(({ cabinet, question }) => ({ id: cabinet, name: content.cabinets[cabinet]!.meta.name, question })), [content]);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [passed, setPassed] = useState<CabinetId[]>([]);
  const [saved, setSaved] = useState(false);

  const finish = (result: CabinetId[]) => { placement(result); setSaved(true); };
  const answer = (a: Answer) => {
    const item = items[index];
    const ok = checkAnswer(item.question, a).correct;
    const next = ok ? [...passed, item.id] : passed;
    setPassed(next);
    if (index + 1 >= items.length) finish(next);
    else setIndex(index + 1);
  };

  if (items.length === 0) {
    return (
      <main className="narrow">
        <h1>No placement test yet</h1>
        <p className="lead">No cabinet content is available to build it from.</p>
        <a className="btn btn-primary" href={href.hall}>Go to the hall</a>
      </main>
    );
  }

  if (saved) {
    return (
      <main className="narrow">
        <p className="eyebrow">Placement test · done</p>
        <h1>{passed.length === 0 ? 'You start from the first cabinet' : 'Some cabinets are already lit'}</h1>
        <p className="lead">
          {passed.length === 0
            ? 'No problem: the first cabinet opens with a short lesson, and the game adapts as you play.'
            : 'You already predicted these correctly, so they open as mastered. Clear their boss to earn the badge.'}
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
          <p className="eyebrow">Placement test · question {index + 1} of {items.length}</p>
          <h1>{item.name}</h1>
        </div>
        <button className="linklike" onClick={() => go(href.hall)}>Skip the test</button>
      </header>
      <ol className="ticks" aria-label="Test progress">
        {items.map((it, i) => <li key={it.id} className={i < index ? 'done' : i === index ? 'now' : ''}>{i + 1}</li>)}
      </ol>
      <div className="narrow-card">
        <p className="tiny">No feedback during the test: it only decides which cabinets open already.</p>
        <QuestionPanel q={item.question} resetKey={item.id} onSubmit={answer} submitLabel={index + 1 >= items.length ? 'Finish' : 'Next question'} />
      </div>
    </main>
  );
}
