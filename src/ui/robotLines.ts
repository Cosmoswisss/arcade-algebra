import type { RobotEvent, RobotLines } from '../content/types';

/**
 * What the guide robot says for an event. For a mistake, the line written for that error kind
 * when there is one, otherwise a generic `wrong` line. Never free text: only lines from robot.json.
 */
export function robotLine(lines: RobotLines, event: RobotEvent, opts: { errorKind?: string; rand?: () => number } = {}): string {
  const rand = opts.rand ?? Math.random;
  const own = event === 'wrong' && opts.errorKind ? lines.errors[opts.errorKind] : undefined;
  const pool = own && own.length ? own : lines.events[event] ?? [];
  if (pool.length === 0) return '';
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}
