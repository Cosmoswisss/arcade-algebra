import { expect, test } from 'vitest';
import { parseRoute } from '../../src/router';

test('routes', () => {
  expect(parseRoute('')).toEqual({ name: 'title' });
  expect(parseRoute('#/hall')).toEqual({ name: 'hall' });
  expect(parseRoute('#/knowledge')).toEqual({ name: 'knowledge' });
  expect(parseRoute('#/transfer')).toEqual({ name: 'transfer' });
  expect(parseRoute('#/transfer/squash')).toEqual({ name: 'transfer', id: 'squash' });
  expect(parseRoute('#/transfer/nope')).toEqual({ name: 'transfer' });
  expect(parseRoute('#/play/squash')).toEqual({ name: 'play', id: 'squash' });
  expect(parseRoute('#/course/hole-in-the-wall')).toEqual({ name: 'course', id: 'hole-in-the-wall' });
  expect(parseRoute('#/play/nope')).toEqual({ name: 'title' });
});
