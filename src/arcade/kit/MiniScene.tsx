import { Application, Container, Graphics, Text } from 'pixi.js';
import { useEffect, useRef } from 'react';
import type { SceneStep } from '../../content/types';
import { vstr } from '../../engine/diagnoseKinds';
import { apply, fromBasis } from '../../engine/matrix';
import type { Mat2, Vec2 } from '../../engine/types';
import { unlockAudio } from './audio';
import { Coords } from './coords';
import { Handle } from './handles';
import { arrowAt, CSS, ease, FONT_MONO, glow, lerp, NEON } from './neon';

const SHAPE: Vec2[] = [[0, 0], [0.3, 0], [0.3, 0.55], [1, 0.55], [1, 1], [0, 1]];
const I: Mat2 = [[1, 0], [0, 1]];
const lerpM = (a: Mat2, b: Mat2, k: number): Mat2 => [[lerp(a[0][0], b[0][0], k), lerp(a[0][1], b[0][1], k)], [lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k)]];

export interface MiniSceneProps {
  /** Animation played first (and again when `playKey` changes). */
  scene?: SceneStep[];
  /** What the learner manipulates once the scene is over. */
  input: 'basis' | 'point' | 'none';
  /** Matrix shown when there is no input (e.g. for number/choice questions). */
  shown?: Mat2;
  /** Extra arrows to draw from the origin (point questions), with coefficients. */
  vectors?: Vec2[];
  playKey: string | number;
  onBasis?: (m: Mat2) => void;
  onPoint?: (p: Vec2) => void;
  onCaption?: (c: string) => void;
  height?: number;
}

/** A small neon plane used in the course: plays a scene, then lets the learner place î/ĵ or a point. */
export default function MiniScene(props: MiniSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const reset = useRef<() => void>(() => {});

  useEffect(() => {
    const el = host.current!;
    const app = new Application();
    let alive = true, cleanup = () => {};
    (async () => {
      try { await (document as Document & { fonts?: FontFaceSet }).fonts?.ready; } catch { /* optional */ }
      await app.init({ resizeTo: el, background: NEON.bg, antialias: true, autoDensity: true, resolution: Math.min(2, window.devicePixelRatio || 1) });
      if (!alive) { app.destroy(true, { children: true }); return; }
      el.appendChild(app.canvas);
      const layer = new Container(), g = new Graphics(), coords = new Coords();
      const tipI = new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: 15, fill: CSS.i, fontWeight: '700' } });
      const tipJ = new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: 15, fill: CSS.j, fontWeight: '700' } });
      const tipP = new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: 15, fill: CSS.target, fontWeight: '700' } });
      layer.addChild(coords.view, g, tipI, tipJ, tipP);
      app.stage.addChild(layer);
      app.stage.eventMode = 'static'; app.stage.hitArea = app.screen;
      app.stage.on('pointerdown', unlockAudio);

      const U = () => Math.min(app.screen.width / 8.5, app.screen.height / 7);
      const O = (): Vec2 => [app.screen.width / 2 - U() * 0.5, app.screen.height * 0.66];
      const toS = (p: Vec2): Vec2 => [O()[0] + p[0] * U(), O()[1] - p[1] * U()];
      const toP = (x: number, y: number): Vec2 => [(x - O()[0]) / U(), (O()[1] - y) / U()];

      let i: Vec2 = [1, 0], j: Vec2 = [0, 1], p: Vec2 = [0, 0];
      let sceneT = 0, interactive = false, clock = 0;
      const sceneLen = () => (latest.current.scene ?? []).reduce((s, st) => s + st.ms / 1000, 0);
      reset.current = () => { sceneT = 0; interactive = !(latest.current.scene?.length); i = [1, 0]; j = [0, 1]; p = [0, 0]; };
      reset.current();
      const limits: [[number, number], [number, number]] = [[-3, 3], [-2, 3]];
      const can = (k: 'basis' | 'point') => () => interactive && latest.current.input === k;
      const hI = new Handle(layer, app.stage, { color: NEON.i, get: () => i, set: (v) => { i = v; latest.current.onBasis?.(fromBasis(i, j)); }, toPlane: toP, toScreen: toS, enabled: can('basis'), limits });
      const hJ = new Handle(layer, app.stage, { color: NEON.j, get: () => j, set: (v) => { j = v; latest.current.onBasis?.(fromBasis(i, j)); }, toPlane: toP, toScreen: toS, enabled: can('basis'), limits });
      const hP = new Handle(layer, app.stage, { color: NEON.target, get: () => p, set: (v) => { p = v; latest.current.onPoint?.(p); }, toPlane: toP, toScreen: toS, enabled: can('point'), limits });

      const tick = () => {
        const dt = Math.min(0.05, app.ticker.deltaMS / 1000);
        clock += dt;
        const pr = latest.current;
        g.clear();
        // current matrix: scene animation, then the learner's basis (or the shown matrix)
        let m: Mat2 = pr.input === 'basis' && interactive ? fromBasis(i, j) : pr.shown ?? I;
        let caption = '';
        if (!interactive && pr.scene?.length) {
          sceneT += dt;
          let acc = 0, from: Mat2 = I;
          m = from;
          for (const st of pr.scene) {
            const d = st.ms / 1000;
            if (sceneT <= acc + d) { m = lerpM(from, st.matrix, ease((sceneT - acc) / d)); caption = st.caption; break; }
            acc += d; from = st.matrix; m = st.matrix; caption = st.caption;
          }
          if (sceneT > sceneLen() + 0.8) interactive = true;
        }
        pr.onCaption?.(caption);
        coords.draw(O(), U(), [-3, 3], [-2, 3]);
        for (let q = -3; q <= 3; q++) {
          const a = toS(apply(m, [q, -2])), b = toS(apply(m, [q, 3])), c = toS(apply(m, [-3, q])), d = toS(apply(m, [3, q]));
          g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).moveTo(c[0], c[1]).lineTo(d[0], d[1]);
        }
        g.stroke({ width: 1, color: NEON.player, alpha: 0.35 });
        const pts = SHAPE.map((s) => toS(apply(m, s)));
        g.poly(pts.flat()).fill({ color: NEON.player, alpha: 0.25 }); glow(g, pts, NEON.player, 2, true);
        const ci = toS([m[0][0], m[1][0]]), cj = toS([m[0][1], m[1][1]]);
        arrowAt(g, O(), ci, NEON.i, 3.5); arrowAt(g, O(), cj, NEON.j, 3.5);
        tipI.text = `î ${vstr([m[0][0], m[1][0]])}`; tipJ.text = `ĵ ${vstr([m[0][1], m[1][1]])}`;
        tipI.position.set(ci[0] + 10, ci[1] + 4); tipJ.position.set(cj[0] + 10, cj[1] - 22);
        for (const v of pr.vectors ?? []) arrowAt(g, O(), toS(v), NEON.accent, 2.5, 0.8);
        tipP.visible = pr.input === 'point' && interactive;
        if (tipP.visible) { const sp = toS(p); g.circle(sp[0], sp[1], 10).stroke({ width: 2, color: NEON.target }); tipP.text = vstr(p); tipP.position.set(sp[0] + 12, sp[1] - 24); }
        hI.update(clock); hJ.update(clock); hP.update(clock);
      };
      app.ticker.add(tick);
      cleanup = () => { app.ticker.remove(tick); app.destroy(true, { children: true }); };
    })();
    return () => { alive = false; cleanup(); };
  }, []);

  useEffect(() => { reset.current(); }, [props.playKey]);

  return <div ref={host} className="mini-scene" style={{ height: props.height ?? 360 }} />;
}
