import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Suspense, lazy, useEffect } from 'react';
import { levelOf } from './engine/progression';
import { go, href, useRoute, type Route } from './router';
import { StoreProvider, useStore } from './store';
import { Course } from './screens/Course';
import { Diagnostic } from './screens/Diagnostic';
import { Hall } from './screens/Hall';
import { Knowledge } from './screens/Knowledge';
import { Transfer } from './screens/Transfer';
import { Profile } from './screens/Profile';
import { Title } from './screens/Title';
import { LogoMark } from './ui/icons';

function TopBar() {
  const { progress } = useStore();
  return (
    <header className="topbar">
      <a className="brand" href={href.title} aria-label="Arcade Algebra, home"><LogoMark /><span>Arcade Algebra</span></a>
      <nav aria-label="Main">
        {progress.profile && <a href={href.hall}>Arcade hall</a>}
        {progress.profile && <a href={href.knowledge}>My knowledge</a>}
      </nav>
      {progress.profile && <a className="chip" href={href.hall} title="Your level and XP"><span className="mono">Lv {levelOf(progress.xp)}</span><span className="mono">{progress.xp} XP</span></a>}
    </header>
  );
}

/** PixiJS and the cabinets are about 1 MB: load them only when a cabinet is opened. */
const Play = lazy(() => import('./screens/Play').then((m) => ({ default: m.Play })));

const NEEDS_PROFILE: Route['name'][] = ['hall', 'knowledge', 'transfer', 'course', 'play', 'diagnostic'];

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'title': return <Title />;
    case 'profile': return <Profile />;
    case 'hall': return <Hall />;
    case 'knowledge': return <Knowledge />;
    case 'transfer': return <Transfer only={route.id} />;
    case 'diagnostic': return <Diagnostic />;
    case 'course': return <Course id={route.id} />;
    case 'play': return <Suspense fallback={<p className="loading" role="status">Powering up the game…</p>}><Play id={route.id} /></Suspense>;
    default: return (
      <main className="narrow">
        <h1>Page not found</h1>
        <a className="btn btn-primary" href={href.hall}>Back to the hall</a>
      </main>
    );
  }
}

function Shell() {
  const route = useRoute();
  const { progress } = useStore();
  const reduce = useReducedMotion();
  const guarded = NEEDS_PROFILE.includes(route.name) && progress.profile === null;
  useEffect(() => { if (guarded) go(href.profile); }, [guarded]);
  if (guarded) return null;

  const fullscreen = route.name === 'play';
  const key = route.name === 'course' || route.name === 'play' ? `${route.name}-${route.id}` : route.name === 'transfer' ? `transfer-${route.id ?? 'all'}` : route.name;
  return (
    <>
      {!fullscreen && <TopBar />}
      <AnimatePresence mode="wait">
        <motion.div key={key} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <Screen route={route} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
