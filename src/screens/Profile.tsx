import { useState } from 'react';
import type { Mode, Theme } from '../engine/types';
import { go } from '../router';
import { useApp } from '../state';

const LEVELS: { mode: Mode; label: string; sub: string }[] = [
  { mode: 'guided', label: 'High school', sub: 'More animations, step by step' },
  { mode: 'fast', label: 'University', sub: 'Shorter lessons, faster pace' },
];
const THEMES: { theme: Theme; label: string; sub: string }[] = [
  { theme: 'games', label: 'Video games', sub: 'Sprites, cameras, characters' },
  { theme: 'physics', label: 'Physics', sub: 'Forces, frames, motion' },
  { theme: 'ai', label: 'AI', sub: 'Images, data, models' },
];

/** Two clicks, no typing: the learner shapes the lessons without writing a prompt. */
export default function Profile() {
  const { progress, setProgress } = useApp();
  const [mode, setMode] = useState<Mode | null>(progress.profile?.mode ?? null);
  const [theme, setTheme] = useState<Theme | null>(progress.profile?.theme ?? null);
  const done = mode && theme;
  return (
    <main className="screen narrow">
      <p className="kicker">Before you play</p>
      <h1 className="h1">Two quick questions</h1>
      <section className="question">
        <h2 className="h2">Where are you at?</h2>
        <div className="choices">
          {LEVELS.map((l) => (
            <button key={l.mode} className={`choice ${mode === l.mode ? 'selected' : ''}`} onClick={() => setMode(l.mode)} aria-pressed={mode === l.mode}>
              <span className="choice-label">{l.label}</span><span className="choice-sub">{l.sub}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="question">
        <h2 className="h2">Which examples speak to you?</h2>
        <div className="choices">
          {THEMES.map((t) => (
            <button key={t.theme} className={`choice ${theme === t.theme ? 'selected' : ''}`} onClick={() => setTheme(t.theme)} aria-pressed={theme === t.theme}>
              <span className="choice-label">{t.label}</span><span className="choice-sub">{t.sub}</span>
            </button>
          ))}
        </div>
      </section>
      <button className="btn btn-primary btn-big" disabled={!done} onClick={() => { setProgress((p) => ({ ...p, profile: { mode: mode!, theme: theme! } })); go('/diagnostic'); }}>
        Continue
      </button>
    </main>
  );
}
