# Le cours devient un jeu : conception

*21/11/2026, branche `merge/v2-final`. Fait suite aux retours de l'équipe après le premier test de la v2 fusionnée.*

## 1. Intention

L'équipe a joué à la v2 et trouve le site **trop mathématique au début** : l'accueil et le cours montrent tous la même grille avec une forme en L, et les « Your turn » ressemblent à des exercices. Elle veut **voir, dès l'accueil et dans le cours, que c'est un jeu**, dans l'esprit de Codédex (une carte du monde, une petite histoire), **en gardant notre direction artistique néon** (`DESIGN.md`). Elle veut aussi un jeu **plus adaptatif**, et que le test de placement serve à quelque chose.

**Comment on saura que c'est réussi :** quelqu'un qui découvre le site comprend en 5 secondes qu'il va jouer ; dans une leçon, il voit la balle, le drone ou la presse de la borne, pas une grille abstraite ; et la démo de 3 minutes montre au moins une adaptation visible (leçons sautées, indice du robot, rappel d'une erreur).

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
1. **Le cours utilise le vrai jeu de la borne** (choix A de l'équipe) :
   - la scène de chaque leçon est le **replay d'une vague du vrai jeu** ;
   - le « Your turn » est **une vraie vague jouée**, sans chrono, avec les aides.
2. **Un robot-guide**, fun et un peu drôle, qui commente le cours, les réussites et les erreurs.
3. **Une carte du monde, « The Grid »**, à la place de la rangée de bornes, avec **une petite histoire** : chaque zone a perdu une règle de l'espace, le joueur la répare.
4. **Un accueil en mode démo d'arcade** : les vrais jeux défilent en replay, et le robot fait l'annonce.
5. **Le thème « AI » est remplacé par « Sport »** (trajectoires de ballon, passes, forces).
6. **Les cinq idées d'adaptation**, toutes demandées :
   1. le test de placement fait sauter des leçons et démarre la partie à une règle plus exigeante ;
   2. une échelle d'indices dans le « Your turn » (l'erreur nommée, puis un indice précis, puis une version plus facile) ; une réussite du premier coup raccourcit la leçon suivante ;
   3. le jeu se souvient des erreurs fréquentes, et le robot les rappelle dans les bornes suivantes ;
   4. un échauffement au début de chaque borne (à partir de la 2ᵉ), sur la notion précédente la plus faible ;
   5. les missions du robot sont racontées dans l'univers du thème choisi.

**Non-objectifs :** pas de pixel art, pas de nouveau jeu de borne, pas de son nouveau (on réutilise `audio.ts`), pas de voix, pas de serveur.

**Anti-objectifs (échec même si ça marche)**
- Un robot qui ressemble à un chatbot : **il ne répond pas à du texte libre**. Il ne dit que des répliques écrites à l'avance, déclenchées par des événements du jeu (règlement du challenge : pas de chatbot).
- Un robot ou une carte qui copient Codédex ou un jeu existant (personnage, dessin, textes).
- Un robot bavard qui ralentit : **2 phrases maximum par réplique**, et on peut toujours passer.
- Des textes qui disparaissent avant d'être lus (règle de la v2) : les répliques restent jusqu'au clic ou jusqu'à l'action suivante.
- Casser les 8 règles pédagogiques de la section 4.3 de la spec v2 : le cours les reprend au lieu de les contourner.

## 3. Contraintes

- **Fichiers partagés** (`CLAUDE.md`) : `src/engine/types.ts`, `src/content/`, `content/README.md`, `package.json`. On les **réserve** dans `CLAUDE.md`, dans un commit séparé, avant d'y toucher. Le contenu des bornes et du rattrapage est la zone des amis : on les prévient que le format de `course.json` change, et on migre nous-mêmes les 21 leçons existantes, pour que tout reste jouable.
- **Format du contenu** : il doit rester écrivable sans coder (JSON), validé au chargement (un fichier faux est signalé, les autres bornes continuent de marcher), et testé (chaque vague et chaque question a une solution, chaque réponse peut être saisie).
- **Pixi** n'est chargé qu'à l'ouverture d'une borne aujourd'hui (`src/arcade/playable.ts`). Il le sera désormais dès l'accueil (mode démo) : on accepte ce coût, mais l'accueil doit afficher son texte avant que Pixi ait fini de charger.
- **Accessibilité** : la région `aria-live` existante annonce aussi les répliques du robot ; le cours reste jouable au clavier (les poignées acceptent déjà les flèches).
- **Mobile 375 px** : pas de défilement horizontal ; la carte passe en vertical.
- `prefers-reduced-motion` : les replays restent, mais sans tremblement ni particules.

## 4. Approches envisagées

| | Approche | Pour | Contre |
|---|---|---|---|
| **A (choisie)** | Le cours utilise le **vrai jeu de la borne** : scène = replay d'une vague, « Your turn » = une vague jouée | Le plus « jeu » ; le cours et la borne ont la même tête ; réutilise `replay()` des 7 bornes | `course.json` change de format (fichiers partagés) ; Pixi chargé dès le cours |
| B | Scènes SVG plus riches, dessinées par borne | Plus léger ; le format change peu | Un 2ᵉ moteur de rendu à maintenir ; le cours reste différent du jeu |
| C | Habillage seulement (robot, sons, confettis) | Rapide | Les scènes restent des grilles : ne règle pas le reproche |

**L'équipe a choisi A.** B double le travail de rendu, et C ne répond pas au retour principal.

## 5. Ce qui a été décidé

### 5.1 Une scène de jeu réutilisable : `ArcadeStage`

- **Un seul composant React** monte une application Pixi et un jeu de borne, pour trois usages : **la borne** (le `CabinetView` actuel), **la scène de leçon** et **le « Your turn »**. La mise en place Pixi de `CabinetView.tsx` (fond, axes, couche du jeu, effets, `declutter`, HUD) est extraite et partagée, pas copiée.
- **Trois modes de pilotage** :
  - `run` : la partie complète, pilotée par le `Runner` actuel, sans changement de comportement ;
  - `demo` : rejoue en boucle le replay d'une vague donnée (`game.startWave(wave, rule)` puis `game.replay(k)` de 0 à 1), avec la légende du replay sous la scène. Pas de vies, pas de score, pas de chrono. Un bouton « Replay » relance depuis k = 0 ;
  - `challenge` : une seule vague, **sans chrono** (la vague attend que le joueur verrouille, puis l'impact se joue), avec la mission et la checklist en direct. Le résultat est renvoyé au cours.
- **Aucune borne n'a besoin de nouveau code de jeu** pour `demo` et `challenge` : ils n'utilisent que l'interface `CabinetGame` existante (`startWave`, `update`, `lock`, `evaluate`, `goalText`, `checklist`, `replay`, `frame`).

### 5.2 Le nouveau format d'une leçon (`course.json`)

Chaque leçon garde `id`, `title`, `text` (guided / fast) et `examples` (par thème). Elle remplace `scene` par `demo`, et sa question devient **l'un des deux** :

```json
{
  "id": "vectors-are-moves",
  "title": "A vector is a move",
  "text": { "guided": "…", "fast": "…" },
  "examples": { "games": "…", "physics": "…", "sport": "…" },
  "robot": "Rule one of the Grid: a vector is a move, not a place. Watch the ball.",
  "demo": { "wave": "<id d'une vague de waves.json>", "rule": "assist" },
  "play": {
    "wave": { "id": "lesson-golf-1", "concept": "vector", "params": { … } },
    "rule": "assist",
    "mission": { "games": "…", "physics": "…", "sport": "…" }
  }
}
```

- **`demo`** (obligatoire) : la vague rejouée comme scène, désignée par son `id` dans `waves.json` ou `drills.json` de la même borne, et la règle d'affichage du replay.
- **`play`** : une vague jouée, écrite dans la leçon (ses `params` suivent le format de `waves.json` de la borne), sa règle, et la mission racontée par le robot **dans chaque thème** (idée d'adaptation n° 5). La mission en coordonnées (`goalText`) reste affichée en plus, pour ne pas perdre la règle pédagogique n° 1.
- **`check`** (l'ancien format de question) reste possible **à la place de `play`**, pour les questions de concept qu'aucune vague ne pose (par exemple « les deux balles finissent-elles au même point ? »). Il est affiché dans un cadre de jeu (le robot pose la question, une animation de réussite ou d'échec).
- **Chaque borne a au moins 2 leçons sur 3 en `play`.**
- **`robot`** : une réplique d'ouverture, 2 phrases maximum.
- **La validation et les tests suivent** : une leçon a `demo` et exactement un de `play` / `check` ; la vague de `demo` existe ; les `params` de `play` passent le validateur de la borne (`paramsRegistry`) ; une vague `play` a une solution (même test que pour `waves.json`).
- **`content/README.md` est mis à jour** avec ce format et un exemple complet.

### 5.3 Le robot-guide

- **Personnage original** dessiné en SVG néon (pas de pixel art, pas de ressemblance avec un personnage existant), animé avec Motion, avec 4 humeurs : `idle`, `happy`, `oops`, `thinking`.
- **Il ne parle que par répliques écrites** et déclenchées par des événements : ouverture de leçon, réussite, erreur (par type d'erreur), indice, échauffement, rappel d'erreur, zone réparée, test de placement, mode démo de l'accueil.
- **Ses répliques génériques** sont dans un nouveau fichier `content/robot.json` : une liste de variantes par événement et, pour les erreurs, par `errorKind`, tirées au hasard. Les répliques propres à une leçon sont dans `course.json` (`robot`) et `cabinet.json` (`story`).
- **Son nom et son ton** : drôle et bienveillant, jamais moqueur, en anglais. Le nom et les premières répliques sont proposés par le développeur, puis relus par l'équipe.
- Il apparaît : dans le cours (à côté de la scène), sur la carte, sur l'accueil, et dans la bulle d'erreur du « Your turn ». **Pas pendant les vagues de la borne** (le HUD de la borne est déjà chargé).

### 5.4 La carte « The Grid » et l'histoire

- **La salle (`Hall.tsx`) devient une carte** : 7 zones reliées par un chemin lumineux sur la grille synthwave, dans l'ordre des bornes. Elle garde **les 4 états actuels** (verrouillée, ouverte, maîtrisée, terminée), la mise en avant de la borne conseillée, et le panneau niveau / XP / badges / Dex. Un marqueur « YOU » est posé sur la zone conseillée.
- **Une zone éteinte se rallume** quand sa borne est terminée (badge).
- **Sur mobile**, le chemin est vertical.
- **L'histoire** : « The Grid » s'est déréglé ; chaque zone a perdu une règle de l'espace ; le joueur la répare en la comprenant. Chaque `cabinet.json` reçoit un champ `story` : `{ "intro": "…", "cleared": "…" }`, 2 phrases chacun, dits par le robot à l'entrée de la zone (avant la 1ʳᵉ leçon) et à la victoire contre le boss.

### 5.5 L'accueil en mode démo

- **La scène de droite de l'accueil** (aujourd'hui `MiniScene` avec la forme en L) devient un `ArcadeStage` en mode `demo` qui **fait défiler les 7 bornes** : la `demo` de la 1ʳᵉ leçon de chaque borne, l'une après l'autre, avec le nom de la borne affiché en néon, comme une borne en attente de joueurs.
- **Le robot** annonce, avec une réplique par borne tirée de `robot.json`.
- **Le texte d'accueil** reste à gauche et s'affiche tout de suite ; la scène apparaît quand Pixi est prêt.

### 5.6 Le thème « Sport »

- **`Theme` devient** `'games' | 'physics' | 'sport'` dans `src/engine/types.ts`.
- **Toutes les clés `ai`** du contenu (exemples et missions) sont réécrites en `sport`.
- **Une progression enregistrée avec `ai`** se charge avec le thème `games` (pas d'erreur, pas de perte du reste de la progression).
- **L'écran de profil** propose Games, Physics et Sport, chacun avec son exemple.

### 5.7 L'adaptation

| # | Quoi | Où c'est décidé | Ce que voit le joueur |
|---|---|---|---|
| 1 | **Le test de placement compte.** Une borne réussie au test : ses leçons en `play` sont marquées « déjà sues » (on peut les rouvrir), son cours commence par une seule leçon de rappel, et la partie démarre au palier `partial`. | Le résultat du test est enregistré par borne dans la progression. Le `Runner` reçoit un palier de départ. | Le robot : « You already know vectors: I'm skipping 2 lessons. » Un message sur la carte. |
| 2 | **L'échelle d'indices** dans un `play` raté : 1) le robot nomme l'erreur (le diagnostic existant) et la partie fausse clignote ; 2) au 2ᵉ échec, il donne un indice précis et la vague repasse avec la règle `assist` ; 3) au 3ᵉ échec, il joue le replay de la bonne réponse, puis propose **une vague d'entraînement** pour cette erreur (tirée de `drills.json`), qu'il faut réussir pour continuer. **Une réussite du premier coup** affiche la leçon suivante en version `fast`. | Logique pure, testée, dans le moteur. | Des indices qui montent d'un cran à chaque échec. |
| 3 | **La mémoire des erreurs.** La progression compte chaque `errorKind` diagnostiqué (cours et bornes). À l'ouverture d'une borne qui a un entraînement pour l'erreur la plus fréquente du joueur, le robot la rappelle. | Compteur dans `ProgressV2`, choix pur et testé. | « Careful: you tend to swap x and y. Watch the order here. » |
| 4 | **L'échauffement.** À partir de la 2ᵉ borne, le cours commence par **une vague `challenge` d'une borne précédente** déjà ouverte : celle de plus faible maîtrise, en visant l'erreur la plus fréquente si une borne précédente a un entraînement pour elle. Une seule tentative, passable, comptée dans la maîtrise de cette borne. | Choix pur et testé. | « Warm-up: a quick one from Vector Golf. » |
| 5 | **Les missions dans le thème** : `play.mission[theme]` et les répliques du robot. | Contenu. | La même vague racontée comme un tir au but (sport) ou une poussée de fusée (physique). |

**Précisions (décisions du développeur, à corriger si besoin)**
- **Le test de placement** garde son principe (la dernière leçon des bornes 1 à 5, sans retour pendant le test) : une leçon en `play` y est jouée en mode `challenge` à la règle `abstract` ; une leçon en `check` pose sa question. « Skip » enregistre les réponses déjà données au lieu de les jeter.
- **La « leçon de rappel »** d'une borne réussie au test est sa dernière leçon.
- **L'indice précis** (étape 2 de l'échelle) est la leçon de rattrapage existante pour ce type d'erreur (`content/remedial/<errorKind>.json`, sinon `other`), dite par le robot. Les scènes de ces leçons restent affichées avec la `MiniScene` actuelle.
- **Si la vague `play` est déjà en `assist`**, l'étape 2 rejoue la même vague avec les aides et la checklist mises en avant.
- **Une carte du Dex gagnée dans le cours** s'affiche dans le cours, avec la même carte que dans la borne.

**Ce qui ne change pas :** le diagnostic des erreurs, l'entraînement après erreur dans les bornes, la maîtrise BKT, le mode dynamique (proposé, jamais imposé), l'XP, les badges et le Dex.

### 5.8 Ce que le cours fait de la progression

- **Une vague `play` réussie** compte dans la maîtrise de la borne comme une vague de borne à la même règle (même fonction `applyWaveResult`), et peut donner sa carte du Dex. Elle donne de l'XP comme une vague normale.
- **Une vague ratée** compte une erreur (maîtrise, mémoire des erreurs), mais **ne coûte pas de vie** : le cours n'a pas de vies.

## 6. Laissé au développeur

- Le nom du robot, son dessin exact et ses premières répliques (relus ensuite par l'équipe).
- Le dessin exact de la carte et du chemin, dans le cadre de `DESIGN.md`.
- La façon d'extraire `ArcadeStage` de `CabinetView` (composant, hook, ou les deux).
- Le choix des vagues `demo` et l'écriture des vagues `play` des 21 leçons migrées, à condition que chaque vague ait une solution et que chaque borne ait au moins 2 leçons en `play`.
- L'ordre de défilement et la durée de chaque borne dans le mode démo de l'accueil.
- Le découpage en commits et l'ordre des tâches.

## 7. Risques

- **Les `params` d'une vague dépendent de la borne** : une leçon écrite à la main peut être fausse. Les tests de contenu doivent l'attraper (validateur de la borne et test de solution).
- **Une vague sans chrono** : certaines bornes utilisent `t` pour animer (le mur qui avance). En mode `challenge`, `t` reste figé à une petite valeur jusqu'au verrouillage, puis avance vite jusqu'à l'impact ; chaque borne est vérifiée à la main dans ce mode.
- **Le poids** : Pixi dès l'accueil ajoute environ 365 Ko ; l'accueil doit rester utilisable pendant le chargement.
- **Les amis du contenu** ont peut-être commencé à écrire avec l'ancien format : à vérifier avec eux avant de migrer.
