import type { CabinetId } from '../engine/types';

/** Custom stroke icons on a 24 px grid (DESIGN.md: no emoji). */
type P = { size?: number; className?: string; title?: string };

const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

const wrap = (paths: JSX.Element, { size = 24, className, title }: P) => (
  <svg {...base(size)} className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>{paths}</svg>
);

export const Lock = (p: P) => wrap(<><rect x="5" y="11" width="14" height="9" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>, p);
export const Play = (p: P) => wrap(<path d="M8 5v14l11-7z" />, p);
export const Check = (p: P) => wrap(<path d="M5 12.5l4.5 4.5L19 7" />, p);
export const Star = (p: P) => wrap(<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />, p);
export const ArrowRight = (p: P) => wrap(<path d="M4 12h15M13 6l6 6-6 6" />, p);
export const ArrowLeft = (p: P) => wrap(<path d="M20 12H5M11 6l-6 6 6 6" />, p);
export const Sound = (p: P) => wrap(<><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>, p);
export const SoundOff = (p: P) => wrap(<><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l4 6M21 9l-4 6" /></>, p);
export const Close = (p: P) => wrap(<path d="M6 6l12 12M18 6L6 18" />, p);

/** Logo mark: the two basis arrows over a corner of grid. */
export const LogoMark = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 26V10M19 26V16M25 26V22M5 20h20M5 14h14M5 8h8" stroke="#6366f1" strokeWidth="1" opacity="0.5" />
    <path d="M5 26h20M20 22l5 4-5 4" stroke="#4ade80" strokeWidth="2.4" />
    <path d="M5 26V6M1 11l4-5 4 5" stroke="#f87171" strokeWidth="2.4" />
    <rect x="14" y="9" width="8" height="8" stroke="#fde047" strokeWidth="2" />
  </svg>
);

/** One glyph per cabinet, used on its marquee. */
export function CabinetGlyph({ id, size = 24 }: { id: CabinetId; size?: number }) {
  const g: Record<CabinetId, JSX.Element> = {
    'vector-golf': <><path d="M5 20l5-9 5 3 4-9" /><circle cx="19" cy="5" r="1.6" /><path d="M5 20h2" /></>,
    drone: <><circle cx="12" cy="12" r="2.2" /><path d="M10 10L5 5M14 10l5-5M10 14l-5 5M14 14l5 5" /><circle cx="4.5" cy="4.5" r="2" /><circle cx="19.5" cy="4.5" r="2" /><circle cx="4.5" cy="19.5" r="2" /><circle cx="19.5" cy="19.5" r="2" /></>,
    'hole-in-the-wall': <><path d="M3 4h18v16H3z" /><path d="M9 9h6v2h-3v4H9z" /></>,
    factory: <><path d="M3 17h18" /><circle cx="6" cy="19.5" r="1.5" /><circle cx="12" cy="19.5" r="1.5" /><circle cx="18" cy="19.5" r="1.5" /><path d="M6 17v-5h5v5M13 17V9h5v8" /></>,
    squash: <><path d="M5 3h14M12 3v6M7 9h10l-1 3H8z" /><path d="M4 21h16M6 21l1-5h10l1 5" /></>,
    rewind: <><path d="M4 12a8 8 0 1 0 3-6.2" /><path d="M4 4v5h5" /><path d="M12 8v4l3 2" /></>,
    'laser-lab': <><path d="M2 12h6" /><path d="M8 5c3 3 3 11 0 14M16 5c-3 3-3 11 0 14" /><path d="M16 12l6-3M16 12l6 3" /></>,
  };
  return wrap(g[id], { size });
}
