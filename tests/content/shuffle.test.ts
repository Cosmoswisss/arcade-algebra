import { expect, test } from 'vitest';
import { displayOrder } from '../../src/content/shuffle';

test('displayOrder is a permutation that moves the right answer away from a fixed spot', () => {
  const positions = new Set<number>();
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
    const o = displayOrder(3, 0, id);
    expect([...o].sort()).toEqual([0, 1, 2]);
    positions.add(o.indexOf(0));
  }
  expect(positions.size).toBeGreaterThan(1);
  expect(displayOrder(3, 0, 'same')).toEqual(displayOrder(3, 0, 'same')); // stable for a given question
});
