# ROADMAP MAÎTRE — PC Builder 237

> **Statut** : v1.2 — 2 octobre 2026 (D1 et D2 tranchées ; documents 01 à 08 corrigés et alignés ; reste le patch 09 et le document 09). Document de pilotage unique : il **n'invente aucune règle**, il range, tranche les conflits de version et ordonne le travail. En cas de doute sur une règle, le document 01 à 09 cité fait foi.
> **Légende** : ✅ décidé · 🛠 écrit · 🧪 testé sur PostgreSQL local seulement · 🔎 à vérifier sur Supabase · ❓ à décider · ⚠ incohérence à corriger

**Ce qui est vrai aujourd'hui** : tout est écrit, **rien n'a été exécuté sur Supabase**, le site actuel est inutilisable avec le nouveau schéma. Pour le MVP, **le porteur du projet relève les prix et modère** (Yaoundé d'abord, Douala ensuite).

---

## 1. Quelle version utiliser (inventaire)

### Documents

| Doc | Version qui fait foi | Fichier source | Remarque |
|---|---|---|---|
| 01 Vision | **v0.3** ✅ corrigé | `docs/` | D1 tranchée, vocabulaire aligné |
| 02 Règles métier | **v0.3** ✅ corrigé | `docs/` | Section 10 réécrite (point 4 `config_hash` : à faire) |
| 03 Architecture | **v0.3** ✅ corrigé | `docs/` | Objets de base complétés, règle 5, connexion anonyme |
| 04 Feuille de route | **v0.4** ✅ corrigé | `docs/` | Chaîne de 9 scripts, D1/D2 ; **ce document prime** pour l'ordre d'exécution |
| 05 Pages et parcours | **v0.4** ✅ corrigé | `docs/` | Vocabulaire, renvois D4/D7 |
| 06 Catalogue de départ | **v0.3** ✅ corrigé | `docs/` | `config_hash` résolu, décisions renumérotées |
| 07 Textes et messages | **v0.3** ✅ corrigé | `docs/` | `PB032`, `23505`, décisions 6, 9, 10 |
| 08 Collecte et modération | **v0.3** ✅ corrigé | `docs/` | Décision MVP et son conflit (voir 4 ci-dessous) |
| 09 Contrat de données | v0.3 | racine | Passera en v0.4 après P0-1 |
| 10 Plan de réalisation | v0.1 | racine | **Absorbé par ce document** (sections 4 et 5) |

### Scripts SQL : chaîne canonique (ordre d'exécution **obligatoire**)

| # | Script | Fichier source | Version à prendre |
|---|---|---|---|
| 1 | `pcbuilder237_schema.sql` | racine | unique |
| 2 | `pcbuilder237_agents_patch.sql` | racine | unique |
| 3 | `pcbuilder237_shop_owner_patch.sql` | racine | unique |
| 4 | `pcbuilder237_shop_products_patch.sql` | racine | identique à celui du zip 1-5 |
| 5 | `pcbuilder237_launch_patch.sql` | zip 2-5 | unique |
| 6 | `pcbuilder237_hide_address_patch.sql` | zip 07 | unique |
| 7 | `pcbuilder237_reason_codes_patch.sql` | **zip 08** | ⚠ **la version du zip 07 est défectueuse** (`v_codes \|\| 'code'` échoue : tout relevé suspect serait refusé au lieu d'aller en modération). Supprimer l'autre |
| 8 | `pcbuilder237_config_hash_patch.sql` | zip 08 | unique |
| 9 | `pcbuilder237_data_contract_patch.sql` | racine | **toujours le dernier** ; à rejouer après tout rejeu d'un patch 3 à 8 |
| — | `pcbuilder237_test_supabase.sql` | racine | à lancer après le 9 ; s'annule tout seul, le rapport est dans le message d'erreur |
| — | `pcbuilder237_catalog_seed.sql` | zip 6 | après le 4 ; fiches **inactives** tant que non vérifiées |

---

## 2. Incohérences à corriger (⚠)

| # | Où | Problème | Correction | État |
|---|---|---|---|---|
| 1 | 02 §10 point 4 | Barré « déjà corrigé » : **faux** | Remis « à faire » ; ✅ après exécution du patch 8 | ✅ fait (02 v0.3) |
| 2 | 04 phase 0 | Ne citait que 4 patchs | Chaîne de 9 scripts | ✅ fait (04 v0.4) |
| 3 | 01 §7, 05 §2.3 vs 08 §5.3 | « Au moins une photo » vs « deux » ; la base n'en impose qu'une | Trancher D4 | ✅ renvoi à D4 posé dans 01, 05 ; **D4 reste ❓** |
| 4 | 01, 02, 04, 05 | « relevé par un agent » | « Constaté par un agent » (07 §3.0 ✅) | ✅ fait (01, 02, 04, 05) |
| 5 | 06 §9 n°7 | `config_hash` « à corriger » ; numérotation 5, 7, 6 | Résolu 🛠, renuméroté | ✅ fait (06 v0.3) |
| 6 | 07 §12 n°9 | Retrait de `check_reason` encore ❓ | Fait dans le patch 9 🧪 | ✅ fait (07 v0.3) |
| 7 | 02 §10.5, 04, 07 n°6 | Garantie : trois positions | D7 ; 02 renvoie à D7 | ✅ 02, 04, 05, 07 alignés ; **D7 reste ❓** |
| 8 | 03 §3 | Liste d'objets incomplète | Compléter | ✅ fait (03 v0.3) |
| 9 | 03 §4.2 règle 5 | « Jamais modifié » faux pour le personnel | Préciser | ✅ fait (03 v0.3) |
| 10 | 01 §5 | Hors périmètre v1 « ❓ proposé » vs ✅ ailleurs | Passer en ✅ | ✅ fait (01 v0.3) |
| 11 | 10 §7 n°4 | Mauvaise référence | Document 10 archivé | ✅ sans objet |
| 12 | 09 §13 (11 écarts) | Reportés nulle part | Lot P0-7 | ✅ reporté dans 01, 02, 03, 05, 07, 08 ; ⏳ reste le document 09 lui-même (v0.4 après P0-1) |
| 13 | patch 9 (en-tête) | Cite « document 09 v0.2 » (en réalité v0.3) | Mettre à jour le commentaire | ⏳ reste (SQL) |
| 14 | 06 §11 ; 07 §13 | « Suite proposée » obsolète | Mise à jour | ✅ fait (06 v0.3, 07 v0.3, 08 v0.3) |
| 15 | Tous | Versions non distinguées | Version + historique en tête | ✅ 01 à 08 ; ⏳ 09 |
| 16 | **01 §6 n°1, 08 §13 n°1-3** | Indiquent encore « non décidé » pour D1, D2 | Aligner sur le registre | ✅ fait (01 v0.3, 08 v0.3) |

---

## 3. Registre unique des décisions

Chaque décision n'apparaît **qu'une fois** ici (les documents d'origine la citent en doublon : la période de lancement figure dans 01, 03, 04, 05 et 10). Numérotation propre à ce registre.

### Bloquantes avant le pilote ou la phase 1

| ID | Décision | Origine | À trancher avant |
|---|---|---|---|
| **D1** ✅ | **Qui relève les prix : le porteur du projet, Yaoundé d'abord, Douala ensuite** (phase MVP) | 01 n°1 · 04 n°3 · 08 n°1 | Tranchée le 2 octobre 2026 |
| **D2** ✅ | **Qui modère : le porteur du projet** (phase MVP). Reste ❓ : le délai (24 h ouvrées proposé) | 04 n°4 · 08 n°3 | Tranchée ; délai avant le pilote |
| **D3** | Confirmer le patch « contrat de données » (`city_id`, fermeture de `check_reason`, `client_ref`, note de rejet, signalement forcé `open`) | 09 n°1, 2, 6, 11 | **P0-1** |
| **D4** | Deux preuves photo pour occasion et reconditionné, imposées aussi par la base ? | 08 n°7 | P1-1 |
| **D5** | Règle de contrôle du processeur (`cpu_options`) et champ « lu sur la machine / sur l'étiquette » | 08 n°10 | P1-1 |
| **D6** | Patchs gardés rejouables ou aplatis en migrations | 03, 09 | P0-4 |
| **D7** | Garantie : obligatoire hors neuf, ou « non précisée » affichée ? | 02 §10.5 · 07 n°6 | P1-1 |
| **D8** | Qui vérifie les fiches constructeur (responsable catalogue) ; liste réelle des modèles ; stockage annoncé = disque principal | 06 n°1-4, 6 | Activation du catalogue (avant pilote) |

### Phase 1, avant l'écran concerné

| ID | Décision | Origine | Lot |
|---|---|---|---|
| D9 | Limites de fréquence (signalements, envois) et où | 03 n°3 · 09 n°4 | P1-4 |
| D10 | Connexion anonyme Supabase et test anti-robot (risque R12 réseau mobile) | 09 n°12 | P1-4 |
| D11 | Durées de cache et invalidation après modération | 09 n°5 | P1-3 |
| D12 | Mesure d'usage : outil externe en phase 1 | 09 n°3 | P1-4 |
| D13 | Ville dans l'URL ; affichage RAM/stockage ; texte de carte sans prix ; vue publique des produits (C6) | 09 n°7-10 | P1-3 |
| D14 | Durée de la période de lancement ; numéro WhatsApp du porteur pour les devis | 01 n°6 · 04 n°6 · 05 §10 | P1-4 |
| D15 | Seuils de lancement ; Douala en retard : retarder tout ou ouvrir Yaoundé seul | 04 n°2 · 08 n°4, 5 | P1-6 |
| D16 | Région Supabase de production | 03 n°5 | P1-5 |
| D17 | Preuves photo publiques (suppose le retrait EXIF) ; unicité d'un nom rejeté | 03 n°2, 8 | P1-1 / P1-2 |
| D18 | Rémunération (sans objet tant que le porteur relève lui-même), contrôle par échantillon (10 %), validité du badge (6 mois), accord des boutiques relu par un juriste | 08 n°2, 6, 8, 9 · 07 n°8 | Pilote |
| **D19** ❓ | **Séparation relevé / modération** : le porteur fait les deux (D1, D2), donc la règle « une personne ne relève pas et ne modère pas le même relevé » (08 §3) ne s'applique pas. Qui exerce le second regard (échantillon 10 %) ? | 08 §3 | Pilote |

### Phases 2 à 4 (ne pas traiter maintenant)
Contenu et tarifs du pack d'abonnement (01 n°2-4) · devis multi-boutiques (07 n°4) · mention « examiné par un modérateur » (07 n°5) · droit de réponse (05 §4.7) · table `events` (C7) · vue agrégée (C4).

### Déjà tranchées ✅ (ne plus rouvrir)
Français seul en phase 1 · vouvoiement · « prix constaté en boutique » · codes de motif et d'erreur plutôt que lecture des phrases · seul le personnel crée une boutique · pas de « prix ancien » avant 45 jours · historique public des prix plus tard · contact ouvert à toutes les boutiques pendant le lancement · connexion agent par e-mail + code agent · **la base décide, le site affiche**.

---

## 4. Roadmap

### Chemin critique
```
P0-1 base de test ─┬─► D3 ─► P0-7 alignement docs
                   └─► P0-2 comptes/données ─► P0-6 migration front ─► P1-1 formulaire agent ─► P1-2 modération ─► PILOTE MOKOLO
P0-4 socle site (parallèle à P0-1) ───────────┘                                                  (D1, D2, D8 requis)
                                                      P1-3 lecture publique ─► P1-4 accueil/signalement ─► P1-5 production ─► P1-6 go/no-go
```
Règle : **aucun écran avant le rapport de P0-1.** Si un test échoue, on corrige le patch, pas le site.

### Phase 0 — Remise à niveau

| Lot | Contenu | Taille | Sortie |
|---|---|---|---|
| P0-1 | Exécuter la chaîne 1→9 sur Supabase **test**, puis le script de test, puis les 6 vérifications `supabase-js` (codes d'erreur dans `error.code`, relecture après insertion, signalement anonyme) | S, **bloquant** | Rapport sans échec ; doc 09 → v0.4 |
| P0-2 | Admin, 2-3 agents, 1 modérateur, 1 propriétaire de test, boutiques, villes/quartiers ; catalogue de départ avec **quelques fiches activées pour le test seulement** | S | Un relevé de test va de l'agent au public, par le modérateur |
| P0-3 | Trancher D1, D2, D3, D8 (sans code) | S | Registre à jour |
| P0-4 | Dépôt/environnements (Vercel, aperçus sur base de test), migrations (D6), 3 clients Supabase (`getUser()`, jamais `getSession()`), types, module de lecture, `fr.json`, fonctions pures testées (Vitest) | M | Tests verts + page de diagnostic |
| P0-5 | Corrections d'audit : titre, `lang="fr"`, favicon, labels, en-têtes de sécurité, Open Graph, `robots.txt` | S | — |
| P0-6 | Migrer le front : connexion agent, routes `/agent` `/boutique` `/admin` protégées côté serveur, retrait de l'ancienne table | M | Aucune page cassée |
| P0-7 | Corriger les incohérences de la section 2 | S | Docs alignés |

**Sortie phase 0** : P0-1 à P0-6 atteints, D1 à D3 tranchées.

### Phase 1 — MVP comparateur de portables

| Lot | Contenu | Taille | Dépend de |
|---|---|---|---|
| P1-1 | Formulaire agent : photos compressées **sans EXIF**, envoi en 3 temps, `client_ref`, reprise après coupure, demande d'ajout de boutique. Essai sur vrai téléphone, connexion lente | L | P0, D4, D5, D7 |
| P1-2 | File de modération : relevés, signalements, demandes de boutique, fiches proposées ; note obligatoire au rejet (`PB032`) | M | P1-1 |
| **Pilote Mokolo** | Collecte réelle (doc 08 §10) avec **catalogue vérifié** | — | P1-2, D1, D2, D8 |
| P1-3 | Lecture publique : ville, `/produits`, `/produits/[id]`, `/boutiques/[id]` ; tri sans effet de l'abonnement ; client public sans cookies | L | P0-4 |
| P1-4 | Accueil, signalement (limite côté serveur), pages de confiance, partage WhatsApp, mesure d'usage | M | P1-3, D9, D10, D12, D14 |
| P1-5 | Production : chaîne 1→9, sauvegardes **avec restauration testée**, administrateur et agents réels, aucune fiche activée sans vérification | M | P1-4, D16 |
| P1-6 | Répétition générale sur téléphone ; seuils par ville (doc 08 §8) ; confidentialité en ligne | S | D15 |

**Sortie phase 1 (go/no-go)** : seuils de couverture atteints (ou ouverture d'une seule ville décidée) ; aucun prix de plus de 45 jours affiché ; parcours testé sur téléphone ; sauvegardes et confidentialité en place.

### Phases suivantes (un plan par phase, écrit après mesure de la précédente)
- **Phase 2** : composants et PC complets, règles anti-arnaque supplémentaires selon les fraudes constatées.
- **Phase 3** : builder (7 règles de compatibilité testées, total par boutique ou panier le moins cher, sauvegarde et partage, devis WhatsApp).
- **Phase 4** : boutiques abonnées (espace, statistiques, `events`, fin du lancement, droit de réponse) ; pack et tarifs à décider avant.

---

## 5. Risques qui comptent vraiment

1. **« Vérifié » ne veut rien dire avant P0-1** : tout a été testé en local avec simulation de `auth` et `storage`. N'écrire « vérifié » qu'après.
2. **Un seul développeur** pour site, catalogue, modération et admin : confier la vérification des fiches à une autre personne.
3. **Pas d'agents = pas de prix = pas de lancement** : D1 est le vrai chemin critique, pas le code.
4. **Rejeu d'un patch qui défait un autre** : rejouer le 9 en dernier, puis le script de test.
5. **Catalogue activé sans vérification** : fausses alertes, boutiques accusées à tort. Valeurs actuelles non vérifiées.

---

## 6. Organisation proposée du dossier

```
docs/
  00-ROADMAP-MAITRE.md        ← ce fichier (seul point d'entrée)
  01 … 09 (une seule version chacune)
  archive/                    ← 10-plan…, anciennes versions 02/03/04/05/06, reason_codes (zip 07)
sql/
  01_schema.sql … 09_data_contract_patch.sql   ← préfixés dans l'ordre d'exécution
  test/test_supabase.sql
  seed/catalog_seed.sql
```
Renommer les scripts avec leur numéro d'ordre supprime l'ambiguïté sur la séquence d'exécution.

## 7. Prochaines actions (dans l'ordre)

1. Supprimer les doublons (section 1) et mettre en place l'arborescence de la section 6.
2. Confirmer **D3** (une ligne par décision : 1, 2, 6, 11 du doc 09).
3. Exécuter **P0-1** sur Supabase test et me communiquer le rapport.
4. En parallèle, trancher **D1** et **D2** ; démarrer **P0-4**.
