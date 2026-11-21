import type { CabinetId, Mat2, Mode, Rule, Theme, Vec2 } from '../engine/types';

export interface CabinetMeta {
  id: CabinetId;
  order: number;
  name: string;
  notion: string;
  /** Exactly three tiers, in the order assist → partial → abstract. */
  tiers: { rule: Rule; banner: string; waves: Record<Mode, number> }[];
  /** Duration of a wave in the first tier, in seconds. */
  waveSeconds: Record<Mode, number>;
  boss: { waves: number };
}

export interface SceneStep { matrix: Mat2; caption: string; ms: number }

export type Question =
  | { kind: 'point'; prompt: string; given: { matrix?: Mat2; vectors?: Vec2[]; coeffs?: number[] }; answer: Vec2; tolerance: number }
  | { kind: 'basis'; prompt: string; given: { matrix: Mat2 }; answer: Mat2; tolerance: number }
  | { kind: 'number'; prompt: string; given: { matrix: Mat2 }; answer: number; tolerance: number }
  | { kind: 'choice'; prompt: string; options: string[]; answer: number };

export interface CourseStep {
  id: string;
  title: string;
  text: Record<Mode, string>;
  examples: Record<Theme, string>;
  scene?: SceneStep[];
  check: Question;
}

export interface Wave { id: string; concept: string; params: unknown }
export interface Drill { errorKind: string; label: string; waves: Wave[] }
export interface DexCard { concept: string; name: string; body: string; demo: Mat2 }
export interface Remedial { errorKind: string; title: string; text: Record<Mode, string>; scene?: SceneStep[] }

export interface CabinetContent { meta: CabinetMeta; course: CourseStep[]; waves: Wave[]; drills: Drill[]; dex: DexCard[] }

/** Validates a cabinet-specific `params` object. Returns null when valid, otherwise the reason. */
export type ParamsValidator = (params: unknown) => string | null;
