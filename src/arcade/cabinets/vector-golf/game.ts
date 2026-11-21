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
  /** Seconds since LOCK IN: drives the club swing. */
  let sinceLock = -1;
  const handles: Handle[] = [];
  const trail: Vec2[] = [];

  const origin = (k: number): Vec2 => (rule === 'assist' ? endPoint(p.start, shots.slice(0, k)) : p.start);
  const S = (v: Vec2) => ctx.toScreen(v);

  /** A golf flag planted in the cup: a dark cup, a pole and a waving pennant. */
  function drawFlag(at: Vec2, clock: number) {
    const L = ctx.layout(), [x, y] = S(at), r = HOLE_R * L.U * 0.7, pole = Math.max(34, L.U * 0.75), wave = Math.sin(clock * 3) * 3;
    g.ellipse(x, y, r, r * 0.45).fill({ color: NEON.bg }).ellipse(x, y, r, r * 0.45).stroke({ width: 2, color: NEON.target, alpha: 0.8 });
    glow(g, [[x, y], [x, y - pole]], NEON.white, 1.6);
    g.poly([x, y - pole, x + 26, y - pole + 7 + wave * 0.3, x, y - pole + 15]).fill({ color: NEON.target });
    holeT.text = `flag ${vstr(at)}`; holeT.position.set(x + 30, y - pole - 4); holeT.visible = true;
  }

  function drawField(clock: number, showFlag = true) {
    const L = ctx.layout();
    ctx.coords.draw(L.O, L.U, FIELD[0], FIELD[1]);
    // walls
    for (const [a, b] of p.walls) glow(g, [S(a), S(b)], NEON.accent, 4);
    // the flag; hidden while the player must predict where the ball stops (it would give the answer away)
    holeT.visible = false;
    if (showFlag) drawFlag(p.hole, clock);
    // start
    const s = S(p.start);
    startT.text = `start ${vstr(p.start)}`; startT.position.set(s[0] - 40, s[1] + 14);
  }

  /**
   * The golf club at the ball: at address while the player aims, then one swing after LOCK IN
   * (back, then through the ball along the first shot), held at the follow-through.
   */
  function drawClub(clock: number) {
    const L = ctx.layout();
    const first = rule === 'abstract' ? p.shots[0] : shots[0] ?? [1, 0];
    const dirX = Math.sign(first[0]) || 1;                         // the side the ball goes to
    const ball = S(p.start), len = Math.max(46, L.U * 1.15);
    const pivot: Vec2 = [ball[0] - dirX * len * 0.35, ball[1] - len * 0.94];
    const rest = Math.atan2(ball[1] - pivot[1], ball[0] - pivot[0]); // club head resting behind the ball
    const back = rest - dirX * 0.95, through = rest + dirX * 0.75;
    let a = rest + Math.sin(clock * 2) * 0.03;                       // at address: a slight waggle
    if (sinceLock >= 0) {
      const k = Math.min(1, sinceLock / 0.45);
      a = k < 0.45 ? rest + (back - rest) * (k / 0.45)               // back swing
        : back + (through - back) * Math.pow((k - 0.45) / 0.55, 2);  // down swing, accelerating through the ball
    }
    const head: Vec2 = [pivot[0] + Math.cos(a) * len, pivot[1] + Math.sin(a) * len];
    glow(g, [pivot, head], NEON.white, 3.2);
    // the grip and the club head: a short blade pointing the way the ball will go
    g.circle(pivot[0], pivot[1], 5).fill({ color: NEON.accent });
    g.moveTo(head[0], head[1]).lineTo(head[0] + dirX * 16, head[1] + 3).stroke({ width: 7, color: NEON.target, cap: 'round' });
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
      // only the numbers + the player's prediction: a cross and its coordinates, no circle
      const q = S(predicted);
      g.moveTo(q[0] - 12, q[1]).lineTo(q[0] + 12, q[1]).moveTo(q[0], q[1] - 12).lineTo(q[0], q[1] + 12);
      g.stroke({ width: 2.5, color: NEON.target });
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
      // the landing point as coordinates only (no circle preview)
      const end = endPoint(p.start, shots), e = S(end);
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
      rule = r; locked = false; afterT = 0; trail.length = 0; sinceLock = -1;
      shots = p.shots.map((_, k) => (k % 2 === 0 ? [1, 0] : [0, 1]) as Vec2);
      predicted = [...p.start] as Vec2;
    },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; sinceLock = 0; },
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
      if (sinceLock >= 0) sinceLock += dt;
      for (const h of handles) h.update(clock);
      if (phase === 'replay') return;
      g.clear();
      const show = phase === 'brief' || phase === 'play' || phase === 'result';
      labels.visible = show;
      if (!show) { ctx.coords.hide(); return; }
      drawField(clock, rule !== 'abstract' || phase === 'result');
      drawShots(phase);
      drawClub(clock);
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
