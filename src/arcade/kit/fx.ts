import type { Container, Graphics } from 'pixi.js';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: number; r: number }

const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** Particles, screen flash and shake. Respects prefers-reduced-motion. */
export class Fx {
  private particles: Particle[] = [];
  private shakeT = 0;
  private flashA = 0;
  private flashColor = 0xffffff;
  constructor(private g: Graphics, private flashG: Graphics, private shaken: Container) {}

  burst(x: number, y: number, n: number, colors: number[]) {
    const count = reduced() ? Math.ceil(n / 2) : n;
    for (let k = 0; k < count; k++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 520;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 0.6 + Math.random() * 0.7, max: 1.3, color: colors[k % colors.length], r: 1.5 + Math.random() * 3 });
    }
  }
  flash(color: number, strength = 0.6) { if (!reduced()) { this.flashColor = color; this.flashA = strength; } }
  shake(seconds = 0.45) { if (!reduced()) this.shakeT = seconds; }

  update(dt: number, w: number, h: number) {
    const g = this.g; g.clear();
    this.particles = this.particles.filter((p) => (p.life -= dt) > 0);
    for (const p of this.particles) {
      p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985;
      const a = Math.max(0, p.life / p.max);
      g.circle(p.x, p.y, p.r * 2.6).fill({ color: p.color, alpha: a * 0.15 });
      g.circle(p.x, p.y, p.r).fill({ color: p.color, alpha: a });
    }
    if (this.shakeT > 0) { this.shakeT -= dt; const k = this.shakeT * 26; this.shaken.position.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k); }
    else this.shaken.position.set(0, 0);
    this.flashA = Math.max(0, this.flashA - dt * 1.8);
    this.flashG.clear();
    if (this.flashA > 0) this.flashG.rect(0, 0, w, h).fill({ color: this.flashColor, alpha: this.flashA * 0.35 });
  }
}
