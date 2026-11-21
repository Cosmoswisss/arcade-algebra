import { Container, Graphics, Text } from 'pixi.js';
import type { Wave } from '../../../content/types';
import { vstr } from '../../../engine/diagnoseKinds';
import { apply, det, fromBasis, mul } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';
import type { KitContext } from '../../kit/context';
import type { Handle } from '../../kit/handles';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from '../../kit/neon';
import type { CabinetGame, Phase } from '../../kit/runner';
import { checklist, evaluateRewind, goalText, solution } from './logic';
import type { ImageId, RewindParams } from './params';

type Poly = { pts: Vec2[]; color: number; fill: number };
const I: Mat2 = [[1, 0], [0, 1]];
const W = 2, H = 1.5;
/** Simple vector pictures in plane units, inside [0, 2] × [0, 1.5]. */
const PICTURES: Record<ImageId, Poly[]> = {
  mountains: [
    { pts: [[0, 0], [2, 0], [2, 1.5], [0, 1.5]], color: NEON.accent, fill: 0.12 },
    { pts: [[1.5, 1.2], [1.6, 1.05], [1.75, 1.05], [1.85, 1.2], [1.75, 1.35], [1.6, 1.35]], color: NEON.target, fill: 0.9 },
    { pts: [[0, 0], [0.7, 0.9], [1.1, 0.5], [1.5, 1], [2, 0]], color: NEON.player, fill: 0.45 },
  ],
  city: [
    { pts: [[0, 0], [2, 0], [2, 1.5], [0, 1.5]], color: NEON.accent, fill: 0.12 },
    { pts: [[0.15, 0], [0.55, 0], [0.55, 1.1], [0.15, 1.1]], color: NEON.player, fill: 0.45 },
    { pts: [[0.7, 0], [1.1, 0], [1.1, 0.7], [0.7, 0.7]], color: NEON.i, fill: 0.45 },
    { pts: [[1.25, 0], [1.8, 0], [1.8, 1.3], [1.25, 1.3]], color: NEON.target, fill: 0.4 },
  ],
  face: [
    { pts: [[0, 0], [2, 0], [2, 1.5], [0, 1.5]], color: NEON.accent, fill: 0.12 },
    { pts: [[0.45, 0.9], [0.75, 0.9], [0.75, 1.15], [0.45, 1.15]], color: NEON.player, fill: 0.8 },
    { pts: [[1.25, 0.9], [1.55, 0.9], [1.55, 1.15], [1.25, 1.15]], color: NEON.player, fill: 0.8 },
    { pts: [[0.5, 0.45], [1.5, 0.45], [1.3, 0.25], [0.7, 0.25]], color: NEON.target, fill: 0.7 },
  ],
};
const lerpM = (a: Mat2, b: Mat2, k: number): Mat2 => [[lerp(a[0][0], b[0][0], k), lerp(a[0][1], b[0][1], k)], [lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k)]];
const mk = (size: number, fill: string) => new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: '700', dropShadow: { color: fill, blur: 8, distance: 0, alpha: 0.8 } } });

export function createRewind(): CabinetGame & { setup(ctx: KitContext): void } {
  let ctx!: KitContext;
  const g = new Graphics();
  const labels = new Container();
  const tipI = mk(15, CSS.i), tipJ = mk(15, CSS.j), warpT = mk(18, CSS.text), frameT = mk(14, CSS.target);
  const btn = new Container(), btnBg = new Graphics(), btnT = mk(15, CSS.j);
  let p: RewindParams = { matrix: I, image: 'mountains' };
  let rule: Rule = 'assist';
  let i: Vec2 = [1, 0], j: Vec2 = [0, 1];
  let cant = false, locked = false, lastCorrect = false, afterT = 0;
  let lastPhase: Phase = 'brief';
  let hI!: Handle, hJ!: Handle;
  const S = (v: Vec2) => ctx.toScreen(v);
  const player = () => fromBasis(i, j);

  function drawPicture(m: Mat2, alpha = 1) {
    for (const poly of PICTURES[p.image]) {
      const pts = poly.pts.map((q) => S(apply(m, q)));
      g.poly(pts.flat()).fill({ color: poly.color, alpha: poly.fill * alpha });
      glow(g, pts, poly.color, 1.5, true, 0.8 * alpha);
    }
  }
  function drawFrame(alpha = 1) {
    const pts = ([[0, 0], [W, 0], [W, H], [0, H]] as Vec2[]).map(S);
    glow(g, pts, NEON.target, 2, true, alpha);
    frameT.visible = true; frameT.text = 'original frame'; frameT.position.set(pts[3][0], pts[3][1] - 22);
  }
  function drawArrows(m: Mat2, alpha = 1) {
    const L = ctx.layout();
    const ci: Vec2 = [m[0][0], m[1][0]], cj: Vec2 = [m[0][1], m[1][1]];
    arrowAt(g, L.O, S(ci), NEON.i, 4, alpha); arrowAt(g, L.O, S(cj), NEON.j, 4, alpha);
    tipI.visible = tipJ.visible = true;
    tipI.text = `î ${vstr(ci)}`; tipJ.text = `ĵ ${vstr(cj)}`;
    tipI.position.set(S(ci)[0] + 12, S(ci)[1] + 4); tipJ.position.set(S(cj)[0] + 12, S(cj)[1] - 24);
  }

  return {
    setup(c: KitContext) {
      ctx = c;
      btnBg.roundRect(-90, -22, 180, 44, 12).fill({ color: NEON.bg, alpha: 0.7 }).roundRect(-90, -22, 180, 44, 12).stroke({ width: 2, color: NEON.j });
      btnT.text = "CAN'T REPAIR"; btnT.anchor.set(0.5); btn.addChild(btnBg, btnT);
      btn.eventMode = 'static'; btn.cursor = 'pointer';
      btn.on('pointerdown', (e) => { e.stopPropagation(); if (ctx.phase() === 'play' && !locked) { cant = true; locked = true; ctx.sfx.lock(); } });
      labels.addChild(tipI, tipJ, warpT, frameT);
      ctx.layer.addChild(g, labels, btn);
      const enabled = () => ctx.phase() === 'play' && !locked;
      hI = ctx.handle({ color: NEON.i, get: () => i, set: (v) => { i = v; }, enabled });
      hJ = ctx.handle({ color: NEON.j, get: () => j, set: (v) => { j = v; }, enabled });
    },
    startWave(w: Wave, r: Rule) { p = w.params as RewindParams; rule = r; i = [1, 0]; j = [0, 1]; cant = false; locked = false; afterT = 0; },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; },
    evaluate() { const res = evaluateRewind(p.matrix, player(), cant); lastCorrect = res.correct; return res; },
    goalText: (r) => goalText(p.matrix, r),
    checklist: (r) => checklist(p.matrix, player(), r),
    replay(k: number) {
      g.clear(); labels.visible = true; frameT.visible = false; tipI.visible = tipJ.visible = false; btn.visible = false;
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3], 0.8);
      const s = solution(p.matrix);
      drawFrame(0.5);
      if (s === 'cant-repair') {
        drawPicture(lerpM(I, p.matrix, ease(k / 0.6)));
        return k < 0.6 ? 'Watch the picture get squashed onto a line…' : 'det = 0: different points landed on the same spot. No move can separate them again.';
      }
      // the warped picture is undone step by step: (undo) · warp goes from warp to identity
      const undo = lerpM(I, s, ease(k / 0.7));
      drawPicture(mul(undo, p.matrix));
      drawArrows(undo);
      if (k < 0.7) return `The undo move sends î to ${vstr([s[0][0], s[1][0]])} and ĵ to ${vstr([s[0][1], s[1][1]])}`;
      return `That undo move is the inverse matrix: (inverse) · (warp) = do nothing. det was ${det(p.matrix)}, not 0.`;
    },
    frame(dt: number, phase: Phase, t: number, clock: number) {
      if (phase !== lastPhase) { afterT = 0; lastPhase = phase; }
      afterT += dt;
      hI.update(clock); hJ.update(clock);
      if (phase === 'replay') return;
      g.clear();
      const show = phase === 'brief' || phase === 'play' || phase === 'result';
      labels.visible = btn.visible = show;
      frameT.visible = false; tipI.visible = tipJ.visible = false; warpT.visible = false;
      if (!show) { ctx.coords.hide(); return; }
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3]);
      btn.position.set(L.w - 130, L.h - 60); btn.alpha = locked ? 0.4 : 1;
      if (rule === 'assist') drawFrame(0.9);
      const hidden = rule === 'abstract' && phase !== 'result' && t < 0.9;
      if (rule === 'abstract') {
        warpT.visible = true; warpT.text = `warp = [[${p.matrix[0][0]}, ${p.matrix[0][1]}], [${p.matrix[1][0]}, ${p.matrix[1][1]}]]`;
        warpT.anchor.set(0.5); warpT.position.set(L.w / 2, S([0, 3])[1] - 10);
      }
      if (phase === 'result' && cant) drawPicture(p.matrix, 0.6 + 0.4 * Math.sin(clock * 8));
      else if (!hidden) drawPicture(mul(player(), p.matrix));
      if (!cant) drawArrows(player(), locked ? 0.6 : 1);
    },
    destroy() {},
  };
}
