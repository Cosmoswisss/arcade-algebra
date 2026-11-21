import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parseContentFiles } from '../../src/content/load';
import { ARROW_LIMIT, ARROW_STEP, POINT_LIMIT, SLIDER, VISIBLE } from '../../src/ui/geometry';

/** Every lesson answer must be reachable with the lesson's own inputs (visible plane, snap grid, slider). */
const raw: Record<string, string> = {};
for (const dir of readdirSync('content/cabinets')) for (const f of readdirSync(`content/cabinets/${dir}`)) raw[`/content/cabinets/${dir}/${f}`] = readFileSync(`content/cabinets/${dir}/${f}`, 'utf8');
const { cabinets } = parseContentFiles(raw);
const onGrid = (v: number) => Math.abs(v / ARROW_STEP - Math.round(v / ARROW_STEP)) < 1e-9;
const questions = Object.values(cabinets).flatMap((c) => c!.course.map((s) => ({ where: `${c!.meta.id}/${s.id}`, q: s.check })));

describe('lesson answers can be entered', () => {
  test('there are lessons to check', () => expect(questions.length).toBeGreaterThan(0));
  test.each(questions)('$where', ({ q }) => {
    if (q.kind === 'point') {
      const [x, y] = q.answer;
      expect(x >= Math.max(VISIBLE[0], -POINT_LIMIT[0]) && x <= Math.min(VISIBLE[1], POINT_LIMIT[0]), `x=${x} off the plane`).toBe(true);
      expect(y >= Math.max(VISIBLE[2], -POINT_LIMIT[1]) && y <= Math.min(VISIBLE[3], POINT_LIMIT[1]), `y=${y} off the plane`).toBe(true);
      expect(onGrid(x) && onGrid(y)).toBe(true);
    }
    if (q.kind === 'basis') for (const v of q.answer.flat()) expect(Math.abs(v) <= ARROW_LIMIT && onGrid(v), `${v} cannot be dragged`).toBe(true);
    if (q.kind === 'number') {
      const steps = (q.answer - SLIDER.min) / SLIDER.step;
      expect(q.answer >= SLIDER.min && q.answer <= SLIDER.max && Math.abs(steps - Math.round(steps)) < 1e-9, `${q.answer} is not on the slider`).toBe(true);
    }
  });
});
