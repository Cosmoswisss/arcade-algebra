# Démo live de 3 minutes : Arcade Algebra

*Préparée le 22/11/2026 sur la branche `camson/live-demo`. À répéter au moins deux fois avant de passer devant le jury.*

## Le message à faire passer

> **On apprend l'algèbre linéaire en jouant, et le jeu sait ce que tu sais.**
> Pas de chatbot : chaque réponse est une preuve, chaque erreur est nommée puis entraînée, et la carte de tes connaissances se met à jour sous tes yeux.

Trois choses que le jury doit avoir vues à la fin : **(1)** le cours *est* le jeu, **(2)** une erreur nommée puis une nouvelle vague, **(3)** « ce que le jeu sait de toi », avec son incertitude.

## Avant de monter sur scène

1. Lancer le site : `npm run dev`, puis ouvrir **http://localhost:5173/?demo#/** (le `?demo` est indispensable).
   Pour une version figée : `npm run build`, puis `npx vite preview`, et ouvrir `http://localhost:4173/?demo#/`.
2. Plein écran du navigateur (pas de barre d'onglets), zoom 100 %, son coupé ou bas.
3. Appuyer sur **Alt+1** : progression vierge, écran titre. Tout est prêt.

### La télécommande cachée (mode `?demo` seulement)

| Raccourci | Charge | Ouvre |
|---|---|---|
| **Alt+1** | un nouveau joueur, sans profil | l'écran titre |
| **Alt+2** | Vector Golf et Drone terminés, profil lycée + sport | la leçon de Constellation |
| **Alt+3** | la même chose, Constellation déjà pratiquée | la borne Constellation, **directement en « numbers only »** |
| **Alt+4** | Constellation terminée, pas encore fêtée | la carte (VEX fête la zone, 3 badges) |
| **Alt+5** | la même chose + une erreur récurrente (colonnes inversées) | « My knowledge » |
| **Alt+0** | — | ouvre ou ferme la liste des scènes |

- Seule une petite pastille « D » presque transparente reste visible en bas à gauche.
- La démo enregistre sa progression sous sa propre clé : la sauvegarde d'un vrai joueur n'est jamais touchée.
- Les vagues des bornes sont **les mêmes à chaque répétition** (hasard figé par borne). Si un moment rate, on recharge la scène et on recommence.

## Le déroulé (3:00)

| Temps | Écran | On fait | On dit (proposition) |
|---|---|---|---|
| **0:00–0:20** | Titre (Alt+1) | Laisser tourner le mode démo : les vrais jeux défilent, VEX annonce. | « En France, l'algèbre linéaire n'existe pas au lycée. Arcade Algebra l'apprend de zéro jusqu'aux vecteurs propres, avec 7 jeux d'arcade, un par idée. Pas de chatbot : le jeu sait ce que tu sais. » |
| **0:20–0:40** | Profil → test de placement | **Insert coin**, cliquer *High school* puis *Sport*, *Continue*. Au test de placement (Machine Factory), cliquer **ROTATE 90°** puis **STRETCH X2**, *Lock in*, puis *Skip the test*. | « Deux clics de profil, puis un test de placement adaptatif : les questions sont de vraies vagues de jeu, impossibles à deviner. Il place le joueur, puis on peut le passer. » |
| **0:40–1:35** | **Alt+2** → leçon Constellation | VEX raconte la zone. *Skip the warm-up* (« il existe un échauffement sur ta notion la plus faible »). Montrer la scène : c'est un replay du vrai jeu. **Your turn** → *Lock in* **sans rien bouger** (erreur exprès). VEX : « One arrow is right, the other is not… î should land on (2, 0) ». **Try another one** → nouvelle vague : glisser **ĵ jusqu'à (0, 2)** (î reste en (1, 0)), *Lock in*. | « Le cours, c'est le jeu lui-même, sans chrono. Je me trompe exprès… le jeu nomme l'erreur, colonne par colonne. Et il ne me redonne pas la même question, dont il vient de montrer la réponse : il m'en donne une nouvelle, sur la même idée. » |
| **1:35–2:15** | **Alt+3** → borne Constellation | Espace pour fermer le briefing (« NEW RULE · STAR MAP ONLY »). La matrice est **[[1, 0], [0, 2]]** : glisser **ĵ jusqu'à (0, 2)**, laisser î en (1, 0), *Lock in*. Laisser le replay se jouer. | « Dans la borne, l'aide disparaît par paliers. Ici, il ne reste que la matrice : il faut savoir la lire pour placer les étoiles. C'est notre preuve de compréhension : prédire avant de voir. » |
| **2:15–2:35** | **Alt+4** → carte | Laisser VEX dire sa réplique de zone réparée. Montrer les badges et la zone allumée. | « Chaque boss battu répare une zone de la Grid. La progression suit les notions, pas un compteur de clics. » |
| **2:35–3:00** | **Alt+5** → My knowledge | Descendre jusqu'aux pourcentages « ± » et à la « next target ». | « Et voilà ce que le jeu sait de moi : une probabilité par notion, avec son incertitude. Mes points faibles deviennent mes prochaines vagues, et un test de transfert vérifie que j'ai appris, pas seulement que je me suis amusé. Merci ! » |

## Si quelque chose tourne mal

- **Une vague ne se passe pas comme prévu** : recharger la scène (Alt+2 ou Alt+3) et refaire le geste ; les vagues sont les mêmes.
- **Le test de placement pose une autre question** (ses questions sont générées à chaque fois) : répondre n'importe quoi puis *Skip the test*. Le déroulé ne dépend pas de la réponse.
- **Le temps file** : couper le test de placement (aller directement à Alt+2 après le titre) ; on gagne 20 secondes.
- **Le navigateur plante** : rouvrir `http://localhost:5173/?demo#/`, puis Alt+2.

## Ce que le mode démo ne fait pas

- Il ne triche pas : ce sont les vrais écrans, les vraies vagues et le vrai moteur. Il prépare seulement une progression et fige le hasard.
- Il ne change rien sans `?demo` dans l'adresse.
