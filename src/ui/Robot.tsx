import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export type RobotMood = 'idle' | 'happy' | 'oops' | 'thinking';

/** VEX's face: a neon screen-head on an antenna. Original drawing, in the Neon Grid palette. */
function Face({ mood }: { mood: RobotMood }) {
  const eye = (cx: number) => {
    if (mood === 'happy') return <path d={`M${cx - 6} 40 q6 -8 12 0`} stroke="var(--cyan)" strokeWidth={3.5} fill="none" strokeLinecap="round" />;
    if (mood === 'oops') return <path d={`M${cx - 5} 33 l10 10 M${cx + 5} 33 l-10 10`} stroke="var(--pink)" strokeWidth={3.5} strokeLinecap="round" />;
    return <rect x={cx - 4} y={mood === 'thinking' ? 30 : 32} width={8} height={mood === 'thinking' ? 6 : 11} rx={3} fill="var(--cyan)" />;
  };
  const mouth = mood === 'happy' ? 'M30 54 q10 8 20 0' : mood === 'oops' ? 'M31 57 q9 -6 18 0' : mood === 'thinking' ? 'M33 55 h8' : 'M32 55 h16';
  return (
    <svg viewBox="0 0 80 84" width="72" height="76" aria-hidden="true" className="robot-face">
      <line x1="40" y1="4" x2="40" y2="16" stroke="var(--grid)" strokeWidth={3} />
      <circle cx="40" cy="5" r="4" fill={mood === 'oops' ? 'var(--pink)' : 'var(--yellow)'} />
      <rect x="10" y="16" width="60" height="52" rx="14" fill="var(--panel)" stroke="var(--cyan)" strokeWidth={3} />
      <rect x="4" y="34" width="6" height="16" rx="3" fill="var(--grid)" />
      <rect x="70" y="34" width="6" height="16" rx="3" fill="var(--grid)" />
      {eye(29)}{eye(51)}
      <path d={mouth} stroke="var(--cyan)" strokeWidth={3} fill="none" strokeLinecap="round" />
      {mood === 'thinking' && <g fill="var(--yellow)"><circle cx="62" cy="10" r="2.5" /><circle cx="70" cy="6" r="2" /></g>}
      <rect x="28" y="72" width="24" height="8" rx="4" fill="var(--grid)" opacity={0.7} />
    </svg>
  );
}

/** The guide robot with its speech bubble. It only ever says lines written in robot.json or the lessons. */
export function Robot({ mood = 'idle', line, name = 'VEX', children }: { mood?: RobotMood; line: string; name?: string; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (!line && !children) return null;
  return (
    <div className={`robot robot-${mood}`}>
      <motion.div className="robot-body" animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
        <Face mood={mood} />
      </motion.div>
      <div className="robot-bubble" role="status" aria-live="polite">
        <b className="robot-name mono">{name}</b>
        <AnimatePresence mode="wait">
          <motion.p key={line} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }}>{line}</motion.p>
        </AnimatePresence>
        {children}
      </div>
    </div>
  );
}
