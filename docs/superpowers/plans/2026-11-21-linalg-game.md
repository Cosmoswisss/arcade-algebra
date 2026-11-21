# Linear Algebra Warp Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** construire un jeu web en 2D où l'on apprend l'algèbre linéaire en tirant î et ĵ pour déformer la grille. Le jeu s'adapte au joueur grâce au diagnostic d'erreurs et au suivi de maîtrise.

**Architecture :**
- **Moteur** : du TypeScript pur dans `src/engine/`, sans React. On y trouve les maths 2×2, la vérification d'un niveau, le diagnostic, la maîtrise et la recommandation. Tout est testé avec Vitest.
- **Niveaux** : des fichiers JSON dans `src/levels/`, validés au chargement.
- **Interface** : des composants React dans `src/components/`, qui utilisent Mafs pour le dessin.

**Tech Stack :** Vite, React 18+, TypeScript (strict), `mafs@0.21.0`, `katex` et `react-katex` (ou le composant `LaTeX` de Mafs), Vitest.

**Spec :** `docs/superpowers/specs/2026-11-21-linalg-game-design.md`

## Global Constraints

- **Langue** : toute l'interface et tout le contenu des niveaux en anglais. Le code aussi (identifiants, noms de champs JSON).
- **Pas de chatbot** et pas de fenêtre de chat, nulle part. Pas d'IA générative dans la v1.
- **Pas de serveur, pas de comptes.** La progression est dans `localStorage`, sous la clé `lag.progress.v1`.
- **Ne jamais `git push`** ni créer de PR. Commits **locaux** uniquement.
- **Couleurs fixes** : î vert `#16a34a`, ĵ rouge `#dc2626`, grille fantôme gris clair.
- **Convention des matrices** : `Mat2 = [[a, b], [c, d]]`, stockée ligne par ligne. La colonne 1 `(a, c)` est l'image de î, la colonne 2 `(b, d)` est l'image de ĵ. Les fichiers JSON utilisent la même convention.
- **Valeurs par défaut d'un niveau** : magnétisme (`snap`) de `0.5`, tolérance de `0.1`.
- **Maîtrise** : vaut `0.2` au départ pour chaque compétence. Une compétence est « acquise » à partir de `0.6`.
- **Identifiants de compétences**, dans cet ordre : `vectors`, `combinations`, `matrix-transform`, `composition`, `determinant`, `inverse`, `eigen`.

## Review Focus

1. **Grille écrasée (det = 0)** : `inverse` renvoie `null`, et aucun `NaN` n'apparaît à l'écran ni dans la maîtrise. Testé en Tâche 1 et en Tâche 3.
2. **Fichier de niveau mal formé** : il est ignoré avec un message clair, et les autres niveaux se chargent quand même. Testé en Tâche 2.
3. **`localStorage` indisponible ou corrompu** : la progression repart des valeurs par défaut, sans planter. Testé en Tâche 5.
4. **Cible `direction` avec v = (0, 0)** : ce n'est jamais une réussite, même si M·v ∥ v est vrai de façon triviale. Testé en Tâche 3.
5. **î déposé sur ĵ, ou au centre** (base dépendante) : la grille s'écrase en ligne ou en point, et le rendu reste stable. Vérifié manuellement en Tâche 6.

---

## Organisation de l'équipe (3 personnes + Claude)

**Les rôles** (à confirmer entre vous) :

| Qui | Rôle | Fichiers dont il est propriétaire |
|---|---|---|
| **Toi** (pilote) | Tu fais coder Claude, tu relis, tu testes dans le navigateur et tu décides. | `src/engine/`, `src/components/`, `src/App.tsx` |
| **Ami 1** (auteur des puzzles) | Il invente les puzzles des compétences `vectors`, `combinations`, `matrix-transform` et `composition`, avec leurs indices. Il les écrit dans de petits fichiers, sans coder. | `src/levels/vectors-*`, `combinations-*`, `transform-*`, `composition-*` |
| **Ami 2** (auteur des puzzles) | Même rôle, pour `determinant`, `inverse` et `eigen`, plus les puzzles qui ciblent une erreur (`scale`, `one-column`). | `src/levels/det-*`, `inverse-*`, `eigen-*`, `error-*` |
| **Tous les 3** | La démo et le pitch, ensemble, à la fin. | `docs/pitch/` |

**Exemple de puzzle (ce que fait Ami 1) :**
« Le carré doit devenir un parallélogramme penché vers la droite et deux fois plus large. » Cela devient le fichier JSON `transform-01` (forme = le carré, cible = la matrice [[2,0],[1,1]], indices = « Where should the corner (1,0) go? »…). Pas besoin de savoir coder : il copie le modèle et change les nombres.

**Pourquoi ce découpage :** chacun a ses propres fichiers (les deux auteurs se partagent les compétences par préfixe de nom de fichier), donc personne n'écrit dans les fichiers d'un autre et il n'y a pas de conflits Git. Le format des puzzles est figé dès la Tâche 2. À partir de là, les deux amis peuvent en écrire en parallèle. Chacun teste aussi les puzzles de l'autre comme un débutant, et ils les font tester par les mentors Scholé.

**Git :**
- On ne pousse rien pour l'instant, c'est ta consigne. Tant que rien n'est poussé, tes amis n'ont pas le code.
- Les deux amis t'envoient leurs fichiers JSON et tu les déposes dans `src/levels/`. Ils testent sur ton ordinateur.
- Le jour où tu autorises un push : une branche par personne, et la fusion dans `main` passe par toi.

**Points de synchronisation :**
- **Après la Tâche 2** : le format des puzzles est figé, et les deux amis démarrent.
- **Après la Tâche 6** : le moment « clic » est jouable. Les deux amis font un premier test, puis on en fait un avec un mentor.
- **Après la Tâche 8** : boucle complète. Les deux amis refont un test, et on corrige.
- **À la fin** : démo et pitch, tous les 3 ensemble.

---

## Structure des fichiers

```
package.json, vite.config.ts, tsconfig.json, index.html
src/
  main.tsx
  App.tsx                    ← écran principal : carte des niveaux ou niveau en cours
  styles.css
  engine/
    types.ts                 ← Vec2, Mat2, SkillId, Level, Target, ErrorKind, Progress
    matrix.ts                ← maths 2×2 pures
    checkLevel.ts            ← le niveau est-il réussi ?
    diagnose.ts              ← quel type d'erreur ?
    mastery.ts               ← mise à jour de la maîtrise (BKT simplifié)
    recommend.ts             ← prochain niveau conseillé
    progress.ts              ← lecture/écriture dans localStorage
  levels/
    loader.ts                ← validateLevel + loadLevels (import.meta.glob)
    *.json                   ← un niveau par fichier
  components/
    WarpGrid.tsx             ← grille déformée + î/ĵ déplaçables + forme + trou
    MatrixPanel.tsx          ← matrice en direct, colonnes colorées
    ErrorReplay.tsx          ← ta grille par-dessus la bonne + message d'erreur
    HintBox.tsx              ← indices un par un
    LevelMap.tsx             ← liste des niveaux par compétence + jauges
tests/engine/*.test.ts, tests/levels/loader.test.ts
```

---

### Task 1 : Mise en place du projet et maths 2×2

**Files :**
- Créer : `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx` (affiche « Linear Algebra Warp » pour l'instant), `.gitignore` (`node_modules`, `dist`)
- Créer : `src/engine/types.ts`, `src/engine/matrix.ts`
- Test : `tests/engine/matrix.test.ts`

**Interfaces :**
- Produit (`types.ts`) :
  ```ts
  export type Vec2 = [number, number];
  export type Mat2 = [[number, number], [number, number]];
  export type SkillId = 'vectors' | 'combinations' | 'matrix-transform' | 'composition' | 'determinant' | 'inverse' | 'eigen';
  export const SKILLS: SkillId[]; // dans l'ordre des Global Constraints
  ```
- Produit (`matrix.ts`) :
  - `identity(): Mat2`
  - `fromBasis(i: Vec2, j: Vec2): Mat2`
  - `basis(m: Mat2): [Vec2, Vec2]`
  - `apply(m: Mat2, v: Vec2): Vec2`
  - `mul(a: Mat2, b: Mat2): Mat2`, qui applique b puis a
  - `det(m: Mat2): number`
  - `inverse(m: Mat2): Mat2 | null`
  - `swapColumns(m: Mat2): Mat2`
  - `scale(m: Mat2, k: number): Mat2`
  - `maxAbsDiff(a: Mat2, b: Mat2): number`

- [ ] **Étape 1 : Créer le projet à la main**

Ne pas lancer `npm create vite` à la racine : le dossier contient déjà des fichiers. Écrire les fichiers de config, puis :

```bash
npm i react react-dom mafs@0.21.0 katex
npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/katex vitest
```

Ajouter les scripts `dev`, `build`, `test` (`vitest run`) et le CSS de Mafs (`import 'mafs/core.css'` dans `main.tsx`).

- [ ] **Étape 2 : Écrire les tests qui échouent** (`tests/engine/matrix.test.ts`)

```ts
expect(fromBasis([2,1],[0,1])).toEqual([[2,0],[1,1]]);
expect(basis([[2,0],[1,1]])).toEqual([[2,1],[0,1]]);
expect(apply([[2,0],[1,1]], [1,1])).toEqual([2,2]);
expect(mul([[0,-1],[1,0]], [[2,0],[0,1]])).toEqual([[0,-1],[2,0]]); // on étire, puis on tourne
expect(det([[2,0],[1,1]])).toBe(2);
expect(det([[1,2],[2,4]])).toBe(0);
expect(inverse([[1,2],[2,4]])).toBeNull();                 // Review Focus 1
expect(inverse([[2,0],[0,4]])).toEqual([[0.5,0],[0,0.25]]);
expect(swapColumns([[2,0],[1,1]])).toEqual([[0,2],[1,1]]);
expect(maxAbsDiff([[1,0],[0,1]], [[1,0.05],[0,1]])).toBeCloseTo(0.05);
```

- [ ] **Étape 3 : Lancer `npm test` et vérifier l'échec** (attendu : FAIL, module introuvable)
- [ ] **Étape 4 : Écrire `types.ts` et `matrix.ts`.** `inverse` renvoie `null` si `|det| < 1e-9`.
- [ ] **Étape 5 : Lancer `npm test` (attendu : PASS) et `npm run dev`** (attendu : la page affiche le titre)
- [ ] **Étape 6 : Commit local**

```bash
git add -A && git commit -m "feat: scaffold Vite+React+Mafs and 2x2 matrix math"
```

---

### Task 2 : Format des niveaux, validation et chargement

**Files :**
- Modifier : `src/engine/types.ts`
- Créer : `src/levels/loader.ts`, `src/levels/transform-01.json`, `src/levels/transform-02-swap.json`
- Test : `tests/levels/loader.test.ts`

**Interfaces :**
- Produit (`types.ts`) :
  ```ts
  export type ErrorKind = 'swapped-columns' | 'sign-flip' | 'scale' | 'one-column' | 'composition-order' | 'other';
  export type Target =
    | { type: 'shape'; matrix: Mat2 }
    | { type: 'point'; from: Vec2; point: Vec2 }
    | { type: 'area'; det: number }
    | { type: 'direction' };          // le joueur déplace v, la matrice est `start`
  export interface Level {
    id: string; skill: SkillId; title: string; prompt: string;
    shape: Vec2[]; target: Target;
    movable: ('i' | 'j' | 'v')[];
    start: Mat2;          // par défaut, identity()
    pre?: Mat2;           // composition : transformation fixe appliquée AVANT celle du joueur
    snap: number;         // par défaut 0.5
    tolerance: number;    // par défaut 0.1
    hints: string[];
    targetsError?: ErrorKind;  // ce niveau entraîne précisément cette erreur
  }
  ```
- Produit (`loader.ts`) :
  - `validateLevel(raw: unknown): { ok: true; level: Level } | { ok: false; error: string }`
  - `loadLevels(): { levels: Level[]; errors: string[] }`, qui lit `import.meta.glob('./*.json', { eager: true })` et trie par `SKILLS` puis par `id`

- [ ] **Étape 1 : Tests qui échouent**

```ts
test('accepte le niveau exemple de la spec et remplit les valeurs par défaut', ...)
  // l'exemple JSON de la spec, section 6
  // → ok, snap 0.5, tolerance 0.1, start = identity
test('refuse un skill inconnu', ...)
  // → ok:false, error contient 'skill'
test('refuse une forme vide', ...)
  // → ok:false, error contient 'shape'
test('refuse une cible sans matrice 2×2', ...)
  // target {type:'shape', matrix:[[1,2]]} → ok:false
test("refuse un movable hors de 'i' | 'j' | 'v'", ...)
test('le message d’erreur cite l’id du niveau', ...)  // Review Focus 2
```

- [ ] **Étape 2 : Lancer les tests et vérifier l'échec**
- [ ] **Étape 3 : Écrire `validateLevel` et `loadLevels`.** Un fichier invalide donne une entrée dans `errors` (`"<fichier>: <raison>"`), jamais une exception.
- [ ] **Étape 4 : Écrire les 2 niveaux.**
  - `transform-01` : l'exemple de la spec.
  - `transform-02-swap` : cible `[[0,1],[2,0]]`, avec `targetsError: "swapped-columns"` et deux indices.
- [ ] **Étape 5 : Lancer les tests (attendu : PASS), puis commit local**
- [ ] **Étape 6 : Prévenir les deux amis que le format est figé.** Lui envoyer `transform-01.json` comme modèle de puzzle.

---

### Task 3 : Vérification d'un niveau

**Files :** Créer `src/engine/checkLevel.ts`. Test : `tests/engine/checkLevel.test.ts`

**Interfaces :**
- Consomme : `Level`, `Mat2`, `Vec2`, ainsi que `apply`, `mul`, `det` et `maxAbsDiff`
- Produit :
  - `effectiveMatrix(level: Level, m: Mat2): Mat2`, qui vaut `level.pre ? mul(m, level.pre) : m`
  - `checkLevel(level: Level, m: Mat2, v?: Vec2): boolean`

**Règles de réussite :**
- **`shape`** : `maxAbsDiff(effectiveMatrix, target.matrix) <= tolerance`
- **`point`** : la distance entre `apply(m, from)` et `point` est `<= tolerance`
- **`area`** : `|det(m) − target.det| <= tolerance`
- **`direction`** : `|v| >= 0.5` et `|cross(apply(start, v), v)| / (|v|·|apply(start, v)|) <= 0.05`. Si `apply(start, v)` est nul, c'est aussi une réussite (valeur propre 0).

- [ ] **Étape 1 : Tests qui échouent**

```ts
test('shape : réussi à 0.05 près, raté à 0.2', ...)
test('shape avec pre : utilise m·pre, pas pre·m', ...)
  // pre = rotation 90°, cible = mul(stretch, rot)
test('area : det -2 réussit seulement si la cible est -2', ...)
test('point : (1,0) envoyé sur (3,2)', ...)
test('direction : v = (1,0) avec start = [[2,0],[0,3]] → réussi ; v = (1,1) → raté', ...)
test('direction : v = (0,0) → jamais réussi', ...)        // Review Focus 4
test('aucune exception avec une matrice de det 0', ...)  // Review Focus 1
```

- [ ] **Étape 2 : Vérifier l'échec. Étape 3 : écrire le code. Étape 4 : PASS. Étape 5 : commit local.**

---

### Task 4 : Diagnostic des erreurs

**Files :** Créer `src/engine/diagnose.ts`. Test : `tests/engine/diagnose.test.ts`

**Interfaces :**
- Consomme : `checkLevel`, `effectiveMatrix`, `swapColumns`, `scale` et `mul`
- Produit :
  - `diagnose(level: Level, m: Mat2, v?: Vec2): ErrorKind | null`, qui renvoie `null` si le niveau est réussi
  - `ERROR_MESSAGES: Record<ErrorKind, string>`, les textes en anglais affichés au joueur

**Ordre des tests** (le premier qui correspond gagne, tolérance = `level.tolerance`). Seulement pour les cibles `shape` ; les autres types de cible renvoient `'other'` en cas d'échec.
1. **`composition-order`** : `level.pre` existe et `mul(level.pre, m) ≈ target`.
2. **`swapped-columns`** : `swapColumns(E) ≈ target`.
3. **`sign-flip`** : l'une des colonnes de E ≈ −1 × la même colonne de la cible, et l'autre colonne est correcte.
4. **`scale`** : il existe `k ∉ [0.9, 1.1]` tel que `scale(target, k) ≈ E`. On estime k comme le rapport des normes de Frobenius.
5. **`one-column`** : une seule colonne est fausse.
6. **`other`** : tout le reste.

**Messages :**
- `swapped-columns` : « You swapped î and ĵ: the first column is where î lands. »
- `sign-flip` : « One arrow points the wrong way. »
- `scale` : « Right directions, wrong size. »
- `one-column` : « One arrow is right. Fix the other one. »
- `composition-order` : « Order matters: this transformation happens after the first one. »
- `other` : « Not quite. Compare your grid with the ghost. »

- [ ] **Étape 1 : Tests qui échouent.** Un test par type d'erreur, avec la cible `[[2,0],[1,1]]` :
  - inversée → `[[0,2],[1,1]]` ;
  - signe → `[[-2,0],[-1,1]]` ;
  - échelle → `[[4,0],[2,2]]` ;
  - une colonne → `[[2,0],[1,3]]` ;
  - plus un test `composition-order` et un test « réussi → null ».
- [ ] **Étapes 2 à 5 : échec, code, PASS, commit local.**

---

### Task 5 : Maîtrise, recommandation et sauvegarde

**Files :** Créer `src/engine/mastery.ts`, `src/engine/recommend.ts`, `src/engine/progress.ts`. Tests : `tests/engine/{mastery,recommend,progress}.test.ts`

**Interfaces :**
- Produit (`types.ts`) : `interface Progress { mastery: Record<SkillId, number>; completed: string[]; lastError: ErrorKind | null }`
- Produit (`mastery.ts`) : `initialMastery()`, qui met chaque compétence à 0.2, et `updateMastery(p: number, correct: boolean, hintsUsed: number): number`
- Produit (`recommend.ts`) : `PREREQS: Record<SkillId, SkillId[]>` (chaque compétence exige la précédente dans `SKILLS`), et `recommend(levels: Level[], progress: Progress): Level | undefined`
- Produit (`progress.ts`) : `loadProgress(storage?: Storage): Progress`, `saveProgress(p: Progress, storage?: Storage): void`, `resetProgress(storage?: Storage): Progress`

**Calcul de la maîtrise** (BKT simplifié, paramètres fixés) :

```
slip = 0.1 ; learn = 0.15
guess = min(0.2 + 0.15·hintsUsed, 0.6)       // une réussite avec indices pèse moins
posterior = correct ? p(1−slip) / (p(1−slip) + (1−p)guess)
                    : p·slip / (p·slip + (1−p)(1−guess))
return clamp(posterior + (1−posterior)·learn, 0, 1)
```

**Recommandation :**
1. Si `lastError` existe, et qu'un niveau non terminé a `targetsError === lastError`, on le recommande.
2. Sinon, parmi les compétences dont tous les `PREREQS` sont à 0.6 ou plus, on prend la plus faible et son premier niveau non terminé.
3. Sinon, on prend le premier niveau non terminé.

- [ ] **Étape 1 : Tests qui échouent**

```ts
test('une réussite fait monter la maîtrise, un échec la fait baisser', ...)
test('une réussite avec 2 indices monte moins qu’une réussite sans indice', ...)
test('la maîtrise reste dans [0,1] après 50 réussites', ...)
test('recommend : propose le niveau ciblé après swapped-columns', ...)
test('recommend : ne propose pas determinant si matrix-transform < 0.6', ...)
test('loadProgress : un JSON corrompu donne les valeurs par défaut', ...)  // Review Focus 3
test('loadProgress : un storage qui lève une exception donne les valeurs par défaut', ...)
```

- [ ] **Étapes 2 à 5 : échec, code, PASS, commit local.** Clé de stockage : `lag.progress.v1`. Tout accès au storage est dans un `try/catch`.

---

### Task 6 : Le moment « clic » (WarpGrid et MatrixPanel)

**Files :** Créer `src/components/WarpGrid.tsx`, `src/components/MatrixPanel.tsx`. Modifier `src/App.tsx` pour afficher `transform-01` en dur.

**Interfaces :**
- Consomme : `Level`, `Mat2`, `basis`, `fromBasis` et `effectiveMatrix`
- Produit :
  - `<WarpGrid level={Level} m={Mat2} onChange={(m: Mat2) => void} v?={Vec2} onVChange?={(v: Vec2) => void} ghost?={Mat2} />`
  - `<MatrixPanel m={Mat2} />`

**À construire :**
- **La grille** : on ne s'appuie pas sur `Coordinates.Cartesian` pour la grille déformée. On dessine la grille d'origine en fantôme gris (lignes x = k et y = k pour k de −6 à 6). Par-dessus, on dessine la grille transformée avec des `Line.Segment` dont les extrémités passent par `apply(effectiveMatrix(level, m), …)`. Les axes transformés sont plus épais.
- **î et ĵ** : deux `MovablePoint` (vert et rouge) sur `basis(m)`. Seulement ceux qui figurent dans `level.movable`. Ils s'accrochent au pas `level.snap`, et chaque déplacement appelle `onChange(fromBasis(...))`.
- **La forme et le trou** : la forme transformée est un `Polygon` plein. Le « trou » est la forme sous `target.matrix`, en pointillés. Pour `area`, on affiche l'aire du carré unité transformé. Pour `direction`, on ajoute un `MovablePoint` v et son image.
- **`ghost`**, s'il est fourni : une seconde grille transformée, en gris pointillé (utilisée par `ErrorReplay`).
- **`MatrixPanel`** : la matrice en LaTeX, la colonne 1 en vert et la colonne 2 en rouge (`\color{}`), plus `det = …` en dessous.

- [ ] **Étape 1 : Construire les composants et les afficher dans `App` avec `transform-01`.** L'état `m` démarre à `level.start`. Pour un niveau `direction`, la grille montre `start`, qui reste fixe, et seul v bouge.
- [ ] **Étape 2 : Vérifier dans le navigateur** (`npm run dev`, panneau de prévisualisation) :
  - quand on tire î, toute la grille suit en direct, et la colonne verte de la matrice change ;
  - quand on dépose î sur ĵ, puis î au centre, la grille s'écrase sans erreur dans la console (Review Focus 5) ;
  - la page reste utilisable sur un écran de téléphone (375 px).
- [ ] **Étape 3 : Commit local, et prévenir les deux amis** que le « clic » est prêt à être testé.

---

### Task 7 : Boucle de jeu (Check, ErrorReplay, indices)

**Files :** Créer `src/components/ErrorReplay.tsx`, `src/components/HintBox.tsx`. Modifier `src/App.tsx`.

**Interfaces :**
- Consomme : `checkLevel`, `diagnose`, `ERROR_MESSAGES`, `updateMastery`, `recommend`, `loadProgress` et `saveProgress`
- Produit :
  - `<ErrorReplay level={Level} m={Mat2} kind={ErrorKind} onTargeted={() => void} onRetry={() => void} />`
  - `<HintBox hints={string[]} onReveal={(count: number) => void} />`

**Le bouton « Check » :**
1. On appelle `diagnose`.
2. **En cas de réussite**, on met à jour la maîtrise (`correct = true`, avec le nombre d'indices révélés), on ajoute le niveau à `completed`, on remet `lastError` à `null`, on sauvegarde, puis on affiche « Nice! » et un bouton « Next » vers `recommend(...)`.
3. **En cas d'échec**, on met à jour la maîtrise (`correct = false`), on enregistre `lastError`, puis on affiche `ErrorReplay`. Il montre la grille du joueur en couleur et la bonne en `ghost` (cible `shape` uniquement), le message, et deux boutons : « Practice this » (le niveau ciblé, s'il existe) et « Retry ».

**Les indices :** le bouton « Hint » révèle un indice à la fois, jamais de solution.

- [ ] **Étape 1 : Construire.** **Étape 2 : vérifier dans le navigateur** :
  - en inversant î et ĵ sur `transform-01`, on voit le message `swapped-columns`, puis « Practice this » ouvre `transform-02-swap` ;
  - la réussite fait monter la maîtrise ;
  - après rechargement, la progression est conservée.
- [ ] **Étape 3 : Commit local.**

---

### Task 8 : Carte des niveaux et jauges de maîtrise

**Files :** Créer `src/components/LevelMap.tsx`. Modifier `src/App.tsx`.

**Interface :** `<LevelMap levels={Level[]} progress={Progress} recommendedId?={string} onPick={(id: string) => void} onReset={() => void} />`

**À construire :**
- Une section par compétence, dans l'ordre de `SKILLS`, avec une jauge de maîtrise en pourcentage.
- Les niveaux réussis sont cochés, le niveau conseillé est mis en avant, et le joueur peut cliquer n'importe quel niveau.
- En bas, les erreurs de chargement de `loadLevels().errors` s'il y en a, et un bouton « Reset progress ».
- L'écran d'accueil de l'application est cette carte, avec un gros bouton « Play » qui mène au niveau conseillé.

- [ ] **Étape 1 : Construire.** **Étape 2 : vérifier dans le navigateur** :
  - un JSON volontairement cassé dans `src/levels/` affiche son erreur, et les autres niveaux restent jouables (Review Focus 2) ;
  - « Reset progress » remet tout à zéro.
- [ ] **Étape 3 : Commit local.**

---

### Task 9 : Contenu, au moins 2 niveaux par compétence

**Files :** Créer `src/levels/*.json`. Ces fichiers appartiennent aux deux amis : intégrer leurs puzzles s'ils existent, sinon écrire ceux-ci.

| Compétence | Niveaux (id → idée) |
|---|---|
| vectors | `vectors-01` : `movable:["i"]`, cible `point` from (1,0) vers (3,2) · `vectors-02` : vers (−2,1) |
| combinations | `combinations-01` : `movable:["i","j"]`, cible `point` from (2,1) vers (4,3) · `combinations-02` : from (1,−1) vers (0,2) |
| matrix-transform | `transform-01`, `transform-02-swap` (déjà faits) · `transform-03-sign`, avec `targetsError: "sign-flip"` |
| composition | `composition-01` : `pre` = rotation 90°, cible = mul(étirement, rotation) · `composition-02-order`, avec `targetsError: "composition-order"` |
| determinant | `det-01` : cible `area` 2 · `det-02` : cible `area` 0 (« Squash the plane flat ») · `det-03` : cible `area` −1 (« Flip it ») |
| inverse | `inverse-01` : `pre` = étirement [[2,0],[0,2]], cible `shape` = identité (« Undo it ») · `inverse-02` : `pre` = cisaillement [[1,1],[0,1]], cible identité |
| eigen | `eigen-01` : `movable:["v"]`, `start` [[2,0],[0,3]] · `eigen-02` : `start` [[2,1],[0,3]] |

Plus un niveau `error-scale` avec `targetsError: "scale"`, et un niveau `error-one-column` avec `targetsError: "one-column"`.

- [ ] **Étape 1 : Ajouter un test** dans `tests/levels/loader.test.ts` : `loadLevels()` ne renvoie aucune erreur, et chaque `SkillId` a au moins 2 niveaux. Chaque `ErrorKind` sauf `other` a au moins un niveau qui le cible.
- [ ] **Étape 2 : Écrire les JSON.** Lancer le test : PASS.
- [ ] **Étape 3 : Jouer chaque niveau dans le navigateur** et vérifier qu'il peut être réussi avec le magnétisme à 0.5.
- [ ] **Étape 4 : Commit local.**

---

### Task 10 : Préparer la démo

- [ ] **Étape 1 : Lancer `npm run build`** (attendu : succès, sans erreur TypeScript), puis `npx vite preview`. Rejouer le déroulé de démo de la spec (section 8) dans le panneau de prévisualisation. La démo et le pitch se préparent ensuite tous les 3 ensemble.
- [ ] **Étape 2 : Écrire un `README.md`** en anglais : ce que fait le jeu, `npm i && npm run dev`, et comment ajouter un niveau (le format JSON).
- [ ] **Étape 3 : Commit local.** Ne pas pousser. Le déploiement (GitHub Pages ou Vercel) se fera seulement quand tu autoriseras un push.

---

## Hors plan (bonus, si le temps le permet)
- Le mini-test de départ (3 niveaux de placement).
- La 3D avec React Three Fiber, en réutilisant le format des niveaux.
