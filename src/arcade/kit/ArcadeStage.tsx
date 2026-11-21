import { Application, Container, Graphics } from 'pixi.js';
import { useEffect, useRef } from 'react';
import type { CabinetContent, Wave } from '../../content/types';
import type { Mode, Rule } from '../../engine/types';
import { sfx, unlockAudio } from './audio';
import type { KitContext } from './context';
import { Coords } from './coords';
import { declutter } from './declutter';
import { ChallengeDriver, DemoDriver } from './drivers';
import type { ChallengePhase, ChallengeResult } from './drivers';
import { Fx } from './fx';
import { Handle } from './handles';
import { Hud } from './hud';
import { computeLayout, toPlane, toScreen } from './layout';
import type { Layout } from './layout';
import { NEON } from './neon';
import { Runner } from './runner';
import type { CabinetGame, Phase, WaveOutcome } from './runner';
import { drawSynthwave } from './scene';

export type GameFactory = () => CabinetGame & { setup(ctx: KitContext): void };

/** How the stage is driven: a full run (the cabinet), a looping replay (a lesson scene), or one untimed wave ("Your turn"). */
export type StageMode =
  | { kind: 'run'; mode: Mode; startTier?: 0 | 1; onWaveResult: (o: WaveOutcome) => { newDex: string | null }; dex: () => { count: number; total: number; isNew: (concept: string) => boolean }; onExit: () => void }
  | { kind: 'demo'; wave: Wave; rule: Rule; seconds?: number }
  | { kind: 'challenge'; wave: Wave; rule: Rule; onDone: (r: ChallengeResult) => void };

/** What the page around a demo or challenge shows in HTML (mission, checklist, caption, LOCK IN). */
export interface StageStatus { phase: ChallengePhase | 'demo'; goal: string; checklist: { label: string; ok: boolean }[]; caption: string; locked: boolean }
/** Commands the page can send to a demo or challenge. */
export interface StageControls { lock(): void; restart(): void; showReplay(): void }

export interface ArcadeStageProps {
  content: CabinetContent;
  createGame: GameFactory;
  mode: StageMode;
  className?: string;
  /** Accessible name of the canvas region. */
  label?: string;
  onStatus?: (s: StageStatus) => void;
  onReady?: (c: StageControls) => void;
}

/**
 * The Pixi scene every cabinet game runs in. The setup (background, axes, game layer, effects,
 * label decluttering) is shared; only the driver changes. Remount (React `key`) to change wave.
 */
export default function ArcadeStage(props: ArcadeStageProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const el = host.current!;
    const app = new Application();
    let alive = true;
    let cleanup = () => {};
    (async () => {
      try { await (document as Document & { fonts?: FontFaceSet }).fonts?.ready; } catch { /* fonts are optional */ }
      await app.init({ resizeTo: el, background: NEON.bg, antialias: true, autoDensity: true, resolution: Math.min(2, window.devicePixelRatio || 1) });
      if (!alive) { app.destroy(true, { children: true }); return; }
      el.appendChild(app.canvas);

      const mode = latest.current.mode;
      let L: Layout = computeLayout(app.screen.width, app.screen.height);
      const world = new Container(), bg = new Graphics(), layer = new Container(), fxG = new Graphics(), flashG = new Graphics();
      fxG.blendMode = 'add';
      const coords = new Coords();
      world.addChild(bg, coords.view, layer, fxG);
      app.stage.addChild(world, flashG);
      const fx = new Fx(fxG, flashG, world);
      const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      let clock = 0;

      // the driver decides the phase the game sees
      let runner: Runner | null = null;
      let demo: DemoDriver | null = null;
      let challenge: ChallengeDriver | null = null;
      const phaseNow = (): Phase => {
        if (runner) return runner.phase;
        if (demo) return 'replay';
        if (!challenge) return 'brief';
        return challenge.phase === 'replay' ? 'replay' : challenge.phase === 'done' ? 'result' : 'play';
      };

      // keyboard play (spec §3): Tab picks the next handle the game currently allows, the arrow keys move it one snap step
      const handles: Handle[] = [];
      let selected = -1;
      const select = (k: number) => { handles.forEach((h, i) => { h.selected = i === k; }); selected = k; };
      const nextHandle = (back: boolean): number => {
        const live = handles.map((h, i) => (h.enabled ? i : -1)).filter((i) => i >= 0);
        const at = live.indexOf(selected);
        const k = at === -1 ? (back ? live.length - 1 : 0) : at + (back ? -1 : 1);
        return k >= 0 && k < live.length ? live[k] : -1;
      };
      const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      const onStageKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const k = nextHandle(e.shiftKey);
          if (k === -1) { select(-1); return; } // past the last handle: let the focus leave the stage
          e.preventDefault(); select(k); return;
        }
        const d = ARROWS[e.key];
        if (!d) return;
        if (selected === -1 || !handles[selected]?.enabled) { const k = nextHandle(false); if (k === -1) return; select(k); }
        e.preventDefault();
        handles[selected].nudge(d[0], d[1]);
      };
      el.addEventListener('keydown', onStageKey);
      const onBlur = () => select(-1);
      el.addEventListener('focusout', onBlur);

      const ctx: KitContext = {
        app, layer, coords, fx, sfx,
        layout: () => L,
        toScreen: (p, origin, s) => toScreen(L, p, origin, s),
        toPlane: (x, y, origin) => toPlane(L, x, y, origin),
        clock: () => clock,
        phase: phaseNow,
        handle: (o) => { const h = new Handle(layer, app.stage, { toPlane: (x, y) => toPlane(L, x, y), toScreen: (p) => toScreen(L, p), ...o }); handles.push(h); return h; },
      };
      const game = latest.current.createGame();
      game.setup(ctx);

      let hud: Hud | null = null;
      if (mode.kind === 'run') {
        const runOpts = () => latest.current.mode as Extract<StageMode, { kind: 'run' }>;
        runner = new Runner(latest.current.content, game, { mode: mode.mode, startTier: mode.startTier, onWaveResult: (o) => runOpts().onWaveResult(o) });
        const r = runner;
        hud = new Hud(latest.current.content.meta, latest.current.content.dex, {
          onLock: () => { if (r.phase === 'play') { r.lock(); sfx.lock(); } },
          onExit: () => runOpts().onExit(),
          onRetry: () => r.start(),
          dex: () => runOpts().dex(),
        });
        app.stage.addChild(hud.view);
        hud.layout(L);
        r.start();
      } else if (mode.kind === 'demo') {
        demo = new DemoDriver(game, mode.wave, mode.rule, { seconds: mode.seconds });
      } else {
        challenge = new ChallengeDriver(game, mode.wave, mode.rule, (res) => {
          if (!reduced) {
            if (res.correct) { fx.burst(L.O[0] + L.U * 0.5, L.O[1] - L.U * 0.5, 70, [NEON.player, NEON.accent, NEON.target, NEON.i]); fx.flash(NEON.player, 0.45); }
            else { fx.burst(L.O[0], L.O[1] - L.U * 0.5, 30, [NEON.j, NEON.accent]); fx.shake(); fx.flash(NEON.j, 0.55); }
          }
          if (res.correct) sfx.win(1); else sfx.fail();
          (latest.current.mode as Extract<StageMode, { kind: 'challenge' }>).onDone(res);
        });
      }

      const lock = () => { unlockAudio(); if (challenge && challenge.phase === 'play' && !challenge.locked) { challenge.lock(); sfx.lock(); } };
      latest.current.onReady?.({
        lock,
        restart: () => demo?.restart(),
        showReplay: () => { if (challenge) { challenge.showReplay(); sfx.whoosh(); } },
      });

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.on('pointerdown', () => { unlockAudio(); if (runner && runner.phase !== 'play') runner.click(); });
      const onKey = (e: KeyboardEvent) => {
        if (runner) {
          if (e.code === 'Space') { e.preventDefault(); unlockAudio(); if (runner.phase === 'play') { if (runner.phaseClock > 0.3) { runner.lock(); sfx.lock(); } } else runner.click(); }
          if (e.code === 'Escape') (latest.current.mode as Extract<StageMode, { kind: 'run' }>).onExit();
        } else if (challenge && e.code === 'Space' && el.contains(document.activeElement)) { e.preventDefault(); lock(); }
      };
      window.addEventListener('keydown', onKey);
      const onResize = () => { L = computeLayout(app.screen.width, app.screen.height); hud?.layout(L); };
      app.renderer.on('resize', onResize);

      let prev: Phase = phaseNow(), floor = 0, lastBeat = -1, lastStatus = '';
      const tick = () => {
        const ms = app.ticker.deltaMS;
        const dt = Math.min(0.05, ms / 1000);
        clock += dt;
        const locked = game.isLocked();
        floor = (floor + dt * (phaseNow() === 'play' ? (locked ? 3.5 : 0.6) : 0.2)) % 1;
        drawSynthwave(bg, L, floor);
        let t = 0;
        if (runner) { runner.tick(ms); t = runner.t; }
        else if (demo) demo.tick(ms);
        else if (challenge) { challenge.tick(ms); t = challenge.t; }
        game.frame?.(dt, phaseNow(), t, clock);
        declutter(world, layer, coords.obstacles(), { x: 0, y: 0, w: L.w, h: L.h });

        if (runner && hud) {
          const r = runner;
          if (r.phase !== prev) {
            if (r.phase === 'result' && r.outcome) {
              if (r.outcome.correct) { fx.burst(L.O[0] + L.U * 0.5, L.O[1] - L.U * 0.5, 90, [NEON.player, NEON.accent, NEON.target, NEON.i]); fx.flash(NEON.player, 0.55); sfx.win(r.run.combo); }
              else { fx.burst(L.O[0], L.O[1] - L.U * 0.5, 40, [NEON.j, NEON.accent]); fx.shake(); fx.flash(NEON.j, 0.7); sfx.fail(); }
            }
            if (r.phase === 'replay') sfx.whoosh();
            if (r.phase === 'card') sfx.unlock();
            if (r.phase === 'brief' && (r.banner.startsWith('NEW RULE') || r.boss)) sfx.rule();
          }
          if (r.phase === 'play' && r.t > 0.6) { const beat = Math.floor(r.t * 12); if (beat !== lastBeat) { lastBeat = beat; sfx.tick(); } }
          hud.update(r, clock, () => game.hud?.());
        }
        prev = phaseNow();
        fx.update(dt, L.w, L.h);

        const onStatus = latest.current.onStatus;
        if (onStatus && !runner) {
          const rule = (latest.current.mode as { rule: Rule }).rule;
          const s: StageStatus = demo
            ? { phase: 'demo', goal: '', checklist: [], caption: demo.caption, locked: false }
            : { phase: challenge!.phase, goal: game.goalText(rule), checklist: game.checklist(rule), caption: challenge!.caption, locked };
          const key = JSON.stringify(s);
          if (key !== lastStatus) { lastStatus = key; onStatus(s); }
        }
      };
      app.ticker.add(tick);

      cleanup = () => {
        window.removeEventListener('keydown', onKey);
        el.removeEventListener('keydown', onStageKey);
        el.removeEventListener('focusout', onBlur);
        app.ticker.remove(tick);
        game.destroy();
        app.destroy(true, { children: true });
      };
    })();
    return () => { alive = false; cleanup(); };
  }, []);

  return <div ref={host} className={props.className ?? 'cabinet-view'} role="application" aria-label={props.label} tabIndex={props.mode.kind === 'demo' ? undefined : 0} />;
}
