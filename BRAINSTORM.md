# LauzHack 2026 : challenge Scholé, brainstorm

## Le challenge, en bref
- Créer une façon **nouvelle et mémorable** d'apprendre un sujet. **Interdit : les chatbots.**
- Critères du jury : **Créativité**, **Adaptabilité** (la leçon change selon l'élève, ses choix et ses résultats), **Facilité d'usage** (on comprend sans explication).
- Ce qu'ils aiment : un test de départ court, chaque réponse liée à une compétence, une **probabilité de maîtrise par compétence**, et les points faibles qui deviennent la cible de la suite.

- **Jugement** : l'ingéniosité de l'approche compte plus que la finition. Est-ce que ça enseigne vraiment à quelqu'un qui n'a jamais vu la matière ?
- **Démo courte** : on présente l'approche et on montre **le moment où ça fait « clic »**.
- **Pas de dataset ni de code de départ** : toute ressource publique, librairie open source ou API d'IA est autorisée.
- **Mentors Scholé** à leur stand : ils aident à cadrer le sujet, donnent des retours et peuvent **jouer un élève perdu** (parfait pour tester).
- **Règle** : l'élève ne doit jamais avoir l'impression de discuter avec une IA. Et il faut faire **différent de Scholé** : tester leur leçon d'essai https://app.schole.ai/g/taste-of-schole, puis aller plus loin.

## Notre idée
Un **jeu web pour apprendre l'algèbre linéaire**, pour des lycéens et des étudiants qui partent de zéro (en France, on n'en fait pas au lycée). On commence par les bases et on va raisonnablement loin.

## Parcours d'apprentissage (7 étapes)
1. **Vecteurs** : des flèches qu'on additionne et qu'on allonge.
2. **Combinaisons linéaires et bases** : atteindre n'importe quel point avec 2 flèches.
3. **Matrice = transformation** : une matrice dit où vont les flèches î et ĵ.
4. **Composition** : enchaîner deux transformations, c'est multiplier les matrices (et AB ≠ BA).
5. **Déterminant** : le facteur d'agrandissement des aires (0 = tout est écrasé, négatif = retourné).
6. **Systèmes et inverse** : retrouver le point de départ (Ax = b).
7. **Vecteurs propres** : les directions qui ne tournent pas.

**Où les élèves bloquent souvent :** confondre un point et un vecteur, inverser lignes et colonnes, l'ordre de la composition, le déterminant négatif, la dépendance linéaire.

## 3 concepts de jeu
| | Concept | Points forts | Risque |
|---|---|---|---|
| A | **Navigateur** : amener un vaisseau sur une cible en combinant des vecteurs donnés | Simple, intuitif dès la 1re seconde | Ne couvre bien que les étapes 1 et 2 |
| B | **Forge de transformations** : déformer une forme pour qu'elle passe dans un trou, en tirant î et ĵ (la matrice se construit en direct) | Très visuel, démo forte, couvre les étapes 3 à 7 | Le moteur de jeu est plus long à coder |
| C | **Escape room** : des messages chiffrés par une matrice qu'il faut inverser | Narratif | Moins visuel, ressemble à des exercices |

**Piste préférée : A puis B dans un seul monde en grille.** On commence en Navigateur, puis la grille elle-même devient déformable.

## Décidé : le moment « clic » de la démo
On tire la flèche î, et **toute la grille se déforme en même temps**. La matrice affichée à côté se met à jour en direct : sa 1re colonne, c'est î, et sa 2e colonne, c'est ĵ.

## Décidé : quand le joueur se trompe
1. **On lui montre son erreur sur la grille** : sa transformation en couleur, la bonne en fantôme, superposées. Il voit où ça diverge.
2. **On lui propose un niveau ciblé** sur cette erreur précise, par exemple « î et ĵ inversés ».
3. **Les niveaux sont des données, pas du code** : chaque niveau est décrit dans un fichier (forme, cible, flèches à bouger, compétence testée). Nous, les concepteurs, pouvons ajouter ou modifier des niveaux plus tard sans toucher au moteur du jeu.

## Comment le jeu s'adapte (ce que le jury regarde)
- **Test de 3 minutes au début** : un mini-défi par étape, pour placer le joueur au bon niveau.
- **Maîtrise par compétence** : une probabilité de maîtrise, mise à jour à chaque réponse.
- **Les erreurs sont analysées** : par exemple, si le joueur inverse les colonnes, le niveau suivant cible exactement cette erreur.
- **Indices progressifs** : d'abord une question, puis une analogie, puis une règle, puis un exemple voisin. Jamais la réponse.
- **Le thème change selon le profil**, sans prompt : jeux vidéo, physique ou IA.
- **Preuve d'apprentissage** : un défi de transfert sans aide, en fin de session.

## Plugins Claude utilisés
- **Superpowers** : brainstorming, puis plan, développement guidé par les tests et revue de code.
- **Education Skills Library** : parcours d'apprentissage, indices progressifs, diagnostics.
- **Game Trend Skills** : générer et évaluer les concepts de jeu.
- **Website Design** : direction visuelle de la webapp.
- **DemoDay** : vidéo de démo finale.
- **Pitch Deck Advisor** : slides du pitch.
