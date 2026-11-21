import type { CSSProperties, MouseEvent } from 'react';
import type { CabinetState } from '../engine/progression';
import { CABINETS, type CabinetId } from '../engine/types';
import { href } from '../router';
import { STATE_LABEL } from './Cabinet';
import { CabinetGlyph, Check, Lock, Star } from './icons';

/**
 * "The Grid": the world map. Seven zones on a glowing path, in cabinet order: a serpentine on desktop,
 * a vertical zig-zag on phones (the two layouts are drawn by CSS from the same zones).
 */

// desktop: viewBox 1000 × 440, two rows (4 zones left to right, then 3 right to left)
const DESK: [number, number][] = [[120, 123], [370, 123], [630, 123], [880, 123], [750, 326], [500, 326], [250, 326]];
// phone: viewBox 100 × 700, one zone per row, alternating sides
const PHONE: [number, number][] = CABINETS.map((_, k) => [k % 2 === 0 ? 30 : 70, 50 + k * 100]);

const deskSegment = (k: number) => {
  const [a, b] = [DESK[k], DESK[k + 1]];
  // the turn between the two rows bends around the right edge
  if (k === 3) return `M${a[0]} ${a[1]} C ${a[0] + 110} ${a[1]}, ${b[0] + 240} ${b[1]}, ${b[0]} ${b[1]}`;
  return `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
};
const phoneSegment = (k: number) => `M${PHONE[k][0]} ${PHONE[k][1]} L${PHONE[k + 1][0]} ${PHONE[k + 1][1]}`;

export interface GridMapProps {
  states: Record<CabinetId, CabinetState>;
  available: (id: CabinetId) => boolean;
  recommended: CabinetId | null;
  names: Record<CabinetId, string>;
  /** Cabinets passed in the placement test (shown on their zone). */
  placed?: CabinetId[];
  onOpen: (id: CabinetId) => void;
  /** A locked or unavailable zone was activated: explain why it does not open. */
  onLocked?: (id: CabinetId) => void;
}

export function GridMap({ states, available, recommended, names, placed = [], onOpen, onLocked }: GridMapProps) {
  // a segment lights up once the zone it leads to is reachable
  const lit = (k: number) => available(CABINETS[k + 1]) && states[CABINETS[k + 1]] !== 'locked';
  return (
    <nav className="grid-map" aria-label="The Grid: seven zones">
      <svg className="grid-path grid-path--desk" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden focusable="false">
        {CABINETS.slice(0, -1).map((id, k) => <path key={id} d={deskSegment(k)} className={lit(k) ? 'is-lit' : ''} vectorEffect="non-scaling-stroke" />)}
      </svg>
      <svg className="grid-path grid-path--phone" viewBox="0 0 100 700" preserveAspectRatio="none" aria-hidden focusable="false">
        {CABINETS.slice(0, -1).map((id, k) => <path key={id} d={phoneSegment(k)} className={lit(k) ? 'is-lit' : ''} vectorEffect="non-scaling-stroke" />)}
      </svg>
      <ol>
        {CABINETS.map((id, k) => {
          const state = states[id];
          const ok = available(id);
          const open = ok && state !== 'locked';
          const rec = ok && id === recommended;
          const isPlaced = placed.includes(id) && state !== 'finished';
          const note = !ok ? 'Coming soon' : rec ? 'You are here' : isPlaced ? 'Placed · review' : STATE_LABEL[state];
          const style = {
            '--x': `${DESK[k][0] / 10}%`, '--y': `${(DESK[k][1] / 440) * 100}%`,
            '--mx': `${PHONE[k][0]}%`, '--my': `${(PHONE[k][1] / 700) * 100}%`,
          } as CSSProperties;
          const label = `Zone ${k + 1}, ${names[id]}: ${note}.`;
          const activate = (e: MouseEvent) => { e.preventDefault(); if (open) onOpen(id); else onLocked?.(id); };
          return (
            <li key={id} className={`zone zone--${ok ? state : 'off'} ${rec ? 'zone--rec' : ''}`} style={style}>
              <a href={open ? href.course(id) : undefined} role={open ? undefined : 'link'} tabIndex={0}
                aria-disabled={open ? undefined : true} aria-label={label} onClick={activate}
                onKeyDown={(e) => { if (!open && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onLocked?.(id); } }}>
                {rec && <span className="zone-you mono" aria-hidden>YOU</span>}
                <span className="zone-node" aria-hidden>
                  <svg viewBox="0 0 64 64" width="64" height="64" focusable="false">
                    <path d="M32 3L57 17.5V46.5L32 61L7 46.5V17.5Z" className="zone-hex" />
                    <g transform="translate(20 20)">{open ? <CabinetGlyph id={id} size={24} /> : <Lock size={24} />}</g>
                  </svg>
                  {state === 'finished' && <i className="zone-badge zone-badge--star"><Star size={16} /></i>}
                  {state === 'mastered' && <i className="zone-badge zone-badge--check"><Check size={14} /></i>}
                </span>
                <span className="zone-num mono" aria-hidden>{String(k + 1).padStart(2, '0')}</span>
                <span className="zone-name" aria-hidden>{names[id]}</span>
                <span className="zone-note mono" aria-hidden>{note}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
