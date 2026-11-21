import { identity } from '../engine/matrix';
import { SKILLS } from '../engine/types';
import type { ErrorKind, Level, Mat2, Movable, Target, Vec2 } from '../engine/types';

type Result = { ok: true; level: Level } | { ok: false; error: string };

const ERROR_KINDS: ErrorKind[] = ['swapped-columns', 'sign-flip', 'scale', 'one-column', 'composition-order', 'other'];
const MOVABLES: Movable[] = ['i', 'j', 'v'];

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isVec2 = (x: unknown): x is Vec2 => Array.isArray(x) && x.length === 2 && x.every(isNum);
const isMat2 = (x: unknown): x is Mat2 => Array.isArray(x) && x.length === 2 && x.every(isVec2);
const isStr = (x: unknown): x is string => typeof x === 'string' && x.length > 0;

function parseTarget(t: unknown): Target | string {
  if (typeof t !== 'object' || t === null) return 'target must be an object';
  const o = t as Record<string, unknown>;
  switch (o.type) {
    case 'shape': return isMat2(o.matrix) ? { type: 'shape', matrix: o.matrix } : 'target.matrix must be a 2x2 matrix';
    case 'point': return isVec2(o.from) && isVec2(o.point) ? { type: 'point', from: o.from, point: o.point } : 'target.from and target.point must be [x, y]';
    case 'area': return isNum(o.det) ? { type: 'area', det: o.det } : 'target.det must be a number';
    case 'direction': return { type: 'direction' };
    default: return "target.type must be 'shape' | 'point' | 'area' | 'direction'";
  }
}

export function validateLevel(raw: unknown): Result {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'level must be a JSON object' };
  const o = raw as Record<string, unknown>;
  const id = isStr(o.id) ? o.id : '(no id)';
  const fail = (why: string): Result => ({ ok: false, error: `${id}: ${why}` });

  if (!isStr(o.id)) return fail('id must be a non-empty string');
  if (!SKILLS.includes(o.skill as never)) return fail(`skill must be one of ${SKILLS.join(', ')}`);
  if (!isStr(o.title)) return fail('title must be a non-empty string');
  if (!isStr(o.prompt)) return fail('prompt must be a non-empty string');
  if (!Array.isArray(o.shape) || o.shape.length === 0 || !o.shape.every(isVec2)) return fail('shape must be a non-empty list of [x, y] points');
  const target = parseTarget(o.target);
  if (typeof target === 'string') return fail(target);
  if (!Array.isArray(o.movable) || o.movable.length === 0 || !o.movable.every((m) => MOVABLES.includes(m))) return fail("movable must list 'i', 'j' or 'v'");
  if (o.start !== undefined && !isMat2(o.start)) return fail('start must be a 2x2 matrix');
  if (o.pre !== undefined && !isMat2(o.pre)) return fail('pre must be a 2x2 matrix');
  if (o.snap !== undefined && !(isNum(o.snap) && o.snap >= 0)) return fail('snap must be a number >= 0');
  if (o.tolerance !== undefined && !(isNum(o.tolerance) && o.tolerance > 0)) return fail('tolerance must be a number > 0');
  if (o.hints !== undefined && !(Array.isArray(o.hints) && o.hints.every(isStr))) return fail('hints must be a list of strings');
  if (o.targetsError !== undefined && !ERROR_KINDS.includes(o.targetsError as ErrorKind)) return fail(`targetsError must be one of ${ERROR_KINDS.join(', ')}`);

  return {
    ok: true,
    level: {
      id: o.id,
      skill: o.skill as Level['skill'],
      title: o.title,
      prompt: o.prompt,
      shape: o.shape as Vec2[],
      target,
      movable: o.movable as Movable[],
      start: (o.start as Mat2 | undefined) ?? identity(),
      ...(o.pre ? { pre: o.pre as Mat2 } : {}),
      snap: (o.snap as number | undefined) ?? 0.5,
      tolerance: (o.tolerance as number | undefined) ?? 0.1,
      hints: (o.hints as string[] | undefined) ?? [],
      ...(o.targetsError ? { targetsError: o.targetsError as ErrorKind } : {}),
    },
  };
}

export function loadLevels(): { levels: Level[]; errors: string[] } {
  const files = import.meta.glob('./*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
  const levels: Level[] = [];
  const errors: string[] = [];
  for (const [path, raw] of Object.entries(files)) {
    const r = validateLevel(raw);
    if (r.ok) levels.push(r.level);
    else errors.push(`${path.replace('./', '')}: ${r.error}`);
  }
  levels.sort((a, b) => SKILLS.indexOf(a.skill) - SKILLS.indexOf(b.skill) || a.id.localeCompare(b.id));
  return { levels, errors };
}
