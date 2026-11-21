import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { SceneStep } from '../content/types';
import { apply, basis, fromBasis } from '../engine/matrix';
import type { Mat2, Vec2 } from '../engine/types';
import { ARROW_LIMIT, ARROW_STEP, H, OX, OY, POINT_LIMIT, SHAPE, U, W, fmtN, snapTo } from './geometry';

const sx = (x: number) => OX + x * U;
const sy = (y: number) => OY - y * U;
const IDENTITY: Mat2 = [[1, 0], [0, 1]];
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
const lerpM = (a: Mat2, b: Mat2, k: number): Mat2 => [[lerp(a[0][0], b[0][0], k), lerp(a[0][1], b[0][1], k)], [lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k)]];
const fmtV = (v: Vec2) => `(${fmtN(v[0])}, ${fmtN(v[1])})`;
const reduced = () => { try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

interface Props {
  /** Auto-playing animation: the grid morphs to each frame in turn. */
  frames?: SceneStep[];
  /** Interactive mode: the player drags î and ĵ. */
  interactive?: boolean;
  matrix?: Mat2;
  onChange?: (m: Mat2) => void;
  /** Point mode: the player clicks to place a point. */
  point?: Vec2 | null;
  onPoint?: (p: Vec2) => void;
  /** Draw this point as a marker the question is about. */
  marker?: Vec2 | null;
  label: string;
  showCaption?: boolean;
}

/** A small SVG plane for lessons: coordinates visible, arrows draggable with mouse, touch or arrow keys. */
export function MiniScene({ frames, interactive, matrix, onChange, point, onPoint, marker, label, showCaption = true }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [m, setM] = useState<Mat2>(matrix ?? frames?.[0]?.matrix ?? IDENTITY);
  const [caption, setCaption] = useState(frames?.[0]?.caption ?? '');
  const drag = useRef<'i' | 'j' | null>(null);
  const [selected, setSelected] = useState<'i' | 'j'>('i');

  // a given matrix: the starting arrows when interactive, the fixed transformation otherwise
  useEffect(() => { if (matrix && !frames) setM(matrix); }, [matrix, frames]);

  // playback
  useEffect(() => {
    if (!frames || frames.length === 0 || interactive) return;
    let raf = 0;
    let idx = 0;
    let from: Mat2 = frames[0].matrix;
    let start = performance.now();
    const TWEEN = reduced() ? 1 : 900;
    setM(frames[0].matrix); setCaption(frames[0].caption);
    const step = (now: number) => {
      const f = frames[idx];
      const t = now - start;
      if (t < TWEEN) setM(lerpM(from, f.matrix, ease(t / TWEEN)));
      else setM(f.matrix);
      if (t >= TWEEN + f.ms) {
        from = f.matrix; idx = (idx + 1) % frames.length; start = now;
        setCaption(frames[idx].caption);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [frames, interactive]);

  const [bi, bj] = basis(m);
  const gridLines = useMemo(() => {
    const out: JSX.Element[] = [];
    for (let k = -4; k <= 5; k++) {
      const a = apply(m, [k, -4]), b = apply(m, [k, 5]), c = apply(m, [-4, k]), d = apply(m, [5, k]);
      out.push(<line key={`v${k}`} x1={sx(a[0])} y1={sy(a[1])} x2={sx(b[0])} y2={sy(b[1])} />);
      out.push(<line key={`h${k}`} x1={sx(c[0])} y1={sy(c[1])} x2={sx(d[0])} y2={sy(d[1])} />);
    }
    return out;
  }, [m]);
  const shape = SHAPE.map((p) => apply(m, p)).map((p) => `${sx(p[0])},${sy(p[1])}`).join(' ');

  const toPlane = useCallback((e: { clientX: number; clientY: number }): Vec2 | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return [(p.x - OX) / U, (OY - p.y) / U];
  }, []);

  const setArrow = (which: 'i' | 'j', v: Vec2) => {
    const [ci, cj] = basis(m);
    const next = which === 'i' ? fromBasis(v, cj) : fromBasis(ci, v);
    setM(next); onChange?.(next);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag.current) return;
    const p = toPlane(e);
    if (p) setArrow(drag.current, [snapTo(p[0], ARROW_STEP, ARROW_LIMIT), snapTo(p[1], ARROW_STEP, ARROW_LIMIT)]);
  };
  const onKey = (which: 'i' | 'j') => (e: KeyboardEvent) => {
    const d: Record<string, Vec2> = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5] };
    if (!d[e.key]) return;
    e.preventDefault();
    const cur = which === 'i' ? bi : bj;
    setArrow(which, [snapTo(cur[0] + d[e.key][0], ARROW_STEP, ARROW_LIMIT), snapTo(cur[1] + d[e.key][1], ARROW_STEP, ARROW_LIMIT)]);
  };

  const handle = (which: 'i' | 'j', v: Vec2, color: string) => (
    <g key={which}>
      <circle cx={sx(v[0])} cy={sy(v[1])} r={22} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={(e) => { drag.current = which; setSelected(which); (e.target as Element).setPointerCapture?.(e.pointerId); }} />
      <circle cx={sx(v[0])} cy={sy(v[1])} r={11} fill={color} opacity={0.22} pointerEvents="none" />
      <circle cx={sx(v[0])} cy={sy(v[1])} r={6.5} fill={color} tabIndex={0} role="slider" aria-label={`Drag ${which === 'i' ? 'î' : 'ĵ'}, now at ${fmtV(v)}. Use the arrow keys.`}
        aria-valuetext={fmtV(v)} onKeyDown={onKey(which)} onFocus={() => setSelected(which)} stroke={selected === which ? '#e0e7ff' : 'none'} strokeWidth={2} />
    </g>
  );

  const labelStyle = { fontFamily: 'var(--font-mono)', fontWeight: 700 } as const;

  return (
    <figure className="mini-scene">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}
        onPointerMove={onMove} onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}
        onClick={(e) => { if (onPoint) { const p = toPlane(e); if (p) onPoint([snapTo(p[0], ARROW_STEP, POINT_LIMIT[0]), snapTo(p[1], ARROW_STEP, POINT_LIMIT[1])]); } }}
        style={{ touchAction: interactive ? 'none' : 'auto', cursor: onPoint ? 'crosshair' : undefined }}>
        <rect width={W} height={H} fill="#0a0620" />
        {/* the original grid, faint */}
        <g stroke="#6366f1" strokeOpacity={0.14} strokeWidth={1}>
          {[-3, -2, -1, 0, 1, 2, 3, 4].map((x) => <line key={`gx${x}`} x1={sx(x)} y1={0} x2={sx(x)} y2={H} />)}
          {[-2, -1, 0, 1, 2, 3].map((y) => <line key={`gy${y}`} x1={0} y1={sy(y)} x2={W} y2={sy(y)} />)}
        </g>
        {/* the transformed grid */}
        <g stroke="#6366f1" strokeOpacity={0.55} strokeWidth={1}>{gridLines}</g>
        <g stroke="#a5b4fc" strokeOpacity={0.8} strokeWidth={1.5}><line x1={0} y1={OY} x2={W} y2={OY} /><line x1={OX} y1={0} x2={OX} y2={H} /></g>
        <g fill="#a5b4fc" fontSize={10} style={{ fontFamily: 'var(--font-mono)' }} textAnchor="middle">
          {[-3, -2, -1, 1, 2, 3, 4].map((x) => <text key={`tx${x}`} x={sx(x)} y={OY + 14}>{x}</text>)}
          {[-2, -1, 1, 2, 3].map((y) => <text key={`ty${y}`} x={OX - 12} y={sy(y) + 3}>{y}</text>)}
        </g>
        <polygon points={shape} fill="#22d3ee" fillOpacity={0.28} stroke="#22d3ee" strokeWidth={2} strokeLinejoin="round" />
        {marker && <g><circle cx={sx(marker[0])} cy={sy(marker[1])} r={5} fill="#fde047" /><text x={sx(marker[0]) + 9} y={sy(marker[1]) - 8} fill="#fde047" fontSize={12} style={labelStyle}>{fmtV(marker)}</text></g>}
        {point && <g><circle cx={sx(point[0])} cy={sy(point[1])} r={7} fill="none" stroke="#fde047" strokeWidth={2.5} /><text x={sx(point[0]) + 11} y={sy(point[1]) - 9} fill="#fde047" fontSize={12} style={labelStyle}>{fmtV(point)}</text></g>}
        <line x1={OX} y1={OY} x2={sx(bi[0])} y2={sy(bi[1])} stroke="#4ade80" strokeWidth={3} strokeLinecap="round" />
        <line x1={OX} y1={OY} x2={sx(bj[0])} y2={sy(bj[1])} stroke="#f87171" strokeWidth={3} strokeLinecap="round" />
        <text x={sx(bi[0]) + 12} y={sy(bi[1]) + 16} fill="#4ade80" fontSize={12} style={labelStyle}>î {fmtV(bi)}</text>
        <text x={sx(bj[0]) + 12} y={sy(bj[1]) - 10} fill="#f87171" fontSize={12} style={labelStyle}>ĵ {fmtV(bj)}</text>
        {interactive && <>{handle('i', bi, '#4ade80')}{handle('j', bj, '#f87171')}</>}
      </svg>
      {showCaption && <figcaption aria-live="polite">{interactive ? 'Drag the arrow tips, or focus one and use the arrow keys.' : caption}</figcaption>}
    </figure>
  );
}
