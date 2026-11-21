import type { CabinetId } from '../engine/types';
import { go } from '../router';

/** Temporary stand-ins until the course (Task 9) and diagnostic (Task 16) screens exist. */
export function CourseSoon({ id }: { id: CabinetId }) {
  return <main className="screen narrow"><p className="kicker">Course</p><h1 className="h1">Course coming next</h1><button className="btn btn-primary" onClick={() => go(`/play/${id}`)}>Enter the cabinet</button></main>;
}
export function DiagnosticSoon() {
  return <main className="screen narrow"><p className="kicker">Placement</p><h1 className="h1">Placement test coming soon</h1><button className="btn btn-primary" onClick={() => go('/hall')}>Go to the arcade</button></main>;
}
