# Passation : « le cours devient un jeu » (branche `merge/v2-final`)

*Rédigé le 21/11/2026 par la session Claude de Camson, interrompue au milieu de l'exécution du plan. À lire en entier par le Claude qui reprend.*

## En une phrase

On exécute le plan `docs/superpowers/plans/2026-11-21-course-as-game.md`, qui met en œuvre la conception approuvée par Camson, `docs/superpowers/specs/2026-11-21-course-as-game-design.md`. **Les tâches 0 à 4 sont finies, la tâche 5 est commitée mais pas entièrement vérifiée, et les tâches 6 à 9 restent à faire, puis une relecture finale de toute la branche.**

## À lire avant de toucher au code, dans cet ordre

1. `CLAUDE.md` : règles de l'équipe (zones, réservations, commits).
2. **La conception** : `docs/superpowers/specs/2026-11-21-course-as-game-design.md`. C'est l'autorité : en cas de conflit avec le plan, elle l'emporte.
3. **Le plan** : `docs/superpowers/plans/2026-11-21-course-as-game.md`, en particulier « Global Constraints », « Review Focus » et les tâches 5 à 9.
4. Ce fichier, pour l'état réel et les décisions prises.

## D'où vient ce travail (pour le contexte)

- `merge/v2-final` réunit **le moteur et les 7 bornes de Camson** (`camson/v2`) avec **le front et les cours de Gabriel** (`gabriel/v2-shell`). C'est la base de travail.
- Après un test de l'équipe, Camson a demandé : un site **plus « jeu »** dès l'accueil et dans le cours (ambiance Codédex : **une carte du monde et une petite histoire**, mais en gardant **notre direction artistique néon**), **un robot-guide drôle**, **« Sport » à la place de « AI »**, et **plus d'adaptation**, avec **un test de placement qui serve à quelque chose**.
- Choix de Camson : **l'option A**. Dans le cours, la scène de chaque leçon est **le replay d'une vague du vrai jeu**, et le « Your turn » est **une vraie vague jouée, sans chrono**. Il a demandé **les 5 idées d'adaptation**, et une exécution du plan **dans une seule session** (« natif »), avec une relecture finale.

## État par tâche

| Tâche | État | Commits |
|---|---|---|
| 0 Réserver les fichiers partagés | ✅ | `05b0a2c` |
| 1 Thème Sport | ✅ | `0840b7c` |
| 2 Format des leçons, migration des 21 leçons, histoires, `robot.json` | ✅ | `b2bc2ae` |
| 3 Logique d'adaptation (`src/engine/adapt.ts`) | ✅ | `181e6ad` |
| 4 `ArcadeStage` + `DemoDriver` / `ChallengeDriver` + palier de départ | ✅ | `a2c2b9f` |
| 5 Robot (`src/ui/Robot.tsx`), `LessonPlay`, nouveau `Course.tsx` | ⚠️ commitée, **vérification navigateur incomplète** | `01c0337` |
| 6 Test de placement qui joue les vagues | ⏳ à faire | |
| 7 Carte « The Grid » | ⏳ à faire | |
| 8 Accueil en mode démo d'arcade | ⏳ à faire | |
| 9 Vérification d'ensemble, README, retrait de la réservation | ⏳ à faire | |
| Relecture finale de la branche | ⏳ à faire | |

**Tâche 5, déjà vu dans le navigateur :** l'intro du robot (histoire de la zone) et la scène de leçon (le replay de Vector Golf avec sa légende).
**Pas encore vérifié** (étape 4 de la tâche 5 dans le plan) :
- l'échelle d'indices sur 3 échecs d'une leçon `play` (nommer l'erreur, puis l'indice et la leçon de rattrapage, puis le replay et la vague d'entraînement) ;
- une réussite du premier coup qui ouvre la leçon suivante en version `fast` ;
- quitter le cours en plein « Your turn » puis revenir, sans erreur console ;
- 375 px de large, sans défilement horizontal.

**Commencez par finir cette vérification**, puis corrigez ce qu'elle révèle avant la tâche 6.

## Décisions prises pendant l'exécution (à respecter, ou à rediscuter avec Camson)

- **Factory** : sa leçon 1 (une seule machine) reste une question `check`, parce qu'une vague de Factory demande 2 ou 3 machines. Ses 2 leçons `play` sont donc les leçons 2 et 3.
- **Test de placement, provisoire** : il saute pour l'instant les bornes dont la dernière leçon est en `play` (aujourd'hui Factory), et le test `tests/content/diagnostic.test.ts` le dit explicitement. **La tâche 6 doit corriger ce test**, pour que les leçons `play` fassent partie du test de placement.
- **`DemoDriver`** fait une pause de 1,2 s sur la dernière image du replay avant de recommencer, pour que la dernière légende reste lisible.
- **Les scènes « compactes »** (`demo` et `challenge`) n'ont pas de HUD Pixi. La mission, la checklist, la légende et le bouton « Lock in » sont affichés en HTML par `LessonPlay`, à partir de `onStatus`. Aucune borne n'implémente `hud()`, donc rien n'est perdu.
- **`LessonPlay`** reçoit `onDone({ correct, firstTry })` au lieu de `onSolved(firstTry)` prévu dans le plan, et une variante `variant: 'single'` (une tentative, sans indices) pour l'échauffement et le test de placement. C'est ce que la tâche 6 doit utiliser.
- **Le robot s'appelle VEX.** Toutes ses répliques sont dans `content/robot.json` (2 phrases max, vérifié par le validateur et par `tests/content/robotLines.test.ts`).
- **Pixi est chargé à la demande** : `LazyStage` dans `src/arcade/playable.ts` charge `src/arcade/CabinetStage.tsx`. Le cours, l'accueil et le test de placement doivent passer par `LazyStage`, jamais importer `ArcadeStage` ou `registry.ts` directement.

## Points d'entrée du code

- **La scène** : `src/arcade/kit/ArcadeStage.tsx` (types `StageMode`, `StageStatus`, `StageControls`) ; les pilotes purs : `src/arcade/kit/drivers.ts`.
- **L'adaptation** : `src/engine/adapt.ts` (`nextHintStep`, `topError`, `reminderFor`, `warmUpPick`, `lessonPlan`, `startTier`) ; la progression gagne `errors` et `placed` (`src/engine/progression.ts`).
- **Le contenu** : `src/content/types.ts` (`CourseStep`, `LessonDemo`, `LessonPlay`, `CabinetStory`, `RobotLines`), la validation dans `src/content/schema.ts`, les outils dans `src/content/lessons.ts` (`findWave`, `allPlayableWaves`).
- **L'interface** : `src/ui/Robot.tsx`, `src/ui/robotLines.ts`, `src/ui/LessonPlay.tsx`, `src/screens/Course.tsx`.

## Astuces pour vérifier dans le navigateur

- **Si le panneau du navigateur est masqué**, `requestAnimationFrame` est bridé et le jeu tourne au ralenti. Pour l'inspection seulement, exécutez ceci dans la page (rien dans le code) :
  ```js
  const ch = new MessageChannel(), q = []; ch.port1.onmessage = () => { const c = q.splice(0); const t = performance.now(); c.forEach((f) => f(t)); };
  window.requestAnimationFrame = (cb) => { q.push(cb); if (q.length === 1) setTimeout(() => ch.port2.postMessage(0), 16); return 1; };
  ```
- **Après une modification à chaud** (HMR), des erreurs « useStore must be used inside StoreProvider » ou `placed` indéfini peuvent apparaître : ce sont des restes de l'état en mémoire. **Rechargez la page** avant de conclure à un bug. Pour ne voir que les nouvelles erreurs, collectez-les après le rechargement : `window.__errs = []; addEventListener('error', (e) => __errs.push(e.message));`.
- Pour tester les états de la carte (tâche 7), on peut écrire la progression dans `localStorage` (clé `linear-arcade.progress.v2`), puis recharger.

## Règles à respecter (rappel)

- Commits **en anglais**, préfixes `feat:` / `fix:` / `docs:` / `content:`, **aucune mention de Claude ni ligne `Co-Authored-By`**.
- `npm test` et `npx tsc --noEmit` passent avant chaque commit ; `npm run build` à la fin.
- **Ne rien pousser sans l'accord de la personne responsable de la session. Ne pas toucher à `main`. Seul Camson fusionne dans `main`.**
- La réservation de `CLAUDE.md` est au nom de Camson : **remplacez-la par votre prénom** dans un commit séparé si vous reprenez ces fichiers, et retirez-la à la fin (tâche 9).

## Pour reprendre avec les skills superpowers

Utilisez `superpowers:executing-plans` sur le plan. Le registre de suivi (`.superpowers/sdd/…/progress.md`) est ignoré par git et n'a donc pas été poussé. Recréez-le à partir de ce texte :

```
# SDD ledger — plan: docs/superpowers/plans/2026-11-21-course-as-game.md
Spec: docs/superpowers/specs/2026-11-21-course-as-game-design.md
Task 0: complete (commits 147bdc1..05b0a2c)
Task 1: complete (commits 05b0a2c..0840b7c)
Task 2: Ruling: factory lesson 1 (one machine) stays a check question — factory waves need 2-3 machines
Task 2: Ruling: placement test temporarily skips cabinets whose last lesson is play — T6 fixes it
Task 2: complete (commits 0840b7c..b2bc2ae)
Task 3: complete (commits b2bc2ae..181e6ad)
Task 4: Ruling: DemoDriver holds 1.2 s on the last replay frame — texts must stay readable
Task 4: Ruling: compact stages have no Pixi HUD; mission/checklist/caption/LOCK IN are HTML from onStatus
Task 4: complete (commits 181e6ad..a2c2b9f)
Task 5: Ruling: LessonPlay uses onDone({correct, firstTry}) and variant 'single' (warm-up, placement)
Task 5: IN PROGRESS — committed 01c0337; browser checks of step 4 still to do
```

**Pour finir** : collectez toutes les lignes `Ruling:` et les points mineurs reportés dans votre message final à Camson, puis faites la relecture de toute la branche (`superpowers:requesting-code-review`) en partant du commit `7a0dd24` (la conception), avec la section « Review Focus » du plan.
