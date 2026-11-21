import { Container, Graphics, Text } from 'pixi.js';
import type { Wave } from '../../../content/types';
import { vstr } from '../../../engine/diagnoseKinds';
import { apply } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';
import type { KitContext } from '../../kit/context';
import type { Handle } from '../../kit/handles';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from '../../kit/neon';
import type { CabinetGame, Phase } from '../../kit/runner';
import { checklist, evaluate, goalText } from './logic';
import type { HoleParams } from './params';

/** The flag shape from the prototype: asymmetric, so swapping î and ĵ is visible. */
const SHAPE: Vec2[] = [[0, 0], [0.3, 0], [0.3, 0.55], [1, 0.55], [1, 1], [0, 1]];
const col = (m: Mat2, c: 0 | 1): Vec2 => [m[0][c], m[1][c]];
const label = (size: number, fill: string, glowOn = true) =>
  new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: '700', dropShadow: glowOn ? { color: fill, blur: 8, distance: 0, alpha: 0.8 } : false } });

export function createHoleInTheWall(): CabinetGame & { setup(ctx: KitContext): void } {
  let ctx!: KitContext;
  const wallG = new Graphics(), playG = new Graphics(), matG = new Graphics();
  const labels = new Container();
  const tipI = label(17, CSS.i), tipJ = label(17, CSS.j), holeI = label(15, CSS.i), holeJ = label(15, CSS.j);
  const wallNumI = label(40, CSS.i), wallNumJ = label(40, CSS.j);
  const matI = label(26, CSS.i), matJ = label(26, CSS.j), matCap = label(13, CSS.muted, false);
  let i: Vec2 = [1, 0], j: Vec2 = [0, 1];
  let target: Mat2 = [[1, 0], [0, 1]];
  let rule: Rule = 'assist';
  let locked = false;
  let ghost: Mat2 | null = null;
  let afterT = 0;
  let lastPhase: Phase = 'brief';
  let lastCorrect = false;
  const trail: { i: Vec2[]; j: Vec2[] } = { i: [], j: [] };
  let hI: Handle, hJ: Handle;

  const M = (): Mat2 => [[i[0], j[0]], [i[1], j[1]]];

  function wallState(phase: Phase, t: number) {
    const L = ctx.layout();
    let tt = t;
    if (phase === 'result' && lastCorrect) tt = 1 + afterT * 0.9;
    if (phase === 'result' && !lastCorrect) tt = 1;
    if (phase === 'replay' || phase === 'card' || phase === 'over' || phase === 'done') return null;
    const e = Math.pow(Math.min(tt, 1), 2.3);
    const s = 0.3 + 0.7 * e + Math.max(0, tt - 1) * 2.2;
    const k = Math.min(1, e);
    const center: Vec2 = [L.V[0] + (L.O[0] - L.V[0]) * k, L.V[1] + (L.O[1] - L.V[1]) * k];
    return { s, center, alpha: tt > 1 ? Math.max(0, 1 - (tt - 1) * 2.2) : 1 };
  }

  function drawWall(phase: Phase, t: number, clock: number) {
    const g = wallG; g.clear();
    holeI.visible = holeJ.visible = false; wallNumI.visible = wallNumJ.visible = false;
    const st = wallState(phase, t);
    if (!st || st.alpha <= 0) return;
    const { s, center, alpha } = st;
    const P = (p: Vec2) => ctx.toScreen(p, center, s);
    const rect = [P([-3.4, -2.2]), P([4.4, -2.2]), P([4.4, 3.2]), P([-3.4, 3.2])];
    const hole = SHAPE.map((p) => P(apply(target, p)));
    const holeVis = rule !== 'abstract' ? 1 : phase === 'result' ? 1 : Math.max(0, (t - 0.9) / 0.1);
    g.poly(rect.flat()).fill({ color: NEON.wall, alpha: 0.92 * alpha });
    if (holeVis > 0.5) g.poly(hole.flat()).cut();
    for (let y = -2; y <= 3; y += 0.6) { const a = P([-3.4, y]), b = P([4.4, y]); g.moveTo(a[0], a[1]).lineTo(b[0], b[1]); }
    g.stroke({ width: 1, color: NEON.accent, alpha: 0.12 * alpha });
    glow(g, rect, NEON.accent, 2.5, true, alpha);
    if (holeVis > 0) glow(g, hole, NEON.target, 2.5, true, alpha * holeVis);
    if (rule === 'assist') {
      const ci = P(col(target, 0)), cj = P(col(target, 1)), r = 7 * Math.max(0.6, s);
      g.circle(ci[0], ci[1], r).fill({ color: NEON.i, alpha: 0.9 * alpha });
      g.circle(cj[0], cj[1], r).fill({ color: NEON.j, alpha: 0.9 * alpha });
      const sc = Math.max(0.55, Math.min(1, s));
      holeI.text = vstr(col(target, 0)); holeJ.text = vstr(col(target, 1));
      holeI.anchor.set(0.5, 1.4); holeJ.anchor.set(0.5, 1.4);
      holeI.position.set(ci[0], ci[1]); holeJ.position.set(cj[0], cj[1]); holeI.scale.set(sc); holeJ.scale.set(sc);
      holeI.alpha = holeJ.alpha = alpha; holeI.visible = holeJ.visible = true;
    }
    if (rule === 'abstract' && holeVis < 1) {
      const c = P([0.5, 1.9]), sc = Math.max(0.35, s);
      brackets(g, c[0], c[1], 150 * sc, 100 * sc, NEON.text, alpha * (1 - holeVis));
      wallNumI.text = `${fmtN(target[0][0])}\n${fmtN(target[1][0])}`; wallNumJ.text = `${fmtN(target[0][1])}\n${fmtN(target[1][1])}`;
      wallNumI.anchor.set(0.5); wallNumJ.anchor.set(0.5);
      wallNumI.position.set(c[0] - 40 * sc, c[1]); wallNumJ.position.set(c[0] + 40 * sc, c[1]); wallNumI.scale.set(sc); wallNumJ.scale.set(sc);
      wallNumI.alpha = wallNumJ.alpha = alpha * (1 - holeVis);
      wallNumI.visible = wallNumJ.visible = true;
    }
    if (phase === 'play' && t > 0.75) glow(g, rect, NEON.j, 4, true, (Math.sin(clock * 30) * 0.5 + 0.5) * 0.6);
  }

  function drawPlayer(phase: Phase, clock: number) {
    const g = playG; g.clear();
    const L = ctx.layout();
    const show = phase === 'play' || phase === 'result' || phase === 'brief';
    tipI.visible = tipJ.visible = show;
    if (!show) return;
    ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3]);
    if (ghost) glow(g, SHAPE.map((p) => ctx.toScreen(apply(ghost!, p))), NEON.target, 2, true, 0.6 + 0.4 * Math.sin(clock * 10));
    const pts = SHAPE.map((p) => ctx.toScreen(apply(M(), p)));
    g.poly(pts.flat()).fill({ color: NEON.player, alpha: locked ? 0.5 : 0.3 });
    glow(g, pts, locked ? NEON.white : NEON.player, 2.5, true);
    if (phase === 'play') {
      trail.i.push(ctx.toScreen(i)); trail.j.push(ctx.toScreen(j));
      if (trail.i.length > 14) trail.i.shift(); if (trail.j.length > 14) trail.j.shift();
    }
    for (const [tr, c] of [[trail.i, NEON.i], [trail.j, NEON.j]] as const)
      for (let k = 1; k < tr.length; k++) { g.moveTo(tr[k - 1][0], tr[k - 1][1]).lineTo(tr[k][0], tr[k][1]); g.stroke({ width: 1 + k * 0.5, color: c, alpha: (k / tr.length) * 0.5, cap: 'round' }); }
    const pi = ctx.toScreen(i), pj = ctx.toScreen(j);
    arrowAt(g, L.O, pi, NEON.i); arrowAt(g, L.O, pj, NEON.j);
    tipI.text = `î ${vstr(i)}`; tipJ.text = `ĵ ${vstr(j)}`;
    tipI.position.set(pi[0] + 14, pi[1] + 6); tipJ.position.set(pj[0] + 14, pj[1] - 26);
  }

  function drawMatrix(m: Mat2, highlight: [number, number]) {
    const L = ctx.layout();
    const mx = L.w - 190, my = L.h - 150;
    matG.clear(); brackets(matG, mx + 64, my + 34, 140, 76, NEON.text, 1);
    matI.text = `${fmtN(m[0][0])}\n${fmtN(m[1][0])}`; matJ.text = `${fmtN(m[0][1])}\n${fmtN(m[1][1])}`;
    matI.position.set(mx + 34, my + 4); matJ.position.set(mx + 94, my + 4);
    matI.alpha = highlight[0]; matJ.alpha = highlight[1];
    matCap.text = ' î      ĵ'; matCap.position.set(mx + 30, my + 66);
  }

  return {
    setup(c: KitContext) {
      ctx = c;
      labels.addChild(tipI, tipJ, holeI, holeJ, wallNumI, wallNumJ, matI, matJ, matCap);
      ctx.layer.addChild(wallG, playG, matG, labels);
      const enabled = () => ctx.phase() === 'play' && !locked;
      hI = ctx.handle({ color: NEON.i, get: () => i, set: (v) => { i = v; }, enabled });
      hJ = ctx.handle({ color: NEON.j, get: () => j, set: (v) => { j = v; }, enabled });
    },
    startWave(w: Wave, r: Rule) {
      target = (w.params as HoleParams).matrix;
      rule = r; i = [1, 0]; j = [0, 1]; locked = false; ghost = null; afterT = 0; trail.i = []; trail.j = [];
    },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; },
    evaluate() {
      const res = evaluate(i, j, target);
      lastCorrect = res.correct;
      if (!res.correct) ghost = target;
      return res;
    },
    goalText: (r) => goalText(target, r),
    checklist: (r) => checklist(target, i, j, r),
    replay(k: number) {
      const g = playG; g.clear();
      const L = ctx.layout();
      tipI.visible = tipJ.visible = false;
      const a = ease(k / 0.38), b = ease((k - 0.38) / 0.38);
      const mi: Vec2 = [lerp(1, target[0][0], a), lerp(0, target[1][0], a)], mj: Vec2 = [lerp(0, target[0][1], b), lerp(1, target[1][1], b)];
      const m: Mat2 = [[mi[0], mj[0]], [mi[1], mj[1]]];
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3], 0.8);
      for (let q = -3; q <= 3; q++) {
        const p1 = ctx.toScreen(apply(m, [q, -3])), p2 = ctx.toScreen(apply(m, [q, 3])), p3 = ctx.toScreen(apply(m, [-3, q])), p4 = ctx.toScreen(apply(m, [3, q]));
        g.moveTo(p1[0], p1[1]).lineTo(p2[0], p2[1]).moveTo(p3[0], p3[1]).lineTo(p4[0], p4[1]);
      }
      g.stroke({ width: 1, color: NEON.violet, alpha: 0.35 });
      const pts = SHAPE.map((p) => ctx.toScreen(apply(m, p)));
      g.poly(pts.flat()).fill({ color: NEON.target, alpha: 0.18 }); glow(g, pts, NEON.target, 2.5, true);
      const ci = ctx.toScreen(mi), cj = ctx.toScreen(mj);
      arrowAt(g, L.O, ci, NEON.i, k < 0.38 ? 6 : 4); arrowAt(g, L.O, cj, NEON.j, k >= 0.38 && k < 0.76 ? 6 : 4);
      g.circle(ci[0], ci[1], 7).fill({ color: NEON.i }); g.circle(cj[0], cj[1], 7).fill({ color: NEON.j });
      drawMatrix(target, [k >= 0.38 && k < 0.76 ? 0.35 : 1, k < 0.38 ? 0.35 : 1]);
      if (k < 0.38) return `î carries the corner (1, 0) → it lands on ${vstr(col(target, 0))}`;
      if (k < 0.76) return `ĵ carries the corner (0, 1) → it lands on ${vstr(col(target, 1))}`;
      return 'Column 1 = where î lands · Column 2 = where ĵ lands';
    },
    frame(dt: number, phase: Phase, t: number, clock: number) {
      if (phase !== lastPhase) { afterT = 0; lastPhase = phase; }
      afterT += dt;
      drawWall(phase, t, clock);
      if (phase !== 'replay') {
        drawPlayer(phase, clock);
        const blink = 0.35 + 0.65 * (Math.sin(clock * 14) * 0.5 + 0.5);
        drawMatrix(M(), phase === 'result' && !lastCorrect ? [i[0] === target[0][0] && i[1] === target[1][0] ? 1 : blink, j[0] === target[0][1] && j[1] === target[1][1] ? 1 : blink] : [1, 1]);
      }
      if (phase === 'over' || phase === 'done' || phase === 'card') ctx.coords.hide();
      hI.update(clock); hJ.update(clock);
    },
    destroy() { /* the Pixi app destroys its children */ },
  };
}

/** Square brackets of a matrix, centered on (cx, cy). */
function brackets(g: Graphics, cx: number, cy: number, w: number, h: number, color: number, alpha: number) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, t = Math.min(12, w * 0.08);
  g.moveTo(x0 + t, y0).lineTo(x0, y0).lineTo(x0, y1).lineTo(x0 + t, y1).moveTo(x1 - t, y0).lineTo(x1, y0).lineTo(x1, y1).lineTo(x1 - t, y1);
  g.stroke({ width: 2.5, color, alpha });
}

function fmtN(x: number) { return Math.abs(x) < 1e-9 ? '0' : String(Math.round(x * 10) / 10); }
