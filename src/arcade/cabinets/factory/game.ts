import { Container, Graphics, Text } from 'pixi.js';
import type { Wave } from '../../../content/types';
import { vstr } from '../../../engine/diagnoseKinds';
import { apply } from '../../../engine/matrix';
import type { Mat2, Rule, Vec2 } from '../../../engine/types';
import type { KitContext } from '../../kit/context';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from '../../kit/neon';
import type { CabinetGame, Phase } from '../../kit/runner';
import { checklist, compose, evaluateFactory, goalText } from './logic';
import type { FactoryParams } from './params';

const SHAPE: Vec2[] = [[0, 0], [0.3, 0], [0.3, 0.55], [1, 0.55], [1, 1], [0, 1]];
const I: Mat2 = [[1, 0], [0, 1]];
const STAGE = [NEON.violet, NEON.accent, NEON.player];
const lerpM = (a: Mat2, b: Mat2, k: number): Mat2 => [[lerp(a[0][0], b[0][0], k), lerp(a[0][1], b[0][1], k)], [lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k)]];
const fm = (x: number) => (Math.abs(x) < 1e-9 ? '0' : String(x));
const mstr = (m: Mat2) => `[${fm(m[0][0])} ${fm(m[0][1])}; ${fm(m[1][0])} ${fm(m[1][1])}]`;
const mk = (size: number, fill: string, w: '500' | '700' | '800' = '700') => new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: w } });

/** A clickable machine card (in the tray or on the belt). */
function machineCard(onPress: () => void) {
  const c = new Container(), bg = new Graphics(), name = mk(14, CSS.text, '800'), mat = mk(13, CSS.muted, '500');
  name.anchor.set(0.5, 0); mat.anchor.set(0.5, 0); name.position.set(0, -26); mat.position.set(0, -4);
  c.addChild(bg, name, mat);
  c.eventMode = 'static'; c.cursor = 'pointer';
  c.on('pointerdown', (e) => { e.stopPropagation(); onPress(); });
  const set = (label: string, m: Mat2, showMatrix: boolean, color: number, active: boolean) => {
    name.text = label.toUpperCase(); mat.text = showMatrix ? mstr(m) : '';
    bg.clear().roundRect(-78, -34, 156, 58, 10).fill({ color: NEON.surface, alpha: 0.95 }).roundRect(-78, -34, 156, 58, 10).stroke({ width: 2, color, alpha: active ? 1 : 0.5 });
  };
  return { c, set };
}

export function createFactory(): CabinetGame & { setup(ctx: KitContext): void } {
  let ctx!: KitContext;
  const g = new Graphics();
  const labels = new Container();
  const trayT = mk(13, CSS.muted), beltT = mk(13, CSS.muted), outT = mk(14, CSS.target);
  let p: FactoryParams = { machines: [], target: I };
  let rule: Rule = 'assist';
  let order: number[] = [];
  let shuffled: number[] = [];
  let locked = false, afterT = 0;
  let lastPhase: Phase = 'brief';
  const tray: ReturnType<typeof machineCard>[] = [];
  const belt: ReturnType<typeof machineCard>[] = [];
  const S = (v: Vec2) => ctx.toScreen(v);
  const can = () => ctx.phase() === 'play' && !locked;

  function drawShape(m: Mat2, color: number, alpha: number, fill = 0.25) {
    const pts = SHAPE.map((q) => S(apply(m, q)));
    g.poly(pts.flat()).fill({ color, alpha: fill * alpha });
    glow(g, pts, color, 2.2, true, alpha);
  }
  function layoutCards(showMatrix: boolean) {
    const L = ctx.layout();
    const narrow = L.w < 760;
    const trayX = narrow ? L.w / 2 - 170 : 100, beltY = L.horizon + 34;
    trayT.text = 'MACHINES (click to add)'; trayT.position.set(trayX - 78, beltY + 52);
    beltT.text = 'BELT (click to remove) →'; beltT.position.set(L.w / 2 - 250, beltY - 58);
    tray.forEach((card, k) => {
      const idx = shuffled[k];
      const used = order.includes(idx);
      card.c.visible = idx !== undefined && !used;
      if (idx === undefined) return;
      card.set(p.machines[idx].name, p.machines[idx].matrix, showMatrix, NEON.player, can());
      card.c.position.set(narrow ? trayX + (k % 2) * 170 : trayX, beltY + 104 + (narrow ? Math.floor(k / 2) * 66 : k * 70));
    });
    belt.forEach((card, k) => {
      const idx = order[k];
      card.c.visible = idx !== undefined;
      if (idx === undefined) return;
      card.set(`${k + 1}. ${p.machines[idx].name}`, p.machines[idx].matrix, showMatrix, STAGE[k], can());
      card.c.position.set(L.w / 2 - 170 + k * 170, beltY);
    });
    // the conveyor belt itself
    const y = beltY + 30;
    g.moveTo(L.w / 2 - 260, y).lineTo(L.w / 2 + 260, y).stroke({ width: 3, color: NEON.line });
    for (let x = -260; x <= 260; x += 26) g.moveTo(L.w / 2 + x, y).lineTo(L.w / 2 + x + 10, y + 6).stroke({ width: 1.5, color: NEON.line });
  }

  return {
    setup(c: KitContext) {
      ctx = c;
      labels.addChild(trayT, beltT, outT);
      ctx.layer.addChild(g, labels);
      for (let k = 0; k < 3; k++) {
        const t = machineCard(() => { const idx = shuffled[k]; if (can() && idx !== undefined && !order.includes(idx)) { order = [...order, idx]; ctx.sfx.snap(); } });
        const b = machineCard(() => { if (can() && order[k] !== undefined) { order = order.filter((_, i) => i !== k); ctx.sfx.click(); } });
        tray.push(t); belt.push(b); ctx.layer.addChild(t.c, b.c);
      }
    },
    startWave(w: Wave, r: Rule) {
      p = w.params as FactoryParams; rule = r; order = []; locked = false; afterT = 0;
      // shuffle so the tray order never gives the answer away
      shuffled = p.machines.map((_, k) => k).reverse();
      if (shuffled.length === 3) shuffled = [shuffled[1], shuffled[2], shuffled[0]];
    },
    update() {},
    isLocked: () => locked,
    lock() { locked = true; },
    evaluate: () => evaluateFactory(p, order),
    goalText: (r) => goalText(p, r),
    checklist: (r) => checklist(p, order, r),
    replay(k: number) {
      g.clear(); labels.visible = true; tray.forEach((t) => { t.c.visible = false; });
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3], 0.8);
      const n = p.machines.length, step = Math.min(n - 1, Math.floor(k * n));
      const prev = compose(p.machines.slice(0, step).map((m) => m.matrix));
      const next = compose(p.machines.slice(0, step + 1).map((m) => m.matrix));
      const cur = lerpM(prev, next, ease(k * n - step));
      order = p.machines.map((_, i) => i).slice(0, step + 1);
      layoutCards(true);
      glow(g, SHAPE.map((q) => S(apply(p.target, q))), NEON.target, 2, true, 0.5);
      drawShape(cur, STAGE[step], 1);
      arrowAt(g, L.O, S([cur[0][0], cur[1][0]]), NEON.i, 3.5); arrowAt(g, L.O, S([cur[0][1], cur[1][1]]), NEON.j, 3.5);
      if (k < 0.97) return `Machine ${step + 1} (${p.machines[step].name}) acts on the part made so far → î at ${vstr([next[0][0], next[1][0]])}, ĵ at ${vstr([next[0][1], next[1][1]])}`;
      return 'One machine after another = one matrix: the product, with the first machine written on the right.';
    },
    frame(dt: number, phase: Phase, _t: number, clock: number) {
      if (phase !== lastPhase) { afterT = 0; lastPhase = phase; }
      afterT += dt;
      if (phase === 'replay') return;
      g.clear();
      const show = phase === 'brief' || phase === 'play' || phase === 'result';
      labels.visible = show;
      tray.forEach((t) => { t.c.visible = show; }); belt.forEach((b) => { b.c.visible = show; });
      if (!show) { ctx.coords.hide(); return; }
      const L = ctx.layout();
      ctx.coords.draw(L.O, L.U, [-3, 3], [-2, 3]);
      layoutCards(true);
      // the outline the final part must match
      glow(g, SHAPE.map((q) => S(apply(p.target, q))), NEON.target, 2.5, true, 0.6 + 0.3 * Math.sin(clock * 4));
      outT.text = 'target part'; const tc = S(apply(p.target, [1, 1])); outT.position.set(tc[0] + 8, tc[1] - 20);
      drawShape(I, NEON.text, 0.35, 0.1);
      const mats = order.map((k) => p.machines[k].matrix);
      if (phase === 'result') {
        // the part travels through every machine on the belt
        const n = Math.max(1, mats.length), f = Math.min(n, afterT / 0.6);
        const s = Math.min(n - 1, Math.floor(f));
        const cur = lerpM(compose(mats.slice(0, s)), compose(mats.slice(0, s + 1)), ease(f - s));
        drawShape(cur, STAGE[Math.min(2, s)], 1);
      } else if (rule === 'assist') {
        mats.forEach((_, k) => drawShape(compose(mats.slice(0, k + 1)), STAGE[k], k === mats.length - 1 ? 1 : 0.45));
      } else if (rule === 'partial' && mats.length) {
        drawShape(compose(mats), NEON.player, 1);
      }
    },
    destroy() {},
  };
}
