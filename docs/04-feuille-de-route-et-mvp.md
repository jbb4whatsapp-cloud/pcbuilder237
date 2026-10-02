# Feuille de route et MVP — PC Builder 237

> **Statut** : brouillon v0.4 — 2 octobre 2026 (décisions du document 05 intégrées ; chaîne de patchs complète ; D1 et D2 tranchées)
> **Historique** : v0.4 — chaîne des 9 scripts ; qui relève et qui modère (✅ le porteur du projet, Yaoundé puis Douala). **L'ordre d'exécution détaillé (lots P0 et P1) et le registre unique des décisions sont dans `00-ROADMAP-MAITRE.md`** : en cas de différence, ce dernier prime.
> **Légende** : ✅ décidé par le porteur du projet · 🛠 déjà en place · ❓ proposition à valider

Ce document répond à la question ouverte n°5 du document 01 (« liste exacte des fonctionnalités du MVP »). Tout ce qui suit est une **proposition** : l'ordre des phases est à valider.

---

## 1. Principes de planification

- ❓ **Le premier produit utilisable est le comparateur de portables** (catégorie la plus répandue, document 01). Le builder vient après.
- ❓ **Pas de données, pas de produit** : un comparateur sans prix récents ne sert à rien. La collecte par les agents démarre avant l'ouverture au public.
- ❓ **Chaque phase se termine par quelque chose d'utilisable** et testé sur le projet Supabase de test avant la production.
- ✅ Hors périmètre v1 : paiement intégré, vente directe, livraison, OTP agents, monteurs, autres villes (document 01, section 5).

---

## 2. Phases

### Phase 0 — Remise à niveau du site actuel
*Objectif : un site propre sur lequel construire, branché sur le nouveau schéma.*

- Exécuter sur le projet de **test**, dans cet ordre (scripts écrits 🛠, jamais exécutés sur Supabase) : schéma v1 → « agents » → « propriétaire de boutique » → « produits » → « lancement » → « adresse et horaires » → « codes de motif » (version du zip 08) → `config_hash` → « contrat de données » (toujours le dernier). Puis `pcbuilder237_test_supabase.sql`.
- Créer le premier admin, deux ou trois agents de test, quelques boutiques et produits.
- Corrections rapides de l'audit : titre, description, `lang="fr"`, favicon, labels, en-têtes de sécurité, Open Graph, `robots.txt`.
- Migrer le front vers le nouveau schéma : l'ancien site cesse de fonctionner tant que ce n'est pas fait (avertissement en tête du schéma 🛠).
- Traiter les écarts du document 02, section 10 : modération des relevés de boutique (patch propriétaire 🛠), `config_hash` (patch dédié 🛠, **pas encore corrigé** tant que non exécuté), garantie (décision D7 ❓), règles anti-arnaque (codes de motif 🛠 ; règle processeur D5 ❓).

**Sortie** : un site déployé en test, login agent et admin fonctionnels, aucune page cassée.

### Phase 1 — MVP : comparateur de portables
*Objectif : un acheteur de Yaoundé ou Douala trouve où acheter un portable au meilleur prix, avec confiance.*

| Fonction | Détail |
|---|---|
| Formulaire agent réel | Envoi avec photos de preuve (aujourd'hui factice), compression, retour d'erreur lisible |
| File de modération | Liste des relevés `pending`, preuves visibles, publier / rejeter avec note |
| Recherche | Ville → quartier → portable, filtre par état |
| Résultats et fiche produit | Prix par boutique, état, garantie, date, origine, stock |
| Meilleur prix | Règles du document 02, section 3 ; relevés `suspect` et `impossible` jamais mis en avant |
| Texte d'alerte | « Spécifications incohérentes, à vérifier » |
| Contact | Lien WhatsApp avec message pré-rempli, **ouvert à toutes les boutiques pendant la période de lancement** ✅ ; devis du builder (phase 3) envoyé au contact du porteur du projet si la boutique n'est pas contactable ✅ |
| Langue | ✅ Français seulement en phase 1 |
| Signalement | Bouton sur boutique et relevé, branché sur `flags` 🛠 |
| Pages de confiance | Comment ça marche, sécurité, mentions, confidentialité |

**Hors phase 1** : builder, abonnements, statistiques, composants.

**Sortie (critères de lancement)** ❓
- Au moins N portables couverts avec au moins M boutiques par ville *(valeurs à fixer, voir section 4)*.
- Aucun relevé de plus de 45 jours affiché.
- Parcours complet testé sur téléphone, avec une connexion lente.
- Sauvegardes Supabase actives, politique de confidentialité en ligne.

### Phase 2 — Composants et PC complets
- Catégories : processeur, carte mère, RAM, carte graphique, stockage, alimentation, boîtier, refroidissement, PC complets.
- Même formulaire agent, adapté aux caractéristiques de chaque catégorie.
- Premières règles anti-arnaque supplémentaires (document 02, « règles à ajouter »), selon les fraudes réellement constatées en phase 1.

### Phase 3 — Builder
- Moteur de compatibilité (7 règles du document 02, section 5), avec tests unitaires.
- Total en deux vues : boutique unique et panier le moins cher.
- Sauvegarde et partage d'une configuration (`builds`, `share_slug` 🛠).
- Devis WhatsApp avec la liste pré-remplie.
- Tarif de montage en option, si la boutique le propose.

### Phase 4 — Boutiques abonnées
- Espace boutique : fiche, horaires, relevés (toujours modérés), suivi des relevés envoyés 🛠 côté base.
- Statistiques de vues et de contacts.
- Propositions de produits par les boutiques, validées par un modérateur avant de servir aux contrôles ✅ (patch `pcbuilder237_shop_products_patch.sql` 🛠).
- Abonnements encaissés à la main par Mobile Money, enregistrés par l'admin 🛠 (fonction `record_subscription`).
- Affichage « déclaré par la boutique » / « constaté par un agent ».
- Fin de la période de lancement : le contact WhatsApp depuis le site devient un avantage de l'abonnement ✅ (document 05, décisions 1 et 7).
- Pack complet et tarifs : **à décider avant cette phase** (questions 2 et 4 du document 01).

### Plus tard ❓
Version anglaise, historique public des prix, droit de réponse des boutiques (après la période de lancement ✅), OTP téléphone pour les agents, rôle monteur, PWA (utile si la connexion est instable), autres villes, éventuelle évolution vers une place de marché (décision explicite requise, voir document 03, section 9).

---

## 3. Qui fait quoi

| Domaine | Responsable | Statut |
|---|---|---|
| Développement du site | Porteur du projet | ✅ |
| Relevés de prix à Yaoundé (en premier) | Porteur du projet | ✅ pour la phase MVP |
| Relevés de prix à Douala (ensuite) | Porteur du projet | ✅ pour la phase MVP |
| Modération | Porteur du projet (délai ❓, 24 h ouvrées proposé) | ✅ pour la phase MVP |
| Encaissement et suivi des abonnements | Porteur du projet (admin) | ✅ |

Les relevés conditionnent le lancement : sans relevés dans une ville, il n'y a pas de prix dans cette ville. Comme Yaoundé précède Douala, **l'ouverture de Yaoundé seule avant Douala est la conséquence naturelle de cet ordre, mais reste à confirmer** (décision D15, seuils de lancement).

---

## 4. Risques

| Risque | Conséquence | Réponse proposée ❓ |
|---|---|---|
| Pas assez de prix au lancement | Site vide, acheteurs qui ne reviennent pas | Phase de collecte avant ouverture ; seuil minimal de couverture comme critère de lancement |
| Prix qui vieillissent vite | Informations fausses | Règle des 45 jours 🛠, date visible partout |
| Boutique accusée à tort | Conflit, atteinte à l'image | Vocabulaire neutre, droit de réponse, modération humaine |
| Fausses preuves ou collusion agent-boutique | Prix publiés non fiables | Modération par échantillon, historique par agent (`agents_overview` 🛠) |
| Abus des signalements | Boutiques attaquées par des concurrents | Limites de fréquence, traitement par le personnel uniquement |
| Un seul développeur, qui relève aussi les prix et modère (D1, D2) | Retards ; relevés et modération en concurrence avec le développement ; pas de second regard sur ses propres relevés | Phases courtes, MVP réduit à la phase 1 ; contrôle par échantillon et confier la vérification à une autre personne dès que possible |
| Dérive de périmètre (marketplace, escrow) | Projet dispersé | Documents 01 et 03 : v1 = comparateur |

---

## 5. Décisions à trancher avant de coder la phase 1

| # | Question | Statut |
|---|---|---|
| 1 | Ordre des phases : portables d'abord, builder ensuite | ❓ |
| 2 | Seuils de lancement : nombre de portables et de boutiques par ville | ❓ |
| 3 | Qui relève les prix à Yaoundé et à Douala | ✅ Porteur du projet, Yaoundé puis Douala (phase MVP) |
| 4 | Qui modère, et sous quel délai | ✅ Porteur du projet ; délai ❓ |
| 5 | Liste des portables du catalogue de départ, avec leurs valeurs autorisées (RAM, stockage) tirées des fiches constructeur | ❓ |
| 6 | Durée de la période de lancement (contact ouvert à toutes les boutiques) et numéro WhatsApp du porteur du projet pour les devis | ❓ |
