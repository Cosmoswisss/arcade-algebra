import type { Wave } from '../../content/types';
import type { Diagnosis } from '../../engine/diagnoseKinds';
import type { Rule } from '../../engine/types';
import { clampDt } from './runner';
import type { CabinetGame } from './runner';

/**
 * Two ways to drive a cabinet game outside a full run, using only the CabinetGame interface:
 * the lesson scene (a replay on a loop) and "Your turn" (one untimed wave). Pure: no Pixi here.
 */

const REPLAY_SECONDS = 5;
/** Pause on the finished replay before it loops, so the last caption can be read. */
const HOLD_SECONDS = 1.2;

export class DemoDriver {
  k = 0;
  caption = '';
  private hold = 0;
  private seconds: number;

  constructor(private game: CabinetGame, wave: Wave, rule: Rule, opts: { seconds?: number } = {}) {
    this.seconds = opts.seconds ?? REPLAY_SECONDS;
    game.startWave(wave, rule);
    this.caption = game.replay(0);
  }

  tick(ms: number) {
    const dt = clampDt(ms);
    if (this.k >= 1) {
      this.hold += dt;
      if (this.hold >= HOLD_SECONDS) this.restart();
      return;
    }
    this.k = Math.min(1, this.k + dt / this.seconds);
    this.caption = this.game.replay(this.k);
  }

  restart() {
    this.k = 0; this.hold = 0;
    this.caption = this.game.replay(0);
  }
}

/** While the player thinks, the wave stays frozen near its start (the wall far away). */
export const CHALLENGE_T = 0.12;
const IMPACT_SECONDS = 0.6;

export type ChallengePhase = 'play' | 'impact' | 'replay' | 'done';
export interface ChallengeResult { correct: boolean; diagnosis: Diagnosis | null }

export class ChallengeDriver {
  phase: ChallengePhase = 'play';
  t = CHALLENGE_T;
  k = 0;
  caption = '';
  result: ChallengeResult | null = null;

  constructor(private game: CabinetGame, wave: Wave, rule: Rule, private onDone: (r: ChallengeResult) => void) {
    game.startWave(wave, rule);
  }

  get locked() { return this.game.isLocked(); }

  lock() {
    if (this.phase !== 'play' || this.game.isLocked()) return;
    this.game.lock();
  }

  tick(ms: number) {
    const dt = clampDt(ms);
    if (this.phase === 'play') {
      if (this.game.isLocked()) this.phase = 'impact';
      else { this.game.update(dt, CHALLENGE_T); return; }
    }
    if (this.phase === 'impact') {
      this.t = Math.min(1, this.t + dt * ((1 - CHALLENGE_T) / IMPACT_SECONDS));
      this.game.update(dt, this.t);
      if (this.t >= 1 - 1e-9) {
        this.result = this.game.evaluate();
        this.phase = 'done';
        this.onDone(this.result);
      }
      return;
    }
    if (this.phase === 'replay') {
      this.k = Math.min(1, this.k + dt / REPLAY_SECONDS);
      this.caption = this.game.replay(this.k);
      if (this.k >= 1) this.phase = 'done';
    }
  }

  /** Plays the replay of the right answer (rung 3 of the hint ladder). */
  showReplay() {
    this.k = 0;
    this.phase = 'replay';
    this.caption = this.game.replay(0);
  }
}
