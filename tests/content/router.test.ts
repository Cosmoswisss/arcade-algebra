import { expect, test } from 'vitest';
import { parseRoute } from '../../src/router';

test('routes', () => {
  expect(parseRoute('')).toEqual({ name: 'title' });
  expect(parseRoute('#/hall')).toEqual({ name: 'hall' });
  expect(parseRoute('#/play/squash')).toEqual({ name: 'play', id: 'squash' });
  expect(parseRoute('#/course/hole-in-the-wall')).toEqual({ name: 'course', id: 'hole-in-the-wall' });
  expect(parseRoute('#/play/nope')).toEqual({ name: 'title' });
});
