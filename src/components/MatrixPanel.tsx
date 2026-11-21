import katex from 'katex';
import { det } from '../engine/matrix';
import type { Mat2 } from '../engine/types';
import { I_COLOR, J_COLOR } from './colors';

const fmt = (x: number) => String(Math.round(x * 100) / 100);

export default function MatrixPanel({ m }: { m: Mat2 }) {
  const c = (x: number, col: string) => `\\color{${col}}{${fmt(x)}}`;
  const tex = `\\begin{bmatrix} ${c(m[0][0], I_COLOR)} & ${c(m[0][1], J_COLOR)} \\\\ ${c(m[1][0], I_COLOR)} & ${c(m[1][1], J_COLOR)} \\end{bmatrix}`;
  const html = katex.renderToString(tex, { throwOnError: false });
  return (
    <div className="matrix-panel">
      <div className="matrix-legend">
        <span style={{ color: I_COLOR }}>î lands here</span>
        <span style={{ color: J_COLOR }}>ĵ lands here</span>
      </div>
      <div className="matrix-tex" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="matrix-det">det = {fmt(det(m))}</div>
    </div>
  );
}
