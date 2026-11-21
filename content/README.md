# Écrire le contenu de Linear Arcade

**Ce fichier est le signal que le format est figé.** Vous pouvez écrire.

Tout le contenu est en **anglais**, dans des fichiers JSON. Aucun code n'est nécessaire.

**Le modèle à copier** est `cabinets/03-hole-in-the-wall/`. Avant d'écrire, lisez les 8 règles pédagogiques, section 4.3 de `docs/superpowers/specs/2026-11-21-linalg-game-v2-design.md`.

## Les dossiers

```
content/
  cabinets/
    01-vector-golf/      ← Ami 1
    02-drone/            ← Ami 1
    03-hole-in-the-wall/ ← modèle (déjà rempli)
    04-factory/          ← Ami 1
    05-squash/           ← Ami 2
    06-rewind/           ← Ami 2
    07-laser-lab/        ← Ami 2
  remedial/              ← Ami 2 (une leçon de rattrapage par type d'erreur)
```

Chaque borne contient **5 fichiers** : `cabinet.json`, `course.json`, `waves.json`, `drills.json` et `dex.json`. Le nom du dossier doit être `0N-<id>`, et l'`id` dans `cabinet.json` doit être identique.

## Conventions
- **Vecteur :** `[x, y]`.
- **Matrice :** `[[a, b], [c, d]]`, écrite ligne par ligne. **La colonne 1 `(a, c)` est l'endroit où atterrit î, la colonne 2 `(b, d)` celui où atterrit ĵ.**
- **Textes courts** : 2 à 4 phrases, avec des **coordonnées**. Exemple : « î lands on (2, 1) ».
- **Dans les textes**, on peut utiliser `**gras**`, `*italique*` et des maths entre `$…$`. Dans le JSON, il faut doubler les antislashs : `$\\begin{bmatrix}…\\end{bmatrix}$`.

## `cabinet.json`

```json
{
  "id": "squash", "order": 5, "name": "Squash!",
  "notion": "The determinant is how much a matrix scales areas — and whether it flips them.",
  "tiers": [
    { "rule": "assist",   "banner": "The area is shown live",               "waves": { "guided": 3, "fast": 2 } },
    { "rule": "partial",  "banner": "NEW RULE · THE AREA IS HIDDEN",        "waves": { "guided": 3, "fast": 2 } },
    { "rule": "abstract", "banner": "NEW RULE · ONLY THE MATRIX IS SHOWN",  "waves": { "guided": 4, "fast": 3 } }
  ],
  "waveSeconds": { "guided": 16, "fast": 12 },
  "boss": { "waves": 2 }
}
```

- **`tiers`** contient **exactement 3 paliers**, dans l'ordre `assist` → `partial` → `abstract` :
  - `assist` : avec aides visuelles ;
  - `partial` : avec moins d'aides ;
  - `abstract` : seulement les nombres.
- **`waves`** indique combien de vagues passent avant le palier suivant.
- **`waveSeconds`** est la durée d'une vague au premier palier. Restez lents : 14 à 16 s en mode guided.

## `course.json` : 3 à 5 écrans de cours

```json
[
  {
    "id": "area-factor",
    "title": "Areas get scaled",
    "text": {
      "guided": "Take the unit square: area **1**.\nAfter the matrix, it becomes a parallelogram. Its area is the **determinant**.",
      "fast": "The unit square (area 1) becomes a parallelogram of area det(M)."
    },
    "examples": {
      "games": "Like a power-up that makes every sprite twice as big.",
      "physics": "Like a fluid being compressed: the same stuff in less space.",
      "ai": "Like resizing an image: the number of pixels changes."
    },
    "scene": [
      { "matrix": [[1, 0], [0, 1]], "caption": "Unit square: area 1.", "ms": 1200 },
      { "matrix": [[2, 0], [0, 1]], "caption": "î doubled: area 2.", "ms": 1800 }
    ],
    "check": { "kind": "number", "prompt": "What is the new area?", "given": { "matrix": [[3, 0], [0, 1]] }, "answer": 3, "tolerance": 0.1 }
  }
]
```

- **`text`** existe en deux versions : `guided` (lycée, plus détaillé) et `fast` (université, droit au but).
- **`examples`** donne une phrase par thème de joueur : `games`, `physics` et `ai`.
- **`scene`** est facultatif. C'est une animation : chaque étape déforme la grille vers `matrix`, en `ms` millisecondes.
- **`check`** est **une question de prédiction**, jamais une simple définition. Il y a 4 types :

| `kind` | Le joueur… | Champs |
|---|---|---|
| `point` | place un point | `given: { matrix?, vectors?, coeffs? }`, `answer: [x, y]`, `tolerance` |
| `basis` | place î et ĵ | `given: { matrix }`, `answer: [[a, b], [c, d]]`, `tolerance` |
| `number` | règle un curseur | `given: { matrix }`, `answer: 2`, `tolerance` |
| `choice` | clique une réponse | `options: ["…", "…"]`, `answer: <index de la bonne option>` |

## `waves.json` : au moins 6 vagues

```json
[ { "id": "stretch-1", "concept": "stretch", "params": { "matrix": [[2, 0], [0, 1]] } } ]
```

- **`id`** doit être unique dans la borne (drills compris).
- **`concept`** doit avoir sa carte dans `dex.json`.
- **`params`** dépend de la borne :

| Borne | `params` |
|---|---|
| `vector-golf` | `{ "start": [x, y], "shots": [[dx, dy], …], "hole": [x, y], "walls": [[[x1, y1], [x2, y2]], …] }` |
| `drone` | `{ "u": [x, y], "v": [x, y], "target": [x, y], "reachable": true }` |
| `hole-in-the-wall` | `{ "matrix": [[a, b], [c, d]] }` |
| `factory` | `{ "machines": [{ "name": "rotate", "matrix": … }, …], "target": [[a, b], [c, d]] }`. La liste est dans **l'ordre de la solution** (la première machine agit en premier). |
| `squash` | `{ "matrix": [[a, b], [c, d]] }`. La réponse est `det`. |
| `rewind` | `{ "matrix": [[a, b], [c, d]], "image": "mountains" \| "city" \| "face" }`. Si `det = 0`, la bonne réponse est « can't repair ». |
| `laser-lab` | `{ "matrix": [[a, b], [c, d]] }`. La réponse est une direction qui ne tourne pas, ou « none » s'il n'y en a pas (rotation). |

**Gardez les coordonnées entre −3 et 3** pour qu'elles restent à l'écran, et utilisez des pas de 0,5.

## `drills.json` : un entraînement par type d'erreur

```json
[ { "errorKind": "swapped-columns", "label": "swapped arrows", "waves": [ { "id": "drill-swap-1", "concept": "combo", "params": { "matrix": [[2, 0], [1, 1]] } } ] } ]
```

Après une erreur de ce type, le jeu enchaîne sur ces vagues (« TRAINING · SWAPPED ARROWS »). Choisissez des cas où **l'erreur se voit clairement**.

**Types d'erreurs par borne :**
- **Matrices** (hole-in-the-wall, rewind, factory) : `swapped-columns`, `sign-flip`, `one-column`, `scale`, `other`, ainsi que `composition-order` pour factory.
- **Vecteurs** (vector-golf, drone) : `swapped-xy`, `sign-x`, `sign-y`, `other`, ainsi que `wrong-span` pour drone.
- **Nombres** (squash) : `wrong-sign`, `missed-zero`, `other`.
- **Laser-lab** : `same-length-not-direction`, `missed-none`, `other`.
- **Rewind** : en plus des erreurs de matrices, `repaired-flat` et `missed-repairable`.

## `dex.json` : une carte par concept

```json
[ { "concept": "stretch", "name": "STRETCH", "body": "Make î or ĵ longer and the whole plane stretches that way.", "demo": [[2, 0], [0, 1]] } ]
```

La carte se débloque la première fois qu'on réussit une vague de ce concept. `demo` est la matrice animée sur la carte.

## `remedial/<errorKind>.json` : leçons de rattrapage (Ami 2)

```json
{ "errorKind": "sign-flip", "title": "An arrow points backwards",
  "text": { "guided": "…", "fast": "…" },
  "scene": [ { "matrix": [[1, 0], [0, 1]], "caption": "…", "ms": 1000 } ] }
```

Il faut une leçon pour **chaque** type d'erreur listé plus haut. Celles des matrices existent déjà.

## Vérifier

```bash
npm test
```

Si un fichier est mal écrit, le test indique **le fichier, l'id et la raison**. Le jeu, lui, désactive seulement la borne concernée et l'affiche en bas de la carte.
