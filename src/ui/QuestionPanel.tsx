import { useEffect, useState, type ReactNode } from 'react';
import type { Answer } from './answers';
import type { Question } from '../content/types';
import type { Mat2, Vec2 } from '../engine/types';
import { MiniScene } from './MiniScene';
import { SLIDER } from './geometry';

const IDENTITY: Mat2 = [[1, 0], [0, 1]];

/** The input for one course question (prediction): arrows, a point, a number or a choice. */
export function QuestionPanel({ q, resetKey, onSubmit, submitLabel = 'Check my answer', children }: {
  q: Question;
  /** Change it to clear the answer (a new question, or a retry). */
  resetKey: string;
  onSubmit: (a: Answer) => void;
  submitLabel?: string;
  children?: ReactNode;
}) {
  const [basisM, setBasisM] = useState<Mat2 | null>(null);
  const [pointP, setPointP] = useState<Vec2 | null>(null);
  const [numberV, setNumberV] = useState(0);
  const [choiceI, setChoiceI] = useState<number | null>(null);
  useEffect(() => { setBasisM(null); setPointP(null); setNumberV(0); setChoiceI(null); }, [resetKey]);

  const fixed: Mat2 = (q.kind === 'point' || q.kind === 'number' ? q.given.matrix : undefined) ?? IDENTITY;
  const answer: Answer | null =
    q.kind === 'basis' ? { kind: 'basis', value: basisM ?? q.given.matrix }
      : q.kind === 'point' ? (pointP ? { kind: 'point', value: pointP } : null)
        : q.kind === 'number' ? { kind: 'number', value: numberV }
          : choiceI === null ? null : { kind: 'choice', value: choiceI };

  return (
    <div className="ask">
      <p className="prompt">{q.prompt}</p>
      {q.kind === 'basis' && <MiniScene interactive matrix={basisM ?? q.given.matrix} onChange={setBasisM} label="Plane with draggable arrows î and ĵ" />}
      {q.kind === 'point' && <MiniScene matrix={fixed} point={pointP} onPoint={setPointP} marker={q.given.vectors?.[0] ?? null} label="Plane: click where the point lands" />}
      {q.kind === 'number' && (
        <>
          <MiniScene matrix={fixed} label="The transformation to read" />
          <label className="slider">Your answer: <b className="mono">{numberV}</b>
            <input type="range" min={SLIDER.min} max={SLIDER.max} step={SLIDER.step} value={numberV} onChange={(e) => setNumberV(Number(e.target.value))} />
          </label>
        </>
      )}
      {q.kind === 'choice' && (
        <fieldset className="choices">
          <legend className="sr-only">Options</legend>
          {q.options.map((o, i) => (
            <label key={o} className={`choice ${choiceI === i ? 'is-on' : ''}`}>
              <input type="radio" name="opt" checked={choiceI === i} onChange={() => setChoiceI(i)} />
              <span className="choice-name mono">{o}</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="actions">
        <button className="btn btn-primary" disabled={!answer} onClick={() => answer && onSubmit(answer)}>{submitLabel}</button>
        {children}
      </div>
      {q.kind === 'point' && !pointP && <p className="tiny">Click on the plane to place your point.</p>}
    </div>
  );
}
