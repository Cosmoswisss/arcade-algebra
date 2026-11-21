import { useEffect, useState } from 'react';
import { CABINETS } from './engine/types';
import type { CabinetId } from './engine/types';

export type Route =
  | { name: 'title' } | { name: 'profile' } | { name: 'diagnostic' } | { name: 'hall' }
  | { name: 'course'; id: CabinetId } | { name: 'play'; id: CabinetId };

export function parseRoute(hash: string): Route {
  const [, a, b] = hash.replace(/^#/, '').split('/');
  const id = CABINETS.includes(b as CabinetId) ? (b as CabinetId) : null;
  if (a === 'profile') return { name: 'profile' };
  if (a === 'diagnostic') return { name: 'diagnostic' };
  if (a === 'hall') return { name: 'hall' };
  if (a === 'course' && id) return { name: 'course', id };
  if (a === 'play' && id) return { name: 'play', id };
  return { name: 'title' };
}

export const go = (path: string) => { location.hash = path; };

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
