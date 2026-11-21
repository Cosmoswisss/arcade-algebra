import { Container, Graphics, Text } from 'pixi.js';
import type { Vec2 } from '../../engine/types';
import { FONT_MONO, NEON, CSS } from './neon';

/** Graduated axes with tick labels (pedagogical rule 2: coordinates everywhere). Reuses its Text objects. */
export class Coords {
  readonly view = new Container();
  private g = new Graphics();
  private labels: Text[] = [];
  constructor() { this.view.addChild(this.g); }

  draw(origin: Vec2, U: number, xr: [number, number], yr: [number, number], alpha = 1) {
    const g = this.g; g.clear();
    this.view.alpha = alpha;
    for (let x = xr[0]; x <= xr[1]; x++) for (let y = yr[0]; y <= yr[1]; y++) g.circle(origin[0] + x * U, origin[1] - y * U, 1.8).fill({ color: NEON.violet, alpha: 0.6 });
    g.moveTo(origin[0] + (xr[0] - 0.3) * U, origin[1]).lineTo(origin[0] + (xr[1] + 0.3) * U, origin[1])
      .moveTo(origin[0], origin[1] - (yr[0] - 0.3) * U).lineTo(origin[0], origin[1] - (yr[1] + 0.3) * U);
    g.stroke({ width: 1.5, color: NEON.violet, alpha: 0.7 });
    let k = 0;
    const label = (s: string, x: number, y: number) => {
      let t = this.labels[k];
      if (!t) { t = new Text({ text: s, style: { fontFamily: FONT_MONO, fontSize: 13, fill: CSS.muted } }); t.anchor.set(0.5); this.labels.push(t); this.view.addChild(t); }
      t.text = s; t.position.set(x, y); t.visible = true; k++;
    };
    for (let x = xr[0]; x <= xr[1]; x++) if (x) label(String(x), origin[0] + x * U, origin[1] + 14);
    for (let y = yr[0]; y <= yr[1]; y++) if (y) label(String(y), origin[0] - 14, origin[1] - y * U);
    for (; k < this.labels.length; k++) this.labels[k].visible = false;
  }
  hide() { this.view.alpha = 0; }
}
