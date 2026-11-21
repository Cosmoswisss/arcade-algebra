import { describe, expect, test } from 'vitest';
import { checklist, compose, evaluateFactory, goalText, orderMatters } from '../../src/arcade/cabinets/factory/logic';
import { validateFactoryParams } from '../../src/arcade/cabinets/factory/params';
import type { FactoryParams } from '../../src/arcade/cabinets/factory/params';
import { loadContent } from '../../src/content/load';
import { allPlayableWaves } from '../../src/content/lessons';
import type { Mat2 } from '../../src/engine/types';

const rot: Mat2 = [[0, -1], [1, 0]], stretch: Mat2 = [[2, 0], [0, 1]];
const P: FactoryParams = { machines: [{ name: 'stretch', matrix: stretch }, { name: 'rotate', matrix: rot }], target: [[0, -1], [2, 0]] };

describe('factory logic', () => {
  test('compose applies the machines in belt order (first machine acts first)', () => expect(compose([stretch, rot])).toEqual([[0, -1], [2, 0]]));
  test('order matters for stretch and rotate', () => expect(orderMatters(stretch, rot)).toBe(true));
  test('two stretches commute', () => expect(orderMatters(stretch, [[1, 0], [0, 3]])).toBe(false));
  test('right order wins', () => expect(evaluateFactory(P, [0, 1]).correct).toBe(true));
  test('reversed order is a composition-order error', () => expect(evaluateFactory(P, [1, 0]).diagnosis?.kind).toBe('composition-order'));
  test('missing a machine is not correct', () => expect(evaluateFactory(P, [0]).correct).toBe(false));
  test('goal names the target columns in assist', () => expect(goalText(P, 'assist')).toContain('(0, 2)'));
  test('abstract checklist is empty', () => expect(checklist(P, [0], 'abstract')).toEqual([]));
  test('params validator', () => { expect(validateFactoryParams(P)).toBeNull(); expect(validateFactoryParams({ ...P, machines: [] })).not.toBeNull(); });
  test('content: the listed order builds the target and a different order does not', () => {
    const c = loadContent().cabinets.factory!;
    for (const w of allPlayableWaves(c)) {
      const p = w.params as FactoryParams;
      expect(evaluateFactory(p, p.machines.map((_, k) => k)).correct, w.id).toBe(true);
      expect(evaluateFactory(p, p.machines.map((_, k) => k).reverse()).correct, `${w.id} reversed`).toBe(false);
    }
  });
});
