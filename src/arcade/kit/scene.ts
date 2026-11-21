import type { Graphics } from 'pixi.js';
import type { Layout } from './layout';
import { glow, NEON } from './neon';

/** The synthwave backdrop: sky glow, striped sun, perspective floor scrolling toward the player. */
export function drawSynthwave(g: Graphics, L: Layout, floorPhase: number) {
  const { w, h, horizon, V } = L;
  g.clear();
  for (let k = 0; k < 6; k++) g.rect(0, horizon - 120 + k * 20, w, 20).fill({ color: NEON.accent, alpha: 0.012 * k });
  const sr = Math.min(w, h) * 0.16;
  g.circle(V[0], horizon - sr * 0.35, sr).fill({ color: 0xff3fa4, alpha: 0.18 });
  for (let k = 0; k < 6; k++) g.rect(V[0] - sr, horizon - sr * 0.35 + k * sr * 0.16, sr * 2, sr * 0.05 + k * 1.5).fill({ color: NEON.bg });
  g.rect(0, horizon, w, h - horizon).fill({ color: NEON.bg });
  for (let k = -14; k <= 14; k++) g.moveTo(V[0], horizon).lineTo(V[0] + k * w * 0.11, h);
  g.stroke({ width: 1, color: NEON.violet, alpha: 0.3 });
  for (let k = 0; k < 14; k++) { const z = (k + floorPhase) / 14, y = horizon + (h - horizon) * z * z; g.moveTo(0, y).lineTo(w, y); }
  g.stroke({ width: 1, color: NEON.accent, alpha: 0.22 });
  glow(g, [[0, horizon], [w, horizon]], NEON.accent, 1.5);
}
