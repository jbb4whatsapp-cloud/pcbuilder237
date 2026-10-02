# Vision et périmètre — PC Builder 237

> **Statut** : brouillon v0.3 — 2 octobre 2026
> **Historique** : v0.3 — hors périmètre v1 confirmé ✅ ; question 1 tranchée pour le MVP ; vocabulaire public aligné sur le document 07, section 3.0 ; renvoi à la décision D4 (nombre de photos). Registre des décisions : `00-ROADMAP-MAITRE.md`.
> **Légende** : ✅ décidé par le porteur du projet · ❓ proposition à valider ou question ouverte

---

## 1. Vision

PC Builder 237 est une application web pour le marché camerounais de l'informatique. Elle réunit deux fonctions :

1. **Comparateur de prix** : trouver où acheter un PC ou un composant au meilleur prix, ville par ville, quartier par quartier, boutique par boutique.
2. **Assembleur de PC (builder)** : composer une configuration, vérifier sa compatibilité et en connaître le coût total en FCFA.

Le produit couvre le **neuf**, l'**occasion** et le **reconditionné** (très présents sur le marché de Mokolo). Il protège l'acheteur grâce à des **contrôles anti-arnaque** et à des **prix relevés avec preuves** par des agents de terrain.

## 2. Le problème

- Les prix varient d'une boutique à l'autre et ne sont publiés nulle part de façon fiable.
- Sur l'occasion et le reconditionné, les annonces peuvent être trompeuses (RAM ou stockage gonflés, composant différent de celui annoncé).
- Assembler un PC exige de vérifier soi-même la compatibilité des composants.

## 3. Utilisateurs et rôles

| Rôle | Description | Accès |
|---|---|---|
| ✅ **Acheteur (particulier)** | Compare, assemble, sauvegarde et partage ses configurations | Gratuit |
| ✅ **Boutique abonnée** (rôle *propriétaire de boutique*) | Gère son espace, publie et modifie les prix de sa boutique, propose des fiches produit | Payant (abonnement) |
| ✅ **Boutique non abonnée** | Apparaît dans le comparateur avec des informations limitées | Gratuit, sans compte |
| ✅ **Agent** | Relève les prix en boutique avec photos de preuve | Compte attribué par l'admin (code agent) |
| ✅ **Modérateur** | Valide les relevés suspects, les prix publiés par les boutiques et les fiches produit qu'elles proposent | Interne |
| ✅ **Admin** | Gère boutiques, produits, agents et rôles | Interne |
| ❓ **Monteur** | Propose un tarif de montage pour une configuration | Prévu plus tard |

## 4. Modèle économique

- ✅ **Gratuit pour les particuliers** : comparateur, builder, sauvegarde et partage de configurations.
- ✅ **Abonnement payant pour les boutiques.**
- ✅ **Paiement au démarrage** : Mobile Money, encaissé à la main (pas de paiement intégré dans l'application au début).
- ✅ **Période de lancement** : le contact WhatsApp est ouvert à toutes les boutiques. Après cette période, il devient un avantage de l'abonnement. ❓ Durée à fixer.

### Ce que voit une boutique non abonnée
✅ Elle apparaît avec des informations limitées. ❓ Contenu exact à définir. Proposition de départ : nom, quartier, prix relevés par les agents avec leur date et l'état du produit ; pas de fiche détaillée ni de statistiques. ✅ Pas de contact WhatsApp depuis le site après la période de lancement.

### Ce que reçoit une boutique abonnée
✅ Le pack est à modifier par le porteur du projet. ❓ Base de travail :
- espace boutique : publication et mise à jour de ses prix et de son stock, et proposition de fiches produit (validées par un modérateur) ;
- ✅ contact WhatsApp depuis le site (après la période de lancement, réservé aux abonnées) ;
- fiche boutique complète (adresse, horaires, WhatsApp, services) ;
- statistiques de vues et de contacts.

### Principes à respecter
- ✅ Les prix saisis par une boutique passent par les contrôles anti-arnaque **et** par un modérateur.
- ❓ Un prix est toujours affiché avec son origine : « constaté par un agent » ou « déclaré par la boutique » (vocabulaire du document 07, section 3.0).
- ❓ L'abonnement n'influence jamais l'ordre des prix dans les résultats.
- ❓ Le badge « boutique vérifiée » s'obtient après la visite d'un agent et ne s'achète pas.

## 5. Périmètre

### Zone géographique
✅ Au lancement : **Yaoundé et Douala**.

### Contenu couvert
- ✅ Neuf, occasion et reconditionné, avec garantie et état pour chaque prix.
- ✅ **Portables (laptops)** : catégorie prioritaire, car ce sont les produits les plus répandus sur le marché actuellement. Ils sont couverts par le comparateur et par les contrôles anti-arnaque (RAM, stockage, processeur, état de la batterie).
- Composants pour le builder : processeur, carte mère, RAM, carte graphique, stockage, alimentation, boîtier, refroidissement.
- PC complets (tours et ordinateurs de marque).
- ❓ Le builder (assemblage) ne s'applique pas aux portables : on les compare, on ne les compose pas.

### Fonctionnalités
1. Comparateur de prix par portable, par composant et par PC complet.
2. Builder avec contrôle de compatibilité et total en FCFA.
3. Détection d'incohérences (anti-arnaque) calculée côté serveur.
4. Collecte des prix par les agents avec preuves photo.
5. Espace boutique et abonnements.
6. Contact et devis par WhatsApp.

### Hors périmètre de la v1 (✅ confirmé : documents 04 et 10)
- paiement en ligne intégré ;
- vente directe ou panier d'achat sur le site ;
- livraison ;
- connexion des agents par OTP SMS (prévue quand le nombre d'agents le justifiera) ;
- version anglaise (✅ français seulement en phase 1) ;
- gestion des monteurs ;
- autres villes et autres pays.

## 6. Questions ouvertes

| # | Question | Statut |
|---|---|---|
| 1 | Qui relève les prix dans chaque ville ? | ✅ **Pour le MVP : le porteur du projet**, Yaoundé d'abord, Douala ensuite. Le recrutement d'agents pour la suite n'est pas décidé |
| 2 | Contenu exact du pack d'abonnement boutique | ❓ À modifier par le porteur |
| 3 | Informations visibles pour une boutique non abonnée | ❓ À préciser (contact exclu après le lancement ✅) |
| 4 | Tarifs, durée et formules d'abonnement | ❓ Non abordé |
| 5 | Liste exacte des fonctionnalités du MVP | ❓ Proposée dans le document 04 |
| 6 | Durée de la période de lancement | ❓ Non décidé |

## 7. Décisions déjà prises (extrait)

- Authentification des agents : code agent attribué par l'admin d'abord, OTP téléphone ensuite.
- Le builder couvre neuf, occasion et reconditionné.
- Un relevé de prix exige au moins une photo de preuve et est validé côté serveur. (Deux photos pour l'occasion et le reconditionné : proposition du document 08, **décision D4 ouverte**.)
- Pour le MVP, le porteur du projet relève les prix et modère (Yaoundé puis Douala).
- Le contact WhatsApp est un avantage de l'abonnement, ouvert à toutes les boutiques pendant la période de lancement.
- Français seulement en phase 1.
