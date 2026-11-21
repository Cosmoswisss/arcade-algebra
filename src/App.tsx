import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { loadContent } from './content/load';
import { loadProgressV2, saveProgressV2 } from './engine/progression';
import type { ProgressV2 } from './engine/progression';
import { useRoute } from './router';
import Hall from './screens/Hall';
import Play from './screens/Play';
import Course from './screens/Course';
import { DiagnosticSoon } from './screens/Placeholder';
import Profile from './screens/Profile';
import Title from './screens/Title';
import { AppCtx } from './state';

const content = loadContent();

export default function App() {
  const route = useRoute();
  const [progress, setProgressState] = useState<ProgressV2>(() => loadProgressV2());
  useEffect(() => { saveProgressV2(progress); }, [progress]);
  const state = useMemo(() => ({ content, progress, setProgress: setProgressState }), [progress]);

  let screen: JSX.Element;
  switch (route.name) {
    case 'profile': screen = <Profile />; break;
    case 'diagnostic': screen = <DiagnosticSoon />; break;
    case 'hall': screen = <Hall />; break;
    case 'course': screen = <Course id={route.id} />; break;
    case 'play': screen = <Play id={route.id} />; break;
    default: screen = <Title />;
  }
  const key = route.name + ('id' in route ? route.id : '');
  return (
    <AppCtx.Provider value={state}>
      <AnimatePresence mode="wait">
        <motion.div key={key} className="route" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
          {screen}
        </motion.div>
      </AnimatePresence>
    </AppCtx.Provider>
  );
}
