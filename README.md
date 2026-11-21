# Linear Arcade

**Learn linear algebra from scratch by playing seven neon arcade cabinets.**
Built at LauzHack 2026 for the Scholé challenge: a learning experience that adapts to the learner, with no chatbot.

Linear Arcade aims for deep, concrete understanding rather than exam drills. You bend the plane with your own hands, and you prove you understood by **predicting before you see**.

## The arcade

| # | Cabinet | Idea | You… |
|---|---|---|---|
| 1 | Vector Golf | vectors, addition | chain vector shots around walls to the flag, then swing the club |
| 2 | Two-Thruster Drone | linear combinations, span | mix two thrusters `a·u + b·v`, or spot that a target is unreachable |
| 3 | Constellation | a matrix = where î and ĵ land | move î and ĵ until the warped grid lights every star |
| 4 | Machine Factory | composition | put transformation machines on a belt in the right order |
| 5 | Squash! | determinant | bet on how the press scales the area, and whether it flips it |
| 6 | Rewind | inverse | build the move that un-warps a picture, or say it can't be repaired |
| 7 | Laser Lab | eigenvectors | aim a laser so the lens doesn't turn it |

The seven cabinets sit on **The Grid**, a neon world map: each zone lost one rule of space, and you repair it by understanding it. **VEX**, a small guide robot, tells the story and comments on what you do. It only says lines written in advance and triggered by the game (it never answers free text), two sentences at most.

Every cabinet starts with a **short course that is the game itself**: each lesson's scene is the replay of a real wave of that cabinet, and "Your turn" is a real wave you play, untimed, with the aids on. A few concept questions stay as prediction questions. The title screen is an **attract mode**: the cabinets take turns replaying a wave, like machines waiting for players.

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
- **Profile**: high school or university (a guided or fast pace), and a theme for the examples and missions: **games, physics or sport**. The same wave is told as a game quest, a physics push or a pass to a teammate.
- **Placement test that counts**: it plays the last lesson of cabinets 1 to 5 at the hardest rule, one try each. A cabinet you pass opens as mastered, its course keeps a single review lesson (the robot says how many it skipped), and its game starts one rule up. Skipping the test keeps the answers already given.
- **Hint ladder in "Your turn"**: 1st miss, the mistake is named; 2nd, a targeted hint (the remedial lesson for that mistake) and the wave again with the aids; 3rd, the replay of the right answer, then a training wave on that mistake, which you must pass to go on. A first-try success makes the next lesson short.
- **Memory of your mistakes**: every diagnosed mistake is counted, in lessons and cabinets. When you open a cabinet that trains your most frequent one, VEX reminds you of it.
- **Warm-up**: from the second cabinet on, the course starts with one wave from an earlier open cabinet, aimed at your most frequent mistake or at your weakest cabinet. One try, skippable, counted in that cabinet's mastery.
- **Mastery per cabinet**: a simplified Bayesian Knowledge Tracing model, fed by the lessons and the cabinets alike.
- **A dynamic mode**: two misses in a row suggest more guidance; three first-try wins suggest a faster pace. Always proposed, never imposed.

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
- **Engine**: `src/engine/` is pure and tested. It covers 2×2 maths, error diagnosis, wave selection, progression and storage, and the adaptivity rules (`adapt.ts`: hint ladder, error memory, warm-up pick, lesson plan, start tier).
- **Arcade stage**: `src/arcade/kit/ArcadeStage.tsx` mounts one cabinet game in PixiJS and drives it three ways: a full run (the cabinet), a looping replay (a lesson scene, the attract mode) or one untimed wave ("Your turn"). The drivers are pure (`drivers.ts`). PixiJS is loaded on demand (`LazyStage` in `src/arcade/playable.ts`), so the text of every screen shows before it arrives.
- **Cabinets**: each cabinet in `src/arcade/cabinets/<id>/` only provides its own mechanic, through the same `CabinetGame` interface.
- **Content**: lessons, waves, drills, Dex cards, zone stories and the robot's lines are JSON in `content/`, validated at load time and tested (every wave and question has a solution, every robot line is two sentences at most).
- **Design**: the visual rules are in [`DESIGN.md`](DESIGN.md). The validated gameplay prototype is in `docs/prototypes/hole-in-the-wall.html`.
