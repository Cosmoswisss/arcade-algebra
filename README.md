# Linear Arcade

**Learn linear algebra from scratch by playing seven neon arcade cabinets.**
Built at LauzHack 2026 for the Scholé challenge: a learning experience that adapts to the learner, with no chatbot.

Linear Arcade aims for deep, concrete understanding rather than exam drills. You bend the plane with your own hands, and you prove you understood by **predicting before you see**.

## The arcade

| # | Cabinet | Idea | You… |
|---|---|---|---|
| 1 | Vector Golf | vectors, addition | chain vector shots around walls into the hole |
| 2 | Two-Thruster Drone | linear combinations, span | mix two thrusters `a·u + b·v`, or spot that a target is unreachable |
| 3 | Hole in the Wall | a matrix = where î and ĵ land | warp your shape with î and ĵ before the wall hits |
| 4 | Machine Factory | composition | put transformation machines on a belt in the right order |
| 5 | Squash! | determinant | bet on how the press scales the area, and whether it flips it |
| 6 | Rewind | inverse | build the move that un-warps a picture, or say it can't be repaired |
| 7 | Laser Lab | eigenvectors | aim a laser so the lens doesn't turn it |

Every cabinet starts with a **short course**: three screens of text, a scene to watch and play with, and a prediction question. A wrong answer opens a **remedial lesson** built around that exact mistake.

## How it adapts (the same 8 rules in every cabinet)

1. **A brief before each wave**: the concept, plus the mission written in coordinates.
2. **Coordinates everywhere**: graduated axes, live coordinates on every arrow and target.
3. **A live checklist** during the wave.
4. **The help fades in three tiers**: first with visual aids, then fewer aids, then the abstract representation only (just the matrix or the numbers). You must predict.
5. **A replay after each wave**, rebuilding the right answer step by step with a caption. It waits for your click.
6. **Mistakes are named**, then trained: the error is diagnosed (swapped columns, wrong sign, wrong order, det = 0, …) and the next wave is a drill on that error.
7. **The Transform Dex**: a collectible card for each new concept.
8. **The arcade loop**: lives, score, combos, an early lock-in bonus, sound and effects. The pace is slow at first.

The learner also shapes the experience without typing anything:
- **Profile**: high school or university. This sets a guided or fast mode.
- **Theme for the examples**: games, physics or AI.
- **Placement test**: opens the cabinets you already master.
- **Mastery per cabinet**: a simplified Bayesian Knowledge Tracing model.
- **A dynamic mode**: two misses in a row suggest more guidance; three first-try wins suggest a faster pace.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine, content and cabinet logic
npm run build
```

## Write content (no code needed)

All lessons, waves, drills and Dex cards are JSON files in `content/`. See [`content/README.md`](content/README.md) for the format. Bad files are reported on the arcade screen, and the other cabinets keep working.

## Under the hood

- **Stack**: Vite, React, TypeScript, PixiJS v8 for the cabinets, Motion for transitions, KaTeX for the maths, and Vitest for the tests.
- **Engine**: `src/engine/` is pure and tested. It covers 2×2 maths, error diagnosis, wave selection, progression and storage.
- **Arcade kit**: `src/arcade/kit/` is shared by all cabinets. It holds the runner state machine, the neon rendering, sound, effects and the HUD.
- **Cabinets**: each cabinet in `src/arcade/cabinets/<id>/` only provides its own mechanic.
- **Design**: the visual rules are in [`DESIGN.md`](DESIGN.md). The validated gameplay prototype is in `docs/prototypes/hole-in-the-wall.html`.
