import type { CabinetId } from '../engine/types';

/** Hand-made 2px line icons, one per cabinet (no emoji — see DESIGN.md). */
const PATHS: Record<CabinetId, JSX.Element> = {
  'vector-golf': <><path d="M18 46h28" /><path d="M36 46V14l12 6-12 6" /><circle cx="20" cy="40" r="3" /></>,
  drone: <><path d="M32 40L14 22" /><path d="M32 40l22-10" /><rect x="26" y="38" width="12" height="8" /></>,
  'hole-in-the-wall': <><rect x="12" y="12" width="40" height="36" /><path d="M24 40V22h8v8h10v10z" /></>,
  factory: <><path d="M10 44h44" /><circle cx="20" cy="30" r="7" /><circle cx="44" cy="30" r="7" /><path d="M27 30h10" /></>,
  squash: <><path d="M14 16h36v8H14z" /><path d="M32 24v6" /><path d="M16 46h32l-6-10H22z" /></>,
  rewind: <><path d="M22 20a14 14 0 1 1-4 14" /><path d="M14 16l8 4-4 8" /></>,
  'laser-lab': <><path d="M10 32h18" /><circle cx="34" cy="32" r="8" /><path d="M42 32h14" /><path d="M42 28l12-8" strokeDasharray="3 3" /></>,
};

export function CabinetIcon({ id, color }: { id: CabinetId; color: string }) {
  return (
    <svg viewBox="0 0 64 60" width="64" height="60" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
      {PATHS[id]}
    </svg>
  );
}
