import { useMemo } from 'react';
import { href } from '../router';
import { useStore } from '../store';
import { ArrowRight } from '../ui/icons';
import { MiniScene } from '../ui/MiniScene';
import type { SceneStep } from '../content/types';

const FRAMES: SceneStep[] = [
  { matrix: [[1, 0], [0, 1]], caption: 'Start: î = (1, 0), ĵ = (0, 1)', ms: 2200 },
  { matrix: [[2, 0], [0, 1]], caption: 'î moves to (2, 0): the whole grid stretches', ms: 2600 },
  { matrix: [[1, 1], [0, 1]], caption: 'ĵ moves to (1, 1): the grid leans', ms: 2600 },
  { matrix: [[0, -1], [1, 0]], caption: 'î → (0, 1), ĵ → (−1, 0): a quarter turn', ms: 2600 },
];

export function Title() {
  const { progress } = useStore();
  const frames = useMemo(() => FRAMES, []);
  const returning = progress.profile !== null;
  return (
    <main className="title">
      <div className="title-copy">
        <p className="eyebrow">7 arcade games · from vectors to eigenvectors</p>
        <h1>Linear Arcade</h1>
        <p className="lead">
          Learn linear algebra by playing. Drag two arrows, fit your shape through the hole in the wall, and see
          why a matrix is nothing more than <strong>where î and ĵ land</strong>.
        </p>
        <div className="actions">
          <a className="btn btn-primary" href={returning ? href.hall : href.profile}>
            {returning ? 'Back to the hall' : 'Insert coin'} <ArrowRight size={18} />
          </a>
          <a className="btn btn-secondary" href="#how">How it works</a>
        </div>
        <ol id="how" className="steps">
          <li><b>Learn</b><span>A one-minute lesson with a scene you can drag. Then a question where you predict the answer first.</span></li>
          <li><b>Play</b><span>A different arcade game for every idea. Walls come at you, so you read coordinates fast, then from the matrix alone.</span></li>
          <li><b>See your mistakes</b><span>Every miss is named — “you swapped î and ĵ” — replayed step by step, and trained on in the next wave.</span></li>
        </ol>
      </div>
      <div className="title-scene">
        <MiniScene frames={frames} label="A grid being stretched, sheared and turned by moving the two arrows î and ĵ" />
      </div>
    </main>
  );
}
