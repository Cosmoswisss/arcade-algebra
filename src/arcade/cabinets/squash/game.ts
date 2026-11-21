import { Container, Graphics, Text } from 'pixi.js';
import type { Wave } from '../../../content/types';
import { vstr } from '../../../engine/diagnoseKinds';
import { apply } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';
import type { KitContext } from '../../kit/context';
import type { Handle } from '../../kit/handles';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from '../../kit/neon';
import type { CabinetGame, Phase } from '../../kit/runner';
import { areaFactor, checklist, evaluateSquash, goalText, snapBet } from './logic';
import type { SquashParams } from './params';

const SQUARE: Vec2[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
const BET_Y = -1.6;
const I: Mat2 = [[1, 0], [0, 1]];
const lerpM = (a: Mat2, b: Mat2, k: number): Mat2 => [[lerp(a[0][0], b[0][0], k), lerp(a[0][1], b[0][1], k)], [lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k)]];
const col = (m: Mat2, c: 0 | 1): Vec2 => [m[0][c], m[1][c]];
const fm = (x: number) => (Math.abs(x) < 1e-9 ? '0' : String(Math.round(x * 100) / 100));
const mk = (size: number, fill: string) => new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: '700', dropShadow: { color: fill, blur: 8, distance: 0, alpha: 0.8 } } });

export function createSquash(): CabinetGame & { setup(ctx: KitContext): void } {
  let ctx!: KitContext;
  const g = new Graphics();
  const labels = new Container();
  const betT = mk(18, CSS.target), pressT = mk(30, CSS.text), tipI = mk(15, CSS.i), tipJ = mk(15, CSS.j), areaT = mk(20, CSS.player);
  const tickTs = Array.from({ length: 7 }, (_, k) => { const t = mk(13, CSS.muted); t.text = String(k - 3); t.anchor.set(0.5); return t; });
  let m: Mat2 = I;
  let rule: Rule = 'assist';
  let bet: Vec2 = [0, BET_Y];
  let locked = false;
  let afterT = 0;
  let lastPhase: Phase = 'brief';
  let handle!: Handle;
  const S = (v: Vec2) => ctx.toScreen(v);
  const betValue = () => snapBet(bet[0]);

  function drawPlane(shape: Mat2, color: number, alpha: number) {
    const pts = SQUARE.map((p) => S(apply(shape, p)));
    g.poly(pts.flat()).fill({ color, alpha: 0.28 * alpha });
    glow(g, pts, color, 2.5, true, alpha);
  }

  function drawPress(t: number, impact: number) {
    // a press head descending from the sky toward the square
    const L = ctx.layout();
    const top = L.horizon - 40, bottom = S([0, 1.25])[1];
    const y = lerp(top, bottom, ease(Math.min(1, t))) + impact * 18;
    const x0 = S([-1.6, 0])[0], x1 = S([2.6, 0])[0];
    g.rect(x0, y - 46, x1 - x0, 46).fill({ color: NEON.wall, alpha: 0.95 });
    glow(g, [[x0, y - 46], [x1, y - 46], [x1, y], [x0, y]], NEON.accent, 2.5, true);
    g.moveTo((x0 + x1) / 2, L.horizon - 60).lineTo((x0 + x1) / 2, y - 46).stroke({ width: 6, color: NEON.line });
    pressT.visible = rule !== 'assist';
    pressT.text = `[[${fm(m[0][0])}, ${fm(m[0][1])}], [${fm(m[1][0])}, ${fm(m[1][1])}]]`;
    pressT.anchor.set(0.5); pressT.position.set((x0 + x1) / 2, y - 23); pressT.scale.set(0.65);
  }

  function drawBetTrack() {
    const a = S([-3, BET_Y]), b = S([3, BET_Y]);
    g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 4, color: NEON.surface2 });
    for (let k = -3; k <= 3; k++) {
      const p = S([k, BET_Y]);
      g.moveTo(p[0], p[1] - 6).lineTo(p[0], p[1] + 6).stroke({ width: 2, color: k === 0 ? NEON.text : NEON.line });
      tickTs[k + 3].position.set(p[0], p[1] + 20);
    }
    const h = S([betValue(), BET_Y]);
    betT.text = `AREA BET: ${betValue()}`; betT.anchor.set(0.5); betT.position.set(h[0], h[1] - 30);
  }

  return {
    setup(c: KitContext) {
      ctx = c;
      labels.addChild(betT, pressT, tipI, tipJ, areaT, ...tickTs);
      ctx.layer.addChild(g, labels);
      handle = ctx.handle({ color: NEON.target, get: () => [betValue(), BET_Y], set: (v) => { bet = [v[0], BET_Y]; }, enabled: () => ctx.phase() === 'play' && !locked, limits: [[-3, 3], [BET_Y, BET_Y]] });
    },
    startWave(w: Wave, r: Rule) { m = (w.params as SquashParams).matrix; rule = r; bet = [1, BET_Y]; locked = false; afterT = 0; },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; },
    evaluate: () => evaluateSquash(m, betValue()),
    goalText: (r) => goalText(m, r),
    checklist: (r) => checklist(m, betValue(), r),
    replay(k: number) {
      g.clear(); labels.visible = true; betT.visible = false; pressT.visible = false; tickTs.forEach((t) => { t.visible = false; });
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3], 0.8);
      const a = ease(k / 0.33), b = ease((k - 0.33) / 0.33);
      const cur: Mat2 = [[lerp(1, m[0][0], a), lerp(0, m[0][1], b)], [lerp(0, m[1][0], a), lerp(1, m[1][1], b)]];
      drawPlane(I, NEON.violet, 0.4);
      const d = areaFactor(m);
      drawPlane(cur, k > 0.66 && d < 0 ? NEON.accent : NEON.target, 1);
      arrowAt(g, L.O, S(col(cur, 0)), NEON.i, k < 0.33 ? 6 : 4); arrowAt(g, L.O, S(col(cur, 1)), NEON.j, k >= 0.33 && k < 0.66 ? 6 : 4);
      tipI.visible = tipJ.visible = true; areaT.visible = false;
      tipI.text = `î ${vstr(col(cur, 0))}`; tipJ.text = `ĵ ${vstr(col(cur, 1))}`;
      const pi = S(col(cur, 0)), pj = S(col(cur, 1)); tipI.position.set(pi[0] + 10, pi[1] + 4); tipJ.position.set(pj[0] + 10, pj[1] - 22);
      if (k < 0.33) return `î goes to ${vstr(col(m, 0))}`;
      if (k < 0.66) return `ĵ goes to ${vstr(col(m, 1))}`;
      const note = d < 0 ? ' — negative: the square was flipped over' : Math.abs(d) < 1e-9 ? ' — zero: î and ĵ are on one line, the square is flat' : '';
      return `Area = ${fm(m[0][0])}·${fm(m[1][1])} − ${fm(m[0][1])}·${fm(m[1][0])} = ${fm(d)}${note}`;
    },
    frame(dt: number, phase: Phase, t: number, clock: number) {
      if (phase !== lastPhase) { afterT = 0; lastPhase = phase; }
      afterT += dt;
      handle.update(clock);
      if (phase === 'replay') return;
      g.clear();
      const show = phase === 'brief' || phase === 'play' || phase === 'result';
      labels.visible = show;
      if (!show) { ctx.coords.hide(); return; }
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3]);
      tickTs.forEach((tt) => { tt.visible = true; }); betT.visible = true;
      tipI.visible = tipJ.visible = false; areaT.visible = false;
      const impact = phase === 'result' ? Math.max(0, 1 - afterT * 3) : 0;
      if (phase === 'result') {
        // the press has hit: the square takes its new shape
        const k = ease(afterT / 0.6);
        const shape = lerpM(I, m, k);
        const d = areaFactor(m);
        drawPlane(shape, d < 0 && k > 0.5 ? NEON.accent : NEON.player, 1);
        areaT.visible = true; areaT.text = `area ${fm(d)}`; const c = S(apply(m, [0.5, 0.5])); areaT.anchor.set(0.5); areaT.position.set(c[0], c[1] + 26);
      } else {
        drawPlane(I, NEON.player, 1);
        if (rule === 'assist') {
          // preview: the shape it will become, over a counting grid
          for (let x = -3; x <= 3; x++) g.moveTo(S([x, -1])[0], S([x, -1])[1]).lineTo(S([x, 3])[0], S([x, 3])[1]);
          for (let y = -1; y <= 3; y++) g.moveTo(S([-3, y])[0], S([-3, y])[1]).lineTo(S([3, y])[0], S([3, y])[1]);
          g.stroke({ width: 1, color: NEON.violet, alpha: 0.35 });
          const pts = SQUARE.map((p) => S(apply(m, p)));
          glow(g, pts, NEON.target, 2, true, 0.55 + 0.25 * Math.sin(clock * 5));
        }
        if (rule !== 'abstract') {
          const pi = S(col(m, 0)), pj = S(col(m, 1));
          arrowAt(g, L.O, pi, NEON.i, 3, 0.7); arrowAt(g, L.O, pj, NEON.j, 3, 0.7);
          tipI.visible = tipJ.visible = true;
          tipI.text = `î → ${vstr(col(m, 0))}`; tipJ.text = `ĵ → ${vstr(col(m, 1))}`;
          tipI.position.set(pi[0] + 10, pi[1] + 4); tipJ.position.set(pj[0] + 10, pj[1] - 22);
        }
      }
      drawPress(phase === 'result' ? 1 : t, impact);
      drawBetTrack();
    },
    destroy() {},
  };
}
