import { Container, Graphics, Text } from 'pixi.js';
import type { Wave } from '../../../content/types';
import { vstr } from '../../../engine/diagnoseKinds';
import { apply, fromBasis } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';
import type { KitContext } from '../../kit/context';
import type { Handle } from '../../kit/handles';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from '../../kit/neon';
import type { CabinetGame, Phase } from '../../kit/runner';
import { checklist, evaluate, goalText, starAnchors, starPoint, TOL } from './logic';
import type { HoleParams } from './params';

/**
 * Constellation: the night sky lost its map. Each star is where a known point lands under a hidden matrix.
 * The player moves î and ĵ, the whole grid follows (the live warped grid is the lesson), and a star lights up
 * when the player's grid point for it lands on it. Rules: labelled stars → bare stars → the star map (matrix) only.
 */
const col = (m: Mat2, c: 0 | 1): Vec2 => [m[0][c], m[1][c]];
const label = (size: number, fill: string, glowOn = true) =>
  new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: '700', dropShadow: glowOn ? { color: fill, blur: 8, distance: 0, alpha: 0.8 } : false } });
const near = (a: Vec2, b: Vec2) => Math.abs(a[0] - b[0]) <= TOL && Math.abs(a[1] - b[1]) <= TOL;
const fmtN = (x: number) => (Math.abs(x) < 1e-9 ? '0' : String(Math.round(x * 10) / 10));

export function createConstellation(): CabinetGame & { setup(ctx: KitContext): void } {
  let ctx!: KitContext;
  const skyG = new Graphics(), gridG = new Graphics(), starG = new Graphics(), playG = new Graphics(), matG = new Graphics();
  const labels = new Container();
  const tipI = label(17, CSS.i), tipJ = label(17, CSS.j);
  const starLabels = Array.from({ length: 5 }, () => label(14, CSS.target));
  const mapT = label(15, CSS.muted, false), mapI = label(30, CSS.i), mapJ = label(30, CSS.j);
  const matI = label(26, CSS.i), matJ = label(26, CSS.j), matCap = label(13, CSS.muted, false);
  let i: Vec2 = [1, 0], j: Vec2 = [0, 1];
  let target: Mat2 = [[1, 0], [0, 1]];
  let anchors: Vec2[] = [];
  let rule: Rule = 'assist';
  let locked = false;
  let lastCorrect = false;
  let afterT = 0;
  let lastPhase: Phase = 'brief';
  let hI: Handle, hJ: Handle;
  // a fixed field of background stars (decoration only), in screen fractions
  const dust = Array.from({ length: 70 }, (_, k) => [((k * 7919) % 1000) / 1000, ((k * 104729) % 997) / 997 * 0.55, ((k * 31) % 7) / 7] as const);

  const M = (): Mat2 => fromBasis(i, j);
  const S = (v: Vec2) => ctx.toScreen(v);

  /** The faint background sky: twinkling dust above the plane. */
  function drawSky(clock: number) {
    const L = ctx.layout(), g = skyG; g.clear();
    for (const [x, y, ph] of dust) g.circle(x * L.w, y * L.h, 1.2).fill({ color: NEON.white, alpha: 0.18 + 0.15 * Math.sin(clock * 1.5 + ph * 6) });
  }

  /** The player's grid: the whole plane follows î and ĵ. */
  function drawGrid(m: Mat2, alpha: number) {
    const g = gridG; g.clear();
    for (let q = -4; q <= 4; q++) {
      const a = S(apply(m, [q, -4])), b = S(apply(m, [q, 4])), c = S(apply(m, [-4, q])), d = S(apply(m, [4, q]));
      g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).moveTo(c[0], c[1]).lineTo(d[0], d[1]);
    }
    g.stroke({ width: 1, color: NEON.player, alpha: 0.22 * alpha });
  }

  /** A 4-point sparkle. */
  function sparkle(g: Graphics, [x, y]: Vec2, r: number, color: number, alpha: number) {
    g.poly([x, y - r, x + r * 0.28, y - r * 0.28, x + r, y, x + r * 0.28, y + r * 0.28, x, y + r, x - r * 0.28, y + r * 0.28, x - r, y, x - r * 0.28, y - r * 0.28]).fill({ color, alpha });
    g.circle(x, y, r * 1.8).fill({ color, alpha: alpha * 0.12 });
  }

  /** Stars (targets), the constellation lines between them, and the player's points for each star. */
  function drawStars(phase: Phase, clock: number, t: number) {
    const g = starG; g.clear();
    starLabels.forEach((s) => { s.visible = false; });
    const m = M();
    const hidden = rule === 'abstract' && phase !== 'result' && !(phase === 'play' && t > 0.97);
    const stars = anchors.map((p) => starPoint(target, p));
    const mine = anchors.map((p) => apply(m, p));
    const lit = stars.map((s, k) => near(mine[k], s));
    const allLit = lit.every(Boolean);
    if (!hidden) {
      // constellation lines, glowing once every star is lit
      const pts = stars.map(S);
      for (let k = 1; k < pts.length; k++) glow(g, [pts[k - 1], pts[k]], allLit ? NEON.target : NEON.muted, allLit ? 2 : 1, false, allLit ? 0.9 : 0.25);
      stars.forEach((s, k) => {
        const tw = 0.75 + 0.25 * Math.sin(clock * 3 + k);
        // in assist, the stars of (1, 0) and (0, 1) carry the î / ĵ colours
        const color = lit[k] ? NEON.target : rule === 'assist' && k === 0 ? NEON.i : rule === 'assist' && k === 1 ? NEON.j : NEON.white;
        sparkle(g, S(s), lit[k] ? 13 : 9, color, lit[k] ? 1 : 0.55 * tw);
        if (rule === 'assist') {
          // full label only for the stars of î and ĵ; the others just name their point, small, under the star
          const t2 = starLabels[k], q = S(s);
          t2.visible = !(k < 2 && lit[k]); // once î or ĵ sits on its star, the arrow's own label says it
          if (k < 2) { t2.text = `${k === 0 ? 'î' : 'ĵ'} star ${vstr(s)}`; t2.style.fontSize = 15; t2.style.fill = k === 0 ? CSS.i : CSS.j; t2.anchor.set(0, 1); t2.position.set(q[0] + 12, q[1] - 6); }
          else { t2.text = vstr(anchors[k]); t2.style.fontSize = 12; t2.style.fill = CSS.muted; t2.anchor.set(0.5, 0); t2.position.set(q[0], q[1] + 12); }
        }
      });
    }
    // the player's own points for the stars: small rings that the stars must catch
    mine.forEach((p, k) => {
      const q = S(p);
      g.circle(q[0], q[1], 5).stroke({ width: 2, color: lit[k] && !hidden ? NEON.target : NEON.player, alpha: 0.9 });
    });
  }

  function drawArrows(phase: Phase) {
    const g = playG; g.clear();
    const L = ctx.layout();
    const show = phase === 'play' || phase === 'result' || phase === 'brief';
    tipI.visible = tipJ.visible = show;
    if (!show) return;
    const pi = S(i), pj = S(j);
    arrowAt(g, L.O, pi, NEON.i); arrowAt(g, L.O, pj, NEON.j);
    tipI.text = `î ${vstr(i)}`; tipJ.text = `ĵ ${vstr(j)}`;
    tipI.position.set(pi[0] + 14, pi[1] + 6); tipJ.position.set(pj[0] + 14, pj[1] - 26);
  }

  /** The star map in "matrix only": the target matrix, top left of the plane. */
  function drawStarMap(show: boolean) {
    mapT.visible = mapI.visible = mapJ.visible = show;
    if (!show) return;
    const L = ctx.layout(), x = Math.max(16, L.O[0] - 4.6 * L.U), y = L.O[1] - 3.2 * L.U;
    mapT.text = 'STAR MAP'; mapT.position.set(x, y - 22);
    brackets(matG, x + 60, y + 34, 120, 76, NEON.text, 1);
    mapI.text = `${fmtN(target[0][0])}\n${fmtN(target[1][0])}`; mapJ.text = `${fmtN(target[0][1])}\n${fmtN(target[1][1])}`;
    mapI.position.set(x + 22, y + 2); mapJ.position.set(x + 74, y + 2);
  }

  /** The player's matrix, bottom right: the live link between the arrows and the numbers. */
  function drawMatrix(m: Mat2, highlight: [number, number]) {
    const L = ctx.layout(), mx = L.w - 190, my = L.h - 150;
    brackets(matG, mx + 64, my + 34, 140, 76, NEON.text, 1);
    matI.text = `${fmtN(m[0][0])}\n${fmtN(m[1][0])}`; matJ.text = `${fmtN(m[0][1])}\n${fmtN(m[1][1])}`;
    matI.position.set(mx + 34, my + 4); matJ.position.set(mx + 94, my + 4);
    matI.alpha = highlight[0]; matJ.alpha = highlight[1];
    matCap.text = ' î      ĵ'; matCap.position.set(mx + 30, my + 66);
  }

  return {
    setup(c: KitContext) {
      ctx = c;
      labels.addChild(tipI, tipJ, ...starLabels, mapT, mapI, mapJ, matI, matJ, matCap);
      ctx.layer.addChild(skyG, gridG, starG, playG, matG, labels);
      const enabled = () => ctx.phase() === 'play' && !locked;
      hI = ctx.handle({ color: NEON.i, get: () => i, set: (v) => { i = v; }, enabled });
      hJ = ctx.handle({ color: NEON.j, get: () => j, set: (v) => { j = v; }, enabled });
    },
    startWave(w: Wave, r: Rule) {
      target = (w.params as HoleParams).matrix;
      anchors = starAnchors(target);
      rule = r; i = [1, 0]; j = [0, 1]; locked = false; afterT = 0;
    },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; },
    evaluate() { const res = evaluate(i, j, target); lastCorrect = res.correct; return res; },
    goalText: (r) => goalText(target, r),
    checklist: (r) => checklist(target, i, j, r),
    replay(k: number) {
      // the right answer, one arrow at a time; each star lights as its point lands
      const L = ctx.layout();
      tipI.visible = tipJ.visible = false; mapT.visible = mapI.visible = mapJ.visible = false;
      const a = ease(k / 0.38), b = ease((k - 0.38) / 0.38);
      const mi: Vec2 = [lerp(1, target[0][0], a), lerp(0, target[1][0], a)], mj: Vec2 = [lerp(0, target[0][1], b), lerp(1, target[1][1], b)];
      const m: Mat2 = [[mi[0], mj[0]], [mi[1], mj[1]]];
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3], 0.8);
      drawGrid(m, 1);
      const g = starG; g.clear(); starLabels.forEach((s) => { s.visible = false; });
      const stars = anchors.map((p) => S(starPoint(target, p)));
      const lit = anchors.map((p) => near(apply(m, p), starPoint(target, p)));
      for (let q = 1; q < stars.length; q++) glow(g, [stars[q - 1], stars[q]], lit.every(Boolean) ? NEON.target : NEON.muted, 1.5, false, lit.every(Boolean) ? 0.9 : 0.25);
      stars.forEach((s, q) => sparkle(g, s, lit[q] ? 13 : 9, lit[q] ? NEON.target : NEON.white, lit[q] ? 1 : 0.5));
      const p = playG; p.clear();
      arrowAt(p, L.O, S(mi), NEON.i, k < 0.38 ? 6 : 4); arrowAt(p, L.O, S(mj), NEON.j, k >= 0.38 && k < 0.76 ? 6 : 4);
      matG.clear(); drawMatrix(target, [k >= 0.38 && k < 0.76 ? 0.35 : 1, k < 0.38 ? 0.35 : 1]);
      if (k < 0.38) return `î carries (1, 0) → its star is ${vstr(col(target, 0))}`;
      if (k < 0.76) return `ĵ carries (0, 1) → its star is ${vstr(col(target, 1))}`;
      return 'Every other star follows: (1, 1) = î + ĵ. Column 1 = î, column 2 = ĵ.';
    },
    frame(dt: number, phase: Phase, t: number, clock: number) {
      if (phase !== lastPhase) { afterT = 0; lastPhase = phase; }
      afterT += dt;
      const L = ctx.layout();
      drawSky(clock);
      if (phase !== 'replay') {
        const visible = phase === 'play' || phase === 'result' || phase === 'brief';
        matG.clear();
        if (visible) {
          ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3]);
          drawGrid(M(), 1);
          drawStars(phase, clock, t);
          drawArrows(phase);
          drawStarMap(rule === 'abstract');
          const blink = 0.35 + 0.65 * (Math.sin(clock * 14) * 0.5 + 0.5);
          drawMatrix(M(), phase === 'result' && !lastCorrect ? [near(i, col(target, 0)) ? 1 : blink, near(j, col(target, 1)) ? 1 : blink] : [1, 1]);
          if (phase === 'play' && t > 0.8) glow(starG, [[0, 0], [L.w, 0], [L.w, L.h], [0, L.h]], NEON.j, 4, true, (Math.sin(clock * 20) * 0.5 + 0.5) * 0.5);
        } else {
          gridG.clear(); starG.clear(); playG.clear();
          tipI.visible = tipJ.visible = false; starLabels.forEach((s) => { s.visible = false; });
          drawStarMap(false); matI.text = matJ.text = matCap.text = '';
          ctx.coords.hide();
        }
      }
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
