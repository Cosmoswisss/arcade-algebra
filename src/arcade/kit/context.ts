import type { Application, Container } from 'pixi.js';
import type { Vec2 } from '../../engine/types';
import type { Sfx } from './audio';
import type { Coords } from './coords';
import type { Fx } from './fx';
import type { Handle, HandleOptions } from './handles';
import type { Layout } from './layout';
import type { Phase } from './runner';

/** Everything a cabinet's mini-game gets from the kit. */
export interface KitContext {
  app: Application;
  /** The game's own layer (shakes with the world). */
  layer: Container;
  layout: () => Layout;
  toScreen: (p: Vec2, origin?: Vec2, s?: number) => Vec2;
  toPlane: (x: number, y: number, origin?: Vec2) => Vec2;
  coords: Coords;
  fx: Fx;
  sfx: Sfx;
  clock: () => number;
  phase: () => Phase;
  handle: (o: Omit<HandleOptions, 'toPlane' | 'toScreen'> & Partial<Pick<HandleOptions, 'toPlane' | 'toScreen'>>) => Handle;
}
