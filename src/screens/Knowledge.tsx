import { cabinetEstimate } from '../engine/belief';
import { conceptRows, estimate, nextTarget } from '../engine/insight';
import { MASTERED } from '../engine/progression';
import { CABINETS } from '../engine/types';
import { href } from '../router';
import { useStore } from '../store';
import { ProofOfLearning } from '../ui/ProofOfLearning';
import { conceptsOf, EstimateBar, isAvailable, TargetCard, weakSpots } from '../ui/LearnerReport';

/**
 * The learner model in the open: the four steps of knowledge tracing, the estimate per concept with its uncertainty,
 * and the gap the next lesson is built around.
 */
export function Knowledge() {
  const { progress, content } = useStore();
  const concepts = conceptsOf(content);
  const cabinets = CABINETS.filter((c) => content.cabinets[c]);
  const tracked = cabinets.reduce((n, c) => n + conceptRows(progress, concepts, c).filter((r) => r.seen).length, 0);
  const total = cabinets.reduce((n, c) => n + (concepts[c]?.length ?? 0), 0);
  const placed = progress.placed.length;
  const target = nextTarget(progress, concepts, isAvailable(content));
  const spots = weakSpots(progress, 5);

  return (
    <main className="knowledge">
      <p className="eyebrow">Knowledge tracing</p>
      <h1>What the game knows about you</h1>
      <p className="lead">No chat and no guessing: each answer is logged against the concept it tests, and the lessons are built from the gaps.</p>

      <ol className="method">
        <li>
          <b>1 · Diagnostic</b>
          <span>A short adaptive test places you, so you never relearn what you hold.</span>
          <em>{placed > 0 ? `${placed} cabinet${placed > 1 ? 's' : ''} placed` : <a href={href.diagnostic}>Take the test</a>}</em>
        </li>
        <li>
          <b>2 · Every answer is evidence</b>
          <span>Lesson questions and game waves update the concept they test. A win with help counts less.</span>
          <em className="mono">{tracked} / {total} concepts tracked</em>
        </li>
        <li>
          <b>3 · Mastery with honest uncertainty</b>
          <span>A probability per concept, and how sure it is. Mastered needs a win with no help.</span>
          <em>shown below as % ± spread</em>
        </li>
        <li>
          <b>4 · Weak spots become targets</b>
          <span>The next waves favour what is weak, unsure or forgotten, and your repeated mistakes.</span>
          <em>{target ? <>next: {target.name}</> : 'all cleared'}</em>
        </li>
      </ol>

      {target && <TargetCard target={target} content={content} />}
      <ProofOfLearning attempts={progress.transfers} />

      {cabinets.map((c) => {
        const rows = conceptRows(progress, concepts, c);
        const e = cabinetEstimate(progress.beliefs, c, rows.map((r) => r.concept));
        return (
          <section key={c} className="kcab" aria-label={content.cabinets[c]!.meta.name}>
            <header>
              <h2>{content.cabinets[c]!.meta.name}</h2>
              <span className="mono">{e.evidence === 0 ? 'no data' : estimate(e.mean, e.sd)}{progress.mastery[c] >= MASTERED ? ' · mastered ✓' : ''}</span>
            </header>
            <ul className="report-rows">
              {rows.map((r) => (
                <li key={r.concept}>
                  <span>{r.name}</span>
                  <EstimateBar mean={r.mean} sd={r.sd} show={r.seen} />
                  <span className="mono">{r.seen ? estimate(r.mean, r.sd) : 'not tested'}{r.wins > 0 ? ' ✓' : ''}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {spots.length > 0 && (
        <section className="kcab" aria-label="Recurring mistakes">
          <header><h2>Mistakes that keep coming back</h2></header>
          <ul className="report-weak-list">
            {spots.map((s) => (
              <li key={`${s.cabinet}:${s.kind}`}><b>{content.remedial[s.kind]?.title ?? s.kind}</b> <span className="tiny">· {content.cabinets[s.cabinet]?.meta.name}</span></li>
            ))}
          </ul>
        </section>
      )}

      <p className="tiny legend">Bar = estimate. Yellow band = uncertainty (one standard deviation each side): it narrows as evidence comes in. ✓ = won with no help.</p>
      <div className="actions"><a className="btn btn-secondary" href={href.hall}>Back to the hall</a></div>
    </main>
  );
}
