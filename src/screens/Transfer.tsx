import { useMemo, useState } from 'react';
import { TRANSFER_AT_END, TRANSFER_PER_CABINET, transferQuestions } from '../content/transfer';
import type { Question } from '../content/types';
import { estimate, pct } from '../engine/insight';
import { transferCabinets, type TransferAnswers, type TransferAttempt } from '../engine/progression';
import type { CabinetId } from '../engine/types';
import { href } from '../router';
import { useStore } from '../store';
import { checkAnswer, type Answer } from '../ui/answers';
import { ArrowRight } from '../ui/icons';
import { isAvailable } from '../ui/LearnerReport';
import { QuestionPanel } from '../ui/QuestionPanel';

interface Item { cabinet: CabinetId; name: string; q: Question }
interface Missed { name: string; prompt: string; text: string }

const PLACED = { known: 'placed as known', missed: 'placed as to learn' } as const;

/**
 * The proof of learning: new cases, no hints, no timer, no feedback until the end. Each cabinet you have worked on gets
 * fresh questions (never the lesson ones). The result sets the estimate from before the check against the one after.
 */
export function Transfer({ only }: { only?: CabinetId } = {}) {
  const { progress, content, finishTransfer } = useStore();
  const eligible = useMemo(() => (only ? (content.cabinets[only] && isAvailable(content)(only) ? [only] : []) : transferCabinets(progress, isAvailable(content))), [only, progress, content]);
  const per = only ? TRANSFER_AT_END : TRANSFER_PER_CABINET;
  const [phase, setPhase] = useState<'intro' | 'test' | 'results'>('intro');
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { correct: boolean; kind: string | null }[]>>({});
  const [missed, setMissed] = useState<Missed[]>([]);
  const [attempt, setAttempt] = useState<TransferAttempt | null>(null);
  const [previous, setPrevious] = useState<TransferAttempt | null>(null);

  const start = () => {
    const seed = String(Date.now());
    const next: Item[] = eligible.flatMap((c) => {
      const cab = content.cabinets[c]!;
      const met = new Set(cab.course.map((s) => s.check?.prompt).filter((p): p is string => !!p));
      return transferQuestions(c, per, seed, met).map((q) => ({ cabinet: c, name: cab.meta.name, q }));
    });
    setItems(next); setIndex(0); setAnswers({}); setMissed([]); setPhase('test');
  };

  const answer = (a: Answer) => {
    const item = items[index];
    const res = checkAnswer(item.q, a);
    const all = { ...answers, [item.cabinet]: [...(answers[item.cabinet] ?? []), { correct: res.correct, kind: res.diagnosis?.kind ?? null }] };
    const miss = res.correct ? missed : [...missed, { name: item.name, prompt: item.q.prompt, text: res.diagnosis?.text ?? '' }];
    setAnswers(all); setMissed(miss);
    if (index + 1 < items.length) { setIndex(index + 1); return; }
    const payload: TransferAnswers[] = eligible.filter((c) => all[c]).map((c) => ({ cabinet: c, outcomes: all[c] }));
    setPrevious(progress.transfers[progress.transfers.length - 1] ?? null);
    setAttempt(finishTransfer(payload));
    setPhase('results');
  };

  if (phase === 'intro') {
    return (
      <main className="narrow">
        <p className="eyebrow">{only ? `End of ${content.cabinets[only]?.meta.name ?? 'the cabinet'} · proof of learning` : 'Proof of learning'}</p>
        <h1>{only ? 'Prove it on new cases' : 'Transfer check'}</h1>
        <p className="lead">Enjoying the games is not the same as having learned. This check asks new cases, with no help, no timer and no feedback until the end.</p>
        <ul className="transfer-rules">
          <li><b>New cases.</b> Built on the spot, never a lesson question.</li>
          <li><b>No help.</b> The matrix is written, the plane is plain, and there is no multiple choice to guess.</li>
          <li><b>Counted.</b> Every answer updates your estimate, and a win here is the strongest proof of mastery.</li>
        </ul>
        {eligible.length === 0 ? (
          <>
            <p className="lead">Nothing to check yet: play a lesson or a cabinet first.</p>
            <div className="actions"><a className="btn btn-primary" href={href.hall}>Back to the hall</a></div>
          </>
        ) : (
          <>
            <p className="tiny">{eligible.length} cabinet{eligible.length > 1 ? 's' : ''}, {per} questions each: {eligible.map((c) => content.cabinets[c]?.meta.name).join(', ')}.</p>
            <div className="actions">
              <button className="btn btn-primary" onClick={start}>Start the check <ArrowRight size={18} /></button>
              <a className="linklike" href={href.hall}>Not now</a>
            </div>
          </>
        )}
      </main>
    );
  }

  if (phase === 'test' && items[index]) {
    const item = items[index];
    return (
      <main className="course">
        <header className="course-head">
          <div>
            <p className="eyebrow">Transfer check · question {index + 1} of {items.length}</p>
            <h1>{item.name}</h1>
          </div>
        </header>
        <ol className="ticks" aria-label="Check progress">
          {items.map((it, i) => <li key={i} className={i < index ? 'done' : i === index ? 'now' : ''}>{i + 1}</li>)}
        </ol>
        <div className="narrow-card">
          <p className="tiny">No feedback until the end.</p>
          <QuestionPanel q={item.q} resetKey={`t-${index}`} onSubmit={answer} submitLabel={index + 1 >= items.length ? 'Finish' : 'Next question'} />
        </div>
      </main>
    );
  }

  const results = attempt?.results ?? [];
  const correct = results.reduce((n, r) => n + r.correct, 0);
  const total = results.reduce((n, r) => n + r.total, 0);
  const avg = (f: (r: TransferAttempt['results'][number]) => number, rs = results) => (rs.length ? rs.reduce((s, r) => s + f(r), 0) / rs.length : 0);
  const prevRate = previous ? previous.results.reduce((n, r) => n + r.correct, 0) / Math.max(1, previous.results.reduce((n, r) => n + r.total, 0)) : null;
  const rate = total ? correct / total : 0;
  return (
    <main className="narrow transfer-results">
      <p className="eyebrow">Transfer check · result</p>
      <h1>{correct} of {total} on new cases</h1>
      <p className="lead">
        {rate === 1 ? 'You carried it over every time. That is learning, not luck.' : rate >= 0.5 ? 'Most of it carries over. The misses below are what to train next.' : 'This is the useful part: it shows what has not stuck yet, and the next waves will target it.'}
      </p>

      <div className="before-after" role="group" aria-label="Estimate before and after">
        <div><span className="tiny">Estimate before</span><b className="mono">{pct(avg((r) => r.before))}%</b></div>
        <span aria-hidden>→</span>
        <div><span className="tiny">Estimate after</span><b className="mono">{pct(avg((r) => r.after))}%</b></div>
        {prevRate !== null && <div className="vs"><span className="tiny">Last check</span><b className="mono">{pct(prevRate)}% right</b></div>}
      </div>

      <ul className="transfer-rows">
        {results.map((r) => (
          <li key={r.cabinet} className={r.correct === r.total ? 'is-ok' : r.correct === 0 ? 'is-ko' : ''}>
            <span>{content.cabinets[r.cabinet]?.meta.name}</span>
            <span className="mono">{r.correct}/{r.total}</span>
            <span className="tiny">{progress.placementResult[r.cabinet] ? `${PLACED[progress.placementResult[r.cabinet]!]} · ` : ''}{estimate(r.before, r.beforeSd)} → {estimate(r.after, r.afterSd)}</span>
          </li>
        ))}
      </ul>

      {missed.length > 0 && (
        <section className="report-weak" aria-label="What to train">
          <h3>What to train</h3>
          <ul>{missed.map((m, i) => <li key={i}><b>{m.name}</b> <span className="tiny">· {m.prompt} {m.text}</span></li>)}</ul>
        </section>
      )}

      <div className="actions">
        <a className="btn btn-primary" href={href.knowledge}>See my knowledge map <ArrowRight size={18} /></a>
        <a className="btn btn-secondary" href={href.hall}>Back to the hall</a>
      </div>
    </main>
  );
}
