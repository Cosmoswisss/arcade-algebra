import { CABINETS, MODES, RULES, THEMES } from '../engine/types';
import type { CabinetId, Rule } from '../engine/types';
import { isMat2, isNum, isObj, isStr, isVec2 } from './check';
import type { CabinetContent, ParamsValidator, Question, Remedial, RobotEvent, RobotLines } from './types';

export const CABINET_FILES = ['cabinet.json', 'course.json', 'waves.json', 'drills.json', 'dex.json'] as const;

type Out<T> = { ok: true; content: T } | { ok: false; errors: string[] };

const hasThemes = (x: unknown) => isObj(x) && THEMES.every((t) => isStr(x[t]));

/** A robot line: one or two sentences. */
export function checkRobotLine(x: unknown): string | null {
  if (!isStr(x) || !x.trim()) return 'robot line is required';
  const sentences = x.trim().split(/(?<=[.!?…])\s+/).filter(Boolean).length;
  return sentences > 2 ? 'robot line: 2 sentences max' : null;
}

const hasModes = (x: unknown, check: (v: unknown) => boolean) => isObj(x) && MODES.every((m) => check(x[m]));

function checkScene(s: unknown, where: string, errors: string[]) {
  if (s === undefined) return;
  if (!Array.isArray(s) || !s.every((st) => isObj(st) && isMat2(st.matrix) && isStr(st.caption) && isNum(st.ms) && st.ms > 0))
    errors.push(`${where}: scene must be a list of { matrix, caption, ms }`);
}

export function checkQuestion(q: unknown): string | null {
  if (!isObj(q) || !isStr(q.prompt)) return 'check needs a kind and a prompt';
  const tol = isNum(q.tolerance) && q.tolerance > 0;
  switch (q.kind) {
    case 'point':
      return isVec2(q.answer) && tol && isObj(q.given) ? null : "a 'point' question needs answer [x, y], given {…} and tolerance > 0";
    case 'basis':
      return isObj(q.given) && isMat2(q.given.matrix) && isMat2(q.answer) && tol ? null : "a 'basis' question needs given.matrix, answer (2x2) and tolerance > 0";
    case 'number':
      return isObj(q.given) && isMat2(q.given.matrix) && isNum(q.answer) && tol ? null : "a 'number' question needs given.matrix, a numeric answer and tolerance > 0";
    case 'choice':
      return Array.isArray(q.options) && q.options.length >= 2 && q.options.every(isStr) && Number.isInteger(q.answer) && (q.answer as number) >= 0 && (q.answer as number) < q.options.length
        ? null : "a 'choice' question needs 2+ options and answer = index of the right option";
    default:
      return "check.kind must be 'point' | 'basis' | 'number' | 'choice'";
  }
}

function checkWaves(list: unknown, file: string, params: ParamsValidator, errors: string[], ids: Set<string>) {
  if (!Array.isArray(list) || list.length === 0) { errors.push(`${file}: must be a non-empty list of waves`); return; }
  for (const w of list) {
    const id = isObj(w) && isStr(w.id) ? w.id : '(no id)';
    if (!isObj(w) || !isStr(w.id)) { errors.push(`${file}#${id}: each wave needs an id`); continue; }
    if (ids.has(w.id)) errors.push(`${file}#${id}: duplicate wave id`);
    ids.add(w.id);
    if (!isStr(w.concept)) errors.push(`${file}#${id}: concept is required (e.g. "stretch")`);
    const why = params(w.params);
    if (why) errors.push(`${file}#${id}: ${why}`);
  }
}

/** Validates one cabinet folder (already JSON-parsed files keyed by file name). */
export function validateCabinet(folder: string, files: Record<string, unknown>, params: ParamsValidator): Out<CabinetContent> {
  const errors: string[] = [];
  const at = (f: string) => `${folder}/${f}`;
  for (const f of CABINET_FILES) if (!(f in files)) errors.push(`${at(f)}: missing file`);
  if (errors.length) return { ok: false, errors };

  const meta = files['cabinet.json'];
  const folderId = folder.replace(/^\d+-/, '') as CabinetId;
  if (!isObj(meta)) errors.push(`${at('cabinet.json')}: must be an object`);
  else {
    if (!CABINETS.includes(meta.id as CabinetId)) errors.push(`${at('cabinet.json')}: id must be one of ${CABINETS.join(', ')}`);
    else if (meta.id !== folderId) errors.push(`${at('cabinet.json')}: id "${meta.id}" does not match folder "${folder}"`);
    if (!isNum(meta.order)) errors.push(`${at('cabinet.json')}: order must be a number`);
    if (!isStr(meta.name) || !isStr(meta.notion)) errors.push(`${at('cabinet.json')}: name and notion are required`);
    const tiers = meta.tiers;
    if (!Array.isArray(tiers) || tiers.length !== 3 || !tiers.every((t, k) => isObj(t) && t.rule === RULES[k] && isStr(t.banner) && hasModes(t.waves, (n) => Number.isInteger(n) && (n as number) >= 1)))
      errors.push(`${at('cabinet.json')}: tiers must be exactly 3 items with rule assist, partial, abstract (in this order), a banner and waves { guided, fast } >= 1`);
    if (!hasModes(meta.waveSeconds, (n) => isNum(n) && (n as number) > 0)) errors.push(`${at('cabinet.json')}: waveSeconds must be { guided, fast } in seconds`);
    if (!isObj(meta.boss) || !Number.isInteger(meta.boss.waves) || (meta.boss.waves as number) < 1) errors.push(`${at('cabinet.json')}: boss.waves must be >= 1`);
    if (!isObj(meta.story) || !isStr(meta.story.intro) || !isStr(meta.story.cleared)) errors.push(`${at('cabinet.json')}: story needs intro and cleared (said by the robot)`);
    else for (const k of ['intro', 'cleared'] as const) { const why = checkRobotLine(meta.story[k]); if (why) errors.push(`${at('cabinet.json')}: story.${k}: ${why}`); }
  }

  const ids = new Set<string>();
  checkWaves(files['waves.json'], at('waves.json'), params, errors, ids);

  const drills = files['drills.json'];
  if (!Array.isArray(drills)) errors.push(`${at('drills.json')}: must be a list`);
  else for (const d of drills) {
    if (!isObj(d) || !isStr(d.errorKind) || !isStr(d.label)) { errors.push(`${at('drills.json')}: each drill needs errorKind and label`); continue; }
    checkWaves(d.waves, `${at('drills.json')}[${d.errorKind}]`, params, errors, ids);
  }

  const course = files['course.json'];
  const playWaves: unknown[] = [];
  if (!Array.isArray(course) || course.length === 0) errors.push(`${at('course.json')}: must be a non-empty list of steps`);
  else {
    let plays = 0;
    for (const s of course) {
      const id = isObj(s) && isStr(s.id) ? s.id : '(no id)';
      const w = `${at('course.json')}#${id}`;
      if (!isObj(s) || !isStr(s.id) || !isStr(s.title)) { errors.push(`${w}: id and title are required`); continue; }
      if (!hasModes(s.text, isStr)) errors.push(`${w}: text must have guided and fast versions`);
      if (!hasThemes(s.examples)) errors.push(`${w}: examples must have games, physics and sport`);
      const robot = checkRobotLine(s.robot);
      if (robot) errors.push(`${w}: ${robot}`);
      if (!isObj(s.demo)) errors.push(`${w}: demo is required ({ wave, rule })`);
      else {
        if (!isStr(s.demo.wave) || !ids.has(s.demo.wave)) errors.push(`${w}: demo wave "${String(s.demo.wave)}" not found in waves.json or drills.json`);
        if (!RULES.includes(s.demo.rule as Rule)) errors.push(`${w}: demo.rule must be assist, partial or abstract`);
      }
      if ((s.play === undefined) === (s.check === undefined)) { errors.push(`${w}: a lesson needs exactly one of play or check`); continue; }
      if (s.check !== undefined) { const q = checkQuestion(s.check); if (q) errors.push(`${w}: ${q}`); continue; }
      plays += 1;
      const p = s.play;
      if (!isObj(p) || !isObj(p.wave)) { errors.push(`${w}: play needs { wave, rule, mission }`); continue; }
      checkWaves([p.wave], `${w} play`, params, errors, ids);
      playWaves.push(p.wave);
      if (!RULES.includes(p.rule as Rule)) errors.push(`${w}: play.rule must be assist, partial or abstract`);
      if (!hasThemes(p.mission)) errors.push(`${w}: play.mission must have games, physics and sport`);
    }
    if (plays < 2) errors.push(`${at('course.json')}: at least 2 lessons must be play (a wave of the game), found ${plays}`);
  }

  const dex = files['dex.json'];
  const concepts = new Set<string>();
  if (!Array.isArray(dex)) errors.push(`${at('dex.json')}: must be a list`);
  else for (const c of dex) {
    if (!isObj(c) || !isStr(c.concept) || !isStr(c.name) || !isStr(c.body) || !isMat2(c.demo)) errors.push(`${at('dex.json')}: each card needs concept, name, body and demo (2x2)`);
    else concepts.add(c.concept);
  }
  const used = [...playWaves, ...(Array.isArray(files['waves.json']) ? files['waves.json'] : []), ...(Array.isArray(drills) ? drills.flatMap((d) => (isObj(d) && Array.isArray(d.waves) ? d.waves : [])) : [])];
  for (const w of used) if (isObj(w) && isStr(w.concept) && !concepts.has(w.concept)) errors.push(`${at('dex.json')}: no card for concept "${w.concept}" (used by ${String(w.id)})`);

  if (errors.length) return { ok: false, errors: [...new Set(errors)] };
  return { ok: true, content: { meta: meta as unknown as CabinetContent['meta'], course: course as CabinetContent['course'], waves: files['waves.json'] as CabinetContent['waves'], drills: drills as CabinetContent['drills'], dex: dex as CabinetContent['dex'] } };
}

export function validateRemedial(file: string, r: unknown): Out<Remedial> {
  if (!isObj(r) || !isStr(r.errorKind) || !isStr(r.title) || !hasModes(r.text, isStr)) return { ok: false, errors: [`${file}: needs errorKind, title and text { guided, fast }`] };
  const errors: string[] = [];
  checkScene(r.scene, file, errors);
  return errors.length ? { ok: false, errors } : { ok: true, content: r as unknown as Remedial };
}

export const ROBOT_EVENTS: RobotEvent[] = ['right', 'wrong', 'hint', 'retry', 'warmup', 'reminder', 'placementSkip', 'attract'];
export const emptyRobot = (): RobotLines => ({ name: 'Robot', events: Object.fromEntries(ROBOT_EVENTS.map((e) => [e, []])) as unknown as Record<RobotEvent, string[]>, errors: {} });

/** content/robot.json: { name, events: { <event>: [lines] }, errors: { <errorKind>: [lines] } }. Every line is 2 sentences max. */
export function validateRobot(file: string, r: unknown): Out<RobotLines> {
  const errors: string[] = [];
  if (!isObj(r) || !isStr(r.name) || !isObj(r.events) || !isObj(r.errors)) return { ok: false, errors: [`${file}: needs name, events and errors`] };
  const lines = (list: unknown, where: string) => {
    if (!Array.isArray(list) || list.length === 0) { errors.push(`${where}: needs a non-empty list of lines`); return; }
    for (const l of list) { const why = checkRobotLine(l); if (why) errors.push(`${where}: ${why} ("${String(l)}")`); }
  };
  for (const e of ROBOT_EVENTS) lines(r.events[e], `${file} events.${e}`);
  for (const [k, list] of Object.entries(r.errors)) lines(list, `${file} errors.${k}`);
  return errors.length ? { ok: false, errors } : { ok: true, content: r as unknown as RobotLines };
}

export type { Question };
