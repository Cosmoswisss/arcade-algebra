import { ERROR_MESSAGES } from '../engine/diagnose';
import type { ErrorKind, Level, Mat2, Vec2 } from '../engine/types';
import WarpGrid from './WarpGrid';

interface Props {
  level: Level;
  m: Mat2;
  v?: Vec2;
  kind: ErrorKind;
  /** Undefined when no level targets this error. */
  onTargeted?: () => void;
  onRetry: () => void;
}

/** Freezes the player's grid and lays the correct one over it as a dashed ghost. */
export default function ErrorReplay({ level, m, v, kind, onTargeted, onRetry }: Props) {
  const ghost = level.target.type === 'shape' ? level.target.matrix : undefined;
  return (
    <div className="replay">
      <WarpGrid level={level} m={m} v={v} ghost={ghost} />
      <div className="feedback bad">
        <strong>{ERROR_MESSAGES[kind]}</strong>
        {ghost && <span className="muted"> Your shape is blue; the hole and the right grid are dashed.</span>}
        <div className="actions">
          {onTargeted && <button className="primary" onClick={onTargeted}>Practice this</button>}
          <button className={onTargeted ? '' : 'primary'} onClick={onRetry}>Retry</button>
        </div>
      </div>
    </div>
  );
}
