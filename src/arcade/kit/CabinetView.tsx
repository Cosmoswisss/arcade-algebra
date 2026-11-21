import { Application, Container, Graphics } from 'pixi.js';
import { useEffect, useRef } from 'react';
import type { CabinetContent } from '../../content/types';
import type { Mode } from '../../engine/types';
import { sfx, unlockAudio } from './audio';
import type { KitContext } from './context';
import { Coords } from './coords';
import { Fx } from './fx';
import { Handle } from './handles';
import { Hud } from './hud';
import { computeLayout, toPlane, toScreen } from './layout';
import type { Layout } from './layout';
import { NEON } from './neon';
import { Runner } from './runner';
import type { CabinetGame, Phase, WaveOutcome } from './runner';
import { drawSynthwave } from './scene';

export interface CabinetViewProps {
  content: CabinetContent;
  createGame: () => CabinetGame & { setup(ctx: KitContext): void };
  mode: Mode;
  onWaveResult: (o: WaveOutcome) => { newDex: string | null };
  dex: () => { count: number; total: number; isNew: (concept: string) => boolean };
  onExit: () => void;
}

/** Mounts one cabinet: a Pixi app, the Runner state machine, the HUD and the effects. Destroys everything on unmount. */
export default function CabinetView(props: CabinetViewProps) {
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

      let L: Layout = computeLayout(app.screen.width, app.screen.height);
      const world = new Container(), bg = new Graphics(), layer = new Container(), fxG = new Graphics(), flashG = new Graphics();
      fxG.blendMode = 'add';
      const coords = new Coords();
      world.addChild(bg, coords.view, layer, fxG);
      app.stage.addChild(world, flashG);
      const fx = new Fx(fxG, flashG, world);
      let clock = 0;
      let runner: Runner | null = null;

      const ctx: KitContext = {
        app, layer, coords, fx, sfx,
        layout: () => L,
        toScreen: (p, origin, s) => toScreen(L, p, origin, s),
        toPlane: (x, y, origin) => toPlane(L, x, y, origin),
        clock: () => clock,
        phase: () => runner?.phase ?? 'brief',
        handle: (o) => new Handle(layer, app.stage, { toPlane: (x, y) => toPlane(L, x, y), toScreen: (p) => toScreen(L, p), ...o }),
      };
      const game = latest.current.createGame();
      game.setup(ctx);
      runner = new Runner(latest.current.content, game, { mode: latest.current.mode, onWaveResult: (o) => latest.current.onWaveResult(o) });
      const r = runner;
      const hud = new Hud(latest.current.content.meta, latest.current.content.dex, {
        onLock: () => { if (r.phase === 'play') { r.lock(); sfx.lock(); } },
        onExit: () => latest.current.onExit(),
        onRetry: () => r.start(),
        dex: () => latest.current.dex(),
      });
      app.stage.addChild(hud.view);
      hud.layout(L);
      r.start();

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.on('pointerdown', () => { unlockAudio(); if (r.phase !== 'play') r.click(); });
      const onKey = (e: KeyboardEvent) => {
        if (e.code === 'Space') { e.preventDefault(); unlockAudio(); if (r.phase === 'play') { if (r.phaseClock > 0.3) { r.lock(); sfx.lock(); } } else r.click(); }
        if (e.code === 'Escape') latest.current.onExit();
      };
      window.addEventListener('keydown', onKey);
      const onResize = () => { L = computeLayout(app.screen.width, app.screen.height); hud.layout(L); };
      app.renderer.on('resize', onResize);

      let prev: Phase = r.phase, floor = 0, lastBeat = -1;
      const tick = () => {
        const ms = app.ticker.deltaMS;
        const dt = Math.min(0.05, ms / 1000);
        clock += dt;
        floor = (floor + dt * (r.phase === 'play' ? (game.isLocked() ? 3.5 : 0.6) : 0.2)) % 1;
        drawSynthwave(bg, L, floor);
        r.tick(ms);
        game.frame?.(dt, r.phase, r.t, clock);
        if (r.phase !== prev) {
          if (r.phase === 'result' && r.outcome) {
            if (r.outcome.correct) { fx.burst(L.O[0] + L.U * 0.5, L.O[1] - L.U * 0.5, 90, [NEON.player, NEON.accent, NEON.target, NEON.i]); fx.flash(NEON.player, 0.55); sfx.win(r.run.combo); }
            else { fx.burst(L.O[0], L.O[1] - L.U * 0.5, 40, [NEON.j, NEON.accent]); fx.shake(); fx.flash(NEON.j, 0.7); sfx.fail(); }
          }
          if (r.phase === 'replay') sfx.whoosh();
          if (r.phase === 'card') sfx.unlock();
          if (r.phase === 'brief' && (r.banner.startsWith('NEW RULE') || r.boss)) sfx.rule();
          prev = r.phase;
        }
        if (r.phase === 'play' && r.t > 0.6) { const beat = Math.floor(r.t * 12); if (beat !== lastBeat) { lastBeat = beat; sfx.tick(); } }
        fx.update(dt, L.w, L.h);
        hud.update(r, clock, () => game.hud?.());
      };
      app.ticker.add(tick);

      cleanup = () => {
        window.removeEventListener('keydown', onKey);
        app.ticker.remove(tick);
        game.destroy();
        app.destroy(true, { children: true });
      };
    })();
    return () => { alive = false; cleanup(); };
  }, []);

  return <div ref={host} className="cabinet-view" />;
}
