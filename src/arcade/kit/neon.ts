import type { Graphics } from 'pixi.js';
import type { Vec2 } from '../../engine/types';

/** Numeric colors for Pixi — same values as DESIGN.md tokens. */
export const NEON = {
  bg: 0x05030f, surface: 0x0e0a24, surface2: 0x16113a, line: 0x2e2a7a, violet: 0x6366f1,
  text: 0xe0e7ff, muted: 0xa5b4fc, i: 0x4ade80, j: 0xf87171, target: 0xfde047, player: 0x22d3ee, accent: 0xf0abfc, wall: 0x1a0b2e, white: 0xffffff,
} as const;
export const CSS = {
  text: '#e0e7ff', muted: '#a5b4fc', dim: '#8b8fc7', i: '#4ade80', j: '#f87171', target: '#fde047', player: '#22d3ee', accent: '#f0abfc', bg: '#05030f',
} as const;
export const FONT_MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';
export const FONT_READ = 'Atkinson Hyperlegible, system-ui, sans-serif';

/** A glowing stroke: three passes (wide faint, medium, sharp core), as in the prototype. */
export function glow(g: Graphics, pts: Vec2[], color: number, w: number, closed = false, alpha = 1) {
  if (pts.length < 2) return;
  for (const [ww, a] of [[w * 5, 0.06], [w * 2.4, 0.16], [w, 1]] as const) {
    g.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]);
    if (closed) g.closePath();
    g.stroke({ width: ww, color, alpha: a * alpha, cap: 'round', join: 'round' });
  }
}

export function arrowAt(g: Graphics, from: Vec2, to: Vec2, color: number, w = 4, alpha = 1) {
  glow(g, [from, to], color, w, false, alpha);
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const len = 9 + w;
  if (Math.hypot(to[0] - from[0], to[1] - from[1]) > 8)
    g.poly([to[0], to[1], to[0] - len * Math.cos(ang - 0.45), to[1] - len * Math.sin(ang - 0.45), to[0] - len * Math.cos(ang + 0.45), to[1] - len * Math.sin(ang + 0.45)]).fill({ color, alpha });
}

export const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
