# CLAUDE.md : règles communes pour les sessions Claude de l'équipe

Claude Code lit ce fichier automatiquement au début de chaque session ouverte dans ce repo.
**Plusieurs personnes travaillent en parallèle, chacune avec son propre Claude.** Le but de ces règles : que personne n'écrase le travail d'un autre.

## Le projet en bref

Un jeu web pour apprendre l'algèbre linéaire à partir de zéro. On le fait pour le challenge Scholé de LauzHack 2026 : pas de chatbot, et le jeu doit s'adapter à l'élève.

- **Pile technique :** Vite, React, TypeScript, Mafs et Vitest. Tout tourne dans le navigateur, il n'y a pas de serveur.
- **Langue :** l'interface, le contenu des niveaux et le code sont **en anglais**. Les documents internes peuvent rester en français.
- **Documents de référence :**
  - la conception : `docs/superpowers/specs/2026-11-21-linalg-game-design.md`
  - le plan : `docs/superpowers/plans/2026-11-21-linalg-game.md`
  - le format des niveaux : `README.md`

> ⚠️ **Une refonte est en cours de conception**, pour ajouter un vrai côté jeu et un cours avant chaque niveau. Tant que la section « Refonte » ci-dessous n'est pas remplie, **ne modifiez pas l'architecture** : `src/App.tsx`, `src/components/` et `src/engine/types.ts`.

## Qui touche à quoi

Chacun ne modifie **que les fichiers de sa zone**. Pour toucher à un fichier d'une autre zone, ou à un fichier partagé, il faut d'abord le réserver (voir « Réservations »).

| Zone | Responsable | Fichiers |
|---|---|---|
| **Moteur et interface** | Camson (pilote) | `src/engine/`, `src/components/`, `src/App.tsx`, `src/styles.css` |
| **Niveaux, partie 1** | Ami 1 | `src/levels/vectors-*`, `combinations-*`, `transform-*`, `composition-*` |
| **Niveaux, partie 2** | Ami 2 | `src/levels/det-*`, `inverse-*`, `eigen-*`, `error-*` |
| **Partagés** (réservation obligatoire) | n'importe qui | `src/engine/types.ts`, `src/levels/loader.ts`, `package.json`, `CLAUDE.md`, `README.md`, `tests/levels/loader.test.ts` |

Remplacez « Ami 1 » et « Ami 2 » par vos prénoms.

## Règles Git

1. **Ne jamais travailler directement sur `main`.** Chaque personne a sa branche, nommée `<prénom>/<sujet>`, par exemple `ami1/levels-vectors`.
2. **Avant de commencer :** `git fetch`, puis on repart du `main` à jour. On relit ce fichier, en particulier les réservations.
3. **Avant chaque commit :** `npm test` et `npx tsc --noEmit` doivent passer.
4. **Un commit = un sujet.** Le message est en anglais et commence par `feat:`, `fix:`, `docs:` ou `content:`.
5. **Interdit :** `git push --force` et `git rebase` sur une branche déjà poussée.
6. **Seul Camson fusionne dans `main`.** Les autres poussent leur branche et le préviennent.
7. **Rien n'est poussé sur GitHub sans l'accord explicite de la personne responsable de la session.**

## Réservations

Avant de modifier un fichier partagé, ou un fichier d'une autre zone, **ajoutez une ligne ici** dans un commit séparé. Supprimez-la quand c'est fini.

| Qui | Fichier(s) | Pourquoi | Depuis |
|---|---|---|---|
| *(vide)* | | | |

## Ajouter un niveau (pour les deux amis)

1. Copier un fichier JSON existant de sa zone, et lui donner un `id` unique égal au nom du fichier.
2. Respecter le format décrit dans `README.md`. La forme doit être **asymétrique**, et les cibles doivent rester entre x −3 et 4,5, y −2 et 3,5.
3. Ajouter la solution du niveau dans `tests/levels/loader.test.ts`, dans l'objet `SOLUTIONS`. **Ce fichier est partagé : il faut le réserver.**
4. Lancer `npm test`. Les tests vérifient que le niveau se charge et qu'il a une solution.

## Refonte (à remplir après le brainstorming)

*Vide pour l'instant. On y mettra la nouvelle structure (cours, puis jeu, puis niveaux) et la répartition du travail qui en découle.*
