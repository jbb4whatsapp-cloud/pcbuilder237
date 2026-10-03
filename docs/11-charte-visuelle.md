# Charte visuelle — PC Builder 237

> **Statut** : brouillon v0.2 — 3 octobre 2026 (direction B « Marché et vert profond » retenue ; maquettes de départ rangées dans docs/maquettes/ ; phase vendeurs à avancer, décision n°9 ; charte appliquée à /produits et à la fiche produit).
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
| 9 | Avancer la phase vendeurs (espace boutique, suivi d'abonnement) dans la feuille de route : oui (3 octobre 2026) ; placement exact à fixer dans la feuille de route | ✅ |

---

## 2. Les vendeurs paient en priorité

Conséquences pour le visuel, sans toucher aux règles déjà décidées : l'abonnement n'entre jamais dans le tri des prix ✅, et le badge « Boutique vérifiée » ne s'achète pas ✅ (document 07, section 3.8).

- L'espace boutique (/boutique) est une surface de premier rang : il montre l'état de l'abonnement, les informations de la boutique et les relevés de ses produits, dans la même charte que le site public.
- Ce que l'abonné obtient de visible : le bouton de contact (après la période de lancement), l'adresse et les horaires (document 09, section 4.2). La charte leur donne de la place, pas un meilleur rang.
- Boutique non contactable : nom et quartier, aucun bouton, aucune couleur d'alerte. Pour un champ réservé, le texte neutre du document 09 : « Adresse et horaires réservés aux boutiques abonnées » ❓ (ton à valider avec le porteur : informatif, jamais culpabilisant).
- Planning ✅ : l'espace boutique était en phase 4 et l'enregistrement d'un abonnement se fait dans l'éditeur SQL. Décision du 3 octobre 2026 : avancer cette phase, puisque les vendeurs sont la source de revenus prioritaire. Le placement exact (avant ou après le formulaire agent) reste à fixer dans la feuille de route.

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

**État au 3 octobre 2026** 🛠 : variables de couleurs, classes de composants (carte, pastille, badges, boutons, bloc d'alerte), en-tête, `/produits` et la fiche produit sont appliqués (commit `8301de8`, branche `p0-6-front`). Restent : `/connexion` et `/acces-refuse`, l'état « boutique non contactable » (texte à valider), le bouton « Signaler » et l'icône WhatsApp, puis le formulaire agent.
