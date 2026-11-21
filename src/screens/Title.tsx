import { useState } from 'react';
import MiniScene from '../arcade/kit/MiniScene';
import { go } from '../router';
import { useApp } from '../state';

const TEASER = [
  { matrix: [[1, 0], [0, 1]] as [[number, number], [number, number]], caption: 'Two arrows: î and ĵ.', ms: 1000 },
  { matrix: [[2, 0], [1, 1]] as [[number, number], [number, number]], caption: 'Move î… and the whole plane follows.', ms: 1800 },
];

export default function Title() {
  const { progress } = useApp();
  const [caption, setCaption] = useState('');
  return (
    <main className="screen title-screen">
      <div className="title-block">
        <p className="kicker">An arcade for linear algebra</p>
        <h1 className="display">Linear<br />Arcade</h1>
        <p className="lead">Seven cabinets, seven ideas, from vectors to eigenvectors. You learn by bending the plane with your own hands, not by reading formulas.</p>
        <button className="btn btn-primary btn-big" onClick={() => go(progress.profile ? '/hall' : '/profile')}>
          {progress.profile ? 'Enter the arcade' : 'Start'}
        </button>
      </div>
      <figure className="title-teaser">
        <MiniScene playKey={0} scene={TEASER} input="basis" onCaption={setCaption} height={380} />
        <figcaption className="mono">{caption || 'Your turn: drag the green arrow.'}</figcaption>
      </figure>
    </main>
  );
}
