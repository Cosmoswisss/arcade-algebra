import type { CabinetState } from '../engine/progression';
import type { CabinetId } from '../engine/types';
import { CabinetGlyph, Check, Lock, Star } from './icons';

/** Body outline per cabinet: each machine has its own silhouette (DESIGN.md: cabinets must look different). */
const BODY: Record<CabinetId, string> = {
  'vector-golf': 'M22 250V74L62 32H142V250Z',
  drone: 'M10 250V92L32 52H128L150 92V250Z',
  'hole-in-the-wall': 'M24 250V44L40 28H120L136 44V250Z',
  factory: 'M14 250V64H44V38H148V250Z',
  squash: 'M16 250V46H144V250Z',
  rewind: 'M22 250V84Q22 30 80 30Q138 30 138 84V250Z',
  'laser-lab': 'M38 250V36L58 18H102L122 36V250Z',
};
const ACCENT = ['#f0abfc', '#22d3ee', '#fde047', '#a5b4fc', '#f0abfc', '#22d3ee', '#fde047'];
const NAME: Record<CabinetId, string[]> = {
  'vector-golf': ['VECTOR', 'GOLF'], drone: ['TWIN', 'DRONE'], 'hole-in-the-wall': ['HOLE IN', 'THE WALL'],
  factory: ['MACHINE', 'FACTORY'], squash: ['SQUASH!'], rewind: ['REWIND'], 'laser-lab': ['LASER', 'LAB'],
};

export interface CabinetProps {
  id: CabinetId;
  order: number;
  state: CabinetState;
  recommended: boolean;
  /** False when the cabinet has no playable game or its content is broken. */
  available: boolean;
}

export function Cabinet({ id, order, state, recommended, available }: CabinetProps) {
  const accent = ACCENT[order - 1];
  const lit = available && state !== 'locked';
  const stroke = lit ? accent : '#2b2260';
  const lines = NAME[id];
  return (
    <svg viewBox="0 0 160 262" className={`cab cab--${state} ${recommended ? 'cab--rec' : ''} ${available ? '' : 'cab--off'}`} aria-hidden focusable="false" style={{ ['--accent' as string]: accent }}>
      <defs>
        <pattern id={`scan-${id}`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 3.5h4" stroke={accent} strokeOpacity="0.18" strokeWidth="1" /></pattern>
      </defs>
      <ellipse cx="80" cy="256" rx="70" ry="5" fill={lit ? accent : '#2b2260'} opacity={lit ? 0.25 : 0.4} />
      <path d={BODY[id]} fill="#0e0a24" stroke={stroke} strokeWidth={2} strokeLinejoin="miter" />
      {/* marquee */}
      <path d="M34 54H126V92H34Z" fill="#16103a" stroke={stroke} strokeWidth={1.2} />
      <g transform="translate(40 61)" color={lit ? accent : '#4b4380'}><CabinetGlyph id={id} size={24} /></g>
      <text x="124" y="64" textAnchor="end" fontFamily="var(--font-mono)" fontWeight={700} fontSize="11" fill={lit ? accent : '#4b4380'}>{String(order).padStart(2, '0')}</text>
      {lines.map((l, k) => (
        <text key={l} x="124" y={76 + k * 10} textAnchor="end" fontFamily="var(--font-display)" fontWeight={600} fontSize={l.length > 9 ? 8 : 9.5} letterSpacing="0.8" fill={lit ? '#e0e7ff' : '#6b63a8'}>{l}</text>
      ))}
      {/* screen */}
      <rect x="36" y="102" width="88" height="66" fill="#05030f" stroke={stroke} strokeWidth={1.5} />
      {lit && <rect x="36" y="102" width="88" height="66" fill={`url(#scan-${id})`} />}
      {lit ? (
        <g transform="translate(60 112)" color={accent} className="cab-glyph"><CabinetGlyph id={id} size={40} /></g>
      ) : (
        <g transform="translate(66 118)" color="#4b4380"><Lock size={28} /></g>
      )}
      {state === 'finished' && <g transform="translate(96 108)" color="#fde047"><Star size={22} /></g>}
      {state === 'mastered' && <g transform="translate(98 110)" color="#4ade80"><Check size={20} /></g>}
      {/* control deck */}
      <path d="M30 184H130L138 208H22Z" fill="#16103a" stroke={stroke} strokeWidth={1.2} />
      <circle cx="52" cy="196" r="6" fill={lit ? accent : '#2b2260'} />
      <rect x="49" y="190" width="6" height="12" fill="none" />
      <circle cx="96" cy="198" r="4.5" fill={lit ? '#fde047' : '#2b2260'} />
      <circle cx="112" cy="198" r="4.5" fill={lit ? '#22d3ee' : '#2b2260'} />
      {/* coin slot */}
      <rect x="70" y="222" width="20" height="4" fill="#05030f" stroke={stroke} strokeWidth={1} />
    </svg>
  );
}

export const STATE_LABEL: Record<CabinetState, string> = { locked: 'Locked', open: 'Open', mastered: 'Mastered', finished: 'Cleared' };

/** Names and one-line notions, used while a cabinet's content is not loaded. */
export const CABINET_INFO: Record<CabinetId, { name: string; notion: string }> = {
  'vector-golf': { name: 'Vector Golf', notion: 'Vectors and addition' },
  drone: { name: 'Two-Thruster Drone', notion: 'Combinations and span' },
  'hole-in-the-wall': { name: 'Hole in the Wall', notion: 'A matrix is a transformation' },
  factory: { name: 'Machine Factory', notion: 'Composition: order matters' },
  squash: { name: 'Squash!', notion: 'The determinant' },
  rewind: { name: 'Rewind', notion: 'The inverse' },
  'laser-lab': { name: 'Laser Lab', notion: 'Eigenvectors' },
};
