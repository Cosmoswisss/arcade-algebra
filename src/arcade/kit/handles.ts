import { Graphics } from 'pixi.js';
import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { Vec2 } from '../../engine/types';
import { sfx } from './audio';

export interface HandleOptions {
  color: number;
  get: () => Vec2;
  set: (v: Vec2) => void;
  /** Converts a screen point to plane coordinates. */
  toPlane: (x: number, y: number) => Vec2;
  toScreen: (v: Vec2) => Vec2;
  enabled: () => boolean;
  snap?: number;
  /** Plane limits [[xmin, xmax], [ymin, ymax]] so a handle can always be grabbed again. */
  limits?: [[number, number], [number, number]];
}

/** A draggable glowing knob with snapping and clamping. Works with mouse and touch. */
export class Handle {
  readonly g = new Graphics();
  dragging = false;
  constructor(parent: Container, stage: Container, private o: HandleOptions) {
    const g = this.g;
    g.circle(0, 0, 13).fill({ color: o.color, alpha: 0.25 }).circle(0, 0, 8).fill({ color: o.color }).circle(0, 0, 26).fill({ color: o.color, alpha: 0.001 });
    g.eventMode = 'static'; g.cursor = 'grab';
    g.on('pointerdown', (e: FederatedPointerEvent) => { if (o.enabled()) { this.dragging = true; e.stopPropagation(); } });
    stage.on('globalpointermove', (e: FederatedPointerEvent) => this.move(e.global.x, e.global.y));
    stage.on('pointerup', () => { this.dragging = false; });
    stage.on('pointerupoutside', () => { this.dragging = false; });
    parent.addChild(g);
  }
  private move(x: number, y: number) {
    if (!this.dragging || !this.o.enabled()) return;
    const step = this.o.snap ?? 0.5;
    const [[x0, x1], [y0, y1]] = this.o.limits ?? [[-3, 3], [-2, 3]];
    let [px, py] = this.o.toPlane(x, y);
    if (step > 0) { px = Math.round(px / step) * step; py = Math.round(py / step) * step; }
    px = Math.min(x1, Math.max(x0, px)); py = Math.min(y1, Math.max(y0, py));
    const cur = this.o.get();
    if (cur[0] !== px || cur[1] !== py) { this.o.set([px, py]); sfx.snap(); }
  }
  update(clock: number) {
    const p = this.o.toScreen(this.o.get());
    this.g.position.set(p[0], p[1]);
    this.g.visible = this.o.enabled();
    this.g.scale.set(this.dragging ? 1.35 : 1 + 0.12 * Math.sin(clock * 8));
  }
}
