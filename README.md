# TechniLium - Store

Vitrine marketplace (clients) du projet TechniLium : catalogue de produits technologiques, recherche, fiches produit - Afrique francophone, prix en F CFA.

Application NextJS **totalement autonome** : ses propres dépendances, son propre `src/components` et `src/lib`, rien d'importé depuis un autre dépôt. L'identité visuelle (palette noir/or, logo) est extraite du logo de marque Techlium Group et dupliquée à l'identique dans [TechniLium-WEB-BACKOFFICE](https://github.com/Yamoon224/TechniLium-WEB-BACKOFFICE), par choix - pas de package de design partagé.

Dépôts liés : [TechniLium-BACKEND](https://github.com/Yamoon224/TechniLium-BACKEND) (API) · [TechniLium-WEB-BACKOFFICE](https://github.com/Yamoon224/TechniLium-WEB-BACKOFFICE)

## Stack

- NextJS 16 (App Router), React 19, TypeScript strict
- Tailwind CSS v4
- Space Grotesk (titres/prix) + IBM Plex Sans (texte courant)
- Vitest

## Démarrage rapide

Nécessite le backend [TechniLium-BACKEND](https://github.com/Yamoon224/TechniLium-BACKEND) démarré sur `http://localhost:8000`.

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:3000
```

## Qualité

```bash
npm run lint
npm run typecheck
npm run test
```

Régénérer le client API typé une fois le backend démarré :

```bash
npm run generate:api-client
```

## Pages

- `/compte/commandes/[orderNumber]` : suivi détaillé d'une commande (frise globale, une frise datée par colis avec ses articles quand la commande est répartie entre vendeurs, livraison, factures, support) ; lien « Suivre cette commande en détail » depuis `/compte`.
- Retour d'articles : sur la page de suivi d'une commande livrée, liste des retours déjà demandés avec leur avancement (demandée, acceptée, reçue, remboursée, refusée) et formulaire (quantité par article, motif) ; le montant est calculé par le serveur.
- `/compte` : une carte par commande avec frise d'avancement (reçue, confirmée, expédiée, livrée, ou « annulée »), date, articles, total, code de livraison et factures ; la même frise sur la confirmation de commande. Chaque étape affiche la date à laquelle la commande l'a atteinte (journal `status_history` de l'API).
- Fiche produit (fil d'Ariane, prix et remise, engagements, détails), panier (liste + récapitulatif fixe) et pages compte/commande/aide/connexion en cartes blanches ; la photo suit le produit jusque dans le panier ; la fiche produit a une galerie (photo principale + vignettes) ; la commande est en deux colonnes (livraison à gauche, récapitulatif avec code promo et total à droite).
- **Préférences d'affichage** (icône palette de l'en-tête ; thème sur l'appareil, **langue, couleur et thème enregistrés dans le compte** pour un client connecté : elles s'appliquent à la connexion, sur tout appareil, et les changements suivants sont sauvegardés ; un visiteur sans compte les garde sur l'appareil) : thème Clair / Sombre / Automatique (appliqué avant l'affichage, sans flash), couleur principale (6 teintes, orange par défaut) et langue Français / English. Les textes s'écrivent en français dans le code, enveloppés dans `<Tr>…</Tr>` (composants serveur ou client) ou `tr("…")` (attributs, messages) ; `src/lib/phrases.ts` donne la version anglaise, un texte sans traduction reste en français, et un test échoue si un texte enveloppé n'a pas son équivalent anglais. Limites : les messages d'erreur renvoyés par l'API et les noms/descriptions de produits restent dans la langue d'origine, montants et dates gardent le format français.
- **Interface** : champs à étiquette flottante style Materialize (soulignement seul, étiquette qui monte et prend la couleur principale au focus ; classe `.field`, étiquette `<span class="field-label">` après le champ ; seuls les éditeurs en ligne des tableaux gardent l'étiquette de leur colonne), cartes à ombre visible (`shadow-card`), œil pour afficher/masquer les mots de passe, logo centré sur la carte de connexion, favicons recadrés sur le logo.
- Icônes (lucide-react) : menu des catégories (pictogramme choisi d'après le nom/slug), en-tête, engagements, pied de page. Photos produit réelles (backoffice `/produits`).
- `/` - accueil façon place de marché : menu des catégories à gauche, bannière et engagements, rayon « Ventes Flash » (offres avec prix barré et pastille -X %, plus forte remise d'abord), un rayon par catégorie avec « Voir plus » ; recherche et filtre affichent une grille de résultats. En-tête et pied de page communs à toutes les pages (layout).
- `/produits/[slug]` - fiche produit détaillée (prix, garantie, caractéristiques, vendeur), ajout au panier respectant le stock.
- `/panier` - panier (localStorage) : quantités, suppression, sous-total.
- **Catalogue en anglais** : noms, descriptions et catégories s'affichent dans la langue choisie quand l'équipe a saisi l'anglais (sinon le français). La langue est aussi gardée dans un cookie (`TechniLium_lang`) pour que les pages rendues côté serveur interrogent l'API dans la bonne langue ; le changement de langue rafraîchit ces pages. Le panier garde le nom tel qu'il était à l'ajout.
- **Reçus de paiement** : sur la page de suivi, les reçus des paiements encaissés sont téléchargeables en PDF (dans la langue de la commande).
- `/aide` - **centre d'aide public** (FAQ sans compte : commander, payer, suivre, code de livraison, colis, retours avec le vrai délai, factures, messages ; contacts affichés seulement s'ils sont configurés côté serveur) ; la demande au support (connecté) est sur `/support`.
- `/suivi` - suivi sans compte : numéro de commande, puis le téléphone utilisé (jamais dans l'URL).
- `/commande` - **commande sans compte** : seuls le nom complet, le téléphone et le lieu de livraison sont demandés (ville, e-mail et notes sont repliés sous « Ajouter des précisions »), avec la langue de l'interface transmise pour les SMS et e-mails. champ **code promotionnel** avec aperçu de la remise et du total avant confirmation (le code est revalidé côté serveur à la commande) ; formulaire de livraison (e-mail facultatif, prérempli si connecté : le client reçoit alors aussi le suivi par e-mail) + confirmation, paiement à la livraison uniquement.
- `/commande/[orderNumber]` - accusé de réception, retrouvé via sessionStorage juste après la commande ; sinon un formulaire redemande le téléphone (jamais dans l'URL - voir plus bas).
- Après la commande (`/commande/[orderNumber]`) et dans `/compte` : le **code de confirmation de livraison** à ne donner au livreur qu'à la remise du colis ; « Partiellement expédiée / livrée » et statut de chaque colis pour une commande multi-vendeurs.
- Sur `/produits/[slug]` : **avis clients** - note moyenne, répartition par étoiles, liste des avis avec la mention « Achat vérifié » ; un client connecté qui a reçu le produit peut donner son avis (publié aussitôt, ou après vérification s'il est signalé).
- `/aide` - support (connecté) : ouvrir une demande (catégorie, commande concernée choisie parmi ses commandes), suivre ses demandes et leur statut, échanger avec le support. Lien depuis `/compte`.
- `/connexion` - connexion et création de compte (un même formulaire, bascule entre les deux modes).
- `/compte` - informations du compte et historique des commandes (`GET /orders/mine`, authentifié) ; « Mes factures » sur chaque commande confirmée : liste des factures et avoirs et téléchargement du PDF (`/customer/...`, limité à ses propres commandes).

Se connecter avant de passer commande rattache automatiquement la commande au compte (`customer_id`) sans rien changer au parcours invité, qui reste entièrement supporté.

## Identité visuelle

Thème clair façon marketplace : fond gris clair, cartes blanches, un seul accent orange (`#f68b1e`) pour prix, boutons et pastilles ; les noms de jetons (`gold`, etc.) sont conservés de l'ancien thème sombre. Aucun logo, nom ni visuel d'un tiers n'est repris.

## Application installable (PWA)

- `src/app/manifest.ts` : nom, icônes (dont maskable), raccourcis (panier, suivi, compte), thème `#f68b1e`.
- `public/sw.js` : worker volontairement prudent. **Aucune page n'est mise en cache** (un téléphone partagé ne doit pas révéler le compte ou le panier d'un autre) ; les pages passent par le réseau et, hors ligne, `public/offline.html` s'affiche. Fichiers de build (`/_next/static`) et icônes : cache d'abord. API, autres origines et requêtes non-GET : réseau.
- `PwaSetup` : enregistre le worker (production, HTTPS ou localhost seulement), propose « Installer » (redemandé après 14 jours), propose la mise à jour quand une nouvelle version attend, signale la perte de connexion.
- Pour changer le worker : modifier `VERSION` dans `public/sw.js` si la liste de précache change.

## Pages d'erreur

`not-found.tsx` (404, statut HTTP 404), `error.tsx` (500, bouton Réessayer, référence `digest`), `global-error.tsx` (500 autonome si le layout lui-même casse, FR/EN), et `/erreur/[code]` pour 400, 401, 403, 404, 408, 429, 500, 502, 503, 504 (texte dans `src/lib/errors.ts`). `/erreur/[code]` répond en HTTP 200 (Cache Components n'autorise pas `dynamicParams`) : c'est une page d'affichage pour les redirections du serveur web (maintenance, 502/503/504), non indexée.
