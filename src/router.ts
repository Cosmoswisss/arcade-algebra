import { useEffect, useState } from 'react';
import { CABINETS } from './engine/types';
import type { CabinetId } from './engine/types';

export type Route =
  | { name: 'title' } | { name: 'profile' } | { name: 'diagnostic' } | { name: 'hall' } | { name: 'knowledge' } | { name: 'transfer'; id?: CabinetId }
  | { name: 'course'; id: CabinetId } | { name: 'play'; id: CabinetId };

export function parseRoute(hash: string): Route {
  const [, a, b] = hash.replace(/^#/, '').split('/');
  const id = CABINETS.includes(b as CabinetId) ? (b as CabinetId) : null;
  if (a === 'profile') return { name: 'profile' };
  if (a === 'diagnostic') return { name: 'diagnostic' };
  if (a === 'hall') return { name: 'hall' };
  if (a === 'knowledge') return { name: 'knowledge' };
  if (a === 'transfer') return id ? { name: 'transfer', id } : { name: 'transfer' };
  if (a === 'course' && id) return { name: 'course', id };
  if (a === 'play' && id) return { name: 'play', id };
  return { name: 'title' };
}

/** Hash links used by the screens: `go(href.hall)` or `<a href={href.course(id)}>`. */
export const href = {
  title: '#/',
  profile: '#/profile',
  diagnostic: '#/diagnostic',
  hall: '#/hall',
  knowledge: '#/knowledge',
  transfer: '#/transfer',
  /** The check at the end of one cabinet. */
  transferFor: (id: CabinetId) => `#/transfer/${id}`,
  course: (id: CabinetId) => `#/course/${id}`,
  play: (id: CabinetId) => `#/play/${id}`,
};

/** Accepts '/hall' or '#/hall'. */
export const go = (path: string) => { location.hash = path.replace(/^#/, ''); };

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
