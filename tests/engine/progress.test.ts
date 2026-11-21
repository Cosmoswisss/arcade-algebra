import { describe, expect, test } from 'vitest';
import { loadProgress, resetProgress, saveProgress } from '../../src/engine/progress';

class MemStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}
const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };

describe('progress', () => {
  test('round trip under lag.progress.v1', () => {
    const s = new MemStorage();
    const p = loadProgress(s as unknown as Storage);
    p.completed.push('t1');
    saveProgress(p, s as unknown as Storage);
    expect(s.data.has('lag.progress.v1')).toBe(true);
    expect(loadProgress(s as unknown as Storage).completed).toEqual(['t1']);
  });
  test('corrupt JSON gives defaults', () => {
    const s = new MemStorage();
    s.setItem('lag.progress.v1', '{not json');
    expect(loadProgress(s as unknown as Storage).mastery.vectors).toBe(0.2);
  });
  test('wrong shape gives defaults', () => {
    const s = new MemStorage();
    s.setItem('lag.progress.v1', JSON.stringify({ mastery: 'x' }));
    expect(loadProgress(s as unknown as Storage).completed).toEqual([]);
  });
  test('throwing storage gives defaults and save does not throw', () => {
    const p = loadProgress(throwing as unknown as Storage);
    expect(p.lastError).toBeNull();
    expect(() => saveProgress(p, throwing as unknown as Storage)).not.toThrow();
    expect(resetProgress(throwing as unknown as Storage).completed).toEqual([]);
  });
});
