import { describe, expect, test } from 'vitest';
import { loadProgressV2, PROGRESS_KEY, resetProgressV2, saveProgressV2 } from '../../src/engine/progression';

class Mem { d = new Map<string, string>(); getItem(k: string) { return this.d.get(k) ?? null; } setItem(k: string, v: string) { this.d.set(k, v); } removeItem(k: string) { this.d.delete(k); } }
const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } } as unknown as Storage;

describe('progress v2 storage', () => {
  test('uses the linear-arcade.progress.v2 key and round-trips', () => {
    const s = new Mem() as unknown as Storage;
    const p = loadProgressV2(s); p.xp = 120; p.dex.push('stretch'); saveProgressV2(p, s);
    expect(PROGRESS_KEY).toBe('linear-arcade.progress.v2');
    const q = loadProgressV2(s); expect(q.xp).toBe(120); expect(q.dex).toEqual(['stretch']);
  });
  test('corrupt data gives defaults', () => {
    const s = new Mem(); s.setItem(PROGRESS_KEY, '{nope'); expect(loadProgressV2(s as unknown as Storage).xp).toBe(0);
  });
  test('wrong types are ignored field by field', () => {
    const s = new Mem(); s.setItem(PROGRESS_KEY, JSON.stringify({ xp: 'lots', profile: { mode: 'turbo', theme: 'ai' }, finished: ['drone', 'nope'] }));
    const p = loadProgressV2(s as unknown as Storage);
    expect(p.xp).toBe(0); expect(p.profile).toBeNull(); expect(p.finished).toEqual(['drone']);
  });
  test('a saved ai theme loads as games, the rest is kept', () => {
    const s = new Mem(); s.setItem(PROGRESS_KEY, JSON.stringify({ profile: { mode: 'fast', theme: 'ai' }, xp: 40 }));
    const p = loadProgressV2(s as unknown as Storage);
    expect(p.profile).toEqual({ mode: 'fast', theme: 'games' });
    expect(p.xp).toBe(40);
  });
  test('an old save without errors or placed loads with empty ones', () => {
    const s = new Mem(); s.setItem(PROGRESS_KEY, JSON.stringify({ xp: 10 }));
    const p = loadProgressV2(s as unknown as Storage);
    expect(p.errors).toEqual({}); expect(p.placed).toEqual([]); expect(p.xp).toBe(10);
  });
  test('errors and placed round-trip, bad entries are dropped', () => {
    const s = new Mem(); s.setItem(PROGRESS_KEY, JSON.stringify({ errors: { 'swapped-xy': 2, bad: 'x', neg: -1 }, placed: ['drone', 'nope'] }));
    const p = loadProgressV2(s as unknown as Storage);
    expect(p.errors).toEqual({ 'swapped-xy': 2 }); expect(p.placed).toEqual(['drone']);
  });
  test('a throwing storage gives defaults and never throws', () => {
    expect(loadProgressV2(boom).xp).toBe(0);
    expect(() => saveProgressV2(loadProgressV2(boom), boom)).not.toThrow();
    expect(resetProgressV2(boom).xp).toBe(0);
  });
});
