import { SKILLS } from '../engine/types';
import type { Level, Progress, SkillId } from '../engine/types';

const SKILL_NAMES: Record<SkillId, string> = {
  vectors: 'Vectors',
  combinations: 'Combining arrows',
  'matrix-transform': 'Matrices are moves',
  composition: 'One move after another',
  determinant: 'Area & squashing',
  inverse: 'Undoing a move',
  eigen: 'Arrows that don’t turn',
};

interface Props {
  levels: Level[];
  progress: Progress;
  recommendedId?: string;
  errors?: string[];
  onPick: (id: string) => void;
  onReset: () => void;
}

export default function LevelMap({ levels, progress, recommendedId, errors = [], onPick, onReset }: Props) {
  return (
    <div className="map">
      {SKILLS.map((skill) => {
        const own = levels.filter((l) => l.skill === skill);
        if (own.length === 0) return null;
        const pct = Math.round(progress.mastery[skill] * 100);
        return (
          <section key={skill} className="skill">
            <div className="skill-head">
              <h2>{SKILL_NAMES[skill]}</h2>
              <div className="gauge" role="meter" aria-label={`${SKILL_NAMES[skill]} mastery`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="gauge-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="muted">{pct}%</span>
            </div>
            <div className="level-row">
              {own.map((l) => {
                const done = progress.completed.includes(l.id);
                const rec = l.id === recommendedId;
                return (
                  <button key={l.id} className={`level-btn${rec ? ' recommended' : ''}${done ? ' done' : ''}`} onClick={() => onPick(l.id)}>
                    {done ? '✓ ' : ''}{l.title}{rec ? ' · suggested' : ''}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {errors.length > 0 && (
        <div className="load-errors">
          <strong>Some levels could not be loaded:</strong>
          <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
      <button className="reset" onClick={onReset}>Reset progress</button>
    </div>
  );
}
