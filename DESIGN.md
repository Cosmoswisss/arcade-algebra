# DESIGN.md: Linear Arcade, "Neon Grid"

The game is an arcade hall at night. Dark glass, thin bright lines, a perspective grid. The look serves one job:
**make coordinates and shapes readable**. Everything decorative is secondary to the plane, the arrows and the numbers.

## 1. Principles

1. **Lines, not blobs.** Hairline strokes and glow on active things only. No big gradients, no blur panels.
2. **Color carries meaning.** î is green, ĵ is red, the target is yellow, the player is cyan. Never reuse these colors for decoration.
3. **Numbers are first-class.** Coordinates and matrices are set in the mono face, always visible, never faded out before they can be read.
4. **Each cabinet is different.** Each has its own silhouette, marquee glyph and accent. No row of identical cards.
5. **Waiting is a feature.** Briefings, replays and cards wait for a click or SPACE. Nothing disappears in under 3 s.

### What would make it look machine-made (do not ship)
- Purple-to-blue gradients on everything, neon blobs behind text, glassmorphism.
- Emoji as icons. Use the SVG glyphs in `src/ui/icons.tsx` (stroke 1.75, 24 px grid).
- Three equal cards in a row with an icon on top, a title and two lines of filler.
- Centered hero with a vague claim ("Unlock your potential"). Say what the thing does, with a number or a coordinate.
- Everything rounded 16 px. Arcade hardware is cut: use 2 px radii and chamfered corners (`clip-path`).

## 2. Color

| Token | Value | Use |
|---|---|---|
| `--ink` | `#05030f` | page and canvas background (fixed) |
| `--panel` | `#0e0a24` | panels, briefing, cards |
| `--panel-2` | `#16103a` | raised panel, hover |
| `--line` | `#2b2260` | hairlines, grid lines in UI |
| `--grid` | `#6366f1` | the plane's grid and axes (violet) |
| `--text` | `#e0e7ff` | body text |
| `--dim` | `#a5b4fc` | secondary text, tick labels |
| `--pink` | `#f0abfc` | accent, brand, new-rule banners (fixed) |
| `--cyan` | `#22d3ee` | the player's shape (fixed) |
| `--yellow` | `#fde047` | the target, rewards, the key action (fixed) |
| `--green` | `#4ade80` | î and u (fixed) |
| `--red` | `#f87171` | ĵ and v, errors, lives (fixed) |

Contrast: `--text` on `--ink` is 15:1, `--dim` on `--ink` is 8.4:1, `--ink` on `--yellow` is 15:1. Minimum body contrast 4.5:1.
Glow = the same color at 6% / 16% / 100% alpha strokes of width 5x / 2.4x / 1x (see `src/arcade/kit/neon.ts`).

## 3. Type

| Role | Family | Use |
|---|---|---|
| Display | **Chakra Petch** 600 (angular, technical) | titles, marquees, buttons |
| Text | **IBM Plex Sans** 400/500/600 | course text, labels: highly readable |
| Numbers | **JetBrains Mono** 500/700 | coordinates, matrices, HUD, score |

Self-hosted through `@fontsource` (no network). Scale (px / line-height): 12/16 caption, 14/20 small, 16/26 body, 20/28 lead,
28/34 title, 44/48 display. Body text lines are at most 68 characters. Mono is used for anything the player must read as a number.

## 4. Space, shape, depth
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72.
- Radius: 2 px. Panels have a **chamfered top-left corner** (10 px). Pills only for status chips.
- Depth is a 1 px `--line` border plus, for the active thing, a colored glow (`0 0 0 1px color, 0 0 18px color/35%`). No drop-shadows under cards.
- The page background is `--ink` with a faint perspective floor (the same one as in the game) fixed at the bottom, 18% opacity.

## 5. Components

**Arcade button.** Three kinds. *Primary*: yellow face, ink text, chamfered, a 3 px darker bottom edge that compresses on press.
*Secondary*: 1 px `--line` border, text color, pink border on hover. *Ghost*: text only, underline on hover. Focus: 2 px `--pink` outline offset 3 px (never removed).
Disabled: 40% opacity and no glow.

**Cabinet (hall).** A tall SVG machine with a marquee on top (glyph and name), a screen and a coin slot. Four states:
*locked* (unlit, padlock), *open* (screen glows in its accent), *current / recommended* (pink border and "PLAY" tag, gentle pulse), *finished* (badge on the marquee).
Each cabinet has its own silhouette and glyph; accents rotate pink, cyan, yellow and violet. Number of the cabinet is always shown.

**Course panel.** Two columns on desktop: text (max 68ch) left, live scene right. The step progress is a row of 3 to 5 ticks. The prediction question sits under the scene.
On mobile the scene goes first.

**Dex card.** Chamfered, 3:4, a looping mini-scene on top, the concept name in Display, two sentences, the key coordinates in mono. Locked cards show a dashed outline and "???".

**HUD (in game).** Top bar: score, combo, wave and rule, lives (SVG hearts), Dex count. Mission and live checklist centered under it. The matrix readout bottom right in mono.

**Banner "NEW RULE".** Full-width strip, pink text on `--panel`, 1 px pink line above and below, stays at least 4 s.

**Status chip / meter.** Mono text, 1 px border, 2 px radius. Meters are 6 px tall with a hard end (no rounded caps).

## 6. Motion
- Screen changes: 250 ms fade and 12 px slide (Motion). Respect `prefers-reduced-motion`: no slide, no pulse, no shake.
- In-game juice (shake, flash, particles) is switched off under reduced motion; sound has its own mute toggle.
- Pulses are slow (1.6 s). Nothing flashes faster than 3 times per second.

## 7. Layout and responsive
- Desktop: content max-width 1120 px, 12 columns, 24 px gutters. Tablet and phone: single column, 16 px side padding.
- Game canvas fills the viewport; HUD text scales with the shorter side. At 375 px the briefing must fit without scrolling and handles must be at least 44 px to grab.
- `touch-action: none` on the canvas only.

## 8. Accessibility
- All interactive text meets 4.5:1. Never rely on color alone: î/ĵ are also labeled "î" and "ĵ" and in the checklist.
- Everything reachable by keyboard outside the canvas. In game: SPACE = lock in / continue, arrows nudge the selected handle by one snap step, Tab cycles handles.
- Course scenes and the hall have text alternatives (`aria-label`). The canvas has a live region that announces the mission and the result.
- Text never disappears in under 3 s. Briefing, replay and cards wait for the player.

## 9. Voice
English, short, concrete. Say coordinates, not adjectives: "send î to (1.5, 0)", not "stretch it a bit".
Errors name the mistake: "You swapped î and ĵ: column 1 is where î lands."

## 10. Review checklist (use before shipping a screen)
- [ ] Could this screen belong to any other product? If yes, add something specific to linear algebra (a coordinate, a matrix, a grid).
- [ ] Is every number readable in mono at its size?
- [ ] Is there a visible focus ring on every control?
- [ ] Are cabinets visibly different from each other?
- [ ] No emoji, no default gradients, no equal-card rows.
