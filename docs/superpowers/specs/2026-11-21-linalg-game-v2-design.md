# Linear Arcade (v2) : document de conception

*LauzHack 2026, challenge Scholé. Rédigé le 21/11/2026, révisé après le prototype jouable. Ce document remplace la v1 (`2026-11-21-linalg-game-design.md`) pour la structure, l'interface et le rendu. Le moteur de la v1 (maths 2×2, diagnostic d'erreurs, maîtrise, sauvegarde) reste la base, avec ses tests.*

**Prototype validé par l'équipe :** `docs/prototypes/hole-in-the-wall.html`. On l'ouvre dans un navigateur, c'est la référence de la sensation de jeu et de l'apprentissage en jeu.

## 1. Intention

**Le but :** faire **comprendre en profondeur et concrètement** l'algèbre linéaire à quelqu'un qui part de zéro, lycéen ou étudiant. **Ce n'est pas** une préparation aux examens. L'université entraîne déjà à réussir des exercices ; nous, on vise l'intuition.

**La forme (décidée) :**
- **Une salle d'arcade** : 7 bornes, une par notion, et un **vrai mini-jeu différent sur chaque borne**.
- **La structure de Codédex** autour : un cours avant chaque borne, de l'XP, des badges, une carte de progression.
- **La direction artistique Neon Grid** : fond sombre, lignes lumineuses, synthwave et arcade.

**Ce que l'équipe a rejeté, à ne pas reproduire :**
- une suite d'exercices déguisés ;
- tout ramener à une seule grille ;
- des maquettes « pas jeu ».

**Ce qu'elle a validé dans le prototype :**
- la jouabilité arcade : un mur qui fonce sur toi, des vies, du score, des combos, du son, du « juice » ;
- **l'apprentissage dans le jeu lui-même**, décrit dans le schéma pédagogique de la section 4.3.

**Comment on sait que l'élève a compris :** il doit **prédire avant de voir**. Dans le jeu, ça prend la forme de règles de plus en plus exigeantes : à la fin, le mur ne montre plus que sa matrice, et il faut savoir la lire pour survivre.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- La salle d'arcade, avec **7 bornes** qui ont chacune leur mini-jeu.
- **Un cours court avant chaque borne**, dans l'esprit de Codédex.
- **L'adaptation dès la première minute** (profil, diagnostic), puis en continu dans le jeu (section 5).
- **Les coordonnées visibles partout**, et un **rythme lisible** : les textes ne disparaissent jamais avant qu'on ait pu les lire.
- **Des animations fluides** et un rendu néon qui ne fait pas « IA ».
- **Le contenu** (cours, vagues, cartes) est décrit dans des fichiers que l'équipe peut écrire sans coder.

**Non-objectifs :** pas de comptes, pas de serveur, pas de streak, pas de certificat, pas d'IA générative, pas de 3D.

**Anti-objectifs (ce serait un échec même si ça marche)**
- Un rendu « généré par IA » : dégradés violets par défaut, cartes toutes identiques, emojis en guise d'icônes, textes creux.
- Tout ce qui ressemble à un chat avec une IA (c'est interdit par le règlement).
- Une borne qu'on réussit en tâtonnant sans comprendre.
- Des textes qui défilent trop vite pour être lus.
- Une copie de Codédex ou d'un jeu existant (personnages, dessins, textes).

## 3. Contraintes
- **Environ 23 h avant la démo** (au 21/11 en fin de matinée). **C'est Claude qui code.**
- **Le format du contenu est figé en tout premier**, pour que les deux amis puissent écrire en parallèle.
- Tout dans le navigateur, interface et contenu **en anglais**.
- **Commits :** jamais de mention de Claude en co-auteur. On ne pousse sur GitHub qu'avec l'accord explicite de Camson.
- **Plusieurs Claude travaillent en parallèle** : il faut respecter `CLAUDE.md` (zones et réservations).

## 4. Le parcours du joueur

```
Titre ─► Profil (2 clics) ─► Diagnostic (~2 min, passable) ─► SALLE D'ARCADE (carte)
                                                                   │
            Borne N : COURS (3–5 écrans courts) ─► MINI-JEU (vagues) ─► VAGUE BOSS ─► badge + borne suivante
```

### 4.1 Profil et diagnostic
- **Le profil**, en deux clics :
  - **le niveau** : `highschool`, qui donne le mode `guided`, ou `university`, qui donne le mode `fast` ;
  - **le thème des exemples** : `games`, `physics` ou `ai`.
- **Le diagnostic** : 5 prédictions rapides, sur les bornes 1 à 5. Une réussite met la maîtrise de la borne à 0,7, ce qui l'ouvre et la marque « mastered ». Il est passable (« Skip »).
- **L'ouverture des bornes** : une borne s'ouvre si elle est maîtrisée, ou si toutes les précédentes sont terminées ou maîtrisées.
- **« Maîtrisé » n'est pas « terminé »** : il faut battre le boss pour avoir le badge.

### 4.2 La salle d'arcade, qui sert de carte
- **7 bornes alignées**, dans l'un de 4 états :
  - éteinte et verrouillée ;
  - allumée ;
  - en cours, en rose avec « ▶ PLAY » ;
  - terminée, avec son badge.
- **En haut** : le niveau du joueur, l'XP, les badges (x / 7) et le Transform Dex (x / n).
- **La borne conseillée est mise en avant** selon la maîtrise. Toutes les bornes ouvertes restent jouables.

### 4.3 Le schéma pédagogique commun à toutes les bornes (validé dans le prototype)

Chaque mini-jeu applique **les mêmes 8 règles**. C'est ce qui relie le jeu à la notion.

1. **Un briefing avant chaque vague**, que le joueur ferme lui-même. Il contient :
   - la notion du jour (« STRETCH · NEW CONCEPT ») ;
   - deux phrases d'explication ;
   - **la mission en coordonnées**, par exemple « send î to (1.5, 0) and ĵ to (0, 1.5) ».
2. **Les coordonnées partout** : axes gradués, coordonnées en direct au bout de chaque flèche ou objet manipulé, et sur les cibles.
3. **La mission et une checklist en direct** pendant la vague : « ○ î on (1.5, 0) » devient « ✓ ».
4. **Des règles de plus en plus exigeantes**, pour prédire avant de voir :
   - d'abord avec les aides visuelles ;
   - puis sans les points d'aide ;
   - enfin, seulement la représentation abstraite (la matrice, les nombres), et la cible n'apparaît qu'à l'impact.

   Un bandeau « NEW RULE » annonce chaque changement.
5. **Un replay après chaque vague**, qui attend le clic du joueur à la fin. La bonne réponse se reconstruit étape par étape, avec une légende : « î carries the corner (1, 0) → it lands on (2, 1) », puis « Column 1 = where î lands · Column 2 = where ĵ lands ».
6. **Une erreur nommée, puis un entraînement ciblé** :
   - le jeu nomme l'erreur (« You swapped î and ĵ — column 1 is where î lands »), et la partie fausse clignote dans la matrice ;
   - **la vague suivante est un entraînement sur cette erreur** (« TRAINING · SWAPPED ARROWS »), jusqu'à ce qu'elle soit réussie.
7. **Le Transform Dex** : une carte à collectionner par concept rencontré pour la première fois, avec une animation en boucle, deux phrases et les coordonnées clés. La collection s'affiche sur la carte et en fin de partie.
8. **La boucle arcade** :
   - 3 vies, un score et des combos ;
   - un bonus « LOCK IN » quand on verrouille tôt ;
   - du son, avec des particules, un flash et un tremblement d'écran ;
   - **un rythme lent au début** (par exemple 16 s par mur dans le prototype) qui accélère ensuite.

### 4.4 Les 7 bornes

| Borne | Notion | Mini-jeu | Progression des règles (point 4) | Erreurs entraînées |
|---|---|---|---|---|
| 1 · **Vector Golf** | vecteurs, addition | Une balle à envoyer au trou en enchaînant des coups-vecteurs, autour d'obstacles. | trajectoire montrée → seulement les coordonnées des coups → prédire le point d'arrivée avant de tirer | coordonnées inversées (x, y), signe |
| 2 · **Two-Thruster Drone** | combinaisons, span | Un drone n'a que deux propulseurs u et v. Il faut doser a·u + b·v pour atteindre des cibles. Certaines cibles sont inatteignables quand u et v sont alignés : il faut répondre « unreachable ». | guide de la combinaison → coefficients seuls → atteignable ou pas, sans essayer | mauvais coefficient, span mal jugé |
| 3 · **Hole in the Wall** ✅ prototype | matrice = transformation | Déformer sa forme avec î et ĵ pour qu'elle passe dans le trou du mur. | points d'aide → trou seul → matrice seule | colonnes inversées, signe, une seule colonne |
| 4 · **Machine Factory** | composition | Un tapis roulant avec des machines (tourner, étirer, cisailler). On les place dans l'ordre pour fabriquer la pièce demandée. | aperçu de chaque étape → résultat final seul → matrices seules | ordre de composition |
| 5 · **Squash!** | déterminant | Des formes passent sous une presse-matrice. Il faut parier sur le facteur d'aire et son signe avant l'impact. | aire affichée en direct → aire cachée → matrice seule | signe (retournement), écrasement (det = 0) |
| 6 · **Rewind** | inverse | Des images déformées sont à remettre droites. Certaines sont écrasées à plat : il faut répondre « can't be repaired » et dire pourquoi. | image d'origine en fantôme → sans fantôme → matrice seule | inverser au lieu d'annuler, det = 0 |
| 7 · **Laser Lab** | vecteurs propres | Des lasers traversent une lentille-matrice. Il faut trouver les directions où ils ressortent sans dévier. | rayon de sortie montré → caché jusqu'au tir → matrice seule | confondre « même direction » et « même longueur » |

**Chaque borne finit par une vague BOSS** : la règle la plus exigeante, sur des cas jamais vus. La réussir donne le badge et 50 XP.

**Ordre de construction et périmètre de démo :**
- **La borne 3 en premier**, en portant le prototype dans l'architecture, puis les bornes **1, 5, 6, 2, 4, 7**.
- **Pour la démo :** au moins 3 bornes complètes et soignées (3, 1, 5). Les autres doivent être au moins jouables, avec leur cours.

### 4.5 Le cours avant chaque borne
- **3 à 5 écrans courts**, dans l'esprit de Codédex. Chaque écran contient :
  - un texte de 2 à 4 phrases, adapté au mode et au thème ;
  - une **petite scène animée et manipulable** dans le style néon, par exemple « tire î et regarde la grille suivre » ;
  - une **mini-question de prédiction**, pas un QCM de définition, qui valide l'écran.
- **Une erreur à la mini-question** affiche la leçon de rattrapage liée à cette erreur.

## 5. Adaptation (le critère n° 1 du jury)

| Quand | Ce qui s'adapte |
|---|---|
| **Au départ** | Le profil choisit le mode et le thème. Le diagnostic ouvre les bornes déjà maîtrisées. |
| **Le mode `guided`** (lycée) | Plus d'animations dans le cours, replays longs, murs plus lents, et plus de vagues avant chaque nouvelle règle. |
| **Le mode `fast`** (université) | Cours plus courts, replays courts (passables), progression des règles plus rapide. |
| **Après une erreur** | L'erreur est nommée, la partie fausse clignote, et la vague suivante est un **entraînement sur cette erreur**. |
| **En continu** | **Mode dynamique.** Deux erreurs de suite en `fast` → on propose de passer en `guided` sur cette borne. Trois réussites du premier coup de suite en `guided` → on propose de passer en `fast`. C'est toujours proposé, jamais imposé. |
| **Maîtrise** | BKT de la v1, par borne. Une réussite sous la règle la plus exigeante (cible cachée) compte comme une preuve forte. Une réussite avec les aides compte moins. Une erreur la fait baisser. |

## 6. Contenu (écrit par l'équipe, sans coder)

```
content/
  cabinets/
    03-hole-in-the-wall/
      cabinet.json   ← nom, notion, règles par palier, vitesse, boss
      course.json    ← les écrans du cours (texte guided/fast, exemples par thème, scène, mini-question)
      waves.json     ← le pool de cibles, chacune taguée avec son concept (stretch, shear…)
      drills.json    ← les cibles d'entraînement par type d'erreur, et leur libellé
      dex.json       ← les cartes du Transform Dex (nom, deux phrases, matrice de démo)
  remedial/          ← une leçon de rattrapage par type d'erreur, partagée entre les bornes
```

- **Le schéma exact est laissé au développeur**, mais il doit couvrir ces fichiers et les points 1 à 8 de la section 4.3.
- **Un fichier invalide est signalé**, sans faire planter le jeu.
- **Un test vérifie** que chaque cible et chaque mini-question a une solution.
- **Les 18 niveaux de la v1** servent de cibles pour la borne 3 et de mini-questions pour les cours des bornes 1 à 3.

## 7. Approche technique (option 4, choisie par l'équipe)
- **React + Vite + TypeScript** pour la carte, le cours, les menus et le HUD hors jeu. **Motion** pour les transitions, **KaTeX** pour les matrices.
- **PixiJS v8** pour chaque mini-jeu : un composant React qui monte une application Pixi par borne.
  - Le prototype montre les techniques à reprendre : le glow en traits superposés, le trou découpé avec `cut()`, les particules, le tremblement, le flash et le son WebAudio.
  - On peut ajouter `pixi-filters` (bloom) si le rendu le justifie.
- **Le moteur de la v1 reste en TypeScript pur, testé avec Vitest** (maths 2×2, `diagnose`, maîtrise, sauvegarde). On y ajoute, toujours testés :
  - le choix de la prochaine cible (paliers, entraînement après erreur) ;
  - l'XP, les niveaux, le Dex ;
  - l'ouverture des bornes ;
  - le mode dynamique.
- **On retire Mafs.**
- **Le front** : avant de coder les écrans, on passe par **website-design:web-design-system**, qui produit un `DESIGN.md`. À la fin, **website-design:web-review** relit les écrans pour éliminer ce qui fait générique.

## 8. Répartition (à reporter dans CLAUDE.md)

| Qui | Zone |
|---|---|
| **Camson + son Claude** | le moteur, le cadre commun des bornes, les mini-jeux PixiJS, la carte, le cours, le design |
| **Ami 1 + son Claude** | le contenu des bornes 1 à 4 : cours, vagues, entraînements, cartes du Dex |
| **Ami 2 + son Claude** | le contenu des bornes 5 à 7, et les leçons de rattrapage |

Tout le monde part de `main`, avec une branche `<prénom>/<sujet>` par personne.

## 9. Démo (≈ 3 min)
1. **Le profil en 2 clics**, puis la salle d'arcade.
2. **Le cours de la borne 3** : un écran avec la scène « tire î, la grille suit ». C'est le « clic ».
3. **Hole in the Wall** : une vague réussie, puis une ratée exprès. On montre l'erreur nommée, le replay colonne par colonne et la vague d'entraînement.
4. **La règle « matrix only »** : on survit en lisant la matrice. C'est la preuve qu'on a compris.
5. **Retour à la carte** : le badge, une carte du Dex débloquée, puis un aperçu de Vector Golf et de Squash!.

## 10. Laissé au développeur
- Le schéma JSON exact.
- Le détail visuel des bornes 1, 2 et 4 à 7, dans le cadre du DESIGN.md et du prototype.
- Le choix du routeur, la durée des animations, les noms des vagues.
- Le partage de code entre les mini-jeux.
