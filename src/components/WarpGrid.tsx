import { Line, Mafs, MovablePoint, Point, Polygon, Text, Vector } from 'mafs';
import { effectiveMatrix } from '../engine/checkLevel';
import { apply, basis, det, fromBasis } from '../engine/matrix';
import type { Level, Mat2, Vec2 } from '../engine/types';
import { GHOST_COLOR, I_COLOR, J_COLOR, SHAPE_COLOR, TARGET_COLOR } from './colors';

const N = 6;

interface Props {
  level: Level;
  m: Mat2;
  onChange?: (m: Mat2) => void;
  v?: Vec2;
  onVChange?: (v: Vec2) => void;
  /** A second transformed grid drawn dashed (used by ErrorReplay). */
  ghost?: Mat2;
  height?: number;
}

function GridLines({ m, color, opacity, dashed }: { m: Mat2; color: string; opacity: number; dashed?: boolean }) {
  const segs = [];
  for (let k = -N; k <= N; k++) {
    const weight = k === 0 ? 2.5 : 1;
    const style = dashed ? 'dashed' : 'solid';
    segs.push(
      <Line.Segment key={`x${k}`} point1={apply(m, [k, -N])} point2={apply(m, [k, N])} color={color} opacity={opacity} weight={weight} style={style} />,
      <Line.Segment key={`y${k}`} point1={apply(m, [-N, k])} point2={apply(m, [N, k])} color={color} opacity={opacity} weight={weight} style={style} />,
    );
  }
  return <>{segs}</>;
}

const snapTo = (step: number) => (p: Vec2): Vec2 =>
  step > 0 ? [Math.round(p[0] / step) * step, Math.round(p[1] / step) * step] : p;

const fmt = (x: number) => String(Math.round(x * 100) / 100);

export default function WarpGrid({ level, m, onChange, v, onVChange, ghost, height = 460 }: Props) {
  const e = effectiveMatrix(level, m);
  const [i, j] = basis(m);
  const t = level.target;
  const constrain = snapTo(level.snap);
  const canMove = (k: 'i' | 'j' | 'v') => level.movable.includes(k);

  return (
    <Mafs height={height} pan={false} zoom={false} viewBox={{ x: [-3, 4.5], y: [-2, 3.5] }}>
      {/* the untouched plane, as a faint ghost */}
      <GridLines m={[[1, 0], [0, 1]]} color={GHOST_COLOR} opacity={0.25} />
      {ghost && <GridLines m={ghost} color={GHOST_COLOR} opacity={0.9} dashed />}
      {/* the warped plane */}
      <GridLines m={e} color={SHAPE_COLOR} opacity={0.6} />

      {t.type === 'shape' && (
        <Polygon points={level.shape.map((p) => apply(t.matrix, p))} color={TARGET_COLOR} fillOpacity={0.12} strokeStyle="dashed" weight={3} />
      )}
      {t.type === 'point' && (
        <>
          <Polygon points={[[t.point[0] - 0.25, t.point[1] - 0.25], [t.point[0] + 0.25, t.point[1] - 0.25], [t.point[0] + 0.25, t.point[1] + 0.25], [t.point[0] - 0.25, t.point[1] + 0.25]]} color={TARGET_COLOR} fillOpacity={0.15} strokeStyle="dashed" />
          <Point x={apply(e, t.from)[0]} y={apply(e, t.from)[1]} color={SHAPE_COLOR} />
        </>
      )}
      {t.type === 'shape' && (
        <>
          {/* corners carried by î and ĵ, so a swap is visible */}
          <Point x={apply(t.matrix, [1, 0])[0]} y={apply(t.matrix, [1, 0])[1]} color={I_COLOR} opacity={0.5} />
          <Point x={apply(t.matrix, [0, 1])[0]} y={apply(t.matrix, [0, 1])[1]} color={J_COLOR} opacity={0.5} />
        </>
      )}
      {t.type !== 'direction' && (
        <Polygon points={level.shape.map((p) => apply(e, p))} color={SHAPE_COLOR} fillOpacity={0.3} weight={2} />
      )}
      {t.type === 'area' && (
        <Text x={-2.8} y={3.2} attach="e" size={18} color={SHAPE_COLOR}>{`area = ${fmt(det(e))}   (goal: ${fmt(t.det)})`}</Text>
      )}

      <Vector tip={i} color={I_COLOR} weight={4} />
      <Vector tip={j} color={J_COLOR} weight={4} />
      {canMove('i') && onChange && <MovablePoint point={i} color={I_COLOR} constrain={constrain} onMove={(p) => onChange(fromBasis(p, j))} />}
      {canMove('j') && onChange && <MovablePoint point={j} color={J_COLOR} constrain={constrain} onMove={(p) => onChange(fromBasis(i, p))} />}

      {t.type === 'direction' && v && (
        <>
          <Vector tip={apply(level.start, v)} color={TARGET_COLOR} weight={3} style="dashed" />
          <Vector tip={v} color={SHAPE_COLOR} weight={4} />
          {canMove('v') && onVChange && <MovablePoint point={v} color={SHAPE_COLOR} constrain={constrain} onMove={onVChange} />}
        </>
      )}
    </Mafs>
  );
}
