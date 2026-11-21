import { Container, Graphics, Text } from 'pixi.js';
import type { Wave } from '../../../content/types';
import { vstr } from '../../../engine/diagnoseKinds';
import type { Rule, Vec2 } from '../../../engine/types';
import type { KitContext } from '../../kit/context';
import type { Handle } from '../../kit/handles';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from '../../kit/neon';
import type { CabinetGame, Phase } from '../../kit/runner';
import { checklist, endPoint, evaluateGolf, goalText, hitsWall, HOLE_R, pathPoints } from './logic';
import type { GolfParams } from './params';

const SHOT_COLORS = [NEON.player, NEON.accent, NEON.target];
const SHOT_CSS = [CSS.player, CSS.accent, CSS.target];
const FIELD: [[number, number], [number, number]] = [[-3, 3], [-2, 3]];
const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
const mk = (size: number, fill: string) => new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: '700', dropShadow: { color: fill, blur: 8, distance: 0, alpha: 0.8 } } });

/** Point along a polyline at fraction k (0..1) of its length. */
function along(pts: Vec2[], k: number): Vec2 {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let d = Math.max(0, Math.min(1, k)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) { const f = lens[i] ? Math.min(1, d / lens[i]) : 1; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}

export function createVectorGolf(): CabinetGame & { setup(ctx: KitContext): void } {
  let ctx!: KitContext;
  const g = new Graphics();
  const labels = new Container();
  const shotLabels = [mk(16, SHOT_CSS[0]), mk(16, SHOT_CSS[1]), mk(16, SHOT_CSS[2])];
  const holeT = mk(15, CSS.target), startT = mk(14, CSS.text), predT = mk(16, CSS.target), endT = mk(16, CSS.player);
  let p: GolfParams = { start: [0, 0], shots: [[1, 0]], hole: [1, 0], walls: [] };
  let rule: Rule = 'assist';
  let shots: Vec2[] = [];
  let predicted: Vec2 = [0, 0];
  let locked = false;
  let lastCorrect = false;
  let afterT = 0;
  let lastPhase: Phase = 'brief';
  const handles: Handle[] = [];
  const trail: Vec2[] = [];

  const origin = (k: number): Vec2 => (rule === 'assist' ? endPoint(p.start, shots.slice(0, k)) : p.start);
  const S = (v: Vec2) => ctx.toScreen(v);

  function drawField(clock: number) {
    const L = ctx.layout();
    ctx.coords.draw(L.O, L.U, FIELD[0], FIELD[1]);
    // walls
    for (const [a, b] of p.walls) glow(g, [S(a), S(b)], NEON.accent, 4);
    // hole
    const h = S(p.hole);
    g.circle(h[0], h[1], HOLE_R * L.U + 4 + Math.sin(clock * 4) * 1.5).stroke({ width: 3, color: NEON.target, alpha: 0.9 });
    g.circle(h[0], h[1], HOLE_R * L.U * 0.6).fill({ color: NEON.bg });
    holeT.text = `HOLE ${vstr(p.hole)}`; holeT.position.set(h[0] + 16, h[1] - 28); holeT.visible = rule !== 'abstract';
    // start
    const s = S(p.start);
    startT.text = `start ${vstr(p.start)}`; startT.position.set(s[0] - 40, s[1] + 14);
  }

  function drawBall(at: Vec2, alpha = 1) {
    const b = S(at);
    g.circle(b[0], b[1], 14).fill({ color: NEON.white, alpha: 0.12 * alpha });
    g.circle(b[0], b[1], 7).fill({ color: NEON.white, alpha });
  }

  function drawShots(phase: Phase) {
    shotLabels.forEach((t) => { t.visible = false; });
    endT.visible = false; predT.visible = false;
    if (rule === 'abstract') {
      // only the numbers + the player's prediction marker
      const q = S(predicted);
      g.moveTo(q[0] - 12, q[1]).lineTo(q[0] + 12, q[1]).moveTo(q[0], q[1] - 12).lineTo(q[0], q[1] + 12);
      g.stroke({ width: 2.5, color: NEON.target });
      g.circle(q[0], q[1], 16).stroke({ width: 2, color: NEON.target, alpha: 0.7 });
      predT.text = `your guess ${vstr(predicted)}`; predT.position.set(q[0] + 18, q[1] - 30); predT.visible = true;
      return;
    }
    shots.forEach((v, k) => {
      const from = S(origin(k)), to = S(add(origin(k), v));
      arrowAt(g, from, to, SHOT_COLORS[k], 3.5);
      const t = shotLabels[k]; t.visible = true; t.text = `shot ${k + 1} ${vstr(v)}`;
      t.position.set((from[0] + to[0]) / 2 + 10, (from[1] + to[1]) / 2 - 24);
    });
    if (rule === 'assist' && phase !== 'result') {
      const end = endPoint(p.start, shots), e = S(end);
      g.circle(e[0], e[1], 9).stroke({ width: 2, color: NEON.player, alpha: 0.8 });
      endT.text = `ends at ${vstr(end)}`; endT.position.set(e[0] + 14, e[1] + 8); endT.visible = true;
    }
  }

  return {
    setup(c: KitContext) {
      ctx = c;
      labels.addChild(...shotLabels, holeT, startT, predT, endT);
      ctx.layer.addChild(g, labels);
      for (let k = 0; k < 3; k++) {
        handles.push(ctx.handle({
          color: SHOT_COLORS[k],
          get: () => (rule === 'abstract' ? predicted : add(origin(k), shots[k] ?? [0, 0])),
          set: (v) => { if (rule === 'abstract') predicted = v; else shots[k] = sub(v, origin(k)); },
          enabled: () => ctx.phase() === 'play' && !locked && (rule === 'abstract' ? k === 0 : k < shots.length),
          limits: FIELD,
        }));
      }
    },
    startWave(w: Wave, r: Rule) {
      p = w.params as GolfParams;
      rule = r; locked = false; afterT = 0; trail.length = 0;
      shots = p.shots.map((_, k) => (k % 2 === 0 ? [1, 0] : [0, 1]) as Vec2);
      predicted = [...p.start] as Vec2;
    },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; },
    evaluate() { const res = evaluateGolf(p, rule, shots, predicted); lastCorrect = res.correct; return res; },
    goalText: (r) => goalText(p, r),
    checklist: (r) => checklist(p, r, shots),
    replay(k: number) {
      g.clear(); shotLabels.forEach((t) => { t.visible = false; }); predT.visible = endT.visible = false;
      drawField(0);
      const pts = pathPoints(p.start, p.shots);
      const n = p.shots.length;
      const seg = Math.min(n - 1, Math.floor(k * n * 1.15));
      for (let s = 0; s <= seg; s++) {
        arrowAt(g, S(pts[s]), S(pts[s + 1]), SHOT_COLORS[s], s === seg ? 5 : 3);
        const t = shotLabels[s]; t.visible = true; t.text = `shot ${s + 1} ${vstr(p.shots[s])}`;
        const a = S(pts[s]), b = S(pts[s + 1]); t.position.set((a[0] + b[0]) / 2 + 10, (a[1] + b[1]) / 2 - 24);
      }
      drawBall(along(pts, ease(k * 1.15)));
      if (k < 0.87) return `Shot ${seg + 1}: ${vstr(p.shots[seg])} → the ball is now at ${vstr(pts[seg + 1])}`;
      return `Adding vectors = chaining them tip to tail: ${p.shots.map(vstr).join(' + ')} = ${vstr(sub(pts[n], p.start))}`;
    },
    frame(dt: number, phase: Phase, _t: number, clock: number) {
      if (phase !== lastPhase) { afterT = 0; lastPhase = phase; }
      afterT += dt;
      for (const h of handles) h.update(clock);
      if (phase === 'replay') return;
      g.clear();
      const show = phase === 'brief' || phase === 'play' || phase === 'result';
      labels.visible = show;
      if (!show) { ctx.coords.hide(); return; }
      drawField(clock);
      drawShots(phase);
      if (phase === 'result') {
        // roll the ball along the path that was actually played
        const played = rule === 'abstract' ? pathPoints(p.start, p.shots) : pathPoints(p.start, shots);
        let stopAt = 1;
        if (rule !== 'abstract' && hitsWall(played, p.walls)) stopAt = 0.5;
        const pos = along(played, Math.min(stopAt, ease(afterT / 1.2)));
        trail.push(S(pos)); if (trail.length > 20) trail.shift();
        for (let i = 1; i < trail.length; i++) { g.moveTo(trail[i - 1][0], trail[i - 1][1]).lineTo(trail[i][0], trail[i][1]); g.stroke({ width: 1 + i * 0.4, color: lastCorrect ? NEON.player : NEON.j, alpha: i / trail.length }); }
        drawBall(pos);
      } else drawBall(p.start);
    },
    destroy() {},
  };
}
