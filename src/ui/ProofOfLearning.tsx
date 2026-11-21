import { pct } from '../engine/insight';
import type { TransferAttempt } from '../engine/progression';
import { href } from '../router';

const rate = (a: TransferAttempt) => {
  const total = a.results.reduce((n, r) => n + r.total, 0);
  return total ? a.results.reduce((n, r) => n + r.correct, 0) / total : 0;
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** The transfer checks so far: score on new cases, and how the estimate moved. This is the evidence of learning. */
export function ProofOfLearning({ attempts }: { attempts: TransferAttempt[] }) {
  const last = attempts[attempts.length - 1];
  return (
    <section className="proof" aria-label="Proof of learning">
      <h2>Proof of learning</h2>
      {!last ? (
        <p className="tiny">Not tested yet. The transfer check asks new cases with no help: it shows whether you learned or just enjoyed.</p>
      ) : (
        <>
          <p className="proof-line">
            <b className="mono">{pct(rate(last))}%</b> right on new cases
            <span className="tiny"> · estimate {pct(mean(last.results.map((r) => r.before)))}% → {pct(mean(last.results.map((r) => r.after)))}%</span>
          </p>
          {attempts.length > 1 && (
            <ul className="proof-history" aria-label="Previous checks">
              {attempts.map((a, i) => (
                <li key={a.at}>
                  <span className="tiny">check {i + 1}</span>
                  <span className="proof-bar" aria-hidden><i style={{ width: `${pct(rate(a))}%` }} /></span>
                  <span className="mono">{pct(rate(a))}%</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <a className="btn btn-secondary" href={href.transfer}>{last ? 'Take it again' : 'Take the transfer check'}</a>
    </section>
  );
}
