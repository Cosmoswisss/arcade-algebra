# Linear Arcade v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** transformer le jeu v1 en **Linear Arcade**. C'est une salle d'arcade de 7 bornes, chacune avec son mini-jeu PixiJS et un cours court avant, et toutes appliquent le schéma pédagogique en 8 règles validé dans le prototype.

**Architecture :**
- **Le moteur** : TypeScript pur dans `src/engine/`. C'est la v1 étendue, testée avec Vitest.
- **Le contenu** : des JSON dans `content/`, validés au chargement par `src/content/`.
- **Le kit d'arcade** : du code PixiJS commun à toutes les bornes, dans `src/arcade/kit/`. Il contient le rendu néon, le son, les effets et la machine à états des vagues.
- **Les bornes** : une par dossier dans `src/arcade/cabinets/`. Chacune ne fournit que sa mécanique propre.
- **L'interface** : les écrans React dans `src/screens/`.

**Tech Stack :** Vite, React 18, TypeScript (strict), `pixi.js@8`, `motion`, KaTeX, Vitest. On retire `mafs` à la fin.

**Spec :** `docs/superpowers/specs/2026-11-21-linalg-game-v2-design.md`. Le prototype de référence est `docs/prototypes/hole-in-the-wall.html`.

## Global Constraints

- **Langue** : interface, contenu, code et messages de commit **en anglais**.
- **Commits locaux** sur la branche `camson/v2`, créée depuis `main`. **Jamais de `Co-Authored-By`** ni aucune mention de Claude. **Jamais de `git push`** sans l'accord explicite de Camson.
- **Pas de chat**, pas d'IA générative, pas de serveur. La progression est dans `localStorage`, sous la clé **`linear-arcade.progress.v2`**.
- **Couleurs fixes** : î / u en vert `#4ade80`, ĵ / v en rouge `#f87171`, cible en jaune `#fde047`, joueur en cyan `#22d3ee`, accent en rose `#f0abfc`, fond `#05030f`.
- **Convention des matrices** (comme en v1) : `Mat2 = [[a, b], [c, d]]` stockée ligne par ligne. La colonne 1 est l'image de î, la colonne 2 celle de ĵ.
- **Le schéma pédagogique en 8 règles** (spec §4.3) est **obligatoire dans chaque borne** : briefing, coordonnées, checklist, paliers de règles, replay qui attend un clic, erreur nommée puis entraînement, Dex, boucle arcade.
- **Lisibilité** : aucun texte ne disparaît en moins de 3 s. Le briefing, le replay et les cartes du Dex attendent un clic ou ESPACE.
- **Rythme** : le premier palier de chaque borne est **lent**. Pour la borne 3, c'est 16 s par mur en `guided` et 12 s en `fast`.
- **Maîtrise** : vaut 0,2 au départ. Une borne est « mastered » à partir de 0,6. Une réussite au diagnostic la met à 0,7.
- **Identifiants des bornes**, dans cet ordre : `vector-golf`, `drone`, `hole-in-the-wall`, `factory`, `squash`, `rewind`, `laser-lab`.

## Review Focus

1. **Fichier de contenu cassé** (JSON invalide ou champ manquant) : il est listé sur la carte, la borne concernée est désactivée, et les autres restent jouables. Testé en Tâche 2.
2. **Grille écrasée** (det = 0) dans Squash! et Rewind : aucun `NaN` dans le rendu, dans le score ni dans la maîtrise. Testé en Tâches 3, 11 et 12.
3. **Onglet en arrière-plan** : le ticker Pixi reçoit un `deltaMS` énorme. `dt` est plafonné à 0,05 s, pour qu'un mur ne « saute » pas l'impact sans que le résultat soit calculé. Testé en Tâche 6 (`clampDt`).
4. **Démontage d'une borne** (retour à la carte en pleine vague) : l'application Pixi est détruite, l'AudioContext n'est pas dupliqué et il n'y a pas de fuite de ticker. Vérifié en Tâche 6 (aucun avertissement dans la console après 5 allers-retours).
5. **Entrée tactile** sur téléphone (375 px) : les poignées se saisissent, la page ne défile pas pendant un glissement, et les textes du briefing tiennent dans l'écran. Vérifié en Tâches 7 et 16.

---

## Organisation (rappel, voir aussi CLAUDE.md)

| Qui | Fait quoi | Dès quand |
|---|---|---|
| **Camson + Claude** | toutes les tâches de ce plan | maintenant |
| **Ami 1** | le contenu des bornes 1 à 4 dans `content/cabinets/01-…` à `04-…` | après la Tâche 2 (format figé) |
| **Ami 2** | le contenu des bornes 5 à 7 dans `content/cabinets/05-…` à `07-…`, et `content/remedial/` | après la Tâche 2 |

Les tâches qui écrivent du contenu d'exemple (Tâches 2 et 10 à 15) **intègrent celui des amis s'il existe déjà**, sinon elles écrivent le minimum jouable. Elles ne doivent jamais écraser un fichier d'un ami sans le lire d'abord.

---

## Structure des fichiers

```
content/
  README.md                         ← guide d'écriture pour les amis (format + exemples)
  cabinets/0N-<id>/{cabinet,course,waves,drills,dex}.json
  remedial/<errorKind>.json
src/
  engine/        (v1 conservé)  + waves.ts, progression.ts, diagnoseKinds.ts
  content/       types.ts, schema.ts (validateurs), load.ts
  arcade/kit/    neon.ts, audio.ts, fx.ts, coords.ts, handles.ts, hud.ts, runner.ts, CabinetView.tsx
  arcade/cabinets/<id>/game.ts       ← implémente CabinetGame
  screens/       Title.tsx, Profile.tsx, Diagnostic.tsx, Hall.tsx, Course.tsx, Play.tsx
  App.tsx        ← routeur à base de hash (#/hall, #/course/<id>, #/play/<id>)
tests/  engine/*, content/*, cabinets/*
```

---

### Task 1 : Branche, dépendances, nettoyage

**Files :** modifier `package.json` et `.gitignore` (ajouter `.superpowers`), supprimer `dist/` du suivi s'il y est.

- [ ] **Étape 1 :** `git checkout -b camson/v2` depuis `main`.
- [ ] **Étape 2 :** `npm i pixi.js@^8.6 motion`. Lancer `npm test` : 77/77 doivent toujours passer.
- [ ] **Étape 3 :** commit local `chore: add pixi.js and motion for v2`.

---

### Task 2 : Format du contenu (à figer en premier)

**Files :**
- Créer `src/content/types.ts`, `src/content/schema.ts`, `src/content/load.ts` et `content/README.md`.
- Créer `content/cabinets/03-hole-in-the-wall/*.json`, à partir des pools, des entraînements et du Dex du prototype.
- Créer `content/remedial/{swapped-columns,sign-flip,one-column,scale,composition-order,other}.json`.
- Tests : `tests/content/schema.test.ts` et `tests/content/load.test.ts`.

**Interfaces (Produces) :** `CabinetId`, `CABINETS`, `Mode`, `Theme` et `Rule` sont définis dans `src/engine/types.ts`, pour que le moteur reste indépendant du dossier `content/`. Le reste est défini dans `src/content/types.ts`.

```ts
export type CabinetId = 'vector-golf' | 'drone' | 'hole-in-the-wall' | 'factory' | 'squash' | 'rewind' | 'laser-lab';
export const CABINETS: CabinetId[];               // ordre ci-dessus
export type Mode = 'guided' | 'fast';
export type Theme = 'games' | 'physics' | 'ai';
export type Rule = 'assist' | 'partial' | 'abstract'; // 3 paliers de la règle 4 du §4.3

export interface CabinetMeta {
  id: CabinetId; order: number; name: string; notion: string;
  tiers: { rule: Rule; banner: string; waves: Record<Mode, number> }[]; // length 3, dans l'ordre assist→partial→abstract
  waveSeconds: Record<Mode, number>;              // durée du 1er palier
  boss: { waves: number };
}
export interface CourseStep {
  id: string; title: string;
  text: Record<Mode, string>;                     // Markdown simple + $maths$
  examples: Record<Theme, string>;
  scene?: { matrix: Mat2; caption: string; ms: number }[];
  check: Question;
}
export type Question =
  | { kind: 'point'; prompt: string; given: { matrix?: Mat2; vectors?: Vec2[]; coeffs?: number[] }; answer: Vec2; tolerance: number }
  | { kind: 'basis'; prompt: string; given: { matrix: Mat2 }; answer: Mat2; tolerance: number }
  | { kind: 'number'; prompt: string; given: { matrix: Mat2 }; answer: number; tolerance: number }
  | { kind: 'choice'; prompt: string; options: string[]; answer: number };
export interface Wave { id: string; concept: string; params: unknown } // params validés par la borne
export interface Drill { errorKind: string; label: string; waves: Wave[] }
export interface DexCard { concept: string; name: string; body: string; demo: Mat2 }
export interface Remedial { errorKind: string; title: string; text: Record<Mode, string>; scene?: CourseStep['scene'] }
export interface CabinetContent { meta: CabinetMeta; course: CourseStep[]; waves: Wave[]; drills: Drill[]; dex: DexCard[] }

export type ParamsValidator = (params: unknown) => string | null;   // null = ok
export function validateCabinet(files: Record<string, unknown>, paramsValidator: ParamsValidator): { ok: true; content: CabinetContent } | { ok: false; errors: string[] };
export function loadContent(): { cabinets: Partial<Record<CabinetId, CabinetContent>>; remedial: Record<string, Remedial>; errors: string[] };
```

- **Les validateurs de `params`** sont fournis par chaque borne, via `src/arcade/cabinets/<id>/params.ts`. Ils sont enregistrés dans `src/content/paramsRegistry.ts`.
- **Dans cette tâche, seul `hole-in-the-wall`** a un validateur : `params = { matrix: Mat2 }`. Les autres bornes utilisent un validateur provisoire qui accepte tout et renvoie `null`. Chaque Tâche de borne le remplace par son vrai validateur.

**Le README de `content/` est figé ici.** Pour chaque borne, il donne la forme exacte de `params`, telle qu'elle sera validée :

| Borne | `params` |
|---|---|
| vector-golf | `{ shots: Vec2[]; start: Vec2; hole: Vec2; walls: [Vec2, Vec2][] }` |
| drone | `{ u: Vec2; v: Vec2; target: Vec2; reachable: boolean }` |
| hole-in-the-wall | `{ matrix: Mat2 }` |
| factory | `{ machines: { name: string; matrix: Mat2 }[]; target: Mat2 }` (l'ordre de la solution = l'ordre de la liste) |
| squash | `{ matrix: Mat2 }` (la réponse est `det`) |
| rewind | `{ matrix: Mat2; image: 'mountains' \| 'city' \| 'face' }` (`det = 0` ⇒ réponse « can't repair ») |
| laser-lab | `{ matrix: Mat2 }` (réponse : un vecteur propre réel, ou « none ») |

- [ ] **Étape 1 : Écrire les tests qui échouent.**
  - accepte le contenu de la borne 3 ;
  - refuse une matrice 1×2 en citant le fichier et l'id de la vague ;
  - refuse un `tiers` qui n'a pas 3 paliers ;
  - **un JSON invalide** (chaîne `'{ "id": }'`) donne une erreur, et les autres bornes se chargent quand même (Review Focus 1) ;
  - `loadContent()` sur le contenu livré renvoie `errors: []`.
- [ ] **Étape 2 :** lancer `npm test`. Attendu : FAIL.
- [ ] **Étape 3 :** implémenter.
  - Les fichiers sont lus avec `import.meta.glob('/content/**/*.json', { query: '?raw', import: 'default', eager: true })`, puis `JSON.parse` dans un `try/catch`, comme le chargeur v1.
  - Écrire `content/README.md` : le format, un exemple complet par fichier, et la règle « ajoute la solution dans le test de ta borne ».
- [ ] **Étape 4 :** lancer `npm test`. Attendu : PASS.
- [ ] **Étape 5 : commit local**, `feat: content format v2 and loader`. **Prévenir Camson que le format est figé**, pour qu'il donne le feu vert aux amis.

---

### Task 3 : Moteur, choix des vagues et diagnostics par type de réponse

**Files :** créer `src/engine/waves.ts` et `src/engine/diagnoseKinds.ts`. Tests : `tests/engine/waves.test.ts` et `tests/engine/diagnoseKinds.test.ts`.

**Interfaces (Produces) :**

```ts
export interface RunState { mode: Mode; waveIndex: number; tierIndex: number; focus: string | null; lastWaveId: string | null; lives: number; score: number; combo: number }
export function tierFor(meta: CabinetMeta, mode: Mode, waveIndex: number): number;     // 0..2, puis 2 pour le boss
export function waveSeconds(meta: CabinetMeta, mode: Mode, tierIndex: number): number; // 1er palier = meta.waveSeconds[mode], puis ×0.85 par palier, min 6
export function nextWave(content: CabinetContent, run: RunState, rand: () => number): { wave: Wave; isDrill: boolean; drillLabel?: string };
export function isBossWave(meta: CabinetMeta, mode: Mode, waveIndex: number): boolean;
// diagnostics génériques (Diagnosis = { kind: string; text: string; wrongParts: boolean[] })
export function diagnoseBasis(player: Mat2, target: Mat2, tol: number): Diagnosis | null; // réutilise la logique v1 : swapped-columns, sign-flip, one-column, scale, other
export function diagnoseVector(player: Vec2, target: Vec2, tol: number): Diagnosis | null; // swapped-xy, sign-x, sign-y, other
export function diagnoseNumber(player: number, target: number, tol: number): Diagnosis | null; // wrong-sign, missed-zero, other
```

**Règles de `nextWave` :**
- si `run.focus` correspond à un entraînement, on choisit une vague de ce drill, différente de `lastWaveId`, avec `isDrill: true` ;
- sinon, on prend une vague au hasard dans le pool, différente de `lastWaveId`.

- [ ] **Étape 1 : Tests qui échouent.**
  - `tierFor` en guided avec des paliers `{3, 3, 4}` : vague 0 → 0, vague 3 → 1, vague 6 → 2 ;
  - `waveSeconds` décroît et ne passe jamais sous 6 ;
  - `nextWave` sort un drill quand `focus` est posé, et ne répète jamais la même vague deux fois de suite (sur 200 tirages avec `rand` déterministe) ;
  - `diagnoseBasis` reproduit les 5 cas v1 ;
  - `diagnoseVector([2,3],[3,2])` renvoie `swapped-xy` ;
  - `diagnoseNumber(-2, 2)` renvoie `wrong-sign` ;
  - `diagnoseNumber(1, 0)` renvoie `missed-zero` ;
  - `diagnoseNumber(NaN, 2)` renvoie `other` sans exception (Review Focus 2).
- [ ] **Étapes 2 à 5 :** échec, implémentation, PASS, commit local `feat: wave director and answer diagnostics`.

---

### Task 4 : Moteur, progression (XP, Dex, ouverture des bornes, mode dynamique)

**Files :** créer `src/engine/progression.ts` et remplacer `src/engine/progress.ts` par la v2 (même API défensive, nouvelle clé). Tests : `tests/engine/progression.test.ts` et `tests/engine/progress.test.ts` (à adapter).

**Interfaces (Produces) :**

```ts
export interface ProgressV2 {
  profile: { mode: Mode; theme: Theme } | null;
  mastery: Record<CabinetId, number>; finished: CabinetId[]; xp: number;
  dex: string[];                       // concepts débloqués
  modeOverride: Partial<Record<CabinetId, Mode>>;
  streak: { cabinet: CabinetId | null; fails: number; firstTryWins: number };
}
export const levelOf: (xp: number) => number;                   // floor(xp/100)+1
export function cabinetState(p: ProgressV2, id: CabinetId): 'locked' | 'open' | 'mastered' | 'finished';
export function applyWaveResult(p: ProgressV2, id: CabinetId, r: { correct: boolean; rule: Rule; firstTry: boolean; concept: string; boss: boolean }): { next: ProgressV2; xpGained: number; newDex: string | null; suggestMode: Mode | null };
export function placeFromDiagnostic(p: ProgressV2, passed: CabinetId[]): ProgressV2; // mastery 0.7 pour chaque borne réussie
```

**Règles :**
- **XP** : +10 par vague réussie, +5 si `rule === 'abstract'`, +50 pour un boss. Une vague ratée ne rapporte rien.
- **Maîtrise** : on appelle `updateMastery` de la v1 avec `hintsUsed = rule === 'assist' ? 2 : rule === 'partial' ? 1 : 0`, pour que les réussites avec aides comptent moins.
- **Mode dynamique** :
  - 2 échecs de suite en `fast` sur la même borne → `suggestMode: 'guided'` ;
  - 3 réussites du premier coup de suite en `guided` → `suggestMode: 'fast'`.
- **Fin de borne** : un boss réussi ajoute la borne à `finished`.
- **Ouverture d'une borne** : elle est ouverte si sa maîtrise est ≥ 0,6, ou si toutes les bornes précédentes sont `finished` ou `mastered`.

- [ ] **Étape 1 : Tests qui échouent.** Un test par règle ci-dessus, plus :
  - un `localStorage` corrompu ou qui lève une exception renvoie les valeurs par défaut ;
  - la clé `linear-arcade.progress.v2` est utilisée ;
  - avec `cabinetState` sur une progression neuve, `vector-golf` est `open` et `drone` est `locked`.
- [ ] **Étapes 2 à 5 :** échec, implémentation, PASS, commit local `feat: progression, xp, dex and adaptive mode`.

---

### Task 5 : Direction artistique, DESIGN.md

- [ ] **Étape 1 :** invoquer le skill **`website-design:web-design-system`**.
  - **Brief :** Neon Grid, synthwave et arcade sombre ; police monospace pour le jeu et une police lisible pour le cours ; les couleurs fixes des Global Constraints ; « must not look AI-generated ».
  - **Sortie :** `DESIGN.md` à la racine, avec la palette, la typographie, les espacements, les composants (bouton arcade, carte du Dex, borne de la carte, panneau de cours) et les états.
- [ ] **Étape 2 :** traduire le DESIGN.md en `src/styles/tokens.css` (variables CSS). Charger les polices depuis Google Fonts, avec des versions figées.
- [ ] **Étape 3 :** commit local `docs: DESIGN.md and design tokens`.

---

### Task 6 : Le kit d'arcade (moteur de borne commun)

**Files :**
- Créer `src/arcade/kit/{neon,audio,fx,coords,handles,hud,runner}.ts` et `src/arcade/kit/CabinetView.tsx`.
- Test : `tests/cabinets/runner.test.ts`, qui teste la machine à états sans Pixi.

**Interfaces (Produces) :**

```ts
// runner.ts — machine à états pure, testable
export type Phase = 'brief' | 'play' | 'result' | 'replay' | 'card' | 'over' | 'done';
export interface CabinetGame {
  setup(ctx: KitContext): void;                        // crée ses graphiques
  startWave(wave: Wave, rule: Rule): void;
  update(dt: number, t: number): void;                 // t = 0..1 progression de la vague
  isLocked(): boolean; lock(): void;
  evaluate(): { correct: boolean; diagnosis: Diagnosis | null };
  goalText(rule: Rule): string;                        // mission en coordonnées (règle 1)
  checklist(rule: Rule): { label: string; ok: boolean }[]; // règle 3 ; vide en 'abstract'
  replay(k: number): string;                           // dessine le replay à k∈[0,1], renvoie la légende (règle 5)
  destroy(): void;
}
export function clampDt(ms: number): number;           // min(ms/1000, 0.05)
export class Runner { constructor(content: CabinetContent, game: CabinetGame, opts: { mode: Mode; onWaveResult: (r) => void; onExit: () => void }); tick(ms: number): void; click(): void; phase: Phase; }
```

**Ce que fournit chaque fichier :**
- **`neon.ts`** : `glow(g, pts, color, w, closed, alpha)` et `arrowAt(...)`, repris du prototype.
- **`fx.ts`** : particules, flash et tremblement.
- **`audio.ts`** : un seul `AudioContext` pour toute l'application, et les sons `snap`, `lock`, `win`, `fail`, `tick`, `unlock`, `rule`, `whoosh`.
- **`coords.ts`** : les axes gradués et les étiquettes de coordonnées.
- **`handles.ts`** : les poignées déplaçables, avec magnétisme, blocage au bord et `touch-action: none`.
- **`hud.ts`** : le score, les vies, les combos, le bandeau « NEW RULE », le briefing, la checklist, les légendes de replay et la carte du Dex.

**La machine à états du `Runner`** reproduit exactement le prototype : `brief` → (clic) → `play` → impact ou `LOCK IN` → `result` (≥ 1,6 s si réussi, ≥ 3 s si raté) → `replay` (attend un clic) → `card` si le Dex a un nouveau concept → `brief` de la vague suivante. Quand il n'y a plus de vies, on passe à `over`, et quand le boss est réussi, à `done`.

**`CabinetView.tsx`** monte une application Pixi dans un `div`, crée le `Runner`, et **détruit tout au démontage** : `app.destroy(true)` et ticker retiré.

- [ ] **Étape 1 : Tests qui échouent** (`runner.test.ts`, avec un faux `CabinetGame`) :
  - `clampDt(5000)` renvoie `0.05` (Review Focus 3) ;
  - `brief` reste `brief` sans clic, même après 60 s de ticks ;
  - un impact avec `evaluate` faux décrémente les vies, pose `focus` sur `diagnosis.kind`, et la vague suivante est un drill ;
  - `replay` ne passe pas à la suite sans clic ;
  - un concept nouveau fait passer par `card` ;
  - un boss réussi mène à `done`.
- [ ] **Étapes 2 à 4 :** échec, implémentation, PASS.
- [ ] **Étape 5 :** commit local `feat: arcade kit (runner, neon, audio, fx, hud)`.

---

### Task 7 : Borne 3, Hole in the Wall (portage du prototype)

**Files :** créer `src/arcade/cabinets/hole-in-the-wall/{game.ts,params.ts}`. Test : `tests/cabinets/hole-in-the-wall.test.ts`, sur la partie pure (évaluation, objectifs, checklist).

**Interfaces :**
- Consomme : `CabinetGame`, `diagnoseBasis`, les helpers du kit.
- Produit : `createHoleInTheWall(): CabinetGame` et `validateHoleParams: ParamsValidator`.

**Comportement :** identique au prototype v5. Les correspondances avec les paliers :
- `assist` = trou avec les points et les coordonnées ;
- `partial` = trou seul ;
- `abstract` = matrice seule, le trou n'apparaissant qu'à t > 0,9.

- [ ] **Étape 1 : Tests.**
  - `goalText('assist')` contient les coordonnées des deux colonnes ;
  - `checklist('abstract')` renvoie `[]` ;
  - `evaluate` sur des colonnes inversées renvoie `swapped-columns` ;
  - `validateHoleParams({ matrix: [[1, 2]] })` renvoie une erreur.
- [ ] **Étape 2 :** implémenter, puis lancer `npm test` (PASS).
- [ ] **Étape 3 : Vérifier dans le navigateur**, avec une page temporaire `#/play/hole-in-the-wall` :
  - mêmes sensations que `docs/prototypes/hole-in-the-wall.html` : briefing, checklist ✓, replay qui attend, entraînement après une inversion, carte STRETCH ;
  - 5 allers-retours vers la carte sans erreur dans la console (Review Focus 4) ;
  - à 375 px, on peut tirer les poignées au doigt (Review Focus 5).
- [ ] **Étape 4 :** commit local `feat: cabinet 3 hole in the wall`.

---

### Task 8 : Coquille de l'application et écrans de base

**Files :**
- Créer `src/screens/{Title,Profile,Hall,Play}.tsx` et `src/router.ts` (hash).
- Réécrire `src/App.tsx` et `src/styles.css`, en important `tokens.css`.

**Comportement :**
- **Title** → **Profile**, qui ne s'affiche que si `profile === null`. Il propose 2 choix, puis enregistre.
- **Hall** : 7 bornes dessinées en SVG néon, avec leur état (`cabinetState`), le niveau, l'XP, les badges et le compteur du Dex.
  - Le clic sur une borne ouverte mène à `#/course/<id>`.
  - Les erreurs de contenu sont listées en bas.
  - Un bouton « Reset progress » demande confirmation.
- **Play** monte `CabinetView`. `onWaveResult` appelle `applyWaveResult` et sauvegarde. `suggestMode` affiche une proposition non bloquante (« Want more step-by-step help? ») qui écrit dans `modeOverride`.
- **Les transitions entre écrans** utilisent `motion` (fondu + glissement, 250 ms).

- [ ] **Étape 1 :** construire.
- [ ] **Étape 2 :** vérifier dans le navigateur :
  - parcours complet Profil → Hall → Play (borne 3) → retour ;
  - l'XP et le Dex sont à jour sur la carte après une partie ;
  - rechargement : la progression est conservée.
- [ ] **Étape 3 :** commit local `feat: app shell, profile and arcade hall`.

---

### Task 9 : Écran de cours et leçons de rattrapage

**Files :** créer `src/screens/Course.tsx` et `src/arcade/kit/MiniScene.tsx` (une petite application Pixi : grille, î/ĵ déplaçables, lecture de `scene`).

**Comportement :**
- **Les étapes** de `course.json` s'affichent une à la fois :
  - le texte du mode actif, avec l'exemple du thème inséré, et les maths rendues par KaTeX ;
  - une `MiniScene` qui joue la `scene` puis devient manipulable ;
  - la question `check`.
- **Les formats de question** : `point` (on place un point), `basis` (on place î et ĵ), `number` (un curseur) et `choice` (des boutons).
- **Après une erreur**, on diagnostique avec `diagnoseVector`, `diagnoseBasis` ou `diagnoseNumber`, puis on affiche `remedial/<kind>.json` (texte et scène), avant de reposer la question.
- **À la fin du cours**, un bouton « ENTER THE CABINET » mène à `#/play/<id>`. On peut repasser le cours en mode `fast`.

- [ ] **Étape 1 : Test** (`tests/content/course.test.ts`) : la fonction pure `checkAnswer(question, answer)` couvre les 4 types de question, tolérance comprise.
- [ ] **Étapes 2 et 3 :** implémenter, PASS, puis vérifier dans le navigateur le cours de la borne 3 : scène « tire î, la grille suit », une question ratée exprès, le rattrapage, et l'entrée dans la borne.
- [ ] **Étape 4 :** commit local `feat: course screen with mini scenes and remedial lessons`.

---

### Tasks 10 à 15 : Les autres bornes (une tâche par borne, même gabarit)

**Chaque tâche :**
- crée `src/arcade/cabinets/<id>/{game.ts,params.ts}` ;
- écrit (ou intègre, si les amis l'ont déjà fait) son contenu, avec au moins **6 vagues, 1 entraînement par type d'erreur, toutes les cartes du Dex et 3 écrans de cours** ;
- ajoute ses tests purs dans `tests/cabinets/<id>.test.ts`, dont un test « chaque vague a une solution » ;
- remplace le validateur provisoire dans `paramsRegistry.ts` ;
- est vérifiée dans le navigateur avec les 8 règles du §4.3 ;
- se termine par un commit local `feat: cabinet N <name>`.

| Tâche | Borne | Mécanique | Logique pure à tester | Diagnostic |
|---|---|---|---|---|
| **10** | 1 · Vector Golf | Le joueur règle chaque coup (vecteur déplaçable, magnétisme 0,5). La balle suit les coups bout à bout. **Prédiction** : avant de tirer, il place le point d'arrivée. Bonus s'il est juste. | `endPoint(start, shots)` ; `hitsWall(path, walls)` (intersection de segments) | `diagnoseVector` |
| **11** | 5 · Squash! | Une forme passe sous la presse-matrice. Avant l'impact, on règle le **pari** sur l'aire et son signe avec un curseur (pas de 0,5). L'impact révèle `det`, avec un retournement animé si `det < 0` et un écrasement si `det = 0`. | `areaFactor(m)` = `det` ; pas de `NaN` pour une matrice nulle | `diagnoseNumber` |
| **12** | 6 · Rewind | Une image déformée par `matrix`. On tire î et ĵ pour construire la transformation qui la remet droite, ou on appuie sur « CAN'T REPAIR » si `det = 0`. L'image est un sprite texturé déformé par `setTransform` avec la matrice. | `solution(m)` = `inverse(m)` ou `'cant-repair'` | `diagnoseBasis` comparé à `inverse(m)` ; erreur `repaired-flat` / `missed-repairable` |
| **13** | 2 · Drone | u et v sont fixes. On règle les coefficients a et b (curseurs, pas de 0,5). Le drone vole vers a·u + b·v. **Règle `abstract`** : on répond « reachable / unreachable » avant de voler. | `solveCoeffs(u, v, target)` (Cramer, `null` si colinéaires) ; `isReachable` | `diagnoseVector` sur (a, b) ; `wrong-span` |
| **14** | 4 · Factory | On glisse 2 ou 3 machines sur le tapis, dans un ordre. La pièce passe dans chaque machine (animation de chaque étape). La règle `abstract` cache l'aperçu intermédiaire. | `compose(machines)` = produit dans l'ordre d'application ; `orderMatters(a, b)` | `composition-order` si l'ordre inverse donne la cible, sinon `diagnoseBasis` |
| **15** | 7 · Laser Lab | On oriente le laser (angle par pas de 15°). Le rayon de sortie est dessiné après le tir (`abstract` : caché jusqu'au tir). On gagne si la sortie est parallèle à l'entrée. Bouton « NO STRAIGHT PATH » quand il n'y a pas de valeur propre réelle (rotation). | `isEigen(m, v)` (tolérance d'angle de 3°) ; `realEigenvectors(m)` (discriminant) | `same-length-not-direction`, `missed-none`, `other` |

L'ordre d'exécution est **10, 11, 12, 13, 14, 15**. Il garantit que les bornes de la démo (3, 1, 5) sont prêtes en premier.

---

### Task 16 : Diagnostic de départ

**Files :** créer `src/screens/Diagnostic.tsx`.

**Comportement :**
- **5 questions de type `Question`**, une par borne de 1 à 5, prises dans `course.json` (la dernière question de chaque cours). Le joueur peut passer (« Skip »).
- **À la fin**, on appelle `placeFromDiagnostic`, puis on affiche la carte avec les bornes « mastered » qui s'allument une par une.

- [ ] **Étape 1 :** implémenter.
- [ ] **Étape 2 :** vérifier dans le navigateur, y compris à 375 px (Review Focus 5).
- [ ] **Étape 3 :** commit local `feat: placement diagnostic`.

---

### Task 17 : Finitions, relecture design et démo

- [ ] **Étape 1 :** invoquer **`website-design:web-review`** sur Title, Profile, Hall, Course et Play. Corriger tout ce qui fait générique ou manque de lisibilité.
- [ ] **Étape 2 :** supprimer la v1 : `mafs`, `src/components/` et `src/levels/`. Avant, convertir les 18 niveaux v1 en vagues de la borne 3 et en questions des cours 1 à 3 s'ils n'y sont pas déjà.
- [ ] **Étape 3 :** lancer `npm test` (PASS), puis `npm run build` (succès).
- [ ] **Étape 4 :** rejouer le déroulé de démo de la spec (§9) de bout en bout dans le navigateur.
- [ ] **Étape 5 :** mettre à jour `README.md` (en anglais) et `CLAUDE.md` (zones v2).
- [ ] **Étape 6 :** commit local `chore: polish, remove v1, demo-ready`. **Demander à Camson** l'autorisation de pousser.
