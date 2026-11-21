import { expect, test } from 'vitest';
import { snapInView, VIEW } from '../../src/engine/snap';

test('snaps to the step', () => expect(snapInView(0.5)([1.2, -0.7])).toEqual([1, -0.5]));
test('keeps points inside the visible area', () => {
  const [x, y] = snapInView(0.5)([40, -30]);
  expect(x).toBeLessThanOrEqual(VIEW.x[1]);
  expect(y).toBeGreaterThanOrEqual(VIEW.y[0]);
});
test('snap 0 only clamps', () => expect(snapInView(0)([1.23, 0.4])).toEqual([1.23, 0.4]));
