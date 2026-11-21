# Linear Algebra Game, v2 : document de conception

*LauzHack 2026, challenge Scholé. Rédigé le 21/11/2026. Ce document remplace la v1 (`2026-11-21-linalg-game-design.md`) pour la structure, l'interface et le rendu. Le moteur décrit en v1 reste valable.*

## 1. Intention

**Le but :** faire **comprendre en profondeur et concrètement** l'algèbre linéaire à quelqu'un qui part de zéro, lycéen ou étudiant. **Ce n'est pas** une préparation aux examens. L'université entraîne déjà à réussir des exercices ; nous, on vise l'intuition géométrique.

**Pourquoi une v2 :** l'équipe a jugé la v1 « pas ludique ». On y enchaînait des exercices sans cours avant, et le site manquait de structure.

**La forme (décidée) :** la **structure de Codédex** (un cours découpé en chapitres, chaque exercice précédé d'une courte leçon, de l'XP, des badges, une carte de progression), mais avec **notre propre direction artistique**.

**Le moment « clic » (inchangé) :** on tire î, et toute la grille suit. Une matrice, c'est l'endroit où atterrissent î et ĵ.

**Comment on sait que l'élève a compris (décidé) :** on lui demande de **prédire où va la forme avant de voir**. En tirant les flèches, on peut réussir à tâtons ; une prédiction ne se devine pas sans avoir compris.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- **Un parcours structuré** : profil de départ, puis diagnostic, puis carte des 7 chapitres. Dans chaque chapitre, une suite d'exercices (leçon puis pratique) et un boss à la fin.
- **L'adaptation dès la première minute**, puis tout au long du jeu (section 5).
- **Des leçons de rattrapage** qui se déclenchent selon l'erreur commise.
- **Direction artistique Neon Grid** (décidée) : fond sombre, lignes lumineuses, ambiance arcade, et des **animations fluides partout**.
- **Le contenu** (leçons et exercices) est décrit dans des fichiers que l'équipe peut écrire sans coder.

**Non-objectifs**
- Pas de comptes, pas de serveur, pas de streak, pas de communauté, pas de certificat.
- Pas d'IA générative (option 1, décidée) : tout le contenu est écrit par l'équipe.
- Pas de 3D.

**Anti-objectifs (ce serait un échec même si ça marche)**
- **Un rendu « généré par IA »** : dégradés violets par défaut, cartes toutes identiques, emojis en guise d'icônes, textes creux.
- **Tout ce qui ressemble à un chat avec une IA** (c'est interdit par le règlement).
- **Des exercices qu'on réussit en appliquant une recette sans comprendre.**
- **Une copie de Codédex** : leurs personnages, leurs dessins, leurs textes. On reprend la structure, pas l'apparence.

## 3. Contraintes
- **Environ 23 h avant la démo** (au 21/11 en fin de matinée), donc de la marge : on vise tout le périmètre décrit ici. **C'est Claude qui code.**
- **Le format du contenu est figé en tout premier**, pour que les deux amis puissent écrire en parallèle pendant que la zone de jeu se construit.
- Tout dans le navigateur, interface et contenu **en anglais**.
- **Commits :** jamais de mention de Claude en co-auteur. On ne pousse sur GitHub qu'avec l'accord explicite de Camson.
- **Plusieurs Claude travaillent en parallèle** : il faut respecter `CLAUDE.md` (zones et réservations).

## 4. Le parcours du joueur

```
Écran titre ─► Profil (3 clics) ─► Diagnostic (~2 min) ─► CARTE DU COURS
                                                            │
     Chapitre N : Ex 1 ─► Ex 2 ─► … ─► BOSS ─► badge + chapitre suivant débloqué
                    │
                    └─ Écran d'exercice : LEÇON (gauche) │ PRATIQUE (droite)
                                                         └─ en cas d'erreur : LEÇON DE RATTRAPAGE
```

### 4.1 Profil de départ (décidé)

Deux questions, en cliquant, sans rien écrire :
- **Niveau** : `highschool` ou `university`. Ça règle le **mode** par défaut :
  - lycée → `guided` (plus d'animations, des prédictions plus guidées) ;
  - université → `fast` (on va plus vite, on passe plus tôt aux prédictions complètes).
- **Thème** : `games`, `physics` ou `ai`. Ça change les exemples des leçons.

Il n'y a **pas** de question sur l'objectif : on ne fait pas de révision d'examen.

### 4.2 Diagnostic

- **Ce que c'est :** 5 prédictions rapides, une par grande notion :
  - vecteurs ;
  - combinaisons ;
  - matrice ;
  - composition ;
  - déterminant.
- **Ce que ça change :**
  - une réussite met la maîtrise du chapitre à 0,7, et le chapitre s'affiche « mastered » sur la carte ;
  - un échec laisse la maîtrise à 0,2.
- **Les chapitres maîtrisés restent jouables**, et le diagnostic peut être ignoré (« Skip »).
- **Les chapitres 6 (inverse) et 7 (vecteurs propres)** ne sont pas testés : on suppose qu'un débutant ne les connaît pas.

### 4.3 La carte du cours

**Les 7 chapitres** (les compétences de la v1) :
1. Arrows
2. Combining
3. Matrices
4. Composition
5. Area & Squash
6. Undo (inverse)
7. Arrows that don't turn (vecteurs propres)

**Sur la carte :**
- **Chaque chapitre est un nœud lumineux**, dans l'un de 4 états : verrouillé, ouvert, en cours ou terminé.
- **Au-dessus** : le niveau du joueur, une barre d'XP et les badges (x / 7).
- **Le chapitre conseillé est mis en avant**, sur la base de la maîtrise. Tous les chapitres ouverts restent jouables.
- **Un chapitre s'ouvre** dans deux cas (choix de Claude) :
  - **s'il est lui-même maîtrisé** (≥ 0,6, par exemple grâce au diagnostic) : le diagnostic prouve qu'on peut le faire, alors on peut sauter en avant ;
  - **ou si tous les chapitres précédents** sont terminés ou maîtrisés.
- **« Maîtrisé » n'est pas « terminé ».** Le badge et l'état « terminé » ne s'obtiennent qu'en battant le boss. Sur la carte, un chapitre maîtrisé non terminé a son propre état visuel.

### 4.4 Écran d'exercice : leçon puis pratique

**À gauche, la leçon :**
- un titre amusant ;
- un court texte adapté au **mode** et au **thème** ;
- une **scène animée** optionnelle, jouée dans la zone de jeu. Par exemple : « regarde î s'étirer, et toute la grille suit ». Elle est rejouable ;
- en dessous, une **checklist d'instructions**.

**À droite, la pratique :** la zone de jeu PixiJS, la matrice en direct et les boutons. En bas de l'écran : `Prev` · `Check` · `Next`, ainsi que l'XP que rapporte l'exercice.

**Les trois types d'exercices :**

| Type | Le joueur… | Validation |
|---|---|---|
| **Predict** | voit une matrice et la forme d'origine, puis place sa prédiction : d'abord les coins de î et ĵ (mode guided, premiers chapitres), puis toute la forme (deux points déplaçables, l'image de î et celle de ĵ, qui donnent la forme). Il clique sur **Reveal** : la grille se déforme en animation. | la prédiction est juste, à la tolérance près |
| **Build** | tire î et ĵ pour que la forme tombe dans le trou. C'est l'exercice de la v1, plus le « juice ». | `checkLevel` de la v1 |
| **Read** | voit une grille déformée, puis tape les 4 nombres de la matrice. | les nombres sont justes, à la tolérance près |

**Ce qu'on prédit dans chaque chapitre** (choix de Claude). La prédiction prend 4 formes : un **point**, une **base** (l'image de î et celle de ĵ), un **nombre** ou une **direction**.

| Chapitre | Ce qu'on montre | Ce que le joueur prédit | Forme |
|---|---|---|---|
| 1 · Arrows | Les nombres d'une flèche, par exemple (3, 2) | Où arrive sa pointe | point |
| 2 · Combining | î et ĵ dessinés, plus des coefficients a et b | Où arrive a·î + b·ĵ | point |
| 3 · Matrices | Une matrice et la forme d'origine | Où vont î et ĵ, donc toute la forme | base |
| 4 · Composition | Deux matrices appliquées l'une après l'autre | Où vont î et ĵ à la fin | base |
| 5 · Area & Squash | Une matrice | L'aire du carré unité après transformation, avec un curseur. Le signe compte : négatif veut dire « retourné ». | nombre |
| 6 · Undo | La forme déjà transformée et sa matrice | Où était la forme d'origine | base |
| 7 · Don't turn | Une matrice | Une direction qui ne tournera pas | direction |

**Mode guided ou full, pour une prédiction de type base** (choix de Claude) :
- **En `guided`**, on prédit **une flèche à la fois**. On place l'image de î, on clique sur Reveal, et seule î s'anime. Puis on fait pareil pour ĵ, et enfin toute la forme suit.
- **En `fast`**, on place les deux images d'un coup, et la forme prédite se dessine en direct à partir des deux points.

Les prédictions de type point, nombre et direction n'ont qu'une seule étape.

**La boucle Predict :**
1. le joueur prédit ;
2. il clique sur **Reveal**, et la vraie transformation s'anime ;
3. on compare : en cas de réussite, l'XP monte avec un effet visuel ;
4. en cas d'échec, on superpose sa prédiction (couleur) et la réalité, le diagnostic nomme l'erreur, puis la **leçon de rattrapage** s'affiche.

**Les types d'erreurs :** ce sont ceux de la v1 (colonnes inversées, signe, échelle, une seule colonne, ordre de composition, autre). Pour Predict et Read, la « matrice du joueur » est celle qui correspond à sa prédiction (image de î, image de ĵ) ou aux nombres tapés. On réutilise donc `diagnose`.

### 4.5 Boss de fin de chapitre

- **Ce que c'est :** une prédiction **sans grille d'aide** (la grille d'origine est cachée), sur une situation jamais vue.
- **Si le joueur réussit :** badge du chapitre, 50 XP, et le chapitre suivant s'ouvre.
- **S'il échoue :** leçon de rattrapage, puis un nouvel essai avec une autre matrice. Le boss a 2 ou 3 variantes.

### 4.6 Gamification
- **XP :** 10 pour un exercice, 15 pour un Predict réussi du premier coup, 50 pour un boss. Pas d'XP pour un exercice déjà réussi.
- **Niveau du joueur :** `floor(XP / 100) + 1`.
- **Badges :** 1 par chapitre, au boss. Ils sont dessinés en SVG néon, pas en emojis.
- **Le « juice »** est au cœur du ressenti :
  - particules et flash quand une forme tombe dans le trou ou qu'une prédiction est juste ;
  - petit tremblement et clignotement rouge sur une erreur ;
  - traînée lumineuse derrière les flèches qu'on tire ;
  - animation de déblocage sur la carte.

## 5. Adaptation (le critère n° 1 du jury)

| Quand | Ce qui s'adapte |
|---|---|
| **Au départ** | Le profil choisit le mode (`guided` ou `fast`) et le thème. Le diagnostic place le joueur sur la carte. |
| **Dans chaque exercice** | Le texte de leçon dépend du mode et du thème. En mode `guided`, les scènes animées se lancent toutes seules, et les prédictions commencent par un seul coin. En mode `fast`, la scène est proposée mais pas imposée. |
| **Dans un chapitre** | En mode `guided`, le joueur fait tous les exercices du chapitre. En mode `fast`, il saute les exercices marqués `guidedOnly`. |
| **Après une erreur** | Une leçon de rattrapage correspondant au type d'erreur, avec l'animation de **sa** prédiction comparée à la réalité. Ensuite, le même exercice, ou une variante si elle existe. |
| **En continu** | **Mode dynamique.** Deux échecs de suite en `fast` → on propose « Want more step-by-step help? » pour passer en `guided` sur ce chapitre. Trois réussites du premier coup de suite en `guided` → on propose de passer en `fast`. C'est toujours proposé, jamais imposé. |
| **Maîtrise** | BKT de la v1. Un **Predict** compte comme une preuve forte. Un **Build** compte moins, parce qu'on peut le réussir à tâtons : il est traité comme une réussite avec un indice de plus. La maîtrise choisit le chapitre conseillé. |
| **Indices** | Progressifs, jamais la réponse (comme en v1). Chaque indice utilisé réduit le gain de maîtrise. |

## 6. Contenu (écrit par l'équipe, sans coder)

```
content/
  chapters/
    03-matrices/
      chapter.json          ← titre, description, ordre des exercices, boss
      01-fit-the-shape.json ← un exercice = leçon + pratique
      02-which-arrow.json
      boss.json
  remedial/
    swapped-columns.json    ← une leçon de rattrapage par type d'erreur
    sign-flip.json …
```

**Un exercice** (format exact laissé au développeur, mais il doit contenir) :
- **Identité :** `id`, `title` (amusant), `type` (`predict` | `build` | `read`), `xp`.
- **La leçon :**
  - `lesson.guided` et `lesson.fast` : chacun un court texte en Markdown simple (gras, italique, maths en `$…$` via KaTeX) ;
  - `lesson.examples.games` / `physics` / `ai` : une phrase d'exemple par thème, insérée dans le texte ;
  - `lesson.scene` (optionnel) : une suite d'étapes `{ matrix, caption, durationMs }` que la zone de jeu anime.
- **Les instructions :** `instructions`, une liste de lignes de checklist.
- **La pratique :** ce sont les champs de niveau de la v1 (`shape`, `target`, `movable`, `start`, `pre`, `snap`, `tolerance`, `hints`, `targetsError`), plus :
  - `matrix`, la matrice à prédire ou à lire, pour Predict et Read ;
  - `guidedOnly`.

**Une leçon de rattrapage :** `errorKind`, `title`, `text` (avec une variante par mode) et une `scene`.

Comme en v1, **un fichier invalide est signalé sur l'écran d'accueil** sans faire planter le jeu, et **un test vérifie que chaque exercice a une solution**.

**Les 18 niveaux de la v1** (choix de Claude) : Claude les **convertit en exercices Build** au début du plan, et les répartit dans les chapitres. Ils passent de `src/levels/` à `content/chapters/`. Le chargeur de la v1 est étendu, pas jeté, et ses tests de solvabilité restent valables.

**Volume visé pour la démo :**
- **Chapitres 1 à 3 complets**, avec 4 à 5 exercices chacun, dont au moins 2 Predict, et un boss.
- **Chapitres 4 à 7** avec au moins 2 exercices et un boss.

## 7. Approche technique

**Options envisagées** : faire évoluer React + Mafs (option 1), un moteur de jeu complet comme Phaser (option 2), une grille SVG faite maison (option 3), et **React + PixiJS pour la zone de jeu (option 4, choisie par l'équipe)**.

**Pourquoi l'option 4 :**
- un vrai néon (bloom), des animations à 60 images par seconde et des particules, pour un rendu qui ne fait pas « IA » ;
- React garde tout ce qui est texte et interface ;
- le moteur de la v1 (maths, diagnostic, maîtrise, recommandation, sauvegarde) **est conservé tel quel, avec ses tests**.

**Pile technique :**
- **On garde :** Vite, React 18, TypeScript et KaTeX.
- **On ajoute :**
  - `pixi.js` v8 et `pixi-filters` v6 (bloom / glow), pour la zone de jeu ;
  - `motion` (Framer Motion) pour les transitions de l'interface ;
  - un petit routeur pour les écrans.
- **On retire :** `mafs`.

**La zone de jeu :** un composant React qui crée une application PixiJS et lui envoie l'état (matrice, éléments déplaçables, mode Predict ou Build, scène à jouer). On y trouve :
- la grille d'origine en fantôme, et la grille déformée qui brille ;
- les flèches î et ĵ qu'on peut déplacer (souris et tactile), avec magnétisme et blocage au bord, comme en v1 ;
- la forme, le trou et la prédiction ;
- les animations par interpolation entre deux matrices, et les particules.

**Le front :** avant de coder les écrans, on utilise le skill **website-design:web-design-system**. Il produit un `DESIGN.md` (couleurs, typographie, espacements, composants, ambiance néon) inspiré de vrais sites. À la fin, **website-design:web-review** relit les écrans pour éliminer ce qui fait générique.

**Les tests :**
- Vitest sur le moteur, sur le chargeur de contenu et sur la solvabilité de chaque exercice ;
- les nouveaux calculs (XP, niveau, mode dynamique, déblocage des chapitres, validation Predict et Read) sont dans le moteur, et testés eux aussi ;
- le rendu est vérifié dans le navigateur.

## 8. Répartition (à reporter dans CLAUDE.md)

| Qui | Zone |
|---|---|
| **Camson + son Claude** | le moteur, la zone de jeu PixiJS, les écrans React, le design |
| **Ami 1 + son Claude** | le contenu des chapitres 1 à 4 (leçons, exercices, boss) |
| **Ami 2 + son Claude** | le contenu des chapitres 5 à 7, et les leçons de rattrapage |

**Le format de contenu est figé au début du plan**, pour que les deux amis puissent commencer tout de suite. Le jeu actuel est sur la branche `main`, et la v2 se fait sur de nouvelles branches.

## 9. Démo (≈ 3 min)
1. **Le profil en 2 clics.**
2. **Un exercice du chapitre 3** : la leçon avec sa scène animée, puis le « clic » quand on tire î.
3. **Un Predict raté exprès** : la superposition, l'erreur nommée, puis la leçon de rattrapage animée.
4. **Le même Predict réussi** : l'effet visuel, l'XP, la maîtrise.
5. **La carte** : le badge et le déblocage, et le mode qui s'adapte.

## 10. Laissé au développeur
- Le format JSON exact, tant qu'il contient les champs de la section 6.
- Le détail visuel : il sera défini par le DESIGN.md, avec la contrainte des couleurs î vert et ĵ rouge.
- Le choix du routeur.
- Le nombre d'images et la durée des animations.
- Les noms des chapitres et des exercices, sauf ceux déjà donnés ici.
