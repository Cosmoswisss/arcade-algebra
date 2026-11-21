import { readdirSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { loadContent } from '../../src/content/load';
import { checkRobotLine } from '../../src/content/schema';
import { robotLine } from '../../src/ui/robotLines';

const { robot } = loadContent();

describe('robotLine', () => {
  test('a mistake with its own line gets it', () => {
    expect(robot.errors['swapped-xy']).toContain(robotLine(robot, 'wrong', { errorKind: 'swapped-xy' }));
  });
  test('a mistake without its own line falls back to a generic wrong line', () => {
    expect(robot.events.wrong).toContain(robotLine(robot, 'wrong', { errorKind: 'no-such-kind' }));
  });
  test('the random source picks the variant', () => {
    expect(robotLine(robot, 'right', { rand: () => 0 })).toBe(robot.events.right[0]);
    expect(robotLine(robot, 'right', { rand: () => 0.999 })).toBe(robot.events.right.at(-1));
  });
  test('a silent robot (no lines) says nothing rather than crashing', () => {
    expect(robotLine({ name: 'x', events: { right: [] } as never, errors: {} }, 'right')).toBe('');
  });
});

describe('robot.json', () => {
  test('every line is 2 sentences at most', () => {
    for (const l of [...Object.values(robot.events).flat(), ...Object.values(robot.errors).flat()]) expect(checkRobotLine(l), l).toBeNull();
  });
  test('every remedial error kind has a line', () => {
    for (const f of readdirSync('content/remedial')) expect(robot.errors[f.replace('.json', '')], f).toBeDefined();
  });
});
