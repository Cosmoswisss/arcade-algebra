import type { CabinetId, Rule } from './types';

/**
 * What the game believes about one concept: a Beta(a, b) over "the learner gets this right without help".
 * The prior is Beta(0.3, 1.2): mean 0.2, wide, and light (worth 1.5 answers), so the first answers move it a lot.
 * `a` and `b` are weighted counts of evidence, so the spread (the uncertainty) shrinks as evidence comes in.
 * Old evidence fades (DECAY): early misses, made while the learner was still learning, do not weigh forever.
 */
export interface Belief {
  a: number;
  b: number;
  /** Wins under the most demanding rule (nothing but the numbers). Aided wins never count here. */
  abs: number;
  /** When the last evidence arrived (ms), for spaced repetition. 0 = never. */
  last: number;
}

const PRIOR_A = 0.3;
const PRIOR_B = 1.2;
/** Share of the evidence kept at each new answer. */
export const DECAY = 0.93;
/** Wins with no help, over the whole cabinet, before it can count as mastered. One lucky win is not proof. */
export const PROOF_WINS = 2;
export const COURSE_CONCEPT = '@course';
/** Unaided answers on new cases (the transfer check). Counted as strong evidence, and as proof of mastery. */
export const TRANSFER_CONCEPT = '@transfer';
const isMeta = (name: string) => name === COURSE_CONCEPT || name === TRANSFER_CONCEPT;

export const priorBelief = (): Belief => ({ a: PRIOR_A, b: PRIOR_B, abs: 0, last: 0 });

export const beliefKey = (cabinet: CabinetId, concept: string) => `${cabinet}:${concept}`;

export const mean = (b: Belief) => b.a / (b.a + b.b);
export const variance = (b: Belief) => (b.a * b.b) / ((b.a + b.b) ** 2 * (b.a + b.b + 1));
export const spread = (b: Belief) => Math.sqrt(variance(b));
/** Weighted evidence collected so far (the prior does not count). */
export const evidence = (b: Belief) => Math.max(0, b.a + b.b - (PRIOR_A + PRIOR_B));

/**
 * A win under an aid says little (the aid could have done the work); a miss under an aid says a lot.
 * A win with nothing but the numbers is the strongest evidence there is.
 */
export const WIN_WEIGHT: Record<Rule, number> = { assist: 0.4, partial: 0.7, abstract: 1.2 };
export const MISS_WEIGHT: Record<Rule, number> = { assist: 1, partial: 0.9, abstract: 0.8 };

/** The old evidence fades toward the prior before the new answer is added. */
const faded = (b: Belief): { a: number; b: number } => ({ a: PRIOR_A + (b.a - PRIOR_A) * DECAY, b: PRIOR_B + (b.b - PRIOR_B) * DECAY });

/** `mult` scales the weight of this answer (the transfer check counts for more). */
export function observe(b: Belief, correct: boolean, rule: Rule, now: number, mult = 1): Belief {
  const f = faded(b);
  return correct
    ? { a: f.a + WIN_WEIGHT[rule] * mult, b: f.b, abs: b.abs + (rule === 'abstract' ? 1 : 0), last: now }
    : { a: f.a, b: f.b + MISS_WEIGHT[rule] * mult, abs: b.abs, last: now };
}

/** Raw weighted evidence, used for lesson questions and the placement test. */
export function addEvidence(b: Belief, wins: number, misses: number, now: number): Belief {
  const f = faded(b);
  return { a: f.a + wins, b: f.b + misses, abs: b.abs, last: now };
}

/** Enough evidence and a high enough mean to move on to the next concept without waiting. */
export const isConceptKnown = (b: Belief | undefined) => !!b && mean(b) >= 0.55 && evidence(b) >= 1.2;

export interface CabinetEstimate {
  mean: number;
  /** Standard deviation of the estimate: how unsure we are. */
  sd: number;
  evidence: number;
  /** At least PROOF_WINS wins under the most demanding rule: no cabinet counts as mastered without them. */
  proof: boolean;
}

/**
 * One number per cabinet, built from its concepts. A concept never seen counts at the prior, so a cabinet
 * is not "mastered" because two concepts went well. The lesson questions add one more entry.
 */
export function cabinetEstimate(beliefs: Record<string, Belief>, cabinet: CabinetId, concepts?: string[]): CabinetEstimate {
  const prefix = `${cabinet}:`;
  const names = concepts ?? Object.keys(beliefs).filter((k) => k.startsWith(prefix) && !isMeta(k.slice(prefix.length))).map((k) => k.slice(prefix.length));
  // The concepts weigh 1 each; the lesson questions count for less (they are few and guessable), the transfer check for more.
  const entries: { b: Belief; w: number }[] = names.map((c) => ({ b: beliefs[beliefKey(cabinet, c)] ?? priorBelief(), w: 1 }));
  const course = beliefs[beliefKey(cabinet, COURSE_CONCEPT)];
  if (course) entries.push({ b: course, w: 0.25 });
  const transfer = beliefs[beliefKey(cabinet, TRANSFER_CONCEPT)];
  if (transfer) entries.push({ b: transfer, w: 1.5 });
  if (entries.length === 0) { const p = priorBelief(); return { mean: mean(p), sd: spread(p), evidence: 0, proof: false }; }
  const total = entries.reduce((s, e) => s + e.w, 0);
  return {
    mean: entries.reduce((s, e) => s + e.w * mean(e.b), 0) / total,
    sd: Math.sqrt(entries.reduce((s, e) => s + e.w * e.w * variance(e.b), 0)) / total,
    evidence: entries.reduce((s, e) => s + evidence(e.b), 0),
    proof: entries.reduce((s, e) => s + e.b.abs, 0) >= PROOF_WINS,
  };
}

/** The value kept in `progress.mastery`: capped below the "mastered" line until there is a win with no aid. */
export const reportedMastery = (e: CabinetEstimate, line: number) => (e.proof ? e.mean : Math.min(e.mean, line - 0.01));

export function isBelief(x: unknown): x is Belief {
  const o = x as Belief;
  return !!o && typeof o === 'object' && [o.a, o.b, o.abs, o.last].every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0) && o.a + o.b > 0;
}
