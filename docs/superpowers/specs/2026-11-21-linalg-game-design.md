# Jeu d'algèbre linéaire : document de conception

*LauzHack 2026, challenge Scholé. Rédigé le 21/11/2026.*

## 1. Intention

Apprendre l'algèbre linéaire **en déformant l'espace avec les mains**, pas en lisant des formules.

**Public** : des lycéens et des étudiants qui n'ont jamais vu d'algèbre linéaire (en France, le lycée n'en fait pas). On reprend les bases et on va raisonnablement loin.

**Pourquoi** : c'est une niche que l'équipe trouve intéressante et qui se modélise bien en jeu. Le jury Scholé récompense trois choses :
- l'**ingéniosité de l'approche**, plus que la finition ;
- le fait que ça **enseigne vraiment à un débutant** ;
- le moment où **l'idée fait « clic »**, qu'on doit montrer pendant la démo.

**Le moment « clic » (décidé)** : le joueur tire la pointe de la flèche î et **toute la grille se déforme avec elle**. À côté, la matrice s'écrit en direct : sa colonne 1, c'est î, et sa colonne 2, c'est ĵ. Le joueur comprend qu'une matrice, c'est simplement l'endroit où vont î et ĵ.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Une webapp jouable dans le navigateur, sans compte ni installation.
- Le moment « clic » parfaitement fluide.
- Une suite de niveaux qui suit le parcours d'apprentissage (section 4).
- **L'adaptation (décidée)**, en deux temps :
  - quand le joueur rate, on lui **montre son erreur sur la grille** (sa transformation en couleur, la bonne en fantôme) ;
  - ensuite, on lui **propose un niveau ciblé** sur cette erreur.
- **Le suivi de maîtrise** : une probabilité par compétence, mise à jour à chaque tentative et visible par le joueur.
- **Des niveaux modifiables (décidé)** : chaque niveau est décrit dans un fichier de données. Les concepteurs ajoutent ou changent des niveaux sans toucher au moteur.

**Non-objectifs (pour le hackathon)**
- Pas de comptes, pas de serveur, pas de base de données. La progression est gardée dans le navigateur.
- Pas d'éditeur de niveaux visuel : les fichiers de données suffisent.
- La 3D n'est pas dans le cœur du jeu. C'est un bonus seulement si le reste est fini.

**Anti-objectifs (ce serait un échec même si ça marche)**
- Que ça ressemble à un chatbot ou à une fenêtre de discussion avec une IA (c'est interdit par le règlement).
- Que ça ressemble à un quiz ou à une suite d'exercices déguisés, ou à une copie de Scholé (leçons générées suivies de quiz).
- Que la démo n'arrive pas à montrer le « clic » en moins de 30 secondes.

## 3. Contraintes
- Le temps d'un hackathon. L'équipe de 3 n'a jamais fait de canvas ni de SVG, et **c'est Claude qui code**.
- Pas de dataset ni de code de départ. Toute librairie open source est autorisée.
- Le dépôt GitHub `Cosmoswisss/fcvalmontlauzhack` est vide au départ.

## 4. Contenu : parcours d'apprentissage

Chaque niveau entraîne une **compétence** parmi ces 7 étapes :

| # | Compétence (id) | Ce que le joueur fait |
|---|---|---|
| 1 | `vectors` | Additionner des flèches et les allonger pour atteindre une cible. |
| 2 | `combinations` | Atteindre une cible en combinant uniquement î et ĵ (ou une base tordue). |
| 3 | `matrix-transform` | Tirer î et ĵ pour qu'une forme tombe dans un trou : c'est le « clic ». |
| 4 | `composition` | Enchaîner deux transformations données, découvrir que l'ordre compte (AB ≠ BA). |
| 5 | `determinant` | Atteindre une aire cible ; écraser la grille (det = 0) ; la retourner (det < 0). |
| 6 | `inverse` | Retrouver la forme de départ à partir de la forme transformée. |
| 7 | `eigen` | Trouver les directions qui ne tournent pas sous une transformation. |

**Priorité de construction** : 3, puis 1, 2 et 5, puis 4 et 6, puis 7. Le niveau 3 passe en premier parce qu'il porte la démo.

**Erreurs classiques à détecter automatiquement** (comparaison entre la matrice du joueur M et la matrice cible T) :
- **colonnes inversées** : M ≈ T avec ses colonnes échangées ;
- **signe** : une colonne de M ≈ −1 fois la bonne colonne ;
- **échelle** : M ≈ k·T avec k ≠ 1 ;
- **une seule colonne fausse** ;
- **ordre de composition** (étape 4) : le joueur a fait BA au lieu de AB.

## 5. Approche technique

**Options envisagées**
- **React + Mafs** (choisie par l'équipe). Mafs est une librairie React pour les maths interactives en 2D, en SVG. Elle fournit des points qu'on peut déplacer, des vecteurs, des polygones, du LaTeX et un composant `Transform` qui applique une matrice.
- **p5.js (canvas)** : écartée. Il faudrait recoder le glisser-déposer et toute l'interface.
- **Three.js d'emblée** : écartée. Trop risqué de ne pas avoir de démo.

**Pile technique (choix de Claude)**
- Vite + React + TypeScript, avec `mafs@0.21` et KaTeX pour les matrices.
- Tests avec Vitest, sur la logique pure : détection d'erreurs, suivi de maîtrise, validation des niveaux.
- Déploiement statique, par exemple GitHub Pages ou Vercel, pour que le jury puisse l'essayer.

**Point technique à vérifier en premier** : la grille de fond de Mafs (`Coordinates.Cartesian`) ne se déforme probablement pas avec `Transform`. On dessine donc **notre propre grille** : des segments de −N à N, transformés par la matrice, avec la grille d'origine en fantôme derrière.

## 6. Architecture

```
src/
  levels/            ← un fichier JSON par niveau (modifiable par les concepteurs)
  engine/
    matrix.ts        ← opérations 2×2 (produit, déterminant, inverse, application)
    checkLevel.ts    ← le niveau est-il réussi ? (avec une tolérance)
    diagnose.ts      ← classe l'erreur du joueur (colonnes inversées, signe…)
    mastery.ts       ← probabilité de maîtrise par compétence
    recommend.ts     ← choisit le prochain niveau
  components/
    WarpGrid.tsx     ← grille déformée, î et ĵ qu'on peut déplacer, forme et trou
    MatrixPanel.tsx  ← matrice affichée en direct (couleurs î/ĵ)
    ErrorReplay.tsx  ← superposition « ta grille » / « la bonne grille »
    LevelMap.tsx     ← liste des niveaux + jauges de maîtrise
  App.tsx
```

**Format d'un niveau (exemple)**

```json
{
  "id": "transform-01",
  "skill": "matrix-transform",
  "title": "Fit the square",
  "prompt": "Drag î and ĵ so the square lands in the hole.",
  "shape": [[0,0],[1,0],[1,1],[0,1]],
  "target": { "type": "shape", "matrix": [[2,0],[1,1]] },
  "movable": ["i", "j"],
  "snap": 0.5,
  "tolerance": 0.1,
  "hints": ["Where should the corner (1,0) go?", "The corner (1,0) follows î exactly."]
}
```

- **`target.type`** a quatre valeurs possibles :
  - `shape` : faire correspondre une forme transformée ;
  - `point` : atteindre un point ;
  - `area` : obtenir un déterminant donné ;
  - `direction` : trouver les vecteurs propres.
- **Un niveau mal écrit** (champ manquant, forme vide…) est signalé clairement au chargement, sans faire planter le jeu.
- **Le magnétisme** (`snap`) fait que les pointes de î et ĵ s'accrochent aux points entiers de la grille (pas de 0,5). Les matrices restent ainsi lisibles.

## 7. Adaptation

- **Suivi de maîtrise** (choix de Claude) : une version simplifiée du *Bayesian Knowledge Tracing*. Chaque compétence a une probabilité p, qui commence à 0,2. Une réussite ou un échec met p à jour, avec moins de poids si le joueur a utilisé des indices. On affiche p sous forme de jauge.
- **Après un échec** : `ErrorReplay` montre les deux grilles superposées et nomme l'erreur (« You swapped î and ĵ »). Le bouton principal mène au niveau ciblé sur cette erreur ; on garde aussi « Retry ».
- **Recommandation** : le niveau conseillé est le premier niveau non réussi de la compétence la plus faible dont les prérequis sont acquis, ou un niveau ciblé si une erreur vient d'être détectée.
- **Indices progressifs** : d'abord une question, ensuite un indice concret, jamais la réponse. Ils sont écrits dans le fichier du niveau.
- **Mini-test de départ** : il est optionnel et vient après le cœur du jeu. Ce sont 3 niveaux courts qui placent le joueur sur le parcours.

## 8. Démo (≈ 3 min)
1. **Le contexte** : « En France on ne voit jamais l'algèbre linéaire au lycée. »
2. **Le clic** : on tire î, et la grille entière suit.
3. **L'adaptation** : on rate volontairement en inversant î et ĵ. La grille fantôme apparaît et un niveau ciblé est proposé.
4. **Les jauges de maîtrise** qui bougent.
5. **L'aperçu du parcours**, avec le déterminant qui écrase la grille.

## 9. Choix faits par Claude (à vérifier)
- **Langue (décidée par l'équipe)** : toute l'interface et le contenu des niveaux sont en anglais. Les identifiants du code aussi.
- **Validation** : le joueur appuie sur « Check ». C'est à ce moment-là qu'on fait le diagnostic et la mise à jour de la maîtrise. Une réussite très proche du but est acceptée dans la tolérance.
- **Pas d'IA générative dans la v1.** L'adaptation repose sur le suivi de maîtrise et la détection d'erreurs, qui marchent hors ligne et sans clé d'API. Une IA pourrait venir ensuite, par exemple pour générer des variantes de niveaux, mais jamais sous forme de chat.
- **Progression** gardée dans le `localStorage`, avec un bouton « Reset progress ».

## 10. Laissé au développeur
- Les couleurs et le style visuel. On garde la convention î vert, ĵ rouge.
- Les animations de transition et le nombre exact de niveaux par compétence.
- L'hébergement final.
