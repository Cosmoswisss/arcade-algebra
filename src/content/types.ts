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
  /** Said by the guide robot when the zone opens and when its boss is beaten (2 sentences max each). */
  story: CabinetStory;
}

export interface CabinetStory { intro: string; cleared: string }

export interface SceneStep { matrix: Mat2; caption: string; ms: number }

export type Question =
  | { kind: 'point'; prompt: string; given: { matrix?: Mat2; vectors?: Vec2[]; coeffs?: number[] }; answer: Vec2; tolerance: number }
  | { kind: 'basis'; prompt: string; given: { matrix: Mat2 }; answer: Mat2; tolerance: number }
  | { kind: 'number'; prompt: string; given: { matrix: Mat2 }; answer: number; tolerance: number }
  | { kind: 'choice'; prompt: string; options: string[]; answer: number };

export interface Wave { id: string; concept: string; params: unknown }

/** The lesson scene: the replay of a wave of this cabinet (from waves.json or drills.json). */
export interface LessonDemo { wave: string; rule: Rule }
/** "Your turn": a wave played for real, untimed. `mission` is the robot's story of it, per theme. */
export interface LessonPlay { wave: Wave; rule: Rule; mission: Record<Theme, string> }

/** A lesson has a demo, and exactly one of `play` (a wave) or `check` (a question). */
export interface CourseStep {
  id: string;
  title: string;
  text: Record<Mode, string>;
  examples: Record<Theme, string>;
  /** The robot's opening line (2 sentences max). */
  robot: string;
  demo: LessonDemo;
  play?: LessonPlay;
  check?: Question;
}

export type RobotEvent = 'right' | 'wrong' | 'hint' | 'retry' | 'warmup' | 'reminder' | 'placementSkip' | 'attract';
/** content/robot.json: generic lines per event, and per error kind for mistakes. */
export interface RobotLines { name: string; events: Record<RobotEvent, string[]>; errors: Record<string, string[]> }
export interface Drill { errorKind: string; label: string; waves: Wave[] }
export interface DexCard { concept: string; name: string; body: string; demo: Mat2 }
export interface Remedial { errorKind: string; title: string; text: Record<Mode, string>; scene?: SceneStep[] }

export interface CabinetContent { meta: CabinetMeta; course: CourseStep[]; waves: Wave[]; drills: Drill[]; dex: DexCard[] }

/** Validates a cabinet-specific `params` object. Returns null when valid, otherwise the reason. */
export type ParamsValidator = (params: unknown) => string | null;
