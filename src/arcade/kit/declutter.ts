import { Container, Text } from 'pixi.js';
import { isCoordLabel, placeLabels, type Rect } from './labelLayout';

/** Per label: where the game asked for it, and where we last put it. */
const placed = new WeakMap<Text, { wx: number; wy: number; ax: number; ay: number }>();

function visibleTexts(c: Container, out: Text[]): Text[] {
  for (const child of c.children) {
    if (!child.visible || child.alpha <= 0) continue;
    if (child instanceof Text) { if (isCoordLabel(child.text)) out.push(child); }
    else if (child instanceof Container) visibleTexts(child, out);
  }
  return out;
}

/**
 * Nudges the coordinate labels of a cabinet's layer off the axes, the tick numbers and each other.
 * Runs after the game's frame. A label the game moves again is taken as its new wanted spot,
 * so cabinets keep positioning their labels as before.
 */
export function declutter(world: Container, layer: Container, obstacles: Rect[], bounds: Rect): void {
  const texts = visibleTexts(layer, []);
  if (texts.length === 0) return;
  const rects = texts.map((t) => {
    let s = placed.get(t);
    if (!s || t.x !== s.ax || t.y !== s.ay) s = { wx: t.x, wy: t.y, ax: t.x, ay: t.y };
    placed.set(t, s);
    t.position.set(s.wx, s.wy);
    const b = t.getBounds();
    const tl = world.toLocal({ x: b.x, y: b.y });
    return { x: tl.x, y: tl.y, w: b.width, h: b.height };
  });
  const offsets = placeLabels(rects, obstacles, bounds);
  texts.forEach((t, k) => {
    const s = placed.get(t)!;
    s.ax = s.wx + offsets[k][0]; s.ay = s.wy + offsets[k][1];
    t.position.set(s.ax, s.ay);
  });
}
