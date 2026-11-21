import { Container, Graphics, Text } from 'pixi.js';
import { FONT_MONO, NEON } from './neon';

/** An in-game answer button (e.g. CAN'T REACH). Stops the click from reaching the stage. */
export function gameButton(label: string, color: number, css: string, onPress: () => void) {
  const c = new Container(), bg = new Graphics();
  const t = new Text({ text: label, style: { fontFamily: FONT_MONO, fontSize: 15, fill: css, fontWeight: '800' } });
  t.anchor.set(0.5);
  const w = Math.max(170, t.width + 36);
  bg.roundRect(-w / 2, -22, w, 44, 12).fill({ color: NEON.bg, alpha: 0.75 }).roundRect(-w / 2, -22, w, 44, 12).stroke({ width: 2, color });
  c.addChild(bg, t);
  c.eventMode = 'static'; c.cursor = 'pointer';
  c.on('pointerdown', (e) => { e.stopPropagation(); onPress(); });
  return c;
}
