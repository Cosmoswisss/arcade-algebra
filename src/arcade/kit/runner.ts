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
  boss: boolean;
  diagnosis: Diagnosis | null;
}

export interface RunnerOptions {
  mode: Mode;
  rand?: () => number;
  /** Called once per wave; returns the Dex concept unlocked by this wave, if any. */
  onWaveResult: (o: WaveOutcome) => { newDex: string | null };
}

/** A background tab can deliver a huge frame; never advance more than 50 ms at once. */
export const clampDt = (ms: number) => Math.min(Math.max(ms, 0) / 1000, 0.05);

const LOCK_SPEED = 6;
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
  private pendingCard: DexCard | null = null;
  private rand: () => number;

  constructor(private content: CabinetContent, private game: CabinetGame, private opts: RunnerOptions) {
    this.rand = opts.rand ?? Math.random;
    this.run = { mode: opts.mode, waveIndex: -1, tierIndex: 0, focus: null, lastWaveId: null, lives: 3, score: 0, combo: 0 };
  }

  get meta() { return this.content.meta; }
  get goal() { return this.game.goalText(this.rule); }
  get checklist() { return this.game.checklist(this.rule); }
  get secondsLeft() { return Math.max(0, ((1 - this.t) * this.duration) / (this.game.isLocked() ? LOCK_SPEED : 1)); }

  start() {
    this.run = { ...this.run, waveIndex: -1, lives: 3, score: 0, combo: 0, focus: null, lastWaveId: null };
    this.bossWins = 0;
    this.setupWave();
  }

  private setupWave() {
    const prevRule = this.run.waveIndex < 0 ? null : this.rule;
    const waveIndex = this.run.waveIndex + 1;
    const { meta } = this;
    this.boss = isBossWave(meta, this.opts.mode, waveIndex);
    const tierIndex = tierFor(meta, this.opts.mode, waveIndex);
    this.rule = this.boss ? 'abstract' : RULES[tierIndex];
    this.run = { ...this.run, waveIndex, tierIndex };
    const pick = nextWave(this.content, this.run, this.rand);
    this.wave = pick.wave;
    this.isDrill = pick.isDrill;
    this.drillLabel = pick.drillLabel ?? '';
    this.run.lastWaveId = pick.wave.id;
    this.duration = waveSeconds(meta, this.opts.mode, tierIndex);
    this.t = 0;
    this.lockBonus = 0;
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
      this.t = Math.min(1, this.t + (dt / this.duration) * (this.game.isLocked() ? LOCK_SPEED : 1));
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
    this.lockBonus = Math.round((1 - this.t) * 100);
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
    const outcome: WaveOutcome = { correct, rule: this.rule, firstTry: correct, concept: wave.concept, boss: this.boss, diagnosis };
    this.outcome = outcome;
    if (correct) {
      this.run.combo += 1;
      this.lastGain = (100 + this.lockBonus + (this.rule === 'abstract' ? 50 : 0)) * this.run.combo;
      this.run.score += this.lastGain;
      if (this.isDrill) this.run.focus = null;
      if (this.boss) this.bossWins += 1;
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
