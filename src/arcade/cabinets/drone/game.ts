import { Container, Graphics, Text } from 'pixi.js';
import type { Wave } from '../../../content/types';
import { vstr } from '../../../engine/diagnoseKinds';
import type { Rule, Vec2 } from '../../../engine/types';
import type { KitContext } from '../../kit/context';
import { gameButton } from '../../kit/gameButton';
import type { Handle } from '../../kit/handles';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from '../../kit/neon';
import type { CabinetGame, Phase } from '../../kit/runner';
import { checklist, evaluateDrone, goalText, position, solveCoeffs } from './logic';
import type { ReachAnswer } from './logic';
import type { DroneParams } from './params';

const A_Y = -0.9, B_Y = -1.9;
const mk = (size: number, fill: string) => new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: '700', dropShadow: { color: fill, blur: 8, distance: 0, alpha: 0.8 } } });
const snap = (x: number) => Math.max(-3, Math.min(3, Math.round(x * 2) / 2)) + 0;

export function createDrone(): CabinetGame & { setup(ctx: KitContext): void } {
  let ctx!: KitContext;
  const g = new Graphics();
  const labels = new Container();
  const uT = mk(15, CSS.i), vT = mk(15, CSS.j), aT = mk(15, CSS.i), bT = mk(15, CSS.j), tT = mk(15, CSS.target), dT = mk(15, CSS.player);
  let p: DroneParams = { u: [1, 0], v: [0, 1], target: [1, 1], reachable: true };
  let rule: Rule = 'assist';
  let a = 0, b = 0, answer: ReachAnswer = null, locked = false, afterT = 0;
  let lastPhase: Phase = 'brief';
  let hA!: Handle, hB!: Handle;
  let cantBtn!: Container, canBtn!: Container;
  const S = (v: Vec2) => ctx.toScreen(v);
  const O = (): Vec2 => [0, 0];

  function drawDrone(at: Vec2, clock: number, alpha = 1) {
    const c = S(at), r = 12;
    g.poly([c[0], c[1] - r, c[0] + r, c[1], c[0], c[1] + r, c[0] - r, c[1]]).fill({ color: NEON.player, alpha: 0.35 * alpha });
    glow(g, [[c[0], c[1] - r], [c[0] + r, c[1]], [c[0], c[1] + r], [c[0] - r, c[1]]], NEON.player, 2, true, alpha);
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) g.circle(c[0] + dx, c[1] + dy, 4 + Math.sin(clock * 30) * 1).stroke({ width: 1.5, color: NEON.player, alpha });
  }
  function drawTrack(y: number, value: number, color: number, t: Text, name: string) {
    const l = S([-3, y]), r = S([3, y]);
    g.moveTo(l[0], l[1]).lineTo(r[0], r[1]).stroke({ width: 4, color: NEON.surface2 });
    for (let k = -3; k <= 3; k++) { const q = S([k, y]); g.moveTo(q[0], q[1] - 5).lineTo(q[0], q[1] + 5).stroke({ width: 2, color: k === 0 ? NEON.text : NEON.line }); }
    const h = S([value, y]); t.text = `${name} = ${value}`; t.position.set(r[0] + 14, r[1] - 10);
    g.circle(h[0], h[1], 3).fill({ color });
  }
  function drawSpanLine() {
    // when u and v are on one line, show that line (the span) faintly
    if (solveCoeffs(p.u, p.v, p.target)) return;
    const d = Math.hypot(...p.u) > 1e-9 ? p.u : p.v, n = Math.hypot(...d);
    const e: Vec2 = [d[0] / n * 6, d[1] / n * 6];
    g.moveTo(S([-e[0], -e[1]])[0], S([-e[0], -e[1]])[1]).lineTo(S(e)[0], S(e)[1]).stroke({ width: 6, color: NEON.violet, alpha: 0.25 });
  }

  return {
    setup(c: KitContext) {
      ctx = c;
      labels.addChild(uT, vT, aT, bT, tT, dT);
      cantBtn = gameButton("CAN'T REACH", NEON.j, CSS.j, () => { if (ctx.phase() === 'play' && !locked) { answer = 'unreachable'; locked = true; ctx.sfx.lock(); } });
      canBtn = gameButton('CAN REACH', NEON.i, CSS.i, () => { if (ctx.phase() === 'play' && !locked) { answer = 'reachable'; locked = true; ctx.sfx.lock(); } });
      ctx.layer.addChild(g, labels, cantBtn, canBtn);
      const enabled = () => ctx.phase() === 'play' && !locked && rule !== 'abstract';
      hA = ctx.handle({ color: NEON.i, get: () => [a, A_Y], set: (v) => { a = snap(v[0]); }, enabled, limits: [[-3, 3], [A_Y, A_Y]] });
      hB = ctx.handle({ color: NEON.j, get: () => [b, B_Y], set: (v) => { b = snap(v[0]); }, enabled, limits: [[-3, 3], [B_Y, B_Y]] });
    },
    startWave(w: Wave, r: Rule) { p = w.params as DroneParams; rule = r; a = 0; b = 0; answer = null; locked = false; afterT = 0; },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; },
    evaluate: () => evaluateDrone(p, rule, a, b, answer),
    goalText: (r) => goalText(p, r),
    checklist: (r) => checklist(p, r, a, b),
    replay(k: number) {
      g.clear(); labels.visible = true; aT.visible = bT.visible = false; cantBtn.visible = canBtn.visible = false;
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3], 0.8);
      const want = solveCoeffs(p.u, p.v, p.target);
      tT.text = `target ${vstr(p.target)}`; tT.position.set(S(p.target)[0] + 14, S(p.target)[1] - 26);
      g.circle(S(p.target)[0], S(p.target)[1], 14).stroke({ width: 3, color: NEON.target });
      if (!want) {
        drawSpanLine();
        arrowAt(g, S(O()), S(p.u), NEON.i, 4); arrowAt(g, S(O()), S(p.v), NEON.j, 4);
        return `u = ${vstr(p.u)} and v = ${vstr(p.v)} are on the same line: their span is that line. ${vstr(p.target)} is off it — unreachable.`;
      }
      const [wa, wb] = want, ka = ease(k / 0.45), kb = ease((k - 0.45) / 0.45);
      const mid: Vec2 = [p.u[0] * wa * ka, p.u[1] * wa * ka];
      arrowAt(g, S(O()), S(mid), NEON.i, 4);
      const end: Vec2 = [mid[0] + p.v[0] * wb * kb, mid[1] + p.v[1] * wb * kb];
      if (kb > 0) arrowAt(g, S(mid), S(end), NEON.j, 4);
      drawDrone(end, k * 10);
      if (k < 0.45) return `${wa} · u = ${wa} · ${vstr(p.u)} = ${vstr([p.u[0] * wa + 0, p.u[1] * wa + 0])}`;
      if (k < 0.9) return `then ${wb} · v = ${vstr([p.v[0] * wb + 0, p.v[1] * wb + 0])}`;
      return `${wa}·u + ${wb}·v = ${vstr(p.target)}: that mix is a linear combination.`;
    },
    frame(dt: number, phase: Phase, _t: number, clock: number) {
      if (phase !== lastPhase) { afterT = 0; lastPhase = phase; }
      afterT += dt;
      hA.update(clock); hB.update(clock);
      if (phase === 'replay') return;
      g.clear();
      const show = phase === 'brief' || phase === 'play' || phase === 'result';
      labels.visible = show; cantBtn.visible = show; canBtn.visible = show && rule === 'abstract';
      if (!show) { ctx.coords.hide(); return; }
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3]);
      cantBtn.position.set(L.w - 120, L.h - 60); canBtn.position.set(L.w - 120, L.h - 116);
      cantBtn.alpha = canBtn.alpha = locked ? 0.4 : 1;
      // thrusters and target
      arrowAt(g, S(O()), S(p.u), NEON.i, 3.5); arrowAt(g, S(O()), S(p.v), NEON.j, 3.5);
      uT.text = `u ${vstr(p.u)}`; vT.text = `v ${vstr(p.v)}`;
      uT.position.set(S(p.u)[0] + 10, S(p.u)[1] + 4); vT.position.set(S(p.v)[0] + 10, S(p.v)[1] - 24);
      const tc = S(p.target);
      g.circle(tc[0], tc[1], 14 + Math.sin(clock * 4) * 2).stroke({ width: 3, color: NEON.target });
      tT.text = `target ${vstr(p.target)}`; tT.position.set(tc[0] + 16, tc[1] - 28);
      aT.visible = bT.visible = rule !== 'abstract';
      if (rule !== 'abstract') { drawTrack(A_Y, a, NEON.i, aT, 'a'); drawTrack(B_Y, b, NEON.j, bT, 'b'); }
      const pos = position(p, a, b);
      dT.visible = false;
      if (phase === 'result' && answer === null && rule !== 'abstract') {
        const f = ease(afterT / 1.1);
        drawDrone([lerp(0, pos[0], f), lerp(0, pos[1], f)], clock);
      } else if (rule === 'assist') {
        // live: the path a·u then b·v and where the drone would end
        const mid: Vec2 = [a * p.u[0], a * p.u[1]];
        if (a !== 0) arrowAt(g, S(O()), S(mid), NEON.i, 2, 0.5);
        if (b !== 0) arrowAt(g, S(mid), S(pos), NEON.j, 2, 0.5);
        drawDrone(pos, clock, 0.6);
        dT.visible = true; dT.text = vstr(pos); dT.position.set(S(pos)[0] + 16, S(pos)[1] + 6);
      } else drawDrone([0, 0], clock);
    },
    destroy() {},
  };
}
