# Le cours devient un jeu : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire du cours une suite de vagues du vrai jeu, commentées par un robot-guide, dans une carte « The Grid » avec une histoire, un accueil en mode démo, le thème Sport et les 5 adaptations du document de conception.

**Architecture:** La mise en place Pixi de `CabinetView` est extraite dans un composant `ArcadeStage` piloté de trois façons (`run`, `demo`, `challenge`) ; les deux nouveaux modes n'utilisent que l'interface `CabinetGame` existante. Toute la logique d'adaptation est pure et testée dans `src/engine/adapt.ts`. Le contenu reste en JSON validé.

**Tech Stack:** Vite, React 18, TypeScript, PixiJS v8, Motion, KaTeX, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-course-as-game-design.md` (à lire en entier avant chaque tâche).

## Global Constraints

- Interface, contenu et code en anglais ; commits en anglais commençant par `feat:`, `fix:`, `docs:` ou `content:` ; **aucune mention de Claude ni ligne `Co-Authored-By`**.
- Avant chaque commit : `npm test` et `npx tsc --noEmit` passent.
- Branche `merge/v2-final` ; ne rien pousser sans accord ; ne pas toucher à `main`.
- Le robot ne répond jamais à du texte libre ; **2 phrases maximum** par réplique ; une réplique reste affichée jusqu'au clic ou à l'action suivante.
- Pas de pixel art ; style néon de `DESIGN.md` ; aucun personnage, dessin ou texte copié de Codédex ou d'un jeu existant.
- Chaque borne a **au moins 2 leçons sur 3 en `play`**.
- 375 px de large : pas de défilement horizontal. `prefers-reduced-motion` : pas de tremblement ni de particules.
- Un fichier de contenu invalide est signalé sur la carte et n'empêche pas les autres bornes de marcher.

## Review Focus

1. **Une progression enregistrée avant ce travail** (thème `ai`, pas de champ `errors` ni `placed`) se charge sans erreur et sans perte : thème → `games`, champs manquants → valeurs par défaut. *Test : Task 1 et Task 3.*
2. **Une leçon `play` dont la vague est fausse** (params invalides, ou sans solution) est refusée au chargement avec un message qui nomme la leçon. *Test : Task 2.*
3. **Quitter le cours en plein « Your turn »** (retour à la carte, changement de leçon) détruit l'application Pixi : pas de fuite, pas d'erreur console au retour. *Vérification navigateur : Task 5.*
4. **Le premier joueur, sans aucune borne précédente**, n'a pas d'échauffement ni de rappel d'erreur (et pas d'erreur). *Test : Task 3.*
5. **Un joueur qui rate 3 fois puis rate l'entraînement** reste sur l'entraînement (il peut réessayer ou revoir la leçon), il n'est jamais bloqué sans bouton. *Test : Task 3 (`nextHintStep`).*

---

### Task 0: Réserver les fichiers partagés

**Files:**
- Modify: `CLAUDE.md` (tableau « Réservations »)

- [ ] **Step 1:** Ajouter une ligne : `Camson | src/engine/types.ts, src/content/, content/README.md, content/cabinets/*/course.json, content/remedial/ | cours jouable, thème sport (spec 2026-11-21-course-as-game) | 21/11`.
- [ ] **Step 2:** Commit `docs: reserve shared files for the playable course`.

### Task 1: Le thème « Sport » remplace « AI »

**Files:**
- Modify: `src/engine/types.ts` (`Theme`, `THEMES`), `src/engine/progression.ts` (`loadProgressV2`), `src/content/schema.ts` (message `examples`), `src/screens/Profile.tsx` (`THEMES`), `src/screens/Course.tsx` (`THEME_NAME`), les 7 `content/cabinets/*/course.json` (clé `ai` → `sport`, texte réécrit sur le sport).
- Test: `tests/engine/progressV2.test.ts`, `tests/content/schema.test.ts`

**Interfaces:**
- Produces: `type Theme = 'games' | 'physics' | 'sport'`; `THEMES: Theme[] = ['games', 'physics', 'sport']`.

- [ ] **Step 1: Tests qui échouent**
  - `progressV2.test.ts` : `test('a saved ai theme loads as games, the rest is kept')` : une progression `{ profile: { mode: 'fast', theme: 'ai' }, xp: 40 }` enregistrée → `loadProgressV2(s).profile` vaut `{ mode: 'fast', theme: 'games' }` et `.xp` vaut `40`.
  - `schema.test.ts` : un `course.json` avec `examples: { games, physics, ai }` est refusé avec un message contenant `games, physics and sport`.
- [ ] **Step 2:** `npx vitest run tests/engine/progressV2.test.ts tests/content/schema.test.ts` → FAIL.
- [ ] **Step 3:** Implémenter. `loadProgressV2` : si `o.profile.theme === 'ai'`, le thème devient `'games'` (le mode est gardé). Exemple de profil Sport : `"A pass is a vector: 3 steps forward, 1 to the side lands the ball on your teammate."`
- [ ] **Step 4:** `npm test` → PASS. `grep -rn '"ai"' content src` → rien.
- [ ] **Step 5:** Commit `feat: sport theme replaces ai`.

### Task 2: Le nouveau format de leçon, l'histoire et le fichier du robot

**Files:**
- Modify: `src/content/types.ts`, `src/content/schema.ts`, `src/content/load.ts`, `content/README.md`
- Create: `content/robot.json`, `src/content/lessons.ts`
- Modify: les 7 `content/cabinets/*/course.json` (migration des 21 leçons) et `cabinet.json` (champ `story`)
- Modify: `src/screens/Course.tsx` (le strict minimum pour compiler : la scène de leçon disparaît jusqu'à la Task 5, `play` affiche « Coming next »)
- Test: `tests/content/schema.test.ts`, `tests/content/lessonInputs.test.ts`, les 7 `tests/cabinets/<id>.test.ts`

**Interfaces:**
- Produces (dans `src/content/types.ts`) :
  ```ts
  export interface LessonDemo { wave: string; rule: Rule }
  export interface LessonPlay { wave: Wave; rule: Rule; mission: Record<Theme, string> }
  export interface CourseStep { id: string; title: string; text: Record<Mode, string>; examples: Record<Theme, string>;
    robot: string; demo: LessonDemo; play?: LessonPlay; check?: Question }   // exactement un de play / check
  export interface CabinetStory { intro: string; cleared: string }
  // CabinetMeta gagne : story: CabinetStory
  export type RobotEvent = 'right' | 'wrong' | 'hint' | 'retry' | 'warmup' | 'reminder' | 'placementSkip' | 'attract';
  export interface RobotLines { events: Record<RobotEvent, string[]>; errors: Record<string, string[]> }
  ```
  `SceneStep` reste (utilisé par `Remedial.scene` et `MiniScene`).
- Produces (dans `src/content/lessons.ts`) :
  - `findWave(c: CabinetContent, id: string): Wave | null` (cherche dans `waves` puis dans les vagues des `drills`).
  - `allPlayableWaves(c: CabinetContent): Wave[]` = vagues + vagues d'entraînement + `play.wave` des leçons.
- Produces (chargeur) : `LoadedContent.robot: RobotLines` ; un `content/robot.json` invalide ou absent donne des listes vides et une erreur dans `errors`.

- [ ] **Step 1: Tests qui échouent** (`schema.test.ts`)
  - une leçon sans `demo` → erreur contenant `course.json#<id>: demo is required` ;
  - une leçon avec `play` **et** `check`, ou aucun des deux → erreur `exactly one of play or check` ;
  - `demo.wave` inconnu → erreur `demo wave "<id>" not found` ;
  - `play.wave.params` refusé par le validateur de la borne → erreur qui contient l'id de la leçon ;
  - `play.mission` sans les 3 thèmes → erreur ;
  - `robot` de plus de 2 phrases (compter `.`, `!`, `?` suivis d'un espace ou de la fin) → erreur `robot line: 2 sentences max` ;
  - `cabinet.json` sans `story.intro` / `story.cleared` → erreur ;
  - moins de 2 leçons en `play` dans une borne → erreur `at least 2 lessons must be play`.
- [ ] **Step 2:** Dans chaque `tests/cabinets/<id>.test.ts`, remplacer `[...c.waves, ...c.drills.flatMap((d) => d.waves)]` par `allPlayableWaves(c)`. `lessonInputs.test.ts` ne vérifie plus que les leçons en `check`. Lancer → FAIL (format pas encore migré).
- [ ] **Step 3:** Implémenter types, validation (`checkQuestion` reste pour `check`), `lessons.ts`, chargement de `content/robot.json`.
- [ ] **Step 4:** Migrer les 21 leçons : garder `id`, `title`, `text`, `examples` ; `scene` → `demo` (une vague existante qui montre la même idée) ; au moins 2 leçons par borne passent en `play` (vague écrite dans la leçon, mission dans les 3 thèmes) ; ajouter `robot`. Ajouter `story` aux 7 `cabinet.json`. Écrire `content/robot.json` (3 variantes par événement, une ligne par `errorKind` de `content/remedial/`), ton drôle et bienveillant. Le nom du robot est choisi ici et utilisé partout.
- [ ] **Step 5:** Mettre à jour `content/README.md` (format complet de `course.json`, `story`, `robot.json`, la règle des 2 leçons en `play`).
- [ ] **Step 6:** `npm test` et `npx tsc --noEmit` → PASS.
- [ ] **Step 7:** Commit `content: lessons play the real game, cabinet stories, robot lines`.

### Task 3: La logique d'adaptation (pure)

**Files:**
- Create: `src/engine/adapt.ts`
- Modify: `src/engine/progression.ts` (`ProgressV2`, `defaultProgress`, `loadProgressV2`, `applyWaveResult`, `placeFromDiagnostic`)
- Test: `tests/engine/adapt.test.ts`, `tests/engine/progression.test.ts`, `tests/engine/progressV2.test.ts`

**Interfaces:**
- Produces (dans `ProgressV2`) : `errors: Record<string, number>` (compte par `errorKind`) ; `placed: CabinetId[]` (bornes réussies au test).
- `WaveResult` gagne `errorKind?: string` ; `applyWaveResult` incrémente `errors[errorKind]` quand `correct` est faux et `errorKind` est donné.
- `placeFromDiagnostic(p, passed)` ajoute aussi `passed` à `placed` (sans doublon).
- Produces (dans `src/engine/adapt.ts`) :
  ```ts
  export type HintStep = 'named' | 'hint' | 'replay-then-drill' | 'drill';
  export function nextHintStep(failures: number): HintStep;            // 1 → named, 2 → hint, 3 → replay-then-drill, ≥4 → drill
  export function topError(p: ProgressV2, among?: string[]): string | null; // le plus fréquent (égalité : ordre alphabétique), filtré par `among`
  export function reminderFor(p: ProgressV2, c: CabinetContent): string | null; // topError parmi les errorKind des drills de c
  export function warmUpPick(p: ProgressV2, id: CabinetId, cabinets: Partial<Record<CabinetId, CabinetContent>>):
    { cabinet: CabinetId; wave: Wave } | null;
  export function lessonPlan(p: ProgressV2, id: CabinetId, c: CabinetContent): { steps: number[]; skipped: number };
  export function startTier(p: ProgressV2, id: CabinetId): 0 | 1;      // 1 si id ∈ placed
  ```
- `warmUpPick` : `null` pour la 1ʳᵉ borne ou si aucune borne précédente n'est ouverte (`cabinetState !== 'locked'`) ; sinon, si une borne précédente ouverte a un entraînement pour `topError(p)`, une vague de cet entraînement ; sinon la borne précédente ouverte de plus faible maîtrise et la `play.wave` de sa dernière leçon en `play`.
- `lessonPlan` : toutes les leçons (`steps = [0..n-1]`, `skipped = 0`), sauf si `id ∈ placed` : seulement la dernière (`steps = [n-1]`, `skipped = n-1`).

- [ ] **Step 1: Tests qui échouent** (`adapt.test.ts`) :
  - `nextHintStep(1..5)` → `named`, `hint`, `replay-then-drill`, `drill`, `drill` ;
  - `topError` : `{ 'swapped-xy': 3, 'sign-x': 3, 'scale': 1 }` → `'sign-x'` ; avec `among: ['scale']` → `'scale'` ; aucun → `null` ;
  - `warmUpPick` : `'vector-golf'` → `null` (aucune borne avant) ; progression neuve et `'drone'` → `{ cabinet: 'vector-golf', wave }` avec la `play.wave` de la dernière leçon `play` de Vector Golf ; avec `errors: { 'swapped-xy': 2 }` et un drill `swapped-xy` dans Vector Golf → `wave` est une vague de ce drill ;
  - `lessonPlan` : borne non placée → 3 étapes ; borne placée → `{ steps: [2], skipped: 2 }` ;
  - `startTier` → `1` seulement pour une borne placée.
- [ ] **Step 2: Tests qui échouent** (progression) : `applyWaveResult(p, id, { ...miss, errorKind: 'swapped-xy' }).next.errors['swapped-xy']` vaut `1` ; `placeFromDiagnostic` remplit `placed` ; `loadProgressV2` d'une ancienne sauvegarde sans `errors` / `placed` → `{}` et `[]`.
- [ ] **Step 3:** `npx vitest run tests/engine` → FAIL. Implémenter. Relancer → PASS.
- [ ] **Step 4:** Commit `feat: adaptivity rules (hint ladder, error memory, warm-up, placement skip)`.

### Task 4: `ArcadeStage` : la scène Pixi partagée, avec les modes démo et défi

**Files:**
- Create: `src/arcade/kit/ArcadeStage.tsx`, `src/arcade/kit/drivers.ts`
- Modify: `src/arcade/kit/CabinetView.tsx` (devient une fine couche sur `ArcadeStage` en mode `run`), `src/arcade/kit/runner.ts` (option `startTier`), `src/engine/waves.ts` (`tierFor` avec décalage), `src/screens/Play.tsx` (passe `startTier`)
- Test: `tests/cabinets/drivers.test.ts`, `tests/cabinets/runner.test.ts`, `tests/engine/waves.test.ts`

**Interfaces:**
- Consumes: `CabinetGame`, `Runner`, `startTier()` (Task 3).
- Produces (`drivers.ts`, pur, sans Pixi) :
  ```ts
  export class DemoDriver {       // rejoue une vague en boucle
    constructor(game: CabinetGame, wave: Wave, rule: Rule, opts?: { seconds?: number });   // durée d'un replay, 5 s par défaut
    tick(ms: number): void; restart(): void; readonly caption: string; readonly k: number;
  }
  export class ChallengeDriver {  // une vague, sans chrono
    constructor(game: CabinetGame, wave: Wave, rule: Rule, onDone: (r: { correct: boolean; diagnosis: Diagnosis | null }) => void);
    phase: 'play' | 'impact' | 'replay' | 'done'; tick(ms: number): void; lock(): void; showReplay(): void;
  }
  ```
  `ChallengeDriver` : en `play`, `t` reste à `0.12` et `game.update(dt, 0.12)` est appelé ; après `lock()`, `t` va de `0.12` à `1` en `0,6 s`, puis `evaluate()` et `onDone` ; `showReplay()` passe en `replay` (k de 0 à 1 en 5 s, puis `done`).
- Produces (`ArcadeStage.tsx`) :
  ```ts
  type StageMode =
    | { kind: 'run'; runner options… (comme CabinetView aujourd'hui) }
    | { kind: 'demo'; wave: Wave; rule: Rule; replayKey: number }
    | { kind: 'challenge'; wave: Wave; rule: Rule; attemptKey: number; onDone: (r) => void; onReplayDone?: () => void; showReplayKey?: number };
  export default function ArcadeStage(props: { content: CabinetContent; createGame: GameFactory; mode: StageMode; compact?: boolean; onCaption?: (s: string) => void }): JSX.Element;
  ```
  `compact` : pas de HUD de borne (vies, score, bouton « Arcade ») ; un bouton « LOCK IN » seulement en `challenge`. La région `aria-live` annonce la légende et la mission.
- `Runner` : `RunnerOptions.startTier?: 0 | 1` ; `tierFor(meta, mode, waveIndex, startTier = 0)` compte comme si `startTier` paliers étaient déjà joués.

- [ ] **Step 1: Tests qui échouent** (`drivers.test.ts`, avec un faux `CabinetGame` qui enregistre ses appels) : `DemoDriver` appelle `startWave(wave, rule)` une fois puis `replay(k)` avec `k` croissant, revient à `k = 0` après 5 s, et `restart()` remet `k` à 0 ; `ChallengeDriver` n'appelle jamais `evaluate()` tant que `lock()` n'est pas appelé, même après 60 s de `tick` ; après `lock()` et 0,6 s, `onDone` est appelé une seule fois avec le résultat de `evaluate()`.
- [ ] **Step 2: Tests qui échouent** : `tierFor(meta, 'guided', 0, 1)` vaut `1` ; un `Runner` créé avec `startTier: 1` commence sa 1ʳᵉ vague en règle `partial`.
- [ ] **Step 3:** Implémenter les drivers et `startTier`. Extraire la mise en place Pixi de `CabinetView` dans `ArcadeStage` (fond, axes, couche, effets, `declutter`, nettoyage) ; `CabinetView` garde ses props actuelles et rend `ArcadeStage` en mode `run`.
- [ ] **Step 4:** `npm test` → PASS ; dans le navigateur, les 7 bornes se jouent comme avant (briefing, replay, entraînement, XP, Dex).
- [ ] **Step 5:** Commit `feat: ArcadeStage with demo and untimed challenge modes`.

### Task 5: Le robot et le nouveau cours

**Files:**
- Create: `src/ui/Robot.tsx`, `src/ui/robotLines.ts`, `src/ui/LessonPlay.tsx`
- Modify: `src/screens/Course.tsx`, `src/store.tsx` (accès à `content.robot`), `src/styles.css`
- Test: `tests/content/robotLines.test.ts`

**Interfaces:**
- Consumes: `ArcadeStage` (Task 4), `adapt.ts` (Task 3), `findWave` (Task 2), `RobotLines` (Task 2), `applyWave` du store (`WaveResult` avec `errorKind`).
- Produces :
  - `robotLine(lines: RobotLines, event: RobotEvent, opts?: { errorKind?: string; rand?: () => number }): string` (pour `wrong`, la ligne de `errors[errorKind]` si elle existe, sinon une ligne de `events.wrong`) ;
  - `<Robot mood="idle" | "happy" | "oops" | "thinking" line={string} onNext?={() => void} />` : robot SVG néon original + bulle, animé avec Motion (sans mouvement si `prefers-reduced-motion`), la bulle a `role="status"` ;
  - `<LessonPlay cabinet={CabinetId} play={LessonPlay} theme={Theme} onSolved={(firstTry: boolean) => void} />` : la vague jouée et toute l'échelle d'indices.
- Le déroulé de `Course.tsx` :
  1. À la 1ʳᵉ leçon d'une borne : le robot dit `meta.story.intro`. Si `warmUpPick` donne une vague : une étape « Warm-up » (`LessonPlay` dans l'autre borne, une tentative, bouton « Skip »). Si `reminderFor` donne une erreur : le robot la rappelle. Si `lessonPlan.skipped > 0` : le robot dit la ligne `placementSkip` avec le nombre de leçons sautées, et les leçons sautées restent accessibles par les pastilles de progression.
  2. Leçon : texte + exemple du thème, robot (`step.robot`), `ArcadeStage` en `demo` (bouton « Replay from the start »).
  3. « Your turn » : `LessonPlay` (si `play`) ou `QuestionPanel` dans un cadre de jeu avec le robot (si `check`).
  4. Échelle d'indices (`nextHintStep`) : `named` = robot `wrong` + diagnostic, la partie fausse clignote (déjà fait par la borne) ; `hint` = robot `hint` + texte de `content.remedial[errorKind] ?? content.remedial.other` (et sa `MiniScene` s'il a une scène), la vague repasse en règle `assist` ; `replay-then-drill` = replay de la bonne réponse, puis une vague de `drills` pour cette erreur (ou la même vague si la borne n'en a pas) ; `drill` = cette vague encore, avec les boutons « Try again » et « Back to the lesson ».
  5. Chaque vague du cours passe par `applyWave` (maîtrise, XP, Dex, mémoire des erreurs) sans perte de vie ; une carte du Dex gagnée s'affiche dans le cours.
  6. Réussite du 1er coup → la leçon suivante s'ouvre en version `fast` (le sélecteur reste disponible).
  7. Fin du cours → « Play the game ».

- [ ] **Step 1: Test qui échoue** (`robotLines.test.ts`) : `robotLine` renvoie la ligne d'erreur propre à `swapped-xy` quand elle existe, une ligne `wrong` générique sinon ; toutes les lignes de `content/robot.json` font 2 phrases au plus ; chaque `errorKind` de `content/remedial/` a au moins une ligne.
- [ ] **Step 2:** `npx vitest run tests/content/robotLines.test.ts` → FAIL ; implémenter `robotLines.ts` → PASS.
- [ ] **Step 3:** Implémenter `Robot.tsx`, `LessonPlay.tsx` et le nouveau `Course.tsx`.
- [ ] **Step 4: Vérification navigateur** (pane visible, ou rAF accéléré comme à la fusion) : sur Vector Golf, une leçon `play` ratée 3 fois montre les 4 étapes dans l'ordre ; une réussite du 1er coup ouvre la leçon suivante en `fast` ; quitter en plein « Your turn » puis revenir ne laisse aucune erreur console ; à 375 px, pas de défilement horizontal.
- [ ] **Step 5:** Commit `feat: playable lessons with the guide robot and the hint ladder`.

### Task 6: Le test de placement qui compte

**Files:**
- Modify: `src/screens/Diagnostic.tsx`, `src/content/diagnostic.ts`
- Test: `tests/content/diagnostic.test.ts`

**Interfaces:**
- Produces : `diagnosticQuestions(cabinets)` renvoie `{ cabinet: CabinetId; play?: LessonPlay; question?: Question }[]` (la dernière leçon des bornes 1 à 5 ; `play` en priorité).
- Le test joue `play` avec `LessonPlay` en règle `abstract`, une seule tentative, sans échelle d'indices ; « Skip the test » appelle `placement(passed)` avec les réponses déjà données, puis va à la carte.

- [ ] **Step 1: Test qui échoue** : pour une borne dont la dernière leçon est en `play`, l'élément a `play` et pas `question`.
- [ ] **Step 2:** Implémenter ; `npm test` → PASS.
- [ ] **Step 3: Vérification navigateur** : réussir la 1ʳᵉ question puis « Skip » → Vector Golf est marquée sur la carte, son cours ne montre que la dernière leçon avec la réplique `placementSkip`, et la partie commence en règle `partial`.
- [ ] **Step 4:** Commit `feat: placement test plays the game and skips known lessons`.

### Task 7: La carte « The Grid »

**Files:**
- Create: `src/ui/GridMap.tsx`
- Modify: `src/screens/Hall.tsx`, `src/ui/Cabinet.tsx` (le dessin de zone peut réutiliser `CabinetGlyph`), `src/styles.css`

**Interfaces:**
- Consumes: `cabinetState`, `recommendedCabinet`, `CABINET_INFO`, `story`.
- Produces : `<GridMap states={Record<CabinetId, CabinetState>} available={(id) => boolean} recommended={CabinetId | null} onOpen={(id) => void} />` : SVG néon, 7 zones sur un chemin (en serpentin sur bureau, vertical sous 640 px), marqueur « YOU » sur la zone conseillée, zones terminées rallumées avec leur badge, zones verrouillées éteintes et non cliquables. Chaque zone est un lien clavier (`<a>`) avec un `aria-label` qui donne le nom et l'état.
- `Hall.tsx` garde le panneau niveau / XP / badges / Dex, la liste des erreurs de contenu, et les liens « Change level or theme », « Take the placement test », « Reset progress ».

- La 1ʳᵉ fois qu'une zone apparaît terminée sur la carte, le robot dit son `story.cleared` (les zones déjà saluées sont gardées dans `ProgressV2.celebrated: CabinetId[]`, chargé à `[]` depuis une ancienne sauvegarde ; test dans `tests/engine/progressV2.test.ts`).

- [ ] **Step 1:** Implémenter.
- [ ] **Step 2: Vérification navigateur** : 4 états visibles (forcer la progression comme à la fusion) ; navigation au clavier ; 375 px sans défilement horizontal.
- [ ] **Step 3:** `npm test` et `npx tsc --noEmit` → PASS. Commit `feat: The Grid world map replaces the cabinet row`.

### Task 8: L'accueil en mode démo d'arcade

**Files:**
- Modify: `src/screens/Title.tsx`, `src/styles.css`, `src/arcade/playable.ts` (import différé partagé)

**Interfaces:**
- Consumes: `ArcadeStage` en `demo`, `findWave`, `robotLine(…, 'attract')`.
- Produces : la scène de droite fait défiler les bornes jouables, dans l'ordre, chacune avec la `demo` de sa 1ʳᵉ leçon pendant un replay complet, avec le nom de la borne en néon et une réplique du robot. Le texte de gauche s'affiche sans attendre Pixi (`ArcadeStage` chargé avec `lazy` et un `Suspense` qui garde la place).

- [ ] **Step 1:** Implémenter.
- [ ] **Step 2: Vérification navigateur** : le titre et « Insert coin » sont visibles avant la fin du chargement de Pixi ; les 7 bornes défilent ; aucune erreur console.
- [ ] **Step 3:** Commit `feat: arcade attract mode on the title screen`.

### Task 9: Vérification d'ensemble et documentation

**Files:**
- Modify: `README.md` (section « How it adapts » et « Under the hood »), `CLAUDE.md` (retirer la réservation)

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npm run build` → PASS.
- [ ] **Step 2: Parcours complet dans le navigateur** : profil (thème Sport) → test de placement → carte → cours (démo, `play` raté puis réussi, robot, carte du Dex) → borne → retour à la carte ; puis une 2ᵉ borne (échauffement, rappel d'erreur).
- [ ] **Step 3:** Mettre à jour le README ; retirer la réservation de `CLAUDE.md`.
- [ ] **Step 4:** Commit `docs: README for the playable course and adaptivity`.
