/** Stable per-question order of choice options, so the right answer is not always in the same spot. */
export function displayOrder(n: number, answer: number, seed: string): number[] {
  let h = 2166136261;
  for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const pos = h % n;
  const others = Array.from({ length: n }, (_, k) => k).filter((k) => k !== answer);
  const rot = (h >>> 8) % Math.max(1, others.length);
  const rotated = [...others.slice(rot), ...others.slice(0, rot)];
  rotated.splice(pos, 0, answer);
  return rotated;
}
