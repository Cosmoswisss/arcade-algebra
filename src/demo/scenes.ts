import { applyWaveResult, defaultProgress } from '../engine/progression';
import type { ProgressV2 } from '../engine/progression';
import type { CabinetId, Rule } from '../engine/types';

type ConceptsOf = (id: CabinetId) => string[] | undefined;

/** A ready-made moment of the live demo: a progress state and the screen to open. */
export interface DemoScene {
  key: string;
  label: string;
  hash: string;
  /** The run starts at this tier (2: numbers only). */
  startTier?: 0 | 1 | 2;
  build: (conceptsOf: ConceptsOf) => ProgressV2;
}

const T0 = Date.UTC(2026, 10, 22, 9, 0, 0);

/** Plays `n` rounds of wins over every concept of a cabinet at a rule (evidence, XP and Dex cards, like a real player). */
function practise(p: ProgressV2, id: CabinetId, conceptsOf: ConceptsOf, rule: Rule, n: number): ProgressV2 {
  let q = p;
  const concepts = conceptsOf(id) ?? [];
  for (let k = 0; k < n; k++) for (const concept of concepts) {
    q = applyWaveResult(q, id, { correct: true, rule, firstTry: true, concept, boss: false }, concepts, T0 + k * 60_000).next;
  }
  return q;
}

const clear = (p: ProgressV2, id: CabinetId, celebrated: boolean): ProgressV2 => ({
  ...p,
  finished: p.finished.includes(id) ? p.finished : [...p.finished, id],
  everMastered: p.everMastered.includes(id) ? p.everMastered : [...p.everMastered, id],
  celebrated: celebrated && !p.celebrated.includes(id) ? [...p.celebrated, id] : p.celebrated,
});

const profiled = (): ProgressV2 => ({ ...defaultProgress(), profile: { mode: 'guided', theme: 'sport' } });

/** Two games cleared: the map, the badges and the warm-up already have something to show. */
function twoCleared(c: ConceptsOf): ProgressV2 {
  let p = profiled();
  for (const id of ['vector-golf', 'drone'] as CabinetId[]) {
    p = practise(p, id, c, 'assist', 1);
    p = practise(p, id, c, 'abstract', 2);
    p = clear(p, id, true);
  }
  return p;
}

function constellationPlayed(c: ConceptsOf): ProgressV2 {
  let p = practise(twoCleared(c), 'hole-in-the-wall', c, 'assist', 1);
  return practise(p, 'hole-in-the-wall', c, 'partial', 1);
}

function constellationCleared(c: ConceptsOf): ProgressV2 {
  return clear(practise(constellationPlayed(c), 'hole-in-the-wall', c, 'abstract', 2), 'hole-in-the-wall', false);
}

function withAMistake(c: ConceptsOf): ProgressV2 {
  let p = constellationCleared(c);
  const concepts = c('hole-in-the-wall') ?? [];
  for (let k = 0; k < 3; k++) {
    p = applyWaveResult(p, 'hole-in-the-wall', { correct: false, rule: 'abstract', firstTry: false, concept: concepts[concepts.length - 1] ?? 'combo', boss: false, errorKind: 'swapped-columns' }, concepts, T0 + 3_600_000 + k * 60_000).next;
  }
  return { ...p, celebrated: p.finished };
}

export const DEMO_SCENES: DemoScene[] = [
  { key: '1', label: 'New player: title screen', hash: '#/', build: () => defaultProgress() },
  { key: '2', label: 'Constellation lesson (2 games cleared)', hash: '#/course/hole-in-the-wall', build: twoCleared },
  { key: '3', label: 'Constellation game, numbers only', hash: '#/play/hole-in-the-wall', startTier: 2, build: constellationPlayed },
  { key: '4', label: 'Map: Constellation just cleared', hash: '#/hall', build: constellationCleared },
  { key: '5', label: 'My knowledge: a recurring mistake', hash: '#/knowledge', build: withAMistake },
];
