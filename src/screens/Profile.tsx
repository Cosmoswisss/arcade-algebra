import { useState } from 'react';
import type { Mode, Theme } from '../engine/types';
import { go, href } from '../router';
import { useStore } from '../store';
import { ArrowRight } from '../ui/icons';

const LEVELS: { mode: Mode; name: string; line: string }[] = [
  { mode: 'guided', name: 'High school', line: 'Step-by-step lessons, slower waves, longer replays, more waves before each new rule.' },
  { mode: 'fast', name: 'University', line: 'Short lessons, quick replays you can skip, rules that tighten sooner.' },
];
const THEMES: { theme: Theme; name: string; example: string }[] = [
  { theme: 'games', name: 'Games', example: 'A character stuck to a sticker on the screen moves whenever the sticker does.' },
  { theme: 'physics', name: 'Physics', example: 'A mark painted on a rubber sheet stays at the same grid coordinates while the sheet stretches.' },
  { theme: 'sport', name: 'Sport', example: 'A pass is a vector: 3 steps forward and 1 to the side lands the ball on your teammate.' },
];

export function Profile() {
  const { progress, setProfile } = useStore();
  const [mode, setMode] = useState<Mode | null>(progress.profile?.mode ?? null);
  const [theme, setTheme] = useState<Theme | null>(progress.profile?.theme ?? null);
  const example = THEMES.find((t) => t.theme === theme)?.example;
  return (
    <main className="narrow">
      <p className="eyebrow">Two clicks, then you play</p>
      <h1>Who is playing?</h1>
      <p className="lead">This sets the pace of the lessons and the examples you will read. You can change it later.</p>

      <fieldset className="choices">
        <legend>Your level</legend>
        {LEVELS.map((l) => (
          <label key={l.mode} className={`choice ${mode === l.mode ? 'is-on' : ''}`}>
            <input type="radio" name="level" checked={mode === l.mode} onChange={() => setMode(l.mode)} />
            <span className="choice-name">{l.name}</span>
            <span className="choice-line">{l.line}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choices choices-row">
        <legend>Examples from</legend>
        {THEMES.map((t) => (
          <label key={t.theme} className={`choice chip ${theme === t.theme ? 'is-on' : ''}`}>
            <input type="radio" name="theme" checked={theme === t.theme} onChange={() => setTheme(t.theme)} />
            <span className="choice-name">{t.name}</span>
          </label>
        ))}
      </fieldset>
      <p className="example" aria-live="polite">{example ? <>Example: {example}</> : <>Pick a theme to see an example.</>}</p>

      <div className="actions">
        <button className="btn btn-primary" disabled={!mode || !theme}
          onClick={() => { if (mode && theme) { setProfile(mode, theme); go(href.diagnostic); } }}>
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </main>
  );
}
