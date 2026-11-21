# DESIGN.md — Linear Arcade

Direction: **Neon Grid** — a dark arcade hall at night. Light only comes from things that *mean* something: the arrows, the target, the player. Everything else is dark glass and thin violet lines. Calm when you read, loud when you play.

> Not based on a UXKIN comparison (not connected for this project). Decisions come from the validated prototype `docs/prototypes/hole-in-the-wall.html` and the rules below.

## 1. Color — dark only

Every color has one job. Glow is reserved for meaning; never decorate with it.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#05030f` | page and game background |
| `--surface` | `#0e0a24` | panels: course text, Dex card, briefing |
| `--surface-2` | `#16113a` | raised items: cabinet tiles, inputs, hover |
| `--line` | `#2e2a7a` | borders, grid lines, separators |
| `--line-soft` | `#6366f1` @ 35% | perspective floor, faint grid |
| `--text` | `#e0e7ff` | body and headings (≈15:1 on bg) |
| `--text-muted` | `#a5b4fc` | secondary text, captions, tick labels (≈9:1) |
| `--text-dim` | `#8b8fc7` | disabled, hints (≥4.5:1) |
| `--i` | `#4ade80` | **î, u, column 1** — nothing else is green |
| `--j` | `#f87171` | **ĵ, v, column 2**; also errors (they never appear together on the same element) |
| `--target` | `#fde047` | the goal: holes, targets, primary call-to-action, XP |
| `--player` | `#22d3ee` | what the player controls / owns: their shape, score, focus ring |
| `--accent` | `#f0abfc` | arcade chrome: titles, cabinet frames, "NEW RULE" banners |
| `--danger` | `#f87171` | lives, SMASH, destructive buttons (reset) |
| `--success` | `#4ade80` | ✓ checklist, PERFECT |

Rules
- Never put two glowing colors side by side on chrome; one glow per component.
- No gradients on text, no purple→blue backgrounds. The only gradient allowed is the horizon sun in the game scene.
- Mastery gauges and XP bars use `--target` on `--surface-2`.

## 2. Typography

Two families, both from Google Fonts:

- **JetBrains Mono** (500, 700, 800) — the arcade voice: titles, HUD, buttons, numbers, matrices, coordinates. Always tabular, never italic.
- **Atkinson Hyperlegible** (400, 700) — the teacher's voice: course text, briefings' explanation lines, Dex body. Built for readability; used only for sentences.

| Token | Size / line-height | Family · weight | Use |
|---|---|---|---|
| `--fs-display` | 56 / 1.05 | Mono 800, uppercase, tracking .04em | title screen, GAME OVER |
| `--fs-h1` | 36 / 1.15 | Mono 800, uppercase | cabinet name, Dex card name |
| `--fs-h2` | 24 / 1.25 | Mono 700 | course step title |
| `--fs-lead` | 20 / 1.5 | Atkinson 400 | course text (body of learning) |
| `--fs-body` | 17 / 1.55 | Atkinson 400 | Dex body, remedial text |
| `--fs-ui` | 15 / 1.3 | Mono 700, uppercase, tracking .06em | buttons, HUD labels, banners |
| `--fs-small` | 13 / 1.35 | Mono 500 | tick labels, captions, "click to skip" |

Course text width: max 62ch. Numbers and coordinates are always in Mono, even inside Atkinson sentences (`<code class="coord">(2, 1)</code>`).

## 3. Spacing

8-based scale: `--s1 4px` · `--s2 8px` · `--s3 12px` · `--s4 16px` · `--s5 24px` · `--s6 32px` · `--s7 48px` · `--s8 64px`.
Page gutter 16px on phones, 32px from 768px. Content max width 1200px. The course screen is a 2-column layout (text 5fr | scene 7fr) above 900px, stacked below.

## 4. Shape and depth

- Radius: `--r-sm 6px` (chips, inputs) · `--r-md 12px` (buttons, panels) · `--r-lg 18px` (cards, briefing). Cabinet tiles use `--r-md` with a 2px frame.
- No drop shadows. Depth = **glow** and **frames**:
  - `--glow-sm`: `0 0 8px` of the component's meaning color at 60%
  - `--glow-lg`: `0 0 24px` at 45% — only on the one thing that needs attention now (current cabinet, PLAY, LOCK IN).
- Borders 1px `--line`; framed chrome 2px in `--accent`.

## 5. Components

**Arcade button**
- Primary: `--target` background, `--bg` text, Mono 700 uppercase, 48px tall, `--r-md`. Hover: lift 1px + `--glow-sm` yellow. Active: press 1px. Focus: 2px `--player` ring offset 3px. Disabled: `--surface-2` bg, `--text-dim` text, no glow.
- Secondary: transparent, 2px `--accent` frame, `--accent` text. Hover: `--surface-2` fill.
- Quiet: text only, `--text-muted`, underline on hover.
- Danger: like secondary in `--danger`; always asks for confirmation.

**Cabinet tile (map)** — 132×176, `--surface` body, a "screen" inset (`--bg`, 1px `--line`) with the cabinet's line-icon (SVG, 2px strokes, no emoji), name in Mono 700 uppercase below.
- locked: 45% opacity, lock glyph, no glow.
- open: `--player` frame.
- current/suggested: `--accent` frame + `--glow-lg` + "▶ PLAY" in `--target`, gentle 2s pulse.
- mastered: `--player` frame with a hollow badge outline.
- finished: badge filled in `--target`.

**Course panel** — `--surface`, `--r-lg`, padding `--s6`. Step indicator as small Mono dots (`●●○○`). Title h2, text in Atkinson lead, theme example in a left-bordered (`--accent`) quote. The check question sits below the scene, never hidden behind scroll on desktop.

**Dex card** — `--surface`, 3px `--target` frame, `--r-lg`. Kicker "NEW TRANSFORM UNLOCKED" in Mono small `--target`; name h1 `--accent`; looped mini animation; body in Atkinson; key coordinates in Mono `--text-muted`.

**HUD (in game, PixiJS)** — Mono only. Score `--player`, combo `--accent`, lives `--danger` (♥), Dex counter `--target`. Matrix: brackets `--text`, column 1 `--i`, column 2 `--j`. Mission line `--text`, checklist ✓ in `--success`. Banners centered, `--accent`, stay ≥ 3s.

**Briefing / modal** — centered, `--surface` 95%, 3px `--accent` frame, `--r-lg`; always closed by the player (click / SPACE), CTA pulses only after 0.4s.

**Inputs** (profile choices, sliders) — large choice tiles (min 64px tall) with 2px `--line` frame; selected = `--player` frame + `--glow-sm`. Sliders: track `--surface-2`, thumb `--target`.

## 6. Motion

- UI transitions (Motion): fade + 12px slide, 250ms, ease-out. No bounce on text.
- Game feedback: particles, flash (≤ 0.35 opacity), shake (≤ 0.45s). Reveal/replay interpolations ease-out cubic.
- Respect `prefers-reduced-motion`: no shake, no flash, halve particle count, keep interpolations.

## 7. Imagery and icons

- Icons: hand-made SVG line icons, 2px stroke, square caps, in the component's meaning color. **No emoji as icons**, no icon font.
- Rewind's pictures are simple vector scenes (mountains, city, face) drawn in the palette — no photos.
- The horizon sun with stripes appears only in game scenes, never on reading screens.
