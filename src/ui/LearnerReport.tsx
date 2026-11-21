import { cabinetEstimate } from '../engine/belief';
import { estimate, nextTarget, pct, type Concepts, type Target } from '../engine/insight';
import { errorKey, MASTERED, type ProgressV2 } from '../engine/progression';
import { CABINETS, type CabinetId } from '../engine/types';
import type { LoadedContent } from '../content/load';
import { PLAYABLE } from '../arcade/playable';
import { href } from '../router';

export const conceptsOf = (content: LoadedContent): Concepts =>
  Object.fromEntries(CABINETS.map((c) => [c, content.cabinets[c]?.dex.map((d) => ({ concept: d.concept, name: d.name }))])) as Concepts;

export const isAvailable = (content: LoadedContent) => (id: CabinetId) => !!content.cabinets[id] && PLAYABLE.has(id);

/** Recurring mistakes, strongest first: only patterns (weight 1.5 and more), not single slips. */
export function weakSpots(p: ProgressV2, limit = 3): { cabinet: CabinetId; kind: string; weight: number }[] {
  const out: { cabinet: CabinetId; kind: string; weight: number }[] = [];
  for (const c of CABINETS) {
    for (const [k, w] of Object.entries(p.mistakes)) if (k.startsWith(`${c}:`) && k !== `${c}:other` && w >= 1.5) out.push({ cabinet: c, kind: k.slice(c.length + 1), weight: w });
  }
  return out.sort((a, b) => b.weight - a.weight).slice(0, limit);
}

/** An estimate bar: the fill is the mean, the yellow band is the uncertainty (one standard deviation each side). */
export function EstimateBar({ mean, sd, show }: { mean: number; sd: number; show: boolean }) {
  const lo = Math.max(0, mean - sd);
  const hi = Math.min(1, mean + sd);
  return (
    <span className="report-bar" aria-hidden>
      {show && <><i style={{ width: `${pct(mean)}%` }} /><b style={{ left: `${pct(lo)}%`, width: `${pct(hi - lo)}%` }} /></>}
    </span>
  );
}

export function TargetCard({ target, content }: { target: Target; content: LoadedContent }) {
  const cab = content.cabinets[target.cabinet]?.meta.name ?? target.cabinet;
  return (
    <div className="target">
      <p className="eyebrow">Next target</p>
      <p className="target-name"><b>{target.name}</b> <span className="tiny">· {cab}</span></p>
      <p className="tiny">{target.why}. Estimate: <span className="mono">{target.seen ? estimate(target.mean, target.sd) : 'no data yet'}</span>. The next waves are built around it.</p>
      <a className="btn btn-secondary" href={PLAYABLE.has(target.cabinet) ? href.play(target.cabinet) : href.course(target.cabinet)}>Train it</a>
    </div>
  );
}

/** What the game believes about the learner, with its uncertainty, and the mistakes that keep coming back. */
export function LearnerReport({ progress, content }: { progress: ProgressV2; content: LoadedContent }) {
  const concepts = conceptsOf(content);
  const rows = CABINETS.filter((c) => content.cabinets[c]).map((c) => {
    const e = cabinetEstimate(progress.beliefs, c, concepts[c]?.map((x) => x.concept));
    return { c, name: content.cabinets[c]!.meta.name, e, proven: progress.mastery[c] >= MASTERED };
  });
  const spots = weakSpots(progress);
  const target = nextTarget(progress, concepts, isAvailable(content));
  const seen = rows.some((r) => r.e.evidence > 0);
  return (
    <section className="report" aria-label="What the game knows about you">
      <h2>What the game knows about you</h2>
      <p className="tiny">An estimate per cabinet, with how sure it is. Every answer, in lessons and in games, is evidence that sharpens it. <a href={href.knowledge}>See the full map</a> · <a href={href.transfer}>Prove it: transfer check</a></p>
      {!seen ? <p className="tiny">Nothing yet: play a lesson or a cabinet.</p> : (
        <ul className="report-rows">
          {rows.map(({ c, name, e, proven }) => (
            <li key={c}>
              <span>{name}</span>
              <EstimateBar mean={e.mean} sd={e.sd} show={e.evidence > 0} />
              <span className="mono">{e.evidence === 0 ? 'no data' : estimate(e.mean, e.sd)}{proven ? ' ✓' : ''}</span>
            </li>
          ))}
        </ul>
      )}
      {target && <TargetCard target={target} content={content} />}
      {spots.length > 0 && (
        <div className="report-weak">
          <h3>Mistakes that keep coming back</h3>
          <ul>
            {spots.map((s) => (
              <li key={errorKey(s.cabinet, s.kind)}>
                <b>{content.remedial[s.kind]?.title ?? s.kind}</b>
                <span className="tiny"> · {content.cabinets[s.cabinet]?.meta.name}. The next games add training on it.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
