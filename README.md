# Linear Arcade

An interactive game for learning linear algebra from scratch, built for LauzHack 2026 (Scholé challenge).

**Grab the arrows. Bend the plane. Discover what a matrix really is.**

You drag the tips of the two basis arrows, î (green) and ĵ (red), and the whole grid warps with them. The matrix next to the grid writes itself as you move: column 1 is where î lands, column 2 is where ĵ lands.

## How it adapts to the learner

- **It names your mistake.** When you press **Check** and miss, the game freezes your grid, draws the correct one as a dashed ghost, and tells you which mistake you made: swapped î and ĵ, a flipped arrow, the wrong size, only one arrow wrong, or the wrong order of moves.
- **It suggests practice on that mistake.** **Practice this** opens a level built around exactly that mistake.
- **It estimates your mastery of each skill.** Every attempt updates a probability per skill, using simplified Bayesian Knowledge Tracing. A success that needed hints counts for less.
- **It suggests what to play next.** The suggested level is your weakest skill whose earlier skills you have already mastered. You can still play any level you like.
- **Hints go step by step.** The first hint is a question, the next is more concrete, and none of them gives away the answer.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine + level content tests
npm run build
```

## Add or edit a level (no code needed)

Each level is one JSON file in `src/levels/`. To add a level, copy an existing file and change the numbers.

```json
{
  "id": "transform-01",
  "skill": "matrix-transform",
  "title": "Fit the shape",
  "prompt": "Drag î and ĵ so the shape lands in the hole.",
  "shape": [[0,0],[0.25,0],[0.25,0.5],[1,0.5],[1,1],[0,1]],
  "target": { "type": "shape", "matrix": [[2,0],[1,1]] },
  "movable": ["i", "j"],
  "hints": ["Where should the corner (1,0) go?", "The corner (1,0) follows î exactly."]
}
```

### Fields

- **`skill`**, one of:
  - `vectors`
  - `combinations`
  - `matrix-transform`
  - `composition`
  - `determinant`
  - `inverse`
  - `eigen`
- **`target.type`**, one of:
  - `shape`: match `matrix`
  - `point`: send the point `from` onto `point`
  - `area`: reach a determinant `det`
  - `direction`: find a vector `v` that the fixed matrix `start` doesn't turn
- **`movable`**: any of `i`, `j`, `v`.
- **Optional fields:**
  - `start`: the starting matrix
  - `pre`: a move applied *before* the player's
  - `snap`: the grid step the arrows lock onto (default `0.5`)
  - `tolerance`: how close counts as solved (default `0.1`)
  - `targetsError`: makes this level the one suggested after that mistake

**Matrices are written row by row:** `[[a, b], [c, d]]`, where `(a, c)` is where î lands and `(b, d)` is where ĵ lands.

**Shapes must look different when î and ĵ are swapped.** A square looks the same either way, so the player can't see that mistake. Keep targets inside x −3…4.5 and y −2…3.5 so they stay on screen.

If a file has a mistake, the home screen lists it with the reason, and every other level stays playable. Run `npm test`: it also checks that every level has a solution on the snap grid. When you add a level, add its solution to `tests/levels/loader.test.ts`.

## Stack

Vite, React, TypeScript, [Mafs](https://mafs.dev) (interactive math in SVG), KaTeX and Vitest. There is no server: progress is saved in the browser.
