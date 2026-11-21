interface Props {
  hints: string[];
  /** How many hints are revealed; owned by the parent so it survives Retry. */
  shown: number;
  onReveal: (count: number) => void;
}

/** Reveals one hint at a time; never the solution. */
export default function HintBox({ hints, shown, onReveal }: Props) {
  if (hints.length === 0) return null;
  return (
    <div className="hints">
      {hints.slice(0, shown).map((h, k) => <p key={k} className="hint">💡 {h}</p>)}
      {shown < hints.length && (
        <button onClick={() => onReveal(shown + 1)}>{shown === 0 ? 'Hint' : 'Another hint'}</button>
      )}
    </div>
  );
}
