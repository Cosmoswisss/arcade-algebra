import { useState } from 'react';

interface Props {
  hints: string[];
  onReveal: (count: number) => void;
}

/** Reveals one hint at a time; never the solution. */
export default function HintBox({ hints, onReveal }: Props) {
  const [shown, setShown] = useState(0);
  if (hints.length === 0) return null;
  return (
    <div className="hints">
      {hints.slice(0, shown).map((h, k) => <p key={k} className="hint">💡 {h}</p>)}
      {shown < hints.length && (
        <button onClick={() => { const n = shown + 1; setShown(n); onReveal(n); }}>
          {shown === 0 ? 'Hint' : 'Another hint'}
        </button>
      )}
    </div>
  );
}
