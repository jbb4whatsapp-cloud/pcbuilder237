# Charte visuelle — PC Builder 237

> **Statut** : brouillon v0.4 — 3 octobre 2026 (direction B « Marché et vert profond » retenue ; maquettes de départ rangées dans docs/maquettes/ ; phase vendeurs à avancer, décision n°9 ; charte appliquée à /produits et à la fiche produit).
> **Légende** : ✅ décidé par le porteur du projet · 🛠 appliqué dans le code · ❓ proposition à valider

Ce document fixe l'apparence du produit : couleurs, typographie, formes et composants. Il prolonge le document 05 (pages et composants) et le document 07 (textes). Il ne change aucune règle métier : en cas de doute, les documents 01 à 09 font foi.

---

## 1. Décisions

| # | Décision | Statut |
|---|---|---|
| 1 | Direction B : vert profond, fond crème chaud, ocre pour le meilleur prix, angles peu arrondis | ✅ |
| 2 | Conception mobile d'abord (360 pixels de large), puis élargissement | ✅ |
| 3 | Version 1 sans photos de produit et sans notes, avis ou nombre de ventes d'un vendeur : ces éléments feront l'objet de versions ultérieures (section 9) | ✅ |
| 4 | Les vendeurs (boutiques) sont la source de revenus prioritaire (section 2) | ✅ |
| 5 | L'ocre est réservé à l'étiquette « Meilleur prix » | ❓ |
| 6 | Pas de mode sombre en version 1 | ❓ |
| 7 | En-tête en aplat vert profond, sans dégradé (plus léger à charger) | ❓ |
| 8 | Pas de logo dessiné : le nom « PC Builder 237 » en texte, favicon à fournir | ❓ |
| 9 | Avancer la phase vendeurs (espace boutique, suivi d'abonnement) dans la feuille de route : oui (3 octobre 2026) ; placement : lots V1 à V4 de la feuille de route | ✅ |
| 10 | Offre « Boutique visible » : 9 900 FCFA par mois, sans engagement ; paiement hors du site, enregistré par l'administrateur | ✅ |
| 11 | Lancement gratuit de 60 jours ; le décompte part de l'ouverture publique ou de l'activation de chaque boutique, pas d'une date fixe | ❓ |
| 12 | Direction A « Tech Moderne Dark Cyan » étudiée puis écartée au profit de la direction B (voir encadré en section 3) | ✅ |

---

## 2. Les vendeurs paient en priorité

Conséquences pour le visuel, sans toucher aux règles déjà décidées : l'abonnement n'entre jamais dans le tri des prix ✅, et le badge « Boutique vérifiée » ne s'achète pas ✅ (document 07, section 3.8).

- L'espace boutique (/boutique) est une surface de premier rang : il montre l'état de l'abonnement, les informations de la boutique et les relevés de ses produits, dans la même charte que le site public.
- Ce que l'abonné obtient de visible : le bouton de contact (après la période de lancement), l'adresse et les horaires (document 09, section 4.2). La charte leur donne de la place, pas un meilleur rang.
- Boutique non contactable : nom et quartier, aucun bouton, aucune couleur d'alerte. Pour un champ réservé, le texte neutre du document 09 : « Adresse et horaires réservés aux boutiques abonnées » ❓ (ton à valider avec le porteur : informatif, jamais culpabilisant).
- Planning ✅ : l'espace boutique était en phase 4 et l'enregistrement d'un abonnement se fait dans l'éditeur SQL. Décision du 3 octobre 2026 : avancer cette phase, puisque les vendeurs sont la source de revenus prioritaire. Placement retenu : lots V1 à V4 de la feuille de route (section 4), en parallèle du pilote et avant la migration de production.

**Offre aux boutiques** ✅ (montant et durée du lancement : 3 octobre 2026) :

- « Boutique visible » : 9 900 FCFA par mois, sans engagement.
- Inclus : bouton « Contacter sur WhatsApp » sur la fiche après la fin du lancement ; adresse, quartier et horaires affichés ; tableau de bord mensuel (vues de fiche et clics sur le bouton WhatsApp, sans donnée personnelle).
- Jamais inclus : un meilleur rang (le tri reste par prix et fiabilité) ; le badge « Boutique vérifiée », qui ne s'achète pas.
- Boutique non abonnée après le lancement : nom et quartier visibles, sans bouton.
- Le relevé de prix par un agent est offert à toutes les boutiques ; il n'est pas présenté comme un avantage de l'abonnement ❓.
- Vocabulaire ❓ : « clics sur le bouton », jamais « leads » ni « ventes », puisque le site ne voit pas la suite.
- Lancement gratuit : 60 jours. Départ du décompte à fixer au go/no-go (décision n°11).

---

## 3. Couleurs

Tous les couples texte et fond respectent un contraste d'au moins 4,5 pour 1 (niveau AA), y compris en plein soleil sur un téléphone d'entrée de gamme.

| Rôle | Valeur | Usage | Contraste |
|---|---|---|---|
| Vert profond | #14532D | en-tête, filtre actif, bouton principal | texte blanc : environ 9 pour 1 |
| Vert action | #15803D | bouton « Contacter sur WhatsApp » | texte blanc : environ 5 pour 1 |
| Fond de page | #FAF7F2 | arrière-plan | texte #1C1917 : plus de 15 pour 1 |
| Surface | #FFFFFF | cartes | — |
| Texte | #1C1917 | texte courant, prix | — |
| Texte secondaire | #57534E | marque, dates, aides | sur le fond de page : environ 7 pour 1 |
| Bordure | #E7E5E4 | contour des cartes et des champs | — |
| Ocre | #FCD34D | étiquette « Meilleur prix » uniquement ❓ | texte #1C1917 : environ 12 pour 1 |
| Alerte (fond / texte) | #FFEDD5 / #7C2D12 | « À vérifier » | environ 8 pour 1 |
| Succès (fond / texte) | #DCFCE7 / #14532D | « Boutique vérifiée » | plus de 8 pour 1 |
| Neutre (fond / texte) | #E7E5E4 / #292524 | « Constaté par un agent », état, stock | plus de 10 pour 1 |
| Erreur | #B91C1C | messages d'erreur système seulement | sur blanc : environ 6,5 pour 1 |

Règles de sens :

- L'alerte d'incohérence est orange brique, jamais rouge, et ne porte jamais d'icône de danger : elle n'accuse personne (document 07, section 1).
- Le rouge est réservé aux erreurs du système. Il n'apparaît jamais sur une boutique, un prix ou un relevé.
- Une information ne passe jamais par la couleur seule : chaque badge porte un texte.

### Encadré 3.A — Direction A « Tech Moderne Dark Cyan » étudiée puis écartée

> Cet encadré archive une direction visuelle alternative proposée lors de l'audit externe du 2 octobre 2026 (rapport *Rapport_PCBUILDER237.pdf*, chapitre 9 « Mockups avant/après »). Elle est mentionnée ici pour traçabilité des décisions et ne s'applique pas au produit. Décision n°12.

#### Origine

La direction A a été proposée par l'auditeur externe à partir d'une lecture rapide du site existant. Elle reposait sur une esthétique « tech moderne » supposée cohérente avec la stack technique (Next.js, Vercel) et avec une référence aux sites de veille technologique (GitHub, Vercel, The Verge). L'auditeur n'avait pas accès aux documents 01 à 09 ni aux contraintes locales (connexion, soleil, terminaux d'entrée de gamme) au moment de la proposition.

#### Palette étudiée

| Rôle | Valeur proposée | Usage prévu |
|---|---|---|
| Fond anthracite | #0F172A | arrière-plan sombre plein écran |
| Fond slate | #1E293B | cartes, surfaces secondaires |
| Texte clair | #E2E8F0 | texte courant sur fond sombre |
| Texte muted | #94A3B8 | textes secondaires, métadonnées |
| Accent cyan | #06B6D4 | boutons principaux, badges, liens |
| Accent cyan clair | #22D3EE | hover, focus, icônes |
| Bordure slate | #475569 | contours de cartes |
| Succès | #10B981 | « Vendeur vérifié » |
| Alerte | #EF4444 | alertes (rouge franc) |

#### Composants étudiés

Les mockups proposés intégraient les éléments suivants, tous écartés de la version 1 :

- **Hero section** : bloc plein écran avec dégradé anthracite → bleu (#1E40AF), titre H2 en 50pt, paragraphe d'accroche et bouton CTA « Voir les PC disponibles » en cyan. Renvoyé aux versions ultérieures : aucune section hero n'est prévue en V1 (décision n°3, en-tête en aplat simple, décision n°7).
- **Cartes produit avec photo** : chaque carte affichait une photo du PC (placeholder 📷), un titre, des specs synthétiques, un prix en FCFA, un badge « Vérifié » vert et un bouton « Contacter ». Écarté par décision n°3 : pas de photo en V1.
- **Badge vendeur vérifié avec note et historique** : pastille verte « ✓ Vendeur vérifié », note moyenne (ex. ⭐ 4.8/5), nombre de ventes (ex. 12 ventes), quartier. Écarté par décision n°3 : aucune note, avis ou nombre de ventes en V1. Le badge « Boutique vérifiée » de la V1 n'affiche ni note ni historique.
- **Fiche produit détaillée avec photo** : disposition en deux colonnes (photo à gauche, specs à droite), bloc prix en teal (#0F766E), profil vendeur avec avatar coloré, boutons « Contacter sur WhatsApp » (vert WhatsApp #25D366) et « Signaler ». Écarté par décision n°3 : pas de photo, pas d'avatar vendeur. Le bouton « Signaler » est repris en V1 (contour, texte #1C1917), le bouton WhatsApp en V1 est en vert action #15803D et non en vert WhatsApp #25D366 (cohérence avec la charte, décision n°1).
- **Dashboard vendeur vérifié en 4 étapes** : parcours de vérification affiché en 4 étapes numérotées (1. Inscription, 2. Vérification d'identité, 3. Vérification d'adresse, 4. Première vente encadrée) avec statuts « Terminé », « En cours », « À venir ». Écarté en V1 : le parcours vendeur vérifié est hors périmètre (section 9). Il suppose des données sensibles (CNI, adresse) et une relecture juridique non engagée.
- **Escrow Mobile Money** : mockup avec bouton « Contacter » qui ouvrait un flux de paiement escrow MTN MoMo / Orange Money. Écarté en V1 (section 9, escrow hors périmètre).
- **Footer complet** : quatre colonnes (À propos, Support, Légal, Réseaux sociaux) avec liens vers /a-propos, /securite, /comment-ca-marche. Écarté en V1 : aucune page SEO statique n'est prévue (document 05). Le footer éventuel de la V1 se limite au minimum utile.
- **Roadmap visuelle sur 12 mois** : planning graphique présentant 24 actions réparties en 4 phases P0 → P3 sur 12 mois. Cet outil de pilotage relève du document de feuille de route, pas de la charte visuelle ; il n'a pas vocation à figurer dans le produit.

#### Composants repris malgré l'écart de la direction A

Trois éléments des mockups écartés sont néanmoins repris en V1, dans la charte B :

- **Bouton WhatsApp** : repris, mais en vert action #15803D (charte B) et non en vert WhatsApp #25D366. Libellé « Contacter sur WhatsApp » identique.
- **Bouton « Signaler »** : repris, en bouton secondaire (contour, texte #1C1917, fond transparent).
- **Pastille de filtre actif** : reprise, en vert profond #14532D avec texte blanc (decision n°1).

#### Motifs d'écartement de la direction A

Les motifs sont purement techniques et ne portent pas de jugement sur la qualité esthétique de la direction A :

1. **Lisibilité en plein soleil** : le fond anthracite #0F172A sur un terminal d'entrée de gamme en extérieur produit un contraste réduit avec le texte clair, tandis que le fond crème #FAF7F2 de la direction B conserve un contraste de plus de 15 pour 1 en plein soleil (test effectué sur écran tactile d'entrée de gamme, document 09, section 2).
2. **Poids de page** : la direction A prévoyait un hero en dégradé, des photos produit et un dashboard vendeur. Ces éléments supposent un poids de page supérieur, en désaccord avec la cible « pages légères sur connexion lente » (section 7). La direction B reste sans dégradé, sans photo, avec une seule police.
3. **Conformité aux décisions déjà prises** : la direction A suppose des fonctionnalités écartées par décision n°3 (photos, notes, avis, parcours vendeur) et par décision n°7 (en-tête sans dégradé). L'adopter aurait nécessité de rouvrir ces décisions.
4. **Cohérence avec le positionnement local** : la direction B (vert profond, ocre) appuie le positionnement « marché local, prix constatés » (document 07, section 10.1). La direction A signalait une esthétique tech importée, sans ancrage local.

#### Éléments conservés pour archive

L'image unique `mockups_avant_apres.png` produite pour le rapport d'audit est conservée dans `docs/maquettes/alternatives/` pour archive. Elle n'est pas intégrée au présent document (choix éditorial : la charte reste un document texte). Le rapport d'audit complet `Rapport_PCBUILDER237.pdf` est conservé à la racine de `docs/` pour référence.

---

## 4. Typographie

- Police : Geist, déjà hébergée avec le site (aucun téléchargement en plus).
- Corps de texte : 16 pixels. Texte secondaire : 14 pixels. Badges : 12 pixels au minimum.
- Titre de page : 24 pixels. Titre de section : 20 pixels. Prix : 20 pixels.
- Graisses : 400 pour le texte, 500 pour les libellés, les prix et les boutons, 700 pour les titres.

---

## 5. Espacement et formes

- Échelle d'espacement : 4, 8, 12, 16, 24, 32 pixels.
- Cartes, champs et boutons : angles de 8 pixels. Pastilles : 4 pixels.
- Bordure : 1 pixel, couleur #E7E5E4.
- Cibles tactiles : 44 pixels de haut au minimum.
- Largeur du contenu : 720 pixels au maximum, centré.
- Focus clavier : contour de 2 pixels en #14532D, décalé de 2 pixels. Jamais supprimé.

---

## 6. Composants

| Composant | Règle |
|---|---|
| En-tête | aplat vert profond, texte blanc, nom du site à gauche |
| Filtres (ville, état) | pastilles ; la pastille active est en vert profond avec texte blanc |
| Carte produit | marque en texte secondaire, nom en 500, « À partir de » puis prix, sans photo en version 1 |
| Ligne de prix (fiche) | une carte par boutique : nom, quartier, prix, badges, spécifications, garantie, date, bouton |
| Prix | 20 pixels, graisse 500, texte #1C1917 |
| Étiquette « Meilleur prix » | fond ocre, texte #1C1917, jamais sur une ligne avec alerte |
| Badge d'origine | neutre : « Constaté par un agent » ou « Déclaré par la boutique » |
| Badge « Boutique vérifiée » | succès ; masqué sur une ligne avec alerte |
| Alerte | bloc orange brique : titre, une ou deux raisons, conseil, pied de page |
| Bouton principal | vert profond, texte blanc ; un seul par écran |
| Bouton WhatsApp | vert action avec l'icône WhatsApp, libellé « Contacter sur WhatsApp » |
| Bouton secondaire (Signaler) | contour, texte #1C1917, fond transparent |
| Ligne hors stock | grisée, sans bouton, mention « Hors stock au dernier constat » |
| État vide | phrase du document 07, section 7.1, avec une action |
| Message d'erreur | texte du document 07, couleur erreur, jamais en rouge pour une boutique |

---

## 7. Accessibilité et performance

- Contraste d'au moins 4,5 pour 1 pour le texte, 3 pour 1 pour les éléments d'interface.
- Cibles tactiles de 44 pixels, focus visible, langue de page en français.
- Pas de mouvement non nécessaire ; respecter la préférence de réduction des animations.
- Aucune image de produit en version 1, aucun dégradé, une seule police : pages légères sur connexion lente.

---

## 8. Maquettes de départ

Rangées dans docs/maquettes/. Ce qui est retenu et ce qui est laissé de côté est détaillé ici.

| Fichier | Retenu | Écarté pour la version 1 |
|---|---|---|
| maquette-accueil.png | bandeau d'accroche et un seul bouton, labels au-dessus des listes, cartes sobres | Gabon, paiement Mobile Money, cadres photo, badge vert « Vérifié » placé à côté d'un prix |
| maquette-fiche-produit.png | disposition en lignes, prix mis en avant, boutons WhatsApp et Signaler | photo, « Vendeur vérifié » avec notes et nombre de ventes, « Occasion - Très bon », une seule offre |
| maquette-vendeur-verifie.png | liste d'étapes numérotées avec statut (Terminé, En cours, À venir) | tout le parcours (voir la section 9) |

Accroche proposée ❓ : « Comparez les prix des PC à Yaoundé et Douala », avec le sous-titre « Prix constatés en boutique par des agents, avec preuves photo. » (document 07, section 10.1).

---

## 9. Versions ultérieures (hors version 1) ✅

À placer dans la feuille de route au moment voulu :

- photos de produit (nécessitent hébergement, droits et une colonne d'image dans le catalogue) ;
- notes, avis et nombre de ventes d'un vendeur (aucune donnée ne les alimente aujourd'hui) ;
- parcours « vendeur vérifié » en plusieurs étapes : identité (pièce d'identité), adresse, première vente encadrée ; il suppose des données sensibles et une relecture juridique ;
- paiement sécurisé et séquestre (escrow) : hors périmètre de la version 1 ;
- le Gabon : hors zone, la version 1 couvre Yaoundé et Douala.

---

## 10. Application au code

Prévu dans l'ordre : variables de couleurs et d'espacement dans la feuille de style globale ; composants communs ; puis les pages /produits, /produits/[id], /connexion et /acces-refuse ; ensuite le formulaire agent (P1-1) directement dans cette charte.

**État au 3 octobre 2026** 🛠 : variables de couleurs, classes de composants (carte, pastille, badges, boutons, bloc d'alerte), en-tête, `/produits` et la fiche produit sont appliqués (commit `8301de8`, branche `p0-6-front`). Appliqués ensuite : `/connexion` et `/acces-refuse` (`5796e96`), l'état « boutique non contactable » avec un texte neutre à valider ❓ (`0502c35`). Restent : le bouton « Signaler » et l'icône WhatsApp, la réécriture de l'accueil, de `/agent` et de `/admin` dans la charte, puis le formulaire agent.
