import { go } from '../router';

/** Temporary stand-in until the diagnostic screen (Task 16) exists. */
export function DiagnosticSoon() {
  return <main className="screen narrow"><p className="kicker">Placement</p><h1 className="h1">Placement test coming soon</h1><button className="btn btn-primary" onClick={() => go('/hall')}>Go to the arcade</button></main>;
}
