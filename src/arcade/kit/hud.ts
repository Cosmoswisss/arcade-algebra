import { Container, Graphics, Text } from 'pixi.js';
import type { CabinetMeta, DexCard } from '../../content/types';
import { apply } from '../../engine/matrix';
import type { Mat2, Vec2 } from '../../engine/types';
import type { Layout } from './layout';
import { arrowAt, CSS, ease, FONT_MONO, FONT_READ, glow, lerp, NEON } from './neon';
import type { Runner } from './runner';

const RULE_LABEL = { assist: 'with hints', partial: 'fewer hints', abstract: 'numbers only' } as const;
const SHAPE: Vec2[] = [[0, 0], [0.3, 0], [0.3, 0.55], [1, 0.55], [1, 1], [0, 1]];

const mono = (s: string, size: number, fill: string, weight: '500' | '700' | '800' = '700', glowOn = true) =>
  new Text({ text: s, style: { fontFamily: FONT_MONO, fontSize: size, fill, fontWeight: weight, align: 'center', dropShadow: glowOn ? { color: fill, blur: 10, distance: 0, alpha: 0.85 } : false } });
const read = (s: string, size: number, fill: string) =>
  new Text({ text: s, style: { fontFamily: FONT_READ, fontSize: size, fill, align: 'center', lineHeight: size * 1.45, wordWrap: true, wordWrapWidth: 520 } });

class Button extends Container {
  private bg = new Graphics();
  private caption: Text;
  constructor(text: string, private primary: boolean, onClick: () => void) {
    super();
    this.caption = mono(text, 15, primary ? CSS.bg : CSS.accent, '800', false);
    this.addChild(this.bg, this.caption);
    this.eventMode = 'static'; this.cursor = 'pointer';
    this.on('pointerdown', (e) => { e.stopPropagation(); onClick(); });
    this.draw();
  }
  setText(t: string) { this.caption.text = t; this.draw(); }
  private draw() {
    const w = Math.max(150, this.caption.width + 40), h = 46;
    this.bg.clear().roundRect(-w / 2, -h / 2, w, h, 12);
    if (this.primary) this.bg.fill({ color: NEON.target }); else this.bg.fill({ color: NEON.bg, alpha: 0.6 }).roundRect(-w / 2, -h / 2, w, h, 12).stroke({ width: 2, color: NEON.accent });
    this.caption.anchor.set(0.5);
  }
}

export interface HudCallbacks { onLock: () => void; onExit: () => void; onRetry: () => void; dex: () => { count: number; total: number; isNew: (c: string) => boolean } }

/** All in-game text and modals (pedagogical rules 1, 3, 5, 6, 7 and 8). Rendered in Pixi above the scene. */
export class Hud {
  readonly view = new Container();
  private score = mono('', 22, CSS.player); private combo = mono('', 20, CSS.accent); private info = mono('', 14, CSS.muted, '500', false);
  private lives = mono('', 24, CSS.j); private dex = mono('', 15, CSS.target);
  private banner = mono('', 19, CSS.accent); private mission = read('', 18, CSS.text); private check = mono('', 16, CSS.text, '700', false);
  private pop = mono('', 46, CSS.target, '800'); private sub = read('', 19, CSS.text);
  private caption = mono('', 18, CSS.text, '700', false); private hint = mono('', 13, CSS.dim, '500', false);
  private lockBtn: Button; private exitBtn: Button;
  // modal
  private modal = new Container(); private modalBg = new Graphics(); private anim = new Graphics();
  private kicker = mono('', 15, CSS.target); private title = mono('', 40, CSS.accent, '800'); private body = read('', 18, CSS.text);
  private goal = read('', 20, CSS.player); private cta = mono('', 17, CSS.target);
  private btnA: Button; private btnB: Button;
  private L!: Layout;

  constructor(private meta: CabinetMeta, private dexCards: DexCard[], private cb: HudCallbacks) {
    this.lockBtn = new Button('LOCK IN  [SPACE]', true, cb.onLock);
    this.exitBtn = new Button('← ARCADE  [ESC]', false, cb.onExit);
    this.btnA = new Button('RETRY', true, cb.onRetry);
    this.btnB = new Button('BACK TO ARCADE', false, cb.onExit);
    for (const t of [this.pop, this.sub, this.caption, this.hint, this.banner, this.mission, this.check, this.kicker, this.title, this.body, this.goal, this.cta]) t.anchor.set(0.5);
    this.lives.anchor.set(1, 0); this.dex.anchor.set(0.5, 0);
    this.modal.addChild(this.modalBg, this.anim, this.kicker, this.title, this.body, this.goal, this.cta, this.btnA, this.btnB);
    this.view.addChild(this.score, this.combo, this.info, this.lives, this.dex, this.banner, this.mission, this.check, this.pop, this.sub, this.caption, this.hint, this.lockBtn, this.exitBtn, this.modal);
  }

  layout(L: Layout) {
    this.L = L;
    const { w, h } = L;
    const narrow = w < 640;
    this.score.position.set(24, 16);
    this.lives.position.set(w - 24, 14);
    if (narrow) {
      this.dex.anchor.set(0, 0); this.dex.position.set(24, 46);
      this.info.position.set(24, 72); this.info.style.wordWrap = true; this.info.style.wordWrapWidth = w - 48; this.info.style.align = 'left';
      this.combo.position.set(24, 112); this.exitBtn.position.set(w - 96, 58); this.exitBtn.scale.set(0.8);
    } else {
      this.dex.anchor.set(0.5, 0); this.dex.position.set(w / 2, 14);
      this.combo.position.set(24, 46); this.info.position.set(24, 78); this.info.style.wordWrap = false;
      this.exitBtn.position.set(w - 110, 72); this.exitBtn.scale.set(1);
    }
    this.mission.position.set(w / 2, narrow ? 150 : 104); this.mission.style.wordWrapWidth = Math.min(760, w - 48);
    this.check.position.set(w / 2, narrow ? 196 : 138);
    this.lockBtn.position.set(120, h - 50);
    this.pop.position.set(w / 2, h * 0.42); this.sub.position.set(w / 2, h * 0.42 + 52); this.sub.style.wordWrapWidth = Math.min(700, w - 48);
    this.caption.position.set(w / 2, h - 52); this.caption.style.wordWrap = true; this.caption.style.wordWrapWidth = Math.min(900, w - 32); this.hint.position.set(w / 2, h - 20);
    const mw = Math.min(640, w - 32), mh = Math.min(400, h - 40), cx = w / 2, cy = h / 2;
    this.modalBg.clear().rect(0, 0, w, h).fill({ color: NEON.bg, alpha: 0.55 }).roundRect(cx - mw / 2, cy - mh / 2, mw, mh, 18).fill({ color: NEON.surface, alpha: 0.97 }).roundRect(cx - mw / 2, cy - mh / 2, mw, mh, 18).stroke({ width: 3, color: NEON.accent });
    this.modalBg.eventMode = 'static';
    this.kicker.position.set(cx, cy - mh / 2 + 30); this.title.position.set(cx, cy - mh / 2 + 74);
    this.body.position.set(cx, cy - 20); this.body.style.wordWrapWidth = mw - 60;
    this.goal.position.set(cx, cy + 66); this.goal.style.wordWrapWidth = mw - 60;
    this.cta.position.set(cx, cy + mh / 2 - 30);
    this.btnA.position.set(cx - 100, cy + mh / 2 - 44); this.btnB.position.set(cx + 110, cy + mh / 2 - 44);
  }

  private dexCard(concept: string) { return this.dexCards.find((c) => c.concept === concept); }

  update(r: Runner, clock: number, matrixPanel?: (L: Layout) => void) {
    const L = this.L; if (!L) return;
    const inPlay = r.phase === 'play';
    this.score.text = `SCORE ${r.run.score}`;
    this.combo.text = r.run.combo > 1 ? `COMBO ×${r.run.combo}` : '';
    this.info.text = `${this.meta.name.toUpperCase()} · WAVE ${r.run.waveIndex + 1} · ${RULE_LABEL[r.rule]}${inPlay ? ` · ⏱ ${r.secondsLeft.toFixed(1)}s` : ''}`;
    this.lives.text = '♥'.repeat(Math.max(0, r.run.lives)) + '♡'.repeat(Math.max(0, 3 - r.run.lives));
    const d = this.cb.dex(); this.dex.text = `TRANSFORM DEX ${d.count}/${d.total}`;
    // mission + checklist during play (rules 1 and 3)
    this.mission.visible = this.check.visible = inPlay;
    if (inPlay) {
      const name = this.dexCard(r.wave?.concept ?? '')?.name ?? '';
      this.mission.text = `${name ? name + ' · ' : ''}${r.goal}`;
      const list = r.checklist;
      this.check.text = list.map((c) => `${c.ok ? '✓' : '○'} ${c.label}`).join('      ');
      this.check.style.fill = list.length && list.every((c) => c.ok) ? CSS.target : CSS.text;
    }
    this.banner.visible = inPlay && !!r.banner && r.phaseClock < 6;
    this.banner.text = r.banner; this.banner.alpha = Math.min(1, 6 - r.phaseClock);
    this.banner.style.wordWrap = true; this.banner.style.wordWrapWidth = L.w - 32;
    this.banner.position.set(L.w / 2, L.w < 640 ? 238 : this.check.text ? 172 : 150);
    this.lockBtn.visible = inPlay && r.lockBonus === 0 && r.t < 0.97;
    this.lockBtn.alpha = 0.85 + 0.15 * Math.sin(clock * 6);
    // result pop
    const res = r.phase === 'result' && r.outcome;
    this.pop.visible = this.sub.visible = !!res;
    if (res) {
      const o = r.outcome!;
      this.pop.text = o.correct ? (r.lockBonus > 40 ? 'PERFECT!' : 'NICE!') : 'SMASH!';
      this.pop.style.fill = o.correct ? CSS.target : CSS.j;
      (this.pop.style.dropShadow as { color: string }).color = o.correct ? CSS.target : CSS.j;
      this.sub.text = o.correct ? `+${r.lastGain}${r.run.combo > 1 ? `   (combo ×${r.run.combo})` : ''}` : (o.diagnosis?.text ?? 'Missed!');
      this.pop.scale.set(1 + Math.max(0, 0.25 - r.phaseClock) * 2);
    }
    // replay caption (rule 5)
    this.caption.visible = this.hint.visible = r.phase === 'replay';
    if (r.phase === 'replay') {
      this.caption.text = (r.outcome && !r.outcome.correct ? 'Watch the right move.  ' : '') + r.caption;
      this.hint.text = r.replayK >= 1 ? 'CLICK / SPACE TO CONTINUE' : 'click / SPACE to skip';
      this.hint.style.fill = r.replayK >= 1 ? CSS.target : CSS.dim;
      this.hint.alpha = r.replayK >= 1 ? 0.6 + 0.4 * Math.sin(clock * 5) : 1;
    }
    matrixPanel?.(L);
    this.updateModal(r, clock);
  }

  private updateModal(r: Runner, clock: number) {
    const show = r.phase === 'brief' || r.phase === 'card' || r.phase === 'over' || r.phase === 'done';
    this.modal.visible = show;
    if (!show) return;
    const L = this.L;
    this.anim.clear();
    this.goal.visible = this.cta.visible = this.btnA.visible = this.btnB.visible = false;
    if (r.phase === 'brief') {
      const concept = r.wave?.concept ?? '';
      const card = this.dexCard(concept);
      const isNew = this.cb.dex().isNew(concept);
      this.kicker.text = `WAVE ${r.run.waveIndex + 1}${r.isDrill ? '  ·  TRAINING' : ''}${r.boss ? '  ·  BOSS' : ''}${isNew ? '  ·  NEW CONCEPT' : ''}`;
      this.title.text = card?.name ?? concept.toUpperCase();
      this.body.text = r.banner && (r.isDrill || r.boss || r.banner.startsWith('NEW RULE')) ? `${r.banner}\n\n${card?.body ?? ''}` : card?.body ?? '';
      this.goal.text = r.goal; this.goal.visible = true;
      this.cta.text = 'CLICK / SPACE — GO!'; this.cta.visible = true;
      this.cta.alpha = r.phaseClock > 0.25 ? 0.55 + 0.45 * Math.sin(clock * 5) : 0;
    } else if (r.phase === 'card' && r.card) {
      this.kicker.text = 'NEW TRANSFORM UNLOCKED';
      this.title.text = r.card.name;
      this.body.text = r.card.body;
      this.drawDemo(r.card.demo, r.phaseClock, [L.w / 2, L.h / 2 + 70]);
      this.cta.text = 'CLICK TO CONTINUE'; this.cta.visible = true; this.cta.alpha = r.phaseClock > 0.5 ? 0.55 + 0.45 * Math.sin(clock * 5) : 0;
      this.body.position.set(L.w / 2, L.h / 2 - 50);
    } else {
      const done = r.phase === 'done';
      this.kicker.text = done ? 'BADGE EARNED' : `WAVE ${r.run.waveIndex + 1}`;
      this.title.text = done ? 'CABINET CLEARED' : 'GAME OVER';
      this.body.text = `Score ${r.run.score}\n\n${this.meta.notion}`;
      this.btnA.visible = this.btnB.visible = true;
      this.btnA.setText(done ? 'PLAY AGAIN' : 'RETRY');
    }
    if (r.phase !== 'card') this.body.position.set(L.w / 2, L.h / 2 - 20);
  }

  private drawDemo(m: Mat2, t: number, o: Vec2) {
    const g = this.anim, u = 26;
    const k = ease(((t % 2.6) - 0.4) / 1.3);
    const mm: Mat2 = [[lerp(1, m[0][0], k), lerp(0, m[0][1], k)], [lerp(0, m[1][0], k), lerp(1, m[1][1], k)]];
    const P = (p: Vec2): Vec2 => { const q = apply(mm, p); return [o[0] + q[0] * u, o[1] - q[1] * u]; };
    for (let q = -2; q <= 2; q++) { const a = P([q, -2]), b = P([q, 2]), c = P([-2, q]), d = P([2, q]); g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).moveTo(c[0], c[1]).lineTo(d[0], d[1]); }
    g.stroke({ width: 1, color: NEON.violet, alpha: 0.5 });
    const pts = SHAPE.map(P);
    g.poly(pts.flat()).fill({ color: NEON.player, alpha: 0.3 }); glow(g, pts, NEON.player, 2, true);
    arrowAt(g, P([0, 0]), P([1, 0]), NEON.i, 3); arrowAt(g, P([0, 0]), P([0, 1]), NEON.j, 3);
  }
}
