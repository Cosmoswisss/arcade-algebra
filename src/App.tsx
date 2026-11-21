import { useMemo, useState } from 'react';
import ErrorReplay from './components/ErrorReplay';
import HintBox from './components/HintBox';
import LevelMap from './components/LevelMap';
import MatrixPanel from './components/MatrixPanel';
import WarpGrid from './components/WarpGrid';
import { diagnose } from './engine/diagnose';
import { updateMastery } from './engine/mastery';
import { loadProgress, resetProgress, saveProgress } from './engine/progress';
import { recommend } from './engine/recommend';
import type { ErrorKind, Level, Mat2, Progress, Vec2 } from './engine/types';
import { loadLevels } from './levels/loader';

const { levels, errors } = loadLevels();
const START_V: Vec2 = [-1, 2];

type Result = null | { ok: true } | { ok: false; kind: ErrorKind };

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [levelId, setLevelId] = useState<string | undefined>(() => recommend(levels, loadProgress())?.id ?? levels[0]?.id);
  const level = useMemo(() => levels.find((l) => l.id === levelId), [levelId]);
  const [m, setM] = useState<Mat2>(level?.start ?? [[1, 0], [0, 1]]);
  const [v, setV] = useState<Vec2>(START_V);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [result, setResult] = useState<Result>(null);
  const [attempt, setAttempt] = useState(0); // remounts HintBox on level change
  const [screen, setScreen] = useState<'map' | 'play'>('map');

  const open = (l: Level | undefined) => {
    if (!l) return;
    setLevelId(l.id);
    setM(l.start);
    setV(START_V);
    setHintsUsed(0);
    setResult(null);
    setAttempt((a) => a + 1);
    setScreen('play');
  };

  const commit = (p: Progress) => { setProgress(p); saveProgress(p); };

  const check = () => {
    if (!level) return;
    const kind = diagnose(level, m, v);
    const mastery = { ...progress.mastery, [level.skill]: updateMastery(progress.mastery[level.skill], kind === null, hintsUsed) };
    if (kind === null) {
      commit({ mastery, completed: progress.completed.includes(level.id) ? progress.completed : [...progress.completed, level.id], lastError: null });
      setResult({ ok: true });
    } else {
      commit({ ...progress, mastery, lastError: kind });
      setResult({ ok: false, kind });
    }
  };

  if (screen === 'map' || !level) {
    const rec = recommend(levels, progress);
    return (
      <main className="app">
        <header className="hero">
          <h1>Linear Algebra Warp</h1>
          <p className="muted">Grab the arrows. Bend the plane. Discover what a matrix really is.</p>
          <button className="primary play-btn" disabled={!rec} onClick={() => open(rec)}>{rec ? 'Play' : 'All levels done!'}</button>
        </header>
        <LevelMap
          levels={levels} progress={progress} recommendedId={rec?.id} errors={errors}
          onPick={(id) => open(levels.find((l) => l.id === id))}
          onReset={() => setProgress(resetProgress())}
        />
      </main>
    );
  }

  const targeted = result && !result.ok
    ? levels.find((l) => l.targetsError === result.kind && l.id !== level.id)
    : undefined;

  return (
    <main className="app">
      <button className="back" onClick={() => setScreen('map')}>← Map</button>
      <h1>{level.title}</h1>
      <p>{level.prompt}</p>
      <div className="play">
        {result && !result.ok ? (
          <ErrorReplay
            level={level} m={m} v={v} kind={result.kind}
            onTargeted={targeted ? () => open(targeted) : undefined}
            onRetry={() => setResult(null)}
          />
        ) : (
          <WarpGrid level={level} m={m} onChange={result ? undefined : setM} v={v} onVChange={result ? undefined : setV} />
        )}
        <aside className="side">
          <MatrixPanel m={m} />
          {result?.ok ? (
            <div className="feedback good">
              <strong>Nice!</strong>
              <div className="actions">
                <button className="primary" onClick={() => open(recommend(levels, progress))}>Next</button>
              </div>
            </div>
          ) : !result && (
            <>
              <button className="primary check" onClick={check}>Check</button>
              <HintBox key={attempt} hints={level.hints} onReveal={setHintsUsed} />
            </>
          )}
          <p className="muted mastery-line">Mastery · {level.skill}: {Math.round(progress.mastery[level.skill] * 100)}%</p>
        </aside>
      </div>
    </main>
  );
}
