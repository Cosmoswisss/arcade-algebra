import CabinetView from '../arcade/kit/CabinetView';
import { GAMES } from '../arcade/registry';
import { loadContent } from '../content/load';
import { applyWaveResult, loadProgressV2, saveProgressV2 } from '../engine/progression';
import type { CabinetId } from '../engine/types';

const content = loadContent();

/** Temporary route (#/play/<id>) used before the full app shell exists. */
export default function PlayPreview({ id }: { id: CabinetId }) {
  const c = content.cabinets[id], make = GAMES[id];
  if (!c || !make) return <p style={{ color: 'white' }}>Cabinet not available: {id}</p>;
  let p = loadProgressV2();
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <CabinetView
        content={c} createGame={make} mode={p.profile?.mode ?? 'guided'}
        onWaveResult={(o) => { const r = applyWaveResult(p, id, o); p = r.next; saveProgressV2(p); return { newDex: r.newDex }; }}
        dex={() => ({ count: p.dex.length, total: c.dex.length, isNew: (k) => !p.dex.includes(k) })}
        onExit={() => { location.hash = ''; location.reload(); }}
      />
    </div>
  );
}
