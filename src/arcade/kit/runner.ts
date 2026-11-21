import type { CabinetContent, DexCard, Wave } from '../../content/types';
import type { Diagnosis } from '../../engine/diagnoseKinds';
import { RULES } from '../../engine/types';
import type { Mode, Rule } from '../../engine/types';
import { isBossWave, nextWave, tierFor, waveSeconds } from '../../engine/waves';
import type { RunState } from '../../engine/waves';

/** What a cabinet's mini-game must provide. Everything else (flow, pacing, scoring) is the Runner's job. */
export interface CabinetGame {
  setup(ctx: unknown): void;
  startWave(wave: Wave, rule: Rule): void;
  /** t goes from 0 (wave starts) to 1 (impact). */
  update(dt: number, t: number): void;
  isLocked(): boolean;
  lock(): void;
  evaluate(): { correct: boolean; diagnosis: Diagnosis | null };
  /** Mission in coordinates, shown in the brief and during the wave (pedagogical rule 1). */
  goalText(rule: Rule): string;
  /** Live checklist (rule 3); empty under the abstract rule. */
  checklist(rule: Rule): { label: string; ok: boolean }[];
  /** Draws the replay at k ∈ [0, 1] and returns its caption (rule 5). */
  replay(k: number): string;
  /** Optional: called every frame for drawing that does not depend on the phase logic (e.g. a wall passing through). */
  frame?(dt: number, phase: Phase, t: number, clock: number): void;
  /** Optional: extra HUD drawn by the cabinet (e.g. the live matrix). */
  hud?(): void;
  destroy(): void;
}

export type Phase = 'brief' | 'play' | 'result' | 'replay' | 'card' | 'over' | 'done';

export interface WaveOutcome {
  correct: boolean;
  rule: Rule;
  firstTry: boolean;
  concept: string;
  /** A real boss wave (drills played during the boss stage do not count). */
  boss: boolean;
  /** This win completed the boss stage: the cabinet is cleared. */
  cleared: boolean;
  diagnosis: Diagnosis | null;
}

export interface RunnerOptions {
  mode: Mode;
  /** 1 starts the run at the partial rule (a cabinet passed in the placement test). */
  startTier?: 0 | 1;
  rand?: () => number;
  /** Called once per wave; returns the Dex concept unlocked by this wave, if any. */
  onWaveResult: (o: WaveOutcome) => { newDex: string | null };
}

/** A background tab can deliver a huge frame; never advance more than 50 ms at once. */
export const clampDt = (ms: number) => Math.min(Math.max(ms, 0) / 1000, 0.05);

const LOCK_SPEED = 6;
/** Lives per run. */
export const START_LIVES = 5;
/** Where an untimed wave waits (the wall far away) until LOCK IN. */
const UNTIMED_T = 0.12;
const BRIEF_GUARD = 0.25;
const CARD_GUARD = 0.5;

export class Runner {
  phase: Phase = 'brief';
  run: RunState;
  wave: Wave | null = null;
  rule: Rule = 'assist';
  boss = false;
  isDrill = false;
  drillLabel = '';
  banner = '';
  /** Wave progress 0..1 and its duration in seconds. */
  t = 0;
  duration = 10;
  phaseClock = 0;
  lockBonus = 0;
  outcome: WaveOutcome | null = null;
  lastGain = 0;
  replayK = 0;
  replayLen = 4;
  caption = '';
  card: DexCard | null = null;
  bossWins = 0;
  /** The first wave of a run has no time limit: it waits for LOCK IN. */
  untimed = false;
  readonly maxLives = START_LIVES;
  private lockSeen = false;
  private pendingCard: DexCard | null = null;
  private rand: () => number;

  constructor(private content: CabinetContent, private game: CabinetGame, private opts: RunnerOptions) {
    this.rand = opts.rand ?? Math.random;
    this.run = { mode: opts.mode, waveIndex: -1, tierIndex: 0, focus: null, lastWaveId: null, lives: START_LIVES, score: 0, combo: 0 };
  }

  get meta() { return this.content.meta; }
  get goal() { return this.game.goalText(this.rule); }
  get checklist() { return this.game.checklist(this.rule); }
  /** True once the player has committed (LOCK IN or an in-game answer button). */
  get locked() { return this.game.isLocked(); }
  get secondsLeft() { return this.untimed ? Infinity : Math.max(0, ((1 - this.t) * this.duration) / (this.game.isLocked() ? LOCK_SPEED : 1)); }

  start() {
    this.run = { ...this.run, waveIndex: -1, lives: START_LIVES, score: 0, combo: 0, focus: null, lastWaveId: null };
    this.bossWins = 0;
    this.setupWave();
  }

  private setupWave() {
    const prevRule = this.run.waveIndex < 0 ? null : this.rule;
    const waveIndex = this.run.waveIndex + 1;
    const { meta } = this;
    this.boss = isBossWave(meta, this.opts.mode, waveIndex, this.opts.startTier ?? 0);
    const tierIndex = tierFor(meta, this.opts.mode, waveIndex, this.opts.startTier ?? 0);
    this.rule = this.boss ? 'abstract' : RULES[tierIndex];
    this.run = { ...this.run, waveIndex, tierIndex };
    const pick = nextWave(this.content, this.run, this.rand);
    this.wave = pick.wave;
    this.isDrill = pick.isDrill;
    this.drillLabel = pick.drillLabel ?? '';
    this.run.lastWaveId = pick.wave.id;
    this.duration = waveSeconds(meta, this.opts.mode, tierIndex);
    this.untimed = waveIndex === 0 && !this.boss;
    this.t = this.untimed ? UNTIMED_T : 0;
    this.lockBonus = 0;
    this.lockSeen = false;
    this.outcome = null;
    this.game.startWave(pick.wave, this.rule);
    if (this.isDrill) this.banner = `TRAINING · ${this.drillLabel.toUpperCase()}`;
    else if (this.boss) this.banner = `BOSS WAVE · ${this.bossWins + 1}/${meta.boss.waves} — no help this time`;
    else if (prevRule !== this.rule) this.banner = meta.tiers[tierIndex].banner;
    else this.banner = '';
    this.enter('brief');
  }

  private enter(p: Phase) { this.phase = p; this.phaseClock = 0; }

  tick(ms: number) {
    const dt = clampDt(ms);
    this.phaseClock += dt;
    if (this.phase === 'play') {
      if (this.game.isLocked() && !this.lockSeen) { this.lockSeen = true; this.lockBonus = this.untimed ? 0 : Math.round((1 - this.t) * 100); }
      // an untimed wave stays put until the player locks in
      if (!(this.untimed && !this.game.isLocked())) this.t = Math.min(1, this.t + (dt / this.duration) * (this.game.isLocked() ? LOCK_SPEED : 1));
      this.game.update(dt, this.t);
      if (this.t >= 1) this.resolve();
    } else if (this.phase === 'result') {
      if (this.phaseClock >= (this.outcome?.correct ? 1.6 : 3)) { this.replayK = 0; this.replayLen = this.outcome?.correct && this.rule === 'assist' && !this.isDrill ? 3.2 : 5; this.enter('replay'); }
    } else if (this.phase === 'replay') {
      this.replayK = Math.min(1, this.replayK + dt / this.replayLen);
      this.caption = this.game.replay(this.replayK);
    } else if (this.phase === 'brief' || this.phase === 'card') {
      this.game.update(dt, this.t);
    }
  }

  lock() {
    if (this.phase !== 'play' || this.game.isLocked()) return;
    this.lockSeen = true;
    this.lockBonus = this.untimed ? 0 : Math.round((1 - this.t) * 100);
    this.game.lock();
  }

  click() {
    if (this.phase === 'brief' && this.phaseClock >= BRIEF_GUARD) this.enter('play');
    else if (this.phase === 'replay') this.afterReplay();
    else if (this.phase === 'card' && this.phaseClock >= CARD_GUARD) { this.card = null; this.afterCard(); }
  }

  private resolve() {
    const { correct, diagnosis } = this.game.evaluate();
    const wave = this.wave!;
    const realBoss = this.boss && !this.isDrill;
    if (correct && realBoss) this.bossWins += 1;
    const cleared = correct && realBoss && this.bossWins >= this.meta.boss.waves;
    const outcome: WaveOutcome = { correct, rule: this.rule, firstTry: correct, concept: wave.concept, boss: realBoss, cleared, diagnosis };
    this.outcome = outcome;
    if (correct) {
      this.run.combo += 1;
      this.lastGain = (100 + this.lockBonus + (this.rule === 'abstract' ? 50 : 0)) * this.run.combo;
      this.run.score += this.lastGain;
      if (this.isDrill) this.run.focus = null;
    } else {
      this.lastGain = 0;
      this.run.combo = 0;
      this.run.lives -= 1;
      this.run.focus = diagnosis?.kind ?? null;
    }
    const { newDex } = this.opts.onWaveResult(outcome);
    this.pendingCard = newDex ? this.content.dex.find((c) => c.concept === newDex) ?? null : null;
    this.enter('result');
  }

  private afterReplay() {
    if (this.run.lives <= 0) { this.enter('over'); return; }
    if (this.pendingCard) { this.card = this.pendingCard; this.pendingCard = null; this.enter('card'); return; }
    this.afterCard();
  }

  private afterCard() {
    if (this.bossWins >= this.meta.boss.waves) { this.enter('done'); return; }
    this.setupWave();
  }
}
