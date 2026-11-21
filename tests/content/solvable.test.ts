import { describe, expect, test } from 'vitest';
import { PARAMS_VALIDATORS } from '../../src/content/paramsRegistry';
import type { CabinetId } from '../../src/engine/types';

/** Review Focus 2: a wave without a solution is refused when the content loads, not only by the tests. */
const CASES: Record<CabinetId, { ok: unknown; unsolvable: unknown }> = {
  'vector-golf': {
    ok: { start: [-1, -1], shots: [[3, 2]], hole: [2, 1], walls: [] },
    unsolvable: { start: [-1, -1], shots: [[3, 2]], hole: [0, 1], walls: [] }, // the listed shots miss the hole
  },
  drone: {
    ok: { u: [1, 0], v: [0, 1], target: [2, 1], reachable: true },
    unsolvable: { u: [1, 0], v: [0, 1], target: [2, 1], reachable: false }, // the flag contradicts the geometry
  },
  'hole-in-the-wall': { ok: { matrix: [[2, 0], [0, 1]] }, unsolvable: { matrix: [[0.3, 0], [0, 1]] } }, // handles snap to 0.5
  factory: {
    ok: { machines: [{ name: 'stretch', matrix: [[2, 0], [0, 1]] }, { name: 'turn', matrix: [[0, -1], [1, 0]] }], target: [[0, -1], [2, 0]] },
    unsolvable: { machines: [{ name: 'stretch', matrix: [[2, 0], [0, 1]] }, { name: 'turn', matrix: [[0, -1], [1, 0]] }], target: [[5, 0], [0, 5]] },
  },
  squash: { ok: { matrix: [[2, 0], [0, 1.5]] }, unsolvable: { matrix: [[2, 0], [0, 2.2]] } }, // the bet slider moves by 0.5
  rewind: { ok: { matrix: [[2, 0], [0, 1]], image: 'face' }, unsolvable: { matrix: [[3, 0], [0, 1]], image: 'face' } }, // 1/3 is not on the 0.5 grid
  // [[3, 1], [0, 1]] keeps the directions (1, 0) and (−1, 2): the second one (116.6°) is not on the 15° dial
  'laser-lab': { ok: { matrix: [[2, 1], [1, 2]] }, unsolvable: { matrix: [[3, 1], [0, 1]] } },
};

describe('params validators refuse waves without a solution', () => {
  for (const id of Object.keys(CASES) as CabinetId[]) {
    test(id, () => {
      expect(PARAMS_VALIDATORS[id](CASES[id].ok)).toBeNull();
      expect(PARAMS_VALIDATORS[id](CASES[id].unsolvable)).toMatch(/no solution|cannot|can't|not reachable|contradict/i);
    });
  }
});
