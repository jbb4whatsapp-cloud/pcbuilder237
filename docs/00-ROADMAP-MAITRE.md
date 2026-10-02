# ROADMAP MAÎTRE — PC Builder 237

> **Statut** : v1.3 — 2 octobre 2026 (P0-1 terminé sur la base de test ; document 09 en v0.4 ; base de test nettoyée). Document de pilotage unique : il **n'invente aucune règle**, il range, tranche les conflits de version et ordonne le travail. En cas de doute sur une règle, le document 01 à 09 cité fait foi.
> **Historique** : v1.2 (2 octobre 2026) : D1 et D2 tranchées. v1.3 (2 octobre 2026) : chaîne 1→9 et scripts de test exécutés sur Supabase test, règle « aucun écran avant P0-1 » levée, sections 1, 2, 5 et 7 réécrites. v1.3 révisée (2 octobre 2026) : commit de P0-1 confirmé (`9e03d45`, poussé sur `origin/main`), arborescence réelle du dépôt reportée (scripts 01 à 09 déjà numérotés dans `supabase/sql/`), état réel des documents 07 et 08 relu.
> **Légende** : ✅ décidé · 🛠 écrit · 🧪 testé sur PostgreSQL local seulement · 🧫 vérifié sur le projet Supabase de test · 🔎 à vérifier (test ou production) · ❓ à décider · ⚠ incohérence à corriger · ⏳ reste à faire

**Ce qui est vrai aujourd'hui** :
- La chaîne complète 1→9 a été rejouée sur une base Supabase de test vide. Le script SQL (71 PASS) et le script supabase-js (31 PASS) ont réussi 🧫. La base de test a été nettoyée (relevés, signalements, comptes anonymes et photos de test à 0).
- **Rien n'est en production.** Le site actuel reste inutilisable avec le nouveau schéma.
- Pour le MVP, **le porteur du projet relève les prix et modère** (Yaoundé d'abord, Douala ensuite).
- « Vérifié » signifie désormais « vérifié sur Supabase de test » (🧫). Plusieurs points restent 🔎 (voir section 5, risque 1).

---

## 1. Quelle version utiliser (inventaire)

### Documents

| Doc | Version qui fait foi | Fichier source | Remarque |
|---|---|---|---|
| 01 Vision | **v0.3** ✅ | `docs/` | D1 tranchée, vocabulaire aligné |
| 02 Règles métier | **v0.3** ✅ | `docs/` | §10 point 4 (`config_hash`) : ✅ sur la base de test, production à faire |
| 03 Architecture | **v0.3** ✅ | `docs/` | Objets de base complétés, règle 5, connexion anonyme |
| 04 Feuille de route | **v0.4** ✅ | `docs/` | Chaîne de 9 scripts, D1/D2 ; **ce document prime** pour l'ordre d'exécution |
| 05 Pages et parcours | **v0.4** ✅ | `docs/` | Vocabulaire, renvois D4/D7 |
| 06 Catalogue de départ | **v0.3** ✅ | `docs/` | `config_hash` résolu, décisions renumérotées |
| 07 Textes et messages | **v0.3** ✅ | `docs/` | `PB032`, `23505`, décisions 6, 9, 10 ; message « relevé déjà envoyé » présent (§7.2) mais statuts 🧪 et « non exécuté » à passer en 🧫 (voir §2, n°20) |
| 08 Collecte et modération | **v0.3** ✅ | `docs/` | Décision MVP ; note sur `price_reports_visible` ajoutée sous K4 ; §12 et §14 encore au statut « base locale / P0-1 à faire » (voir §2, n°20) |
| 09 Contrat de données | **v0.4** ✅ | `docs/09-contrat-de-donnees-site-supabase.md` | Vérifié sur la base de test ; D3 « retenue par défaut », confirmation attendue |
| 10 Plan de réalisation | v0.1 | racine | **Absorbé par ce document** (sections 4 et 5) ; à archiver |

### Scripts SQL : chaîne canonique (ordre d'exécution **obligatoire**)

| # | Script | Fichier source | Version à prendre |
|---|---|---|---|
| 1 | `supabase/sql/01_schema.sql` | dépôt | unique |
| 2 | `supabase/sql/02_agents_patch.sql` | dépôt | unique |
| 3 | `supabase/sql/03_shop_owner_patch.sql` | dépôt | unique |
| 4 | `supabase/sql/04_shop_products_patch.sql` | dépôt | unique |
| 5 | `supabase/sql/05_launch_patch.sql` | dépôt | unique |
| 6 | `supabase/sql/06_hide_address_patch.sql` | dépôt | unique |
| 7 | `supabase/sql/07_reason_codes_patch.sql` | dépôt | ✅ version corrigée confirmée (les quatre `array_append` aux lignes 165, 173, 182 et 199). La version défectueuse du zip 07 ne doit plus servir |
| 8 | `supabase/sql/08_config_hash_patch.sql` | dépôt | unique |
| 9 | `supabase/sql/09_data_contract_patch.sql` | dépôt | **toujours le dernier** ; à rejouer après tout rejeu d'un patch 3 à 8 (rejouer le 5 ou le 6 retire `city_id` de `shops_public`) |
| — | `supabase/tests/test_supabase.sql` | dépôt | à lancer après le 9 ; s'annule tout seul, le rapport est dans le message d'erreur ; **71 PASS** 🧫 |
| — | `supabase/tests/test_supabase_js.mjs` | dépôt | à lancer après le script SQL ; passe par l'API (clé publique, jetons) ; **31 PASS** 🧫 ; exige `.env.test.local` (projet de TEST uniquement) et Node 18.17 ou plus |
| — | catalogue de départ (`supabase/seed/`) | dépôt | après le 4 ; fiches **inactives** tant que non vérifiées |

Tous les scripts sont déjà rangés et numérotés dans `supabase/` (section 6). Les anciens fichiers à la racine et dans les zips ne servent plus : les supprimer ou les archiver pour éviter toute confusion.

---

## 2. Incohérences à corriger (⚠)

| # | Où | Problème | Correction | État |
|---|---|---|---|---|
| 1 | 02 §10 point 4 | Barré « déjà corrigé » : faux | Remis « à faire », puis fait par le patch 8 | ✅ sur la base de test ; ⏳ production (P1-5) |
| 2 | 04 phase 0 | Ne citait que 4 patchs | Chaîne de 9 scripts | ✅ fait (04 v0.4) |
| 3 | 01 §7, 05 §2.3 vs 08 §5.3 | « Au moins une photo » vs « deux » ; la base n'en impose qu'une | Trancher D4 | ✅ renvoi à D4 posé ; **D4 reste ❓** |
| 4 | 01, 02, 04, 05 | « relevé par un agent » | « Constaté par un agent » (07 §3.0) | ✅ fait |
| 5 | 06 §9 n°7 | `config_hash` « à corriger » | Résolu, renuméroté | ✅ fait (06 v0.3) |
| 6 | 07 §12 n°9 | Retrait de `check_reason` encore ❓ | Fait dans le patch 9 | ✅ fait (07 v0.3) ; 🧫 vérifié |
| 7 | 02 §10.5, 04, 07 n°6 | Garantie : trois positions | D7 | ✅ alignés ; **D7 reste ❓** |
| 8 | 03 §3 | Liste d'objets incomplète | Compléter | ✅ fait (03 v0.3) |
| 9 | 03 §4.2 règle 5 | « Jamais modifié » faux pour le personnel | Préciser | ✅ fait (03 v0.3) |
| 10 | 01 §5 | Hors périmètre v1 « ❓ proposé » vs ✅ | Passer en ✅ | ✅ fait (01 v0.3) |
| 11 | 10 §7 n°4 | Mauvaise référence | Document 10 archivé | ✅ sans objet |
| 12 | 09 §13 (11 écarts) | Reportés nulle part | Lot P0-7 | ✅ doc 09 en v0.4 ; ✅ reportés dans 01, 02, 03, 05, 07, 08 ; ⏳ reste à contrôler : n°17 et n°18 |
| 13 | patch 9 (en-tête) | Citait « document 09 v0.2 » | Mettre à jour le commentaire | ✅ l'en-tête dit déjà « document 09, v0.4 » (vérifié) |
| 14 | 06 §11 ; 07 §13 | « Suite proposée » obsolète | Mise à jour | ✅ fait |
| 15 | Tous | Versions non distinguées | Version + historique en tête | ✅ 01 à 09 |
| 16 | 01 §6 n°1, 08 §13 n°1-3 | « Non décidé » pour D1, D2 | Aligner sur le registre | ✅ fait (01 v0.3, 08 v0.3) |
| 17 | 07 §7.2 | Message « relevé déjà envoyé » (`23505` sur `price_reports_client_ref_key`) absent | Ajouter le texte | ✅ présent dans 07 v0.3 (§7.2) ; ⏳ reste ❓ à lever (texte à valider) |
| 18 | 08 (requêtes K1 à K4) | Celles qui passent par l'application doivent lire `price_reports_visible` et non `price_reports` | Revoir les requêtes | ✅ note ajoutée sous K4 (08 v0.3) ; ⏳ à vérifier sur Supabase |
| 19 | Arborescence (§6) | Section 6 différente du dépôt | Aligner la section 6 sur le dépôt | ✅ fait (scripts 01 à 09 déjà numérotés dans `supabase/sql/`, tests dans `supabase/tests/`, seed dans `supabase/seed/`) |
| 20 | 07 et 08 | Statuts périmés (🧪, « non exécuté sur Supabase », « Suite proposée » obsolète) | 🧪 → 🧫 ; suites renvoyées à la roadmap | ✅ fait et poussé (`3090ca2`) |
| 21 | 02 §10 (points 1 à 4) | Statuts « 🧪 local, 🔎 Supabase » alors que les patchs 3 et 8 sont exécutés sur la base de test | « 🧫 test Supabase, 🔎 production » ; noms de patchs réels ; test d'insertion propriétaire ajouté | ✅ fait et poussé (`66dc181`, `82d91d5`) : 71 PASS, 0 FAIL ; relevé de boutique toujours `pending`, `source = shop`, même si le client envoie `published` et `agent` |

---

## 3. Registre unique des décisions

Chaque décision n'apparaît **qu'une fois** ici. Numérotation propre à ce registre (le document 09 §15 a sa propre numérotation : la correspondance est donnée dans la colonne « Origine »).

### Bloquantes avant le pilote ou la phase 1

| ID | Décision | Origine | À trancher avant |
|---|---|---|---|
| **D1** ✅ | **Qui relève les prix : le porteur du projet, Yaoundé d'abord, Douala ensuite** (phase MVP) | 01 n°1 · 04 n°3 · 08 n°1 | Tranchée le 2 octobre 2026 |
| **D2** ✅ | **Qui modère : le porteur du projet** (phase MVP). Reste ❓ : le délai (24 h ouvrées proposé) | 04 n°4 · 08 n°3 | Tranchée ; délai avant le pilote |
| **D3** 🧫 | Confirmer le patch « contrat de données » : `city_id` dans les vues, fermeture de `check_reason` et de la lecture directe de `price_reports`, `client_ref`, note de rejet obligatoire, signalement forcé `open`. **Retenu par défaut dans le patch, tests au vert ; confirmation attendue** | 09 n°1, 2, 6, 11 | **P0-7** |
| **D4** | Deux preuves photo pour occasion et reconditionné, imposées aussi par la base ? | 08 n°7 | P1-1 |
| **D5** | Règle de contrôle du processeur (`cpu_options`) et champ « lu sur la machine / sur l'étiquette » | 08 n°10 | P1-1 |
| **D6** | Patchs gardés rejouables ou aplatis en migrations | 03, 09 | P0-4 |
| **D7** | Garantie : obligatoire hors neuf, ou « non précisée » affichée ? | 02 §10.5 · 07 n°6 | P1-1 |
| **D8** | Qui vérifie les fiches constructeur (responsable catalogue) ; liste réelle des modèles ; stockage annoncé = disque principal | 06 n°1-4, 6 | Activation du catalogue (avant pilote) |

### Phase 1, avant l'écran concerné

| ID | Décision | Origine | Lot |
|---|---|---|---|
| D9 | Limites de fréquence (signalements, envois) et où (action serveur) | 03 n°3 · 09 n°4 | P1-4 |
| D10 | Connexion anonyme Supabase et test anti-robot (risque R12 réseau mobile). **Activée sur la base de test seulement ; elle reste désactivée en production tant que D10 n'est pas tranchée** | 09 n°12 | P1-4 |
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
P0-1 ✅ (base de test) ─┬─► D3 (confirmation) ─► P0-7 alignement docs
                        └─► P0-2 comptes/données ─► P0-6 migration front ─► P1-1 formulaire agent ─► P1-2 modération ─► PILOTE MOKOLO
P0-4 socle site (peut démarrer maintenant) ────────┘                                                  (D1 ✅, D2 ✅, D8 requis)
                                                      P1-3 lecture publique ─► P1-4 accueil/signalement ─► P1-5 production ─► P1-6 go/no-go
```
La règle « aucun écran avant le rapport de P0-1 » est **levée** : le rapport est sans échec sur la base de test. Règle qui reste : si un test échoue, on corrige le patch, pas le site.

### Phase 0 — Remise à niveau

| Lot | Contenu | Taille | État | Sortie |
|---|---|---|---|---|
| P0-1 | Chaîne 1→9 sur Supabase **test**, script SQL, 6 vérifications `supabase-js` | S | ✅ 🧫 fait : 71 PASS + 31 PASS, base nettoyée. Commit fait et poussé : `9e03d45` (7 fichiers : `.env.example`, `.gitignore`, `package.json`, doc 09, patch 9, deux scripts de test), arbre de travail propre | Rapport sans échec ; doc 09 en v0.4 |
| P0-2 | Admin, 2-3 agents, 1 modérateur, 1 propriétaire de test, boutiques, villes/quartiers ; catalogue de départ avec **quelques fiches activées pour le test seulement** | S | ⏳ Partiel sur la base de test (agent, modérateur, propriétaire, boutique, produit, abonnement de test). Reste : données réelles de test et **production** | Un relevé de test va de l'agent au public, par le modérateur |
| P0-3 | Trancher D1, D2, D3, D8 (sans code) | S | D1 ✅, D2 ✅ ; D3 🧫 en attente de confirmation ; D8 ❓ | Registre à jour |
| P0-4 | Dépôt/environnements (Vercel, aperçus sur base de test), migrations (D6), 3 clients Supabase (`getUser()`, jamais `getSession()`), types, module de lecture (constantes de colonnes, `mapError`, fonctions pures), `fr.json`, tests Vitest | M | ⏳ **À démarrer** | Tests verts + page de diagnostic |
| P0-5 | Corrections d'audit : titre, `lang="fr"`, favicon, labels, en-têtes de sécurité, Open Graph, `robots.txt` | S | ⏳ | — |
| P0-6 | Migrer le front : connexion agent, routes `/agent` `/boutique` `/admin` protégées côté serveur, retrait de l'ancienne table ; relire les relevés par `price_reports_visible` | M | ⏳ | Aucune page cassée |
| P0-7 | Corriger les incohérences de la section 2 | S | ✅ terminé : n°13, n°20, n°21 (commits `3090ca2`, `b20e13e`, `054f85b`, `66dc181`, `82d91d5`). Restent n°17 et n°18 : à valider par une vraie requête depuis le site (avec P0-4/P1-1) | Docs alignés |

**Sortie phase 0** : P0-1 à P0-6 atteints, D1 à D3 tranchées. Aujourd'hui : P0-1 ✅, D1 ✅, D2 ✅.

### Phase 1 — MVP comparateur de portables

| Lot | Contenu | Taille | Dépend de |
|---|---|---|---|
| P1-1 | Formulaire agent : photos compressées **sans EXIF**, envoi en 3 temps (photos, relevé avec `client_ref`, relecture des colonnes ouvertes), reprise après coupure, demande d'ajout de boutique. Essai sur vrai téléphone, connexion lente | L | P0, D4, D5, D7 |
| P1-2 | File de modération : relevés, signalements, demandes de boutique, fiches proposées ; note obligatoire au rejet (`PB032`) ; mises à jour sans `.select()` complet | M | P1-1 |
| **Pilote Mokolo** | Collecte réelle (doc 08 §10) avec **catalogue vérifié** | — | P1-2, D1 ✅, D2 ✅, D8 |
| P1-3 | Lecture publique : ville, `/produits`, `/produits/[id]`, `/boutiques/[id]` ; tri sans effet de l'abonnement ; client public sans cookies ; filtre `city_id` | L | P0-4 |
| P1-4 | Accueil, signalement (limite côté serveur), pages de confiance, partage WhatsApp, mesure d'usage | M | P1-3, D9, D10, D12, D14 |
| P1-5 | Production : chaîne 1→9, **puis script SQL et script supabase-js sur la production** (retester R10 et R11), sauvegardes **avec restauration testée**, administrateur et agents réels, connexion anonyme désactivée sauf décision D10, aucune fiche activée sans vérification | M | P1-4, D10, D16 |
| P1-6 | Répétition générale sur téléphone ; seuils par ville (doc 08 §8) ; confidentialité en ligne | S | D15 |

**Sortie phase 1 (go/no-go)** : seuils de couverture atteints (ou ouverture d'une seule ville décidée) ; aucun prix de plus de 45 jours affiché ; parcours testé sur téléphone ; sauvegardes et confidentialité en place.

### Phases suivantes (un plan par phase, écrit après mesure de la précédente)
- **Phase 2** : composants et PC complets, règles anti-arnaque supplémentaires selon les fraudes constatées.
- **Phase 3** : builder (7 règles de compatibilité testées, total par boutique ou panier le moins cher, sauvegarde et partage, devis WhatsApp).
- **Phase 4** : boutiques abonnées (espace, statistiques, `events`, fin du lancement, droit de réponse) ; pack et tarifs à décider avant.

---

## 5. Risques qui comptent vraiment

1. **« Vérifié » veut dire « vérifié sur Supabase de test », pas « en production ».** Restent 🔎 après P0-1 :
   - les codes `PB001` à `PB031` côté client JavaScript (seuls `PB032` et `23505` sont vérifiés) ;
   - les noms par défaut des contraintes `CHECK` (par exemple `price_reports_price_fcfa_check`) ;
   - le filtre `reported_specs->>ram_gb` sur la vue ;
   - le propriétaire de boutique qui est lui-même l'auteur d'un relevé ;
   - la vraie connexion anonyme par l'API, et son comportement sur réseau mobile partagé (R12) ;
   - le rejeu du patch 9 seul sur Supabase, et l'avertissement du tableau de bord sur la vue `price_reports_visible`.
2. **Un seul développeur** pour site, catalogue, modération et admin : confier la vérification des fiches à une autre personne.
3. **Pas d'agents = pas de prix = pas de lancement** : D1 est tranchée, mais l'exécution (relevés réels à Yaoundé puis Douala) est le vrai chemin critique, pas le code.
4. **Rejeu d'un patch qui défait un autre** : rejouer le 9 en dernier, puis les deux scripts de test. Rejouer le patch lancement ou adresse retire `city_id` de `shops_public`.
5. **Catalogue activé sans vérification** : fausses alertes, boutiques accusées à tort. Valeurs actuelles non vérifiées.
6. **Secrets et base de test** : `.env.test.local` ne doit jamais être commité ni pointer vers la production ; les scripts de test créent des données (relevés, signalements, comptes anonymes, photos) et doivent être lancés sur le projet de TEST uniquement, avec nettoyage ensuite.
7. **Connexion anonyme** : activée sur la base de test seulement. Ne pas l'activer en production avant D10.

---

## 6. Organisation du dossier

```
docs/
  00-ROADMAP-MAITRE.md        ← ce fichier (seul point d'entrée)
  01 … 09 (une seule version chacune)
  archive/                    ← 10-plan…, anciennes versions
supabase/
  seed/                       ← catalogue de départ
  sql/
    01_schema.sql … 09_data_contract_patch.sql   ← numérotés dans l'ordre d'exécution
  tests/
    test_supabase.sql
    test_supabase_js.mjs
.env.example                  ← modèle (site + tests) ; suivi par git
.env.local                    ← site, non commité
.env.test.local               ← tests, non commité, base de TEST uniquement
```
Cette arborescence est celle du dépôt aujourd'hui. Le numéro dans le nom des scripts supprime l'ambiguïté sur la séquence d'exécution.

## 7. Prochaines actions (dans l'ordre)

1. ✅ **Contrôles après le commit : faits** (patch 7 corrigé, en-tête « Node 18.17 ou plus », seul `.env.example` suivi par git).
2. **Confirmer D3** : une ligne par décision (n°1, 2, 6, 11 du doc 09 §15), ou demander des changements au patch. Si un changement est demandé, rejouer le patch 9, puis les deux scripts de test.
3. **P0-4** : démarrer le socle du site (dépôt, environnements, 3 clients Supabase, `fr.json`, module de lecture, Vitest). C'est le chemin critique côté code.
4. ✅ **P0-7 terminé** (voir la section 2). Test d'insertion propriétaire ajouté : 71 PASS. Les n°17 et n°18 se valideront avec le site (P0-4, P1-1).
5. **Catalogue activé sans vérification** : fausses alertes, boutiques accusées à tort. Valeurs actuelles non vérifiées.
6. **Secrets et base de test** : `.env.test.local` ne doit jamais être commité ni pointer vers la production ; les scripts de test créent des données (relevés, signalements, comptes anonymes, photos) et doivent être lancés sur le projet de TEST uniquement, avec nettoyage ensuite.
7. **Connexion anonyme** : activée sur la base de test seulement. Ne pas l'activer en production avant D10.

---

## 6. Organisation du dossier

```
docs/
  00-ROADMAP-MAITRE.md        ← ce fichier (seul point d'entrée)
  01 … 09 (une seule version chacune)
  archive/                    ← 10-plan…, anciennes versions
supabase/
  seed/                       ← catalogue de départ
  sql/
    01_schema.sql … 09_data_contract_patch.sql   ← numérotés dans l'ordre d'exécution
  tests/
    test_supabase.sql
    test_supabase_js.mjs
.env.example                  ← modèle (site + tests) ; suivi par git
.env.local                    ← site, non commité
.env.test.local               ← tests, non commité, base de TEST uniquement
```
Cette arborescence est celle du dépôt aujourd'hui. Le numéro dans le nom des scripts supprime l'ambiguïté sur la séquence d'exécution.

## 7. Prochaines actions (dans l'ordre)

1. ✅ **Contrôles après le commit : faits** (patch 7 corrigé, en-tête « Node 18.17 ou plus », seul `.env.example` suivi par git).
2. **Confirmer D3** : une ligne par décision (n°1, 2, 6, 11 du doc 09 §15), ou demander des changements au patch. Si un changement est demandé, rejouer le patch 9, puis les deux scripts de test.
3. **P0-4** : démarrer le socle du site (dépôt, environnements, 3 clients Supabase, `fr.json`, module de lecture, Vitest). C'est le chemin critique côté code.
4. **P0-7** : corriger les points ouverts de la section 2 : n°13 (en-tête du patch 9 qui cite « document 09 v0.2 »), n°20 (statuts 🧪 et « non exécuté » à passer en 🧫 dans les documents 07 et 08, « suite proposée » à remplacer), puis valider n°17 et n°18.
   - Test d'insertion propriétaire : ✅ ajouté et passé (71 PASS). Reste à commiter `test_supabase.sql` et les docs 02 et 09 (compteur 71).
5. **P0-2** : préparer les données de test réelles, puis la liste des comptes (admin, agents, modérateur) pour la production.
6. En parallèle, côté terrain : **D8** (qui vérifie les fiches, liste réelle des modèles) et **D2** (délai de modération), nécessaires avant le pilote Mokolo.
