/** One AudioContext for the whole app, created on the first user gesture. */
let ac: AudioContext | null = null;

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') void ac.resume(); return; }
  try { ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { ac = null; }
}

function beep(f: number, d = 0.08, type: OscillatorType = 'square', v = 0.04, when = 0) {
  if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  const t0 = ac.currentTime + when;
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + d + 0.03);
}

export const sfx = {
  snap: () => beep(1200, 0.03, 'triangle', 0.03),
  lock: () => { beep(440, 0.06); beep(880, 0.08, 'square', 0.04, 0.06); },
  win: (combo: number) => [523, 659, 784, 1046].forEach((f, k) => beep(f * (1 + 0.06 * Math.min(combo, 6)), 0.12, 'square', 0.045, k * 0.07)),
  fail: () => { beep(140, 0.35, 'sawtooth', 0.07); beep(90, 0.45, 'sawtooth', 0.06, 0.05); },
  tick: () => beep(660, 0.025, 'square', 0.02),
  unlock: () => [392, 523, 659, 784, 1046, 1318].forEach((f, k) => beep(f, 0.16, 'triangle', 0.05, k * 0.08)),
  rule: () => { beep(220, 0.1, 'square', 0.04); beep(330, 0.14, 'square', 0.04, 0.1); },
  whoosh: () => beep(300, 0.18, 'triangle', 0.03),
  click: () => beep(900, 0.04, 'triangle', 0.03),
};
export type Sfx = typeof sfx;
