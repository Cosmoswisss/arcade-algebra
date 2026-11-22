import { useEffect, useState } from 'react';
import type { CabinetId } from '../engine/types';
import { go } from '../router';
import { useStore } from '../store';
import { demoRun } from './demo';
import { DEMO_SCENES } from './scenes';
import type { DemoScene } from './scenes';

/**
 * The presenter's hidden remote (live-demo mode only). Alt+1…5 loads a scene, Alt+0 shows or hides this list.
 * Only a faint dot shows on screen, so the audience sees the real game.
 */
export function DemoPanel() {
  const { content, loadScene } = useStore();
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const load = (s: DemoScene) => {
    const conceptsOf = (id: CabinetId) => content.cabinets[id]?.dex.map((d) => d.concept);
    const target = s.hash.match(/^#\/play\/([a-z-]+)/)?.[1] as CabinetId | undefined;
    demoRun.cabinet = target ?? null;
    demoRun.startTier = target ? (s.startTier ?? null) : null;
    demoRun.nonce += 1;
    const p = s.build(conceptsOf);
    // screens that need a profile redirect to the profile page: a scene without one changes screen first,
    // a scene with one loads its progress first
    if (p.profile || location.hash === s.hash) { loadScene(p); go(s.hash); }
    else {
      window.addEventListener('hashchange', () => loadScene(p), { once: true });
      go(s.hash);
    }
    setLast(s.key);
    setOpen(false);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.code === 'Digit0') { e.preventDefault(); setOpen((o) => !o); return; }
      const s = DEMO_SCENES.find((x) => e.code === `Digit${x.key}`);
      if (s) { e.preventDefault(); e.stopPropagation(); load(s); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  return (
    <div className="demo-remote" aria-label="Live demo remote">
      <button type="button" className="demo-dot" title="Live demo: Alt+0 for scenes" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {last ? `D${last}` : 'D'}
      </button>
      {open && (
        <ol className="demo-list">
          {DEMO_SCENES.map((s) => (
            <li key={s.key}><button type="button" onClick={() => load(s)}><kbd>Alt+{s.key}</kbd> {s.label}</button></li>
          ))}
        </ol>
      )}
    </div>
  );
}
