import { Container, Graphics, Text } from 'pixi.js';
import type { Wave } from '../../../content/types';
import { vstr } from '../../../engine/diagnoseKinds';
import { apply } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';
import type { KitContext } from '../../kit/context';
import { gameButton } from '../../kit/gameButton';
import type { Handle } from '../../kit/handles';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from '../../kit/neon';
import type { CabinetGame, Phase } from '../../kit/runner';
import { angleToDir, checklist, evaluateLaser, goalText, isEigen, realEigenvectors } from './logic';
import type { LaserParams } from './params';

const I: Mat2 = [[1, 0], [0, 1]];
const lerpM = (a: Mat2, b: Mat2, k: number): Mat2 => [[lerp(a[0][0], b[0][0], k), lerp(a[0][1], b[0][1], k)], [lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k)]];
const mk = (size: number, fill: string) => new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: '700', dropShadow: { color: fill, blur: 8, distance: 0, alpha: 0.8 } } });
const fmtV = (v: Vec2) => vstr([Math.round(v[0] * 100) / 100, Math.round(v[1] * 100) / 100]);

export function createLaserLab(): CabinetGame & { setup(ctx: KitContext): void } {
  let ctx!: KitContext;
  const g = new Graphics();
  const labels = new Container();
  const aimT = mk(15, CSS.player), exitT = mk(15, CSS.target), lensT = mk(18, CSS.text);
  let m: Mat2 = I;
  let rule: Rule = 'assist';
  let angle = 30, saidNone = false, locked = false, afterT = 0;
  let lastPhase: Phase = 'brief';
  let aim!: Handle;
  let noneBtn!: Container;
  const S = (v: Vec2) => ctx.toScreen(v);
  const dir = () => angleToDir(angle);

  function drawGrid(mat: Mat2, alpha: number) {
    for (let q = -3; q <= 3; q++) {
      const a = S(apply(mat, [q, -3])), b = S(apply(mat, [q, 3])), c = S(apply(mat, [-3, q])), d = S(apply(mat, [3, q]));
      g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).moveTo(c[0], c[1]).lineTo(d[0], d[1]);
    }
    g.stroke({ width: 1, color: NEON.accent, alpha });
  }
  function beam(v: Vec2, color: number, width: number, alpha: number, dashed = false) {
    const n = Math.hypot(...v) || 1, far: Vec2 = [v[0] / n * 4.2, v[1] / n * 4.2];
    if (!dashed) glow(g, [S([0, 0]), S(far)], color, width, false, alpha);
    else for (let k = 0; k < 14; k++) { const a = k / 14, b = (k + 0.5) / 14; g.moveTo(S([far[0] * a, far[1] * a])[0], S([far[0] * a, far[1] * a])[1]).lineTo(S([far[0] * b, far[1] * b])[0], S([far[0] * b, far[1] * b])[1]); g.stroke({ width, color, alpha }); }
  }
  function drawLens(clock: number) {
    const c = S([0, 0]), r = ctx.layout().U * 0.55;
    g.circle(c[0], c[1], r).fill({ color: NEON.surface2, alpha: 0.6 });
    g.circle(c[0], c[1], r + 2 * Math.sin(clock * 3)).stroke({ width: 2, color: NEON.accent, alpha: 0.9 });
  }

  return {
    setup(c: KitContext) {
      ctx = c;
      labels.addChild(aimT, exitT, lensT);
      noneBtn = gameButton('NO STRAIGHT PATH', NEON.j, CSS.j, () => { if (ctx.phase() === 'play' && !locked) { saidNone = true; locked = true; ctx.sfx.lock(); } });
      ctx.layer.addChild(g, labels, noneBtn);
      aim = ctx.handle({
        color: NEON.player, get: () => dir(),
        set: (v) => { const a = (Math.atan2(v[1], v[0]) * 180) / Math.PI; const snapped = Math.round(a / 15) * 15; if (snapped !== angle) angle = snapped; },
        enabled: () => ctx.phase() === 'play' && !locked, snap: 0, limits: [[-3, 3], [-2, 3]],
      });
    },
    startWave(w: Wave, r: Rule) { m = (w.params as LaserParams).matrix; rule = r; angle = 30; saidNone = false; locked = false; afterT = 0; },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; },
    evaluate: () => evaluateLaser(m, dir(), saidNone),
    goalText: (r) => goalText(m, r),
    checklist: (r) => checklist(m, dir(), r),
    replay(k: number) {
      g.clear(); labels.visible = true; noneBtn.visible = false; aimT.visible = exitT.visible = false;
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3], 0.8);
      const warp = lerpM(I, m, ease(k / 0.5));
      drawGrid(warp, 0.35);
      drawLens(k * 6);
      const eig = realEigenvectors(m);
      if (!eig.length) {
        for (let a = 0; a < 180; a += 30) { const v = angleToDir(a); arrowAt(g, S([0, 0]), S(apply(warp, v)), NEON.j, 2.5, 0.8); }
        return k < 0.5 ? 'Watch every arrow get turned…' : 'A rotation turns every direction: no beam can come out straight. No real eigenvector.';
      }
      eig.forEach((e, i) => {
        const v: Vec2 = [e[0] * 1.5, e[1] * 1.5];
        arrowAt(g, S([0, 0]), S(apply(warp, v)), i ? NEON.j : NEON.i, 4);
        beam(e, i ? NEON.j : NEON.i, 1.5, 0.35, true);
      });
      const lam = eig.map((e) => { const w = apply(m, e); return Math.abs(e[0]) > 1e-9 ? w[0] / e[0] : w[1] / e[1]; });
      return k < 0.5 ? 'These directions stay on their own line while the plane warps…' : `Eigenvectors: ${eig.map((e, i) => `${fmtV(e)} stretched ×${Math.round(lam[i] * 100) / 100}`).join(' and ')}.`;
    },
    frame(dt: number, phase: Phase, t: number, clock: number) {
      if (phase !== lastPhase) { afterT = 0; lastPhase = phase; }
      afterT += dt;
      aim.update(clock);
      if (phase === 'replay') return;
      g.clear();
      const show = phase === 'brief' || phase === 'play' || phase === 'result';
      labels.visible = noneBtn.visible = show;
      if (!show) { ctx.coords.hide(); return; }
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3]);
      noneBtn.position.set(L.w - 140, L.h - 60); noneBtn.alpha = locked ? 0.4 : 1;
      if (rule !== 'abstract') drawGrid(m, 0.25);
      drawLens(clock);
      lensT.visible = rule === 'abstract';
      lensT.text = `lens = [[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`; lensT.anchor.set(0.5); lensT.position.set(L.w / 2, S([0, 3])[1] - 10);
      const v = dir(), out = apply(m, v);
      arrowAt(g, S([0, 0]), S(v), NEON.player, 4);
      aimT.visible = !saidNone; aimT.text = `aim ${angle}° ${fmtV(v)}`; aimT.position.set(S(v)[0] + 14, S(v)[1] - 10);
      const reveal = rule === 'assist' || phase === 'result';
      exitT.visible = reveal && !saidNone;
      if (reveal && !saidNone) {
        const f = phase === 'result' ? ease(afterT / 0.6) : 1;
        const straight = isEigen(m, v);
        beam(out, straight ? NEON.target : NEON.j, phase === 'result' ? 3 : 1.5, f, phase !== 'result');
        exitT.text = `exit ${fmtV(out)}`; exitT.position.set(S(out)[0] + 14, S(out)[1] + 6);
      }
      if (phase === 'play' && t > 0.75) beam(v, NEON.player, 1, 0.3 + 0.3 * Math.sin(clock * 20), true);
    },
    destroy() {},
  };
}
