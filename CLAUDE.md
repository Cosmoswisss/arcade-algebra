# CLAUDE.md : règles communes pour les sessions Claude de l'équipe (Linear Arcade)

Claude Code lit ce fichier automatiquement au début de chaque session ouverte dans ce repo.
**Plusieurs personnes travaillent en parallèle, chacune avec son propre Claude.** Le but de ces règles : que personne n'écrase le travail d'un autre.

## Le projet en bref

**Linear Arcade** : un jeu web pour apprendre l'algèbre linéaire à partir de zéro. On le fait pour le challenge Scholé de LauzHack 2026 : pas de chatbot, et le jeu doit s'adapter à l'élève.

C'est **une salle d'arcade de 7 bornes**, une par notion. Chaque borne a son propre mini-jeu (PixiJS), précédé d'un **cours court** dans l'esprit de Codédex. **On vise la compréhension profonde, pas la réussite d'examens.**

- **Pile technique (v2) :** Vite, React, TypeScript, PixiJS v8, Motion, KaTeX et Vitest. Tout tourne dans le navigateur, sans serveur.
- **Langue :** l'interface, le contenu et le code sont **en anglais**. Les documents internes peuvent rester en français.
- **Documents de référence (à lire avant de travailler) :**
  - **la conception :** `docs/superpowers/specs/2026-11-21-linalg-game-v2-design.md`. **Les 8 règles pédagogiques de la section 4.3 sont obligatoires dans chaque borne.**
  - **le plan :** `docs/superpowers/plans/2026-11-21-linear-arcade-v2.md`
  - **le prototype validé :** `docs/prototypes/hole-in-the-wall.html`, à ouvrir dans un navigateur
  - **le format du contenu :** `content/README.md`, créé par la Tâche 2 du plan. **N'écrivez pas de contenu avant qu'il existe.**
- **La v1 a été supprimée** (Mafs, `src/components/`, `src/levels/`). Les 7 bornes v2 sont toutes jouables, avec un contenu minimal écrit par Claude.

## Qui touche à quoi

Chacun ne modifie **que les fichiers de sa zone**. Pour toucher à un fichier d'une autre zone, ou à un fichier partagé, il faut d'abord le réserver (voir « Réservations »).

| Zone | Responsable | Fichiers |
|---|---|---|
| **Moteur, bornes, écrans, design** | Camson (pilote) | `src/`, `tests/` (sauf les tests de contenu des amis), `DESIGN.md` |
| **Contenu des bornes 1 à 4** (cours, vagues, entraînements, cartes du Dex) | Ami 1 | `content/cabinets/01-vector-golf/`, `02-drone/`, `03-hole-in-the-wall/`, `04-factory/` |
| **Contenu des bornes 5 à 7, et leçons de rattrapage** | Ami 2 | `content/cabinets/05-squash/`, `06-rewind/`, `07-laser-lab/`, `content/remedial/` |
| **Partagés** (réservation obligatoire) | n'importe qui | `src/engine/types.ts`, `src/content/`, `content/README.md`, `package.json`, `CLAUDE.md`, `README.md` |

Remplacez « Ami 1 » et « Ami 2 » par vos prénoms.

## Règles Git

1. **Ne jamais travailler directement sur `main`.** Chaque personne a sa branche, nommée `<prénom>/<sujet>`, par exemple `ami1/content-golf`.
2. **Avant de commencer :** `git fetch`, puis on repart du `main` à jour. On relit ce fichier, en particulier les réservations.
3. **Avant chaque commit :** `npm test` et `npx tsc --noEmit` doivent passer.
4. **Un commit = un sujet.** Le message est en anglais et commence par `feat:`, `fix:`, `docs:` ou `content:`.
5. **Interdit :** `git push --force` et `git rebase` sur une branche déjà poussée.
6. **Seul Camson fusionne dans `main`.** Les autres poussent leur branche et le préviennent.
7. **Rien n'est poussé sur GitHub sans l'accord explicite de la personne responsable de la session.**
8. **Aucune mention de Claude en co-auteur** dans les commits ni dans les PR (pas de ligne `Co-Authored-By`).

## Réservations

Avant de modifier un fichier partagé, ou un fichier d'une autre zone, **ajoutez une ligne ici** dans un commit séparé. Supprimez-la quand c'est fini.

| Qui | Fichier(s) | Pourquoi | Depuis |
|---|---|---|---|
| Massimo | `src/engine/types.ts`, `src/content/`, `content/README.md`, `content/robot.json`, `content/cabinets/*/course.json`, `content/cabinets/*/cabinet.json`, `content/remedial/` | cours jouable, robot, thème sport (spec `2026-11-21-course-as-game-design.md`) | 21/11 |

## Écrire du contenu (pour les deux amis)

1. **Le format est figé** : il est décrit dans `content/README.md`. Chaque borne a déjà un contenu minimal (3 écrans de cours, 8 à 12 vagues) : améliorez-le plutôt que de repartir de zéro.
2. **Écrire dans le dossier de sa borne**, en suivant le README, et en anglais. Pour chaque borne :
   - **3 à 5 écrans de cours**, chacun avec une mini-question de **prédiction**, jamais une simple définition ;
   - **au moins 6 vagues**, chacune taguée avec son concept ;
   - **un entraînement par type d'erreur** de la borne ;
   - **une carte du Dex par concept.**
3. **Les textes sont courts** (2 à 4 phrases) et **donnent des coordonnées**, pas seulement des mots. Le mode `guided` détaille davantage, le mode `fast` va droit au but.
4. **Lancer `npm test`** : les tests vérifient que le contenu se charge et que chaque vague et chaque question a une solution.
