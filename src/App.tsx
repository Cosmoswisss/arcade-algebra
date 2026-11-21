import { useState } from 'react';
import MatrixPanel from './components/MatrixPanel';
import WarpGrid from './components/WarpGrid';
import type { Mat2 } from './engine/types';
import { loadLevels } from './levels/loader';

const { levels } = loadLevels();

export default function App() {
  const level = levels.find((l) => l.id === 'transform-01')!;
  const [m, setM] = useState<Mat2>(level.start);
  return (
    <main className="app">
      <h1>{level.title}</h1>
      <p>{level.prompt}</p>
      <div className="play">
        <WarpGrid level={level} m={m} onChange={setM} />
        <MatrixPanel m={m} />
      </div>
    </main>
  );
}
