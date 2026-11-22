<p align="center">
  <img src="public/favicon.svg" width="88" alt="Arcade Algebra logo: a joystick pushed off its rest position" />
</p>

<h1 align="center">Arcade Algebra</h1>

<p align="center">
  <b>Learn linear algebra from scratch by playing seven neon arcade games.</b><br />
  No chatbot. A game that keeps a picture of what you know, and teaches from the gaps.
</p>

Built at **LauzHack 2026** for the **Scholé** challenge: a learning experience that adapts to the learner, without being a chatbot.

Arcade Algebra aims for deep, concrete understanding, not exam drills. You bend the plane with your own hands, and you prove you understood by **predicting before you see**. In France linear algebra is not taught in high school, so the game starts from zero and goes as far as eigenvectors.

---

## Contents

1. [The seven games](#the-seven-games)
2. [How a game teaches](#how-a-game-teaches)
3. [How it adapts to you](#how-it-adapts-to-you)
4. [The learner model](#the-learner-model)
5. [How it answers the Scholé challenge](#how-it-answers-the-schol%C3%A9-challenge)
6. [Run it](#run-it)
7. [Write content (no code needed)](#write-content-no-code-needed)
8. [Under the hood](#under-the-hood)
9. [Honest limits](#honest-limits)
10. [Team](#team)

---

## The seven games

The games sit on **The Grid**, a neon world map. Each zone lost one rule of space, and you repair it by understanding it. **VEX**, a small guide robot, tells the story and comments on what you do. It only says lines written in advance and triggered by the game (it never answers free text), two sentences at most.

| # | Game | Idea | You… |
|---|---|---|---|
| 1 | Vector Golf | vectors, addition | chain vector shots around walls to the flag, then swing the club |
| 2 | Two-Thruster Drone | linear combinations, span | mix two thrusters `a·u + b·v`, or spot that a target is unreachable |
| 3 | Constellation | a matrix = where î and ĵ land | move î and ĵ until the warped grid lights every star |
| 4 | Machine Factory | composition | put transformation machines on a belt in the right order |
| 5 | Squash! | determinant | bet on how the press scales the area, and whether it flips it |
| 6 | Rewind | inverse | build the move that un-warps a picture, or say it can't be repaired |
| 7 | Laser Lab | eigenvectors | aim a laser so the lens doesn't turn it |

Each game opens the next one: clear its boss, or show that you already master it.

## How a game teaches

**A short course that is the game itself.** Each lesson's scene is the replay of a real wave of that game, and "Your turn" is a real wave you play, untimed, with the aids on. A few concept questions stay as prediction questions. The title screen is an attract mode: the games take turns replaying a wave, like machines waiting for players.

**The same 8 rules in every game:**

1. **A brief before each wave**: the concept, plus the mission written in coordinates.
2. **Coordinates everywhere**: graduated axes, live coordinates on every arrow and target.
3. **A live checklist** during the wave.
4. **The help fades in three tiers**, then a boss: first with visual aids, then fewer aids, then the abstract representation only (just the matrix or the numbers). You must predict. The boss is always at the hardest rule, on cases you have not seen.
5. **A replay after each wave**, rebuilding the right answer step by step with a caption. It waits for your click.
6. **Mistakes are named, then trained**: the error is diagnosed (swapped columns, wrong sign, wrong order, det = 0, …) and the next wave is a drill on that error.
7. **The Transform Dex**: a collectible card for each new concept.
8. **The arcade loop**: five lives, score, combos, an early lock-in bonus, sound and effects. The first wave of a run has no clock.

## How it adapts to you

You never type a prompt. Everything below happens from what you choose and how you answer.

- **Profile.** High school or university sets the pace of the lessons. A theme (**games, physics or sport**) sets the examples and missions: the same wave is told as a game quest, a physics push or a pass to a teammate.
- **A short placement test.** It is a binary search along the chain of games: about three games asked out of seven, two probes each, about **7 questions** in all. Every question is open (a played wave, a point, arrows or a number): nothing can be passed by luck, and one slip is forgiven with a spare question. Passing a game also unlocks the ones before it; only the games actually passed are placed. A placed game keeps a single review lesson (the robot says how many it skipped) and its game starts one tier up. You can skip the test: it keeps the answers already given.
- **A hint ladder in "Your turn".** 1st miss: the mistake is named. 2nd: a targeted hint (the remedial lesson for that mistake) and the wave again with the aids. 3rd: the replay of the right answer, then a training wave on that mistake, which you must pass to go on. A first-try success makes the next lesson short.
- **Tiers that wait for you.** The help only fades when the concepts you have met are known well enough (a few waves of delay at most, so nobody is stuck). After a lost run, you restart one tier below your best one, not from the aids.
- **The next wave depends on you.** The wave picker favours concepts that are weak, uncertain or long unseen, and brings a new concept sooner when you already know the last one.
- **Memory of your mistakes.** Every diagnosed mistake is counted, in lessons and games, and saved. A mistake that keeps coming back returns as a training wave in later sessions, and VEX reminds you of it when you open a game that trains it. A training wave you win halves it.
- **Warm-up.** From the second game on, the course starts with one wave from an earlier open game, aimed at your most frequent mistake or your weakest game. One try, skippable.
- **A dynamic pace.** Two misses in a row suggest more guidance; three first-try wins suggest a faster pace. Always proposed, never imposed.

## The learner model

Every answer, in a lesson or in a game, is **evidence about one concept**. The game keeps a belief per concept and shows it to you, with how sure it is.

- **Mastery is a probability with its uncertainty.** Each concept has a Beta belief. The page **My knowledge** shows "64% ± 12" per concept and per game, with a bar and an uncertainty band that narrows as evidence comes in.
- **Evidence is weighted.** A win with the aids on says little; a win with only the numbers says the most. A miss under the aids says a lot. Old evidence fades, so early mistakes do not weigh forever.
- **"Mastered" has to be earned.** A game counts as mastered when its estimate is high enough **and** you won at least twice with no help. Clearing the boss also opens the next game.
- **Weak spots become targets.** The "next target" is the concept that needs work most. It is the same measure the wave picker uses, so what you see is what you will train.
- **A proof of learning, not just fun.** At the end of each game there is a **transfer check**: new cases generated on the spot, never a lesson question, with no help, no clock and no feedback until the end. It only asks open questions (a point, arrows, a number), so it cannot be guessed. The result shows your estimate before and after, and the mistakes to train. A check across all the games you have worked on is also available from the map.

## How it answers the Scholé challenge

| What the challenge asks | What Arcade Algebra does |
|---|---|
| **No chatbot** | Everything is written in advance and triggered by the game. The robot never answers free text. |
| **The lesson changes with who the learner is** | Profile (level and theme), placement test, per-concept belief. |
| **...with what they choose** | Theme, pace, order on the map, "Skip to the game". |
| **...with how they are doing** | Named mistakes, hint ladder, training waves, tiers that wait, a wave picker driven by weak concepts. |
| **A diagnostic to start** | The ~7-question adaptive placement test. |
| **Every graded activity is evidence, tagged to a competency** | Lesson questions, lesson waves, game waves and the transfer check all update the same per-concept belief. |
| **A score with honest uncertainty** | "64% ± 12", and mastery that needs wins with no help. |
| **Weak topics become targets** | "Next target", recurring-mistake training, the warm-up. |
| **Did they learn, or just enjoy?** | The transfer check: new cases, no help, estimate before and after. |
| **Usable without explanations** | One idea per game, the mission written in coordinates, a robot that guides, a short course that is the game. |

## Run it

You need Node.js 20.19 or later (22 recommended).

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine, content and game logic
npm run build    # type-check, then a production build in dist/
```

Everything runs in the browser, with no server. Progress is saved in `localStorage`; "Reset progress" is at the bottom of the map.

Handy for testing, in `npm run dev` only: press **Shift + C** in a game to count its boss as cleared and jump to the end screen, then open its transfer check. Direct links: `#/transfer`, `#/transfer/<game>`, `#/diagnostic`, `#/knowledge`.

## Write content (no code needed)

All lessons, waves, drills and Dex cards are JSON files in `content/`. See [`content/README.md`](content/README.md) for the format. Bad files are reported on the arcade screen, and the other games keep working. The tests check that every wave and every question has a solution.

## Under the hood

- **Stack**: Vite, React, TypeScript, PixiJS v8 for the games, Motion for transitions, KaTeX for the maths, and Vitest for the tests.
- **Engine** (`src/engine/`): pure and tested. 2×2 maths, error diagnosis, wave selection, progression and storage; the adaptivity rules (`adapt.ts`: hint ladder, error memory, warm-up pick, lesson plan, start tier); the learner model (`belief.ts`) and the views built on it (`insight.ts`).
- **Placement and transfer** (`src/content/diagnostic.ts`, `src/content/transfer.ts`): the binary-search placement as a pure state machine, and the generators of new questions for the transfer check, one per game.
- **Arcade stage** (`src/arcade/kit/ArcadeStage.tsx`): mounts one game in PixiJS and drives it three ways: a full run, a looping replay (a lesson scene, the attract mode) or one untimed wave ("Your turn"). The drivers are pure. PixiJS is loaded on demand, so the text of every screen shows before it arrives.
- **Games** (`src/arcade/cabinets/<id>/`): each one only provides its own mechanic, through the same `CabinetGame` interface.
- **Screens** (`src/screens/`): title, profile, map, course, play, placement test, transfer check and "My knowledge".
- **Design**: the visual rules are in [`DESIGN.md`](DESIGN.md) ("Neon Grid"). The validated gameplay prototype is in `docs/prototypes/hole-in-the-wall.html`.

```
content/        lessons, waves, drills, Dex cards, robot lines (JSON)
src/engine/     pure logic: maths, diagnosis, waves, learner model
src/content/    content loading and validation, placement, transfer questions
src/arcade/     the PixiJS stage, the games and their kit
src/screens/    the pages
src/ui/         shared components (map, robot, lesson player, learner report)
tests/          unit tests for the engine, the content and the games
```

## Honest limits

- **The learner model has not been calibrated on real learners yet.** Its weights and thresholds were tuned against simulated students (novice, expert, guesser, aid-dependent, persistent mistake), not against people. They are the first thing to adjust after real play.
- **The placement test can be fooled a little.** A learner who guesses a lot can open a game by luck; the boss and the transfer check catch almost all of them.
- **The theme only changes the examples and missions** shown in the lessons, not the waves themselves.
- Touch, sound and screen readers have not been tested on real devices.

## Team

Built in one weekend at LauzHack 2026 by [Camil Mechta](https://github.com/camilmechta), [Massimo Binetruy](https://github.com/GuizmoU) and [Gabriel Plasse](https://github.com/Cosmoswisss).
