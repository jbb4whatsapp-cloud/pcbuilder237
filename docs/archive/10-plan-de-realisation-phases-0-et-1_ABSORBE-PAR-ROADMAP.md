# Plan de réalisation, phases 0 et 1 — PC Builder 237

> **Statut** : brouillon v0.1 — 2 octobre 2026
> **Légende** : ✅ décidé par le porteur du projet · 🛠 lu dans un document ou un script reçu · 🧪 vérifié sur PostgreSQL local seulement · 🔎 reste à vérifier sur Supabase · ❓ proposition à valider

Ce document transforme la feuille de route (document 04) en **lots de travail** : quoi construire, dans quel ordre, avec quels documents comme référence, et comment savoir que c'est terminé. Il ne chiffre aucune durée : un seul développeur, des durées qui dépendent de choses que personne ne connaît encore (voir la section 8). Les tailles **S, M, L** sont des ordres de grandeur relatifs ❓.

Il ne remplace pas le document 08 (collecte sur le terrain et modération) : le plan de collecte et les seuils de lancement y restent. Il dit seulement **quand le site doit être prêt pour que la collecte puisse démarrer**.

---

## 1. Sources

Documents 01 à 09 ; scripts SQL : schéma v1 et les patchs « agents », « propriétaire de boutique », « produits », « lancement », « adresse et horaires », « codes de motif » (version corrigée), `config_hash`, « contrat de données » ; script de test `pcbuilder237_test_supabase.sql` ; catalogue de départ `pcbuilder237_catalog_seed.sql` (document 06).

**Je n'ai pas relu le catalogue de départ en entier pour ce document** : seulement son en-tête et sa procédure d'activation (section 4, lot P0-2).

---

## 2. Où nous en sommes

| Domaine | État |
|---|---|
| Vision, règles métier, architecture, pages, textes, collecte, contrat de données (01 à 09) | 🛠 brouillons rédigés ; décisions encore ouvertes (section 7) |
| Base de données | 🛠 schéma et 8 patchs écrits ; 🧪 chaîne complète exécutée sans erreur sur PostgreSQL 16 local, 48 vérifications réussies ; **rien exécuté sur Supabase** |
| Catalogue de départ | 🛠 fiches insérées **inactives** ; valeurs **non vérifiées** sur les fiches constructeur |
| Site | 🛠 site actuel branché sur l'ancien schéma, **inutilisable avec le nouveau** tant que le front n'est pas migré (avertissement en tête du schéma) |
| Agents, modération | ❓ personne désignée (document 01, question 1 ; document 08, décisions 1 à 3) |

**Conséquence** : le prochain travail utile n'est pas un écran, c'est l'exécution sur Supabase (lot P0-1). Elle peut changer le document 09 et, par ricochet, ce plan.

---

## 3. Principes d'exécution

1. ❓ **La base de test d'abord, toujours.** Aucun script, aucune migration ne va en production sans avoir passé la base de test.
2. ✅ **La base décide, le site affiche** (documents 03 et 09). Un lot qui ajoute une règle côté navigateur au lieu de la base est refusé.
3. ❓ **Un lot n'est « fini » que si** : (a) ses fonctions pures ont des tests Vitest ; (b) il a été essayé contre la base de test, avec les rôles concernés ; (c) chaque état d'erreur du document 07 qu'il peut produire est affiché ; (d) il ne contient ni `select *` ni chaîne de colonnes recopiée (document 09, section 2).
4. ❓ **Le site se construit pendant que la collecte tourne.** Les lots du formulaire agent et de la file de modération passent avant les pages publiques : le pilote de Mokolo (document 08, section 10) n'a besoin que d'eux.
5. ❓ **Phases courtes, sortie utilisable** (document 04, section 1). Un lot terminé est déployé sur l'aperçu Vercel branché sur la base de test.
6. ✅ Hors périmètre v1 : paiement intégré, vente directe, livraison, OTP des agents, monteurs, autres villes, anglais (document 01).

---

## 4. Phase 0 — Remise à niveau

*Objectif : un site propre, branché sur le nouveau schéma, sur lequel construire.*

### P0-1 Base de test (taille S, bloquant)

- Exécuter, dans l'ordre : schéma → agents → propriétaire → produits → lancement → adresse et horaires → codes de motif → `config_hash` → contrat de données.
- Exécuter `pcbuilder237_test_supabase.sql` ; garder le rapport.
- Faire les six vérifications `supabase-js` listées à la fin de ce script (codes d'erreur dans `error.code`, relecture après insertion, signalement par connexion anonyme…).
- **Sortie** : rapport sans échec, ou liste des écarts. Le document 09 passe en v0.4 : les marques 🧪 deviennent ✅ ou sont corrigées.
- **Si un test échoue** : on corrige le patch, pas le site.

### P0-2 Données de test et comptes (S)

- Premier administrateur : ligne `admin` dans `user_roles` pour votre compte (indication en bas du schéma 🛠).
- Deux ou trois agents de test : compte Authentication (e-mail d'un domaine que vous contrôlez, code agent comme mot de passe, « Auto Confirm User »), puis `grant_agent` 🛠.
- Un modérateur de test, un propriétaire de test (`record_subscription` puis `grant_shop_owner` 🛠), quelques boutiques par ville, géographie (villes et quartiers).
- **Catalogue de départ** : l'exécuter sur la base de test, puis activer **seulement quelques fiches de test**, par la procédure d'activation du script (fiche par fiche). ⚠ Les valeurs de RAM et de stockage sont **non vérifiées** : ces activations ne valent que pour la base de test. En production, une fiche ne s'active qu'après vérification sur la fiche constructeur (document 06, section 6), par le responsable catalogue (document 08, section 3 ❓).
- **Sortie** : un acheteur fictif voit des prix, un agent de test envoie un relevé, un modérateur le publie, à la main dans l'éditeur SQL.

### P0-3 Décisions bloquantes (S, sans code)

Voir la section 7. Sans la réponse à « qui relève les prix », le lancement n'a pas de date.

### P0-4 Socle technique du site (M)

- **Dépôt et environnements** (document 03, section 10 ❓) : branche `main` vers Vercel production, aperçus branchés sur la base de test ; variables d'environnement : URL et clé publique seulement, jamais de clé secrète dans `NEXT_PUBLIC_*`.
- **Migrations versionnées** : dossier `supabase/migrations/` avec les scripts de P0-1 dans l'ordre ❓. Attention : ces scripts sont des patchs **rejouables avec des gardes**, pas des migrations classiques ; le patch « contrat de données » doit rester **le dernier** (document 09, section 12). Décider si l'on garde ce principe ou si l'on aplatit les patchs en une seule migration avant la production ❓.
- **Trois clients Supabase** (document 09, section 3) : public serveur sans cookies, navigateur avec session, serveur avec session (`getUser()`, jamais `getSession()`).
- **Types** : génération automatique pour les tables ; types des vues écrits à la main dans un seul fichier (document 09, section 10).
- **Module de lecture** : constantes de colonnes (une par lecture), `mapError` (une clé de `fr.json` d'après le code d'erreur, document 09, section 8), fonctions pures de la section 5 du document 09 (filtre par ville, meilleur prix, ordre d'affichage, contact WhatsApp, dates, alerte d'incohérence), toutes testées avec Vitest.
- **`fr.json`** : textes du document 07, section 11.
- **Sortie** : tests Vitest verts ; une page de diagnostic (hors production) qui lit `current_prices` avec le client public.

### P0-5 Corrections rapides de l'audit (S)

Titre et description, `lang="fr"`, favicon, labels, en-têtes de sécurité, Open Graph, `robots.txt` (document 03, sections 4.3 et 8 ❓ ; document 04, phase 0).

### P0-6 Migration du front (M)

- Connexion de l'agent : e-mail et code agent (`signInWithPassword`) ✅ ; choix de l'espace d'après les lignes de `user_roles` et `has_active_shop()` (document 09, section 3).
- Routes `/agent`, `/boutique`, `/admin` protégées **côté serveur** (document 03, section 7) ; aucune de ces pages n'est en cache partagé (document 09, section 9).
- Retirer toute lecture de l'ancienne table `price_reports` (devenue `price_reports_legacy`, lisible seulement par le personnel).
- **Sortie** : site déployé en test, connexions agent et admin fonctionnelles, **aucune page cassée** (document 04).

### P0-7 Alignement des documents (S)

Reporter les 11 écarts de la section 13 du document 09 dans les documents 02, 03, 05, 07 et 08, et mettre la chaîne de patchs à jour dans le document 04.

### Sortie de la phase 0

Les sorties de P0-1 à P0-6 sont atteintes ; le document 09 est en v0.4 ; les décisions bloquantes (section 7, colonnes « avant P1-1 ») sont tranchées.

---

## 5. Phase 1 — MVP : comparateur de portables

*Objectif : un acheteur de Yaoundé ou de Douala trouve où acheter un portable au meilleur prix, avec confiance* (document 04).

### Ordre et dépendances

```
P0 ──► P1-1 formulaire agent ──► P1-2 file de modération ──► pilote Mokolo (document 08, étape 2)
                                         │
                                         └──► P1-3 lecture publique ──► P1-4 accueil, signalement, pages ──► P1-5 mise en production ──► P1-6 répétition générale
```

Le pilote de collecte peut commencer **dès que P1-1 et P1-2 sont terminés** et que le catalogue vérifié est activé. P1-3 à P1-5 se construisent pendant la collecte.

### P1-1 Formulaire agent (taille L)

Référence : document 09, section 6.6 ; document 08, section 5 ; document 07, section 6.

- Choix de la boutique (par quartier, adresse affichée pour distinguer deux boutiques de même nom), du produit, de l'état, du prix, du stock, de la garantie (**vide ≠ 0**), de la configuration annoncée (`ram_gb`, `storage_gb` en **nombres**, `cpu`, état de la batterie).
- **Photos** : compression (moins de 1 Mo conseillé), **retrait des métadonnées EXIF**, deux photos pour l'occasion et le reconditionné (document 08, écart 5, décision n°7 ❓) ; envoi dans le bucket `proofs` sous `<uid>/<horodatage>/<fichier>`, pas de remplacement ni de suppression.
- **Envoi en trois temps** : photos, puis insertion (`client_ref` généré à l'ouverture du formulaire), puis relecture `.select('id,status,check_level,check_codes')`, puis motif dans `price_reports_visible`.
- **Reprise après coupure** : brouillon dans le navigateur avec les chemins de photos déjà envoyés et le `client_ref` ; `23505` sur `price_reports_client_ref_key` = « déjà envoyé ».
- Session expirée : reconnexion sans perdre le brouillon. Demande d'ajout de boutique (`shop_requests`, 10 demandes ouvertes au plus).
- Retour à l'agent : « Il est visible par les acheteurs » ou « Il sera examiné par un modérateur » avec la raison (document 07, section 6).
- **Essai** : les cas de la fin du catalogue de départ (T480 avec 24 Go publié, 10 Go suspect, 64 Go impossible, stockage 300 Go suspect, MacBook Air M1 avec 32 Go impossible) ; essai **sur un vrai téléphone, en connexion lente**.

### P1-2 File de modération (taille M)

Référence : document 09, section 6.8 ; document 08, section 6.

- File des relevés `pending` (du plus ancien au plus récent) lue par `price_reports_visible` : produit, boutique, auteur (nom d'affichage), `check_codes`, motif, preuves en **URL signées de quelques minutes**.
- Publier ou rejeter ; **note obligatoire au rejet** (`PB032`) ; mise à jour **sans `.select()` complet**, relecture par la vue.
- Signalements (statut `open`, `reviewed`, `dismissed`), demandes de boutique (`create_shop_from_request`, refus avec note), fiches produit proposées (`products_to_review`).
- Boutiques : statut et badge « vérifiée » ; période de lancement : mise à jour de `launch_settings` par l'admin.
- Une même personne ne relève pas et ne modère pas le même relevé (document 08, section 3) : à contrôler par la procédure, la base ne l'impose pas 🛠.
- **Sortie** : un relevé « suspect » du pilote passe de l'agent au modérateur puis au public, sans intervention dans l'éditeur SQL.

### P1-3 Lecture publique (taille L)

Référence : document 09, sections 4, 5, 6.1 à 6.4, 9.

- Choix de la ville (adresse de la page : `?ville=`, cookie seulement pour pré-remplir).
- `/produits` : filtres (état, marque, quartier, fourchette de prix, RAM, stockage, texte avec **échappement** de la saisie, risque R4), pagination `.range()`.
- `/produits/[id]` : une ligne par relevé, ordre du document 09 section 5.2 (en stock par prix croissant, puis hors stock grisé ; **l'abonnement n'entre jamais dans le tri**), « meilleur prix » réservé aux relevés `ok` en stock, alerte d'incohérence d'après `check_codes` (jamais « arnaque », jamais la boutique désignée comme fautive), origine « Constaté par un agent » / « Déclaré par la boutique », date relative en fuseau Africa/Douala.
- `/boutiques/[id]` : `shops_public`, adresse et horaires selon l'abonnement, bouton WhatsApp **seulement si** `contactable` et numéro présent.
- Client public **sans cookies** pour toute page pouvant être mise en cache ; cache de 5 à 10 minutes (document 09, section 9 ❓).
- **Essai** : un même produit vu par le public, un agent et un modérateur ; une boutique suspendue et un produit inactif disparaissent pour le public.

### P1-4 Accueil, signalement, pages de confiance, partage (taille M)

- Accueil : recherche, portables en vedette calculés depuis `current_prices`, bandeau « contact ouvert jusqu'au… » lu dans `launch_settings`.
- **Signalement** : connexion anonyme Supabase créée au premier signalement, **sans `.select()`** après l'insertion ; **limite de fréquence côté serveur** (action serveur) ; réponse unique « Merci, nous vérifions. » (document 09, section 6.11 ; décisions n°4 et 12 du document 09).
- Pages de confiance : comment ça marche, sécurité, mentions légales, confidentialité (textes du document 07, section 10).
- Référencement et partage : titres, Open Graph (le partage WhatsApp est le canal principal), `sitemap.xml` des produits actifs, données structurées `AggregateOffer` ❓.
- **Mesure de l'usage** : un outil externe sans données personnelles en phase 1 (document 09, décision n°3 ❓). Pas de table `events` avant la phase 4.

### P1-5 Mise en production (taille M)

- Créer le projet Supabase de **production** (région : décision n°5 du document 03 ❓) ; exécuter la chaîne de patchs puis le patch « contrat de données » en dernier.
- Rejouer sur la production la **partie non destructive** du script de test (il s'annule tout seul), puis les six vérifications `supabase-js`.
- **Sauvegardes quotidiennes actives et une restauration testée** ; alerte sur les erreurs de déclencheurs ; en-têtes de sécurité ; connexions anonymes activées avec test anti-robot si retenu (risque R12 : adresses IP partagées sur réseau mobile 🔎).
- Premier administrateur et comptes agents créés **en production** ; **aucune fiche de catalogue activée sans vérification** (P0-2).

### P1-6 Répétition générale et go/no-go (taille S)

Document 08, section 10, étape 5 : parcours acheteur de bout en bout sur téléphone avec connexion lente ; vérification des seuils de la section 8 du document 08 par ville (10 modèles avec 3 boutiques en occasion, 8 boutiques avec 5 prix, 80 % des lignes de moins de 21 jours, file de modération sous 48 h pendant deux semaines) ❓ ; politique de confidentialité en ligne ; critère « aucun relevé de plus de 45 jours affiché » (garanti par la vue 🛠).

### Sortie de la phase 1 (critères de lancement du document 04)

Seuils de couverture atteints dans chaque ville (ou décision explicite d'ouvrir une ville seulement, document 08, section 8) ; parcours complet testé ; sauvegardes et confidentialité en place.

---

## 6. Qui fait quoi

| Travail | Responsable | Statut |
|---|---|---|
| Lots P0 et P1 (développement) | Porteur du projet | ✅ (document 04, section 3) |
| Vérification des fiches constructeur avant activation | Responsable catalogue (modérateur ou admin) | ❓ |
| Relevés de prix (Yaoundé, Douala) | À décider | ❓ **bloquant pour le lancement** |
| Modération et délai | À décider (24 h ouvrées proposé, document 08) | ❓ |
| Texte de l'accord des boutiques pour photographier les prix | Juriste | ❓ (document 08, décision n°9) |

---

## 7. Décisions à trancher, par lot

| # | Décision | Document | À trancher avant |
|---|---|---|---|
| 1 | Qui relève les prix à Yaoundé et à Douala | 01 (question 1) ; 08 (n°1) | pilote (fin P1-2) |
| 2 | Qui modère, avec quel délai | 08 (n°3) | pilote |
| 3 | Confirmer le patch « contrat de données » (décisions n°1, 2, 6, 11) | 09 (section 15) | P0-1 |
| 4 | Deux preuves photo pour l'occasion et le reconditionné, imposées aussi par la base ? | 08 (n°7) ; 05 (écart 3) | P1-1 |
| 5 | Règle de contrôle du processeur (`cpu_options`) et champ « lu sur la machine / sur l'étiquette » | 08 (n°10) | P1-1 |
| 6 | Garder les patchs comme scripts rejouables ou les aplatir en migrations | 03 ; 09 | P0-4 |
| 7 | Limites de fréquence (signalements, envois) et où | 03 (n°3) ; 09 (n°4) | P1-4 |
| 8 | Connexion anonyme et test anti-robot | 09 (n°12) | P1-4 |
| 9 | Durées de cache, invalidation après modération | 09 (n°5) | P1-3 |
| 10 | Mesure de l'usage : outil externe | 09 (n°3) | P1-4 |
| 11 | Autres décisions du document 09 (n°7 à 10 : ville dans l'adresse, affichage RAM et stockage, texte des cartes sans prix, vue publique des produits) | 09 | P1-3 |
| 12 | Durée de la période de lancement ; numéro WhatsApp du porteur du projet pour les devis | 01 (n°6) ; 04 (n°6) | P1-4 |
| 13 | Seuils de lancement et cas « Douala en retard » | 04 (n°2) ; 08 (n°4, 5) | P1-6 |
| 14 | Région Supabase de production | 03 (n°5) | P1-5 |

---

## 8. Risques propres à ce plan

| Risque | Conséquence | Réponse proposée ❓ |
|---|---|---|
| L'exécution sur Supabase révèle un écart que la base locale ne montrait pas | Retouche des patchs et du document 09 | P0-1 en premier ; on ne code aucun écran avant son rapport |
| Un seul développeur pour le site, le catalogue, la modération et l'administration | Retards, erreurs de vérification | Ordre des lots fixé (section 5) ; confier la vérification des fiches à une autre personne dès que possible |
| Catalogue activé sans vérification | Alertes d'incohérence fausses, boutiques accusées à tort | Procédure d'activation fiche par fiche ; contrôle SQL des trois clés lues par le serveur (document 06) |
| Pilote retardé faute d'agents | Pas de prix, pas de lancement | Décisions n°1 et 2 en premier ; le développement des pages publiques continue en parallèle |
| Rejeu d'un patch qui défait un autre | Colonnes ou droits perdus en silence | Ordre fixé, patch « contrat de données » toujours en dernier, script de test rejoué après chaque rejeu |
| Connexions anonymes bloquées sur réseau mobile (R12) | Signalements et sauvegardes impossibles pour certains visiteurs | Test sur Supabase 🔎 ; compte en repli ; contrôle côté serveur |
| Scripts de test et de patch jamais exécutés sur Supabase | Fausse confiance | Le mot « vérifié » n'est employé qu'après P0-1 |

---

## 9. Après la phase 1

Phase 2 (composants et PC complets), phase 3 (builder), phase 4 (boutiques abonnées : statistiques, table `events`, fin de la période de lancement, droit de réponse) : voir le document 04. Chacune aura son plan de réalisation, écrit une fois la phase précédente mesurée, pas avant.

---

## 10. Suite proposée

1. Exécuter P0-1 sur Supabase et rapporter le résultat : le document 09 passe en v0.4.
2. Trancher les décisions n°1 à 3 de la section 7 (qui relève, qui modère, confirmation du patch).
3. Commencer P0-4 (socle) : c'est la partie la moins dépendante du résultat de P0-1.
