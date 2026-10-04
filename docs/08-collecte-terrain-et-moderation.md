# Collecte des prix, vérification sur place et modération — PC Builder 237

> **Statut** : brouillon v0.3 — 2 octobre 2026 (patchs « agents » et « propriétaire de boutique » reçus et vérifiés ; deux écarts corrigés, section 12)
> **Historique** : v0.3 — décision MVP intégrée : **le porteur du projet relève et modère** (Yaoundé puis Douala) ; conséquence sur la séparation relevé/modération (section 3) ; chaîne de patchs complétée (section 12) ; requêtes de suivi et lecture par `price_reports_visible` (section 9) ; décisions 1 à 3 (section 13) mises à jour. Statuts de vérification mis à jour après P0-1 (base de test).
> **Légende** : ✅ décidé par le porteur du projet · 🛠 déjà en place dans le schéma ou les patchs (écrit, non exécuté sur une base de production) · 🧫 vérifié sur le projet Supabase de test · ❓ proposition à valider · 🔍 à vérifier sur le terrain ou sur une fiche constructeur

Ce document répond aux trois questions qui bloquent le lancement : **qui relève les prix, qui modère, à partir de quand le site est-il assez rempli pour ouvrir** (document 01, question 1 ; document 04, section 5, décisions 2, 3 et 4). Il décrit aussi ce que fait concrètement un agent en boutique et un modérateur devant sa file, ce que les documents 05 et 07 ne détaillent pas.

**Toutes les valeurs chiffrées sont des hypothèses de travail**, à remplacer par les mesures de la collecte pilote (section 10). Aucune décision n'est prise à la place du porteur du projet : chaque point ouvert est repris dans la section 13.

Sources : documents 01 à 07, schéma SQL v1 et patchs « produits », « lancement », « adresse et horaires », « codes de motif » et « catalogue de départ ». Tous les patchs ont maintenant été lus, et la chaîne complète a été exécutée sur une base PostgreSQL 16 **locale** avec des simulations de l'authentification et du stockage Supabase (section 12). Cette vérification locale a ensuite été complétée sur le projet Supabase de test (P0-1 ✅ : script SQL 71 PASS, script supabase-js 31 PASS ; document 09 v0.4). Rien n'est en production.

---

## 1. Principe : pas de données, pas de produit

Un comparateur sans prix récents ne sert à rien (document 04, section 1). Le site ne s'ouvre au public qu'une fois la collecte rodée et les seuils de la section 8 atteints. La collecte, la modération et le catalogue vérifié sont donc **le chemin critique du lancement**, avant le développement des écrans.

---

## 2. Ce que la base impose déjà 🛠

| Contrainte | Conséquence pour l'exploitation |
|---|---|
| Un relevé exige au moins une photo de preuve | Pas de relevé « de mémoire » ; l'agent doit photographier |
| Seul le dernier relevé publié compte, par produit, boutique, état et configuration | Un nouveau passage remplace l'ancien prix sans le supprimer |
| Un relevé de plus de 45 jours n'est plus affiché | Chaque ligne doit être revue **avant** 45 jours, sinon elle disparaît du site |
| Le serveur calcule le niveau de contrôle ; `ok` est publié tout de suite, le reste attend un modérateur | Le travail du modérateur se limite aux alertes (et, en phase 4, aux relevés de boutique) |
| Le produit doit exister et être actif ; la boutique doit être active | Un modèle absent du catalogue ne peut pas être relevé : il faut le faire créer avant |
| Une règle de prix bas existe, mais seulement avec **3 relevés publiés ou plus** pour un même produit, état et configuration sur 60 jours | Sous 3 boutiques par produit, ce contrôle ne s'applique jamais (section 8) |

---

## 3. Équipe et rôles ❓

| Rôle | Mission | Compte |
|---|---|---|
| **Agent** | Visite les boutiques, relève les prix avec preuves, signale les boutiques absentes | Rôle `agent` attribué par l'admin ✅ |
| **Modérateur** | Traite la file des relevés en attente, les fiches produit proposées, les signalements et les demandes d'ajout de boutique | Rôle `moderator` |
| **Responsable catalogue** | Vérifie les fiches produit sur les fiches constructeur (document 06, section 6) | Modérateur ou admin ❓ |
| **Admin** | Rôles, boutiques, abonnements, badge « vérifiée » | Rôle `admin` |

**Décision MVP ✅** : le porteur du projet assure lui-même le relevé des prix **et** la modération, Yaoundé d'abord, Douala ensuite. Le reste de cette section décrit l'organisation cible si des agents et un modérateur sont ajoutés ensuite.

**⚠ Conséquence à traiter ❓** : tant que la même personne relève et modère, la règle ci-dessous (« une même personne ne relève pas et ne modère pas le même relevé ») **ne peut pas être appliquée**, et la base ne l'impose pas. Les relevés `ok` sont publiés sans modération ; le seul second regard possible est le contrôle par échantillon (section 6.3), à faire par une autre personne dès qu'il y en a une.

**Proposition de départ si des agents sont recrutés** ❓ (hors MVP, où le porteur du projet relève seul, D1 ✅) : 2 agents par ville, pour qu'une absence n'interrompe pas la collecte ; 1 modérateur pour les deux villes ; le porteur du projet comme admin et responsable catalogue au début. Une même personne ne doit pas à la fois relever un prix et modérer ce relevé.

### Rémunération des agents ❓ (sans objet tant que le porteur relève lui-même)

| Formule | Avantage | Risque |
|---|---|---|
| Forfait par tournée ou par jour | Aucune incitation à gonfler le volume | Pas d'incitation à la qualité |
| Commission par relevé accepté | Simple, proportionnelle | Pousse aux doublons et aux relevés bâclés ou inventés |
| Forfait + prime de qualité (peu de rejets, relevés complets) | Équilibre | Demande un suivi (section 9) |

**Recommandation** : forfait par tournée, avec contrôle par échantillon (section 6.3), puis une prime de qualité quand le suivi par agent existe. Si une commission est choisie, la **plafonner par jour** et ne payer que les relevés non rejetés. Les montants ne sont pas traités ici.

Rappel (document 03, section 4.1) : le « code agent » est le mot de passe du compte. Quand un agent part, l'admin retire son rôle : l'accès est coupé immédiatement.

---

## 4. Charge de travail et cadence ❓

Une ligne de prix = un produit dans une boutique, pour un état et une configuration donnés.

| Hypothèse (par ville) | Valeur |
|---|---|
| Boutiques actives | 12 |
| Modèles du catalogue vendus par boutique | 6 |
| Variantes de configuration par modèle et par boutique | 1,5 |
| Lignes à tenir à jour | 12 × 6 × 1,5 ≈ **108** |
| Cycle de rafraîchissement visé | **21 jours** (la moitié de la limite de 45 jours : une tournée manquée ne fait pas disparaître les prix) |
| Relevés par agent et par jour de tournée (photos et échanges inclus) | 20 |

*MVP : ces cadences valent pour une seule personne, le porteur du projet, qui relève et modère ; « agent » désigne alors cette personne.*

**Résultat** : 108 ÷ 21 ≈ **5 relevés par jour et par ville**, soit une tournée de 20 relevés tous les quatre jours environ. Côté modération, si 20 % des relevés déclenchent une alerte, cela fait environ **un relevé à examiner par jour et par ville**.

À retenir : **la saisie n'est pas le facteur limitant.** Les vrais obstacles sont l'accès aux boutiques, la couverture des modèles et le catalogue vérifié. Si les chiffres mesurés s'écartent beaucoup de ces hypothèses, refaire le calcul avant de dimensionner l'équipe.

**Ordre de priorité des relevés** ❓ : d'abord les produits les plus cherchés sans prix (événement « recherche sans résultat », document 05, section 7), puis les lignes les plus anciennes (la requête K3, section 9, les repère).

---

## 5. Protocole de l'agent en boutique

### 5.1 Avant la visite
- Liste des boutiques du quartier et des modèles prioritaires.
- Téléphone chargé, connexion testée, brouillon de la veille envoyé.
- Modèle absent du catalogue : le noter et prévenir un modérateur ; ne pas le saisir sous un autre nom.

### 5.2 Accueil et accord ❓
- Se présenter, expliquer en une phrase le but (« relever les prix affichés pour un comparateur »), demander l'accord de photographier les étiquettes et les machines.
- **Ne jamais photographier** les personnes, les clients ni les documents de la boutique.
- Refus ou gêne : remercier, ne rien relever, le signaler au modérateur. Une boutique qui refuse n'est pas pénalisée.
- Le texte exact de l'accord (et la politique de confidentialité) relève d'une **relecture juridique** (document 07, décision 8).

### 5.3 Preuves selon l'état ❓

| État | Preuve conseillée | Imposé par le serveur ? |
|---|---|---|
| Neuf | Photo de l'étiquette de prix avec le produit | Au moins 1 photo 🛠 |
| Occasion ou reconditionné | Étiquette de prix **et** capture de l'écran de la machine montrant mémoire et stockage | ✅ Deux photos minimum, **imposées par la base** (D4, décidé le 4 octobre 2026) ; 🛠 patch à écrire (section 12, écart 5) |

### 5.4 Lire la configuration sur la machine 🔍
Les intitulés varient selon la version et la langue du système : à confirmer sur de vraies machines avant la formation des agents.

| Information | Windows | Mac |
|---|---|---|
| Mémoire installée | Paramètres > Système > Informations système (« Mémoire RAM installée ») ; Gestionnaire des tâches > Performance > Mémoire (emplacements utilisés, vitesse) | Menu Pomme > À propos de ce Mac |
| Processeur | Même écran « Informations système » | Même écran (puce) |
| Disque principal | Gestionnaire des tâches > Performance > Disque, ou Explorateur de fichiers > Ce PC | Informations système > Stockage |
| Batterie | Invite de commandes : `powercfg /batteryreport` produit un fichier HTML ; santé ≈ capacité à pleine charge ÷ capacité d'origine | Informations système > Alimentation (cycles, état) ; Réglages > Batterie (capacité maximale) |

La commande `wmic memorychip`, utilisée sur l'ancienne page `/agent`, est **obsolète** : elle est absente des versions récentes de Windows 11. Alternative en PowerShell : `Get-CimInstance Win32_PhysicalMemory`.

La machine n'est allumée **qu'avec l'accord de la boutique**. Si ce n'est pas possible, l'agent saisit la configuration annoncée sur l'étiquette et choisit « lue sur l'étiquette » dans le champ prévu à cet effet (D5, décidé le 4 octobre 2026) ; le modérateur la voit comme une configuration non vérifiée sur la machine.

### 5.5 Saisie
Les libellés et aides du formulaire sont dans le document 07, section 6. Points d'attention :

- **nombres** seulement (`16`, pas « 16 Go ») ; stockage = **disque principal** ;
- **prix demandé, sans négociation** ;
- une machine dans **deux configurations** (16 et 8 Go) = **deux relevés** ;
- garantie : réponse explicite obligatoire (D7, décidé le 4 octobre 2026) : « Aucune » (`0`), « X mois », ou « Non précisée par la boutique » (enregistrée comme inconnue) ; jamais laissée vide par oubli ;
- après l'envoi, lire le message : « publié » ou « envoyé pour vérification », et la raison technique en cas d'attente (document 07, section 6).

### 5.6 Après la tournée
Vérifier que rien ne reste en brouillon ; noter les boutiques fermées, déménagées ou nouvelles (demande d'ajout 🛠, document 05, section 2.3).

---

## 6. Modération

### 6.1 File et délais ❓
- Ordre : du plus ancien au plus récent (document 05, section 2.4).
- **Objectif** : relevé en attente traité sous **24 heures ouvrées**. Alerte interne à 48 heures (requête K1, section 9).
- Rejet : note obligatoire, neutre, qui dit quoi corriger (modèles : document 07, section 9).

### 6.2 Que faire selon le motif 🛠
Les codes viennent du patch « codes de motif » (exécuté sur la base de test 🧫).

| Code | Que vérifier | Publier si… | Rejeter si… |
|---|---|---|---|
| `ram_above_max` (impossible) | La photo de l'écran montre bien la mémoire annoncée ; la barrette peut être plus grande que la liste du constructeur | La preuve est claire. Faire ensuite **corriger la fiche produit** (maximum réel) | La photo ne montre pas la mémoire, ou la valeur est une faute de saisie |
| `ram_not_allowed` (suspect) | Combinaison de barrettes plausible (12, 20 ou 24 Go sont normaux sur certains modèles) ; faute de frappe | Combinaison plausible et prouvée | Valeur impossible, ou aucune preuve de configuration |
| `storage_not_allowed` (suspect) | Étiquetage différent d'une capacité normale (500 / 512, 1000 / 1024) ; disque principal ou total ? | Variante d'étiquetage ; compléter la liste de la fiche produit | Capacité fausse ou preuve absente |
| `price_low` (suspect) | Étiquette lisible ; promotion, déstockage, machine défectueuse ou autre configuration | Prix confirmé par la photo et cohérent avec l'état | Prix incohérent avec la photo, ou configuration différente de celle annoncée |
| Aucun code (relevé de boutique, phase 4) | Toujours modéré, même sans anomalie | Preuve lisible, produit et boutique corrects | Voir les notes de rejet |

Un relevé publié malgré une alerte apparaît avec le texte d'alerte et **n'est jamais présenté comme meilleur prix** (document 05, section 4.2).

### 6.3 Contrôle par échantillon des relevés publiés automatiquement ❓
Un relevé `ok` est publié sans regard humain. Pour détecter les preuves fabriquées ou la collusion agent-boutique (document 04, section 4), le modérateur **réexamine un échantillon** : proposition de départ **10 % des relevés publiés des 7 derniers jours**, à adapter selon l'historique de chaque agent (moins de contrôle pour un agent sans rejet, davantage pour un nouvel agent). Requête de tirage : section 9.

### 6.4 Fiches produit proposées par les boutiques ✅
Comparer avec la fiche constructeur, exiger une note en cas de rejet, enregistrer la source et la date de vérification dans la fiche (document 02, section 9 ; document 06, section 6). Un **second regard** est prévu pour les fiches du catalogue de départ.

### 6.5 Signalements ❓
1. **Classer** : faute de saisie, prix périmé, spécifications incohérentes, comportement de la boutique, abus manifeste.
2. **Délai cible** : 72 heures.
3. **Issues possibles** : classer sans suite ; demander à un agent de repasser ; rejeter un relevé ; proposer la suspension d'une boutique à l'admin.
4. **Jamais** d'identité du signalant, jamais de retour public nommant une boutique (document 05, section 4.6).
5. Le droit de réponse est ouvert **après la période de lancement** ✅ (document 05, section 4.7).

### 6.6 Demandes d'ajout de boutique 🛠
Vérifier l'existence de la boutique (appel au numéro donné ou visite d'un agent), éviter les doublons, créer en un geste ou refuser avec note (modèles : document 07, section 9.3). Seul le personnel crée une boutique ✅.

---

## 7. Badge « boutique vérifiée » ❓

Il s'obtient, il ne s'achète pas ✅. **Visite de vérification** par un agent :

- la boutique existe à l'adresse indiquée (photo de la façade) ;
- le nom correspond ; le numéro WhatsApp répond (appel de test) ;
- un responsable a été rencontré et accepte de figurer sur le site ;
- trois relevés consécutifs sont publiés **sans alerte**.

L'admin active ensuite `is_verified` (colonne réservée au personnel 🛠). **Validité proposée : 6 mois**, puis nouvelle visite ❓. Un signalement fondé fait retirer le badge le temps de l'examen.

---

## 8. Seuils de lancement ❓

Réponse proposée à la décision n°2 du document 04. À mesurer **par ville**, avec les requêtes de la section 9 :

| Critère | Seuil proposé |
|---|---|
| Portables couverts : au moins **3 boutiques** avec un prix `ok` en stock, état occasion | **10 modèles** |
| Boutiques actives avec au moins 5 prix affichés | 8 |
| Lignes affichées de moins de 21 jours | 80 % |
| File de modération | Plus ancien relevé en attente < 48 h, pendant 2 semaines de suite |
| Relevés de plus de 45 jours affichés | 0 (garanti par la vue 🛠) |

**Pourquoi 3 boutiques** : c'est le minimum pour que la règle de prix bas s'applique (section 2) et pour qu'une comparaison ait un sens.

**Ouverture par ville** ❓ : si Douala n'atteint pas les seuils à la date prévue, deux options : (a) retarder tout le lancement ; (b) ouvrir Yaoundé et afficher « Douala bientôt ». Le document 01 prévoit les deux villes au lancement ✅ ; l'option (b) est une exception à décider explicitement.

---

## 9. Indicateurs de suivi

Requêtes **en lecture seule** pour l'éditeur SQL de Supabase (rôle personnel). Elles ont été testées sur le schéma v1 (base locale de test) ; elles n'utilisent que des colonnes que les patchs « lancement » et « codes de motif » conservent dans `current_prices`.

**K1. File d'attente : volume et âge du plus ancien**
```sql
select count(*) as en_attente,
       round(extract(epoch from (now() - min(reported_at))) / 3600) as heures_plus_ancien
from public.price_reports
where status = 'pending';
```

**K2. Couverture : modèles avec au moins 3 boutiques, par ville et par état**
```sql
select c.name as ville, x.condition,
       count(*) filter (where x.boutiques >= 3) as produits_couverts,
       count(*) as produits_avec_prix
from (
  select cp.product_id, n.city_id, cp.condition, count(distinct cp.shop_id) as boutiques
  from public.current_prices cp
  join public.neighborhoods n on n.id = cp.neighborhood_id
  where cp.check_level = 'ok' and cp.in_stock
  group by cp.product_id, n.city_id, cp.condition
) x
join public.cities c on c.id = x.city_id
group by c.name, x.condition
order by c.name, x.condition;
```

**K3. Fraîcheur : âge médian et part des lignes de plus de 30 jours**
```sql
select round(percentile_cont(0.5) within group
         (order by extract(epoch from now() - reported_at) / 86400)::numeric, 1) as age_median_jours,
       round(100.0 * count(*) filter (where reported_at < now() - interval '30 days')
             / nullif(count(*), 0), 1) as pct_plus_30_jours
from public.current_prices;
```

**K4. Qualité par agent sur 30 jours**
```sql
select reported_by, count(*) as releves,
       count(*) filter (where status = 'rejected') as rejetes,
       count(*) filter (where check_level <> 'ok') as alertes
from public.price_reports
where reported_at > now() - interval '30 days'
group by reported_by;
```
> **Lecture depuis l'application** : K1 à K5 s'exécutent telles quelles dans l'éditeur SQL. Depuis l'application, lire `price_reports_visible` et non `price_reports`, dont les colonnes sensibles sont fermées par le patch contrat de données 🧫 (document 09, section 13, point 11) ; lecture depuis le site à vérifier avec une vraie requête.

La vue `agents_overview` du patch « agents » 🛠 ne donne que le total de relevés et la date du dernier : elle ne compte ni les rejets ni les alertes. K4 reste donc utile, et la vue sert à l'admin pour voir qui est actif (elle n'est lisible que depuis l'éditeur SQL).

**K5. Tirage de l'échantillon à contrôler (10 % des 7 derniers jours)**
```sql
select id, reported_by, product_id, shop_id, price_fcfa, reported_at
from public.price_reports
where status = 'published' and check_level = 'ok'
  and reported_at > now() - interval '7 days'
order by random()
limit greatest(1, ceil(0.10 * (
  select count(*) from public.price_reports
  where status = 'published' and check_level = 'ok'
    and reported_at > now() - interval '7 days'
))::int);
```

---

## 10. Plan de collecte avant l'ouverture ❓

Les durées sont indicatives.

| Étape | Contenu | Sortie |
|---|---|---|
| 1. Préparation | Catalogue de départ vérifié et activé (document 06) ; schéma et patchs exécutés sur la base de **test** ; protocole de la section 5 maîtrisé (agents formés s'il y en a) ; machines de test pour valider la section 5.4 | Agents capables de saisir un relevé complet |
| 2. Pilote à Mokolo | 1 semaine, un seul quartier ; MVP : le porteur du projet relève (si des agents sont recrutés : 2 agents) ; chaque relevé revu par un modérateur (**D19 ❓** : en solo, qui exerce ce second regard ?) | Mesures réelles : relevés par jour, taux d'alerte, taux de rejet, temps de saisie |
| 3. Ajustement | Corriger les fiches produit fausses, le formulaire, la formation ; refaire le calcul de la section 4 | Hypothèses remplacées par des mesures |
| 4. Collecte étendue | Tous les quartiers prévus à Yaoundé, puis Douala | Seuils de la section 8 suivis chaque semaine |
| 5. Répétition générale | Parcours acheteur testé sur téléphone, connexion lente ; sauvegardes actives ; pages de confiance en ligne (document 04, phase 1) | Go ou no-go sur les seuils |

---

## 11. Risques opérationnels ❓

| Risque | Réponse proposée |
|---|---|
| Preuve fabriquée ou prix arrangé avec la boutique | Contrôle par échantillon (6.3), suivi par agent (K4), rotation des tournées |
| Agent peu fiable | Retrait du rôle (effet immédiat), relecture de ses relevés récents |
| Boutique qui refuse ou se méfie | Script d'accueil (5.2), aucune pénalité, pas de relevé sans accord |
| Prix affiché ≠ prix payé | Le relevé note le prix **demandé** ; le texte public l'indique (document 07, section 10.5) |
| Fiche produit fausse : fausses alertes ou arnaques non vues | Vérification sur fiche constructeur et second regard (document 06) ; activation fiche par fiche |
| Photos contenant des données personnelles ou un lieu précis | Pas de photo de personnes ; retrait des métadonnées EXIF avant l'envoi (document 03, section 4.4) ; bucket privé 🛠 |
| Collecte qui s'essouffle | Indicateurs K3 et K4 relus chaque semaine ; relances sur les lignes de plus de 30 jours |

---

## 12. Écarts constatés dans les documents et les scripts

Relevés en lisant l'ensemble, puis en exécutant la chaîne complète sur une base locale de test (schéma v1, « agents », « propriétaire de boutique », « produits », « lancement », « adresse et horaires », « codes de motif », catalogue de départ). **Aucune erreur d'exécution dans l'ordre indiqué.** Les écarts 1 à 3 touchent des scripts que j'ai écrits.

| # | Constat | Conséquence | Statut |
|---|---|---|---|
| 1 | `config_hash` valait `md5(reported_specs::text)` : toute la configuration annoncée comptait. Le document 02, section 10, point 4 affirmait le contraire (« déjà corrigé »), ce qui était faux. Test : deux relevés identiques sauf la batterie restaient **deux lignes** dans `current_prices` | Doublons de lignes ; règle de prix bas rarement déclenchée | 🛠 Corrigé par `pcbuilder237_config_hash_patch.sql` : l'empreinte ne porte que sur `ram_gb`, `storage_gb` et `cpu`. Les relevés existants sont recalculés. Après le patch, les deux relevés de test n'occupent plus qu'une ligne (le plus récent). Point 4 du document 02 : exécuté sur la base de test 🧫, production à faire (lot P1-5) |
| 2 | Le processeur n'avait aucune clé définie dans `reported_specs` | Aucun contrôle possible | 🛠 La clé `cpu` est posée (texte, normalisé : « i5-8350U » et « I5 8350u » = même empreinte). Un relevé sans `cpu` forme un groupe à part. **Décidé le 4 octobre 2026 (D5)** : champ « configuration lue sur la machine / sur l'étiquette » dans le formulaire agent (P1-1) ; règle de contrôle (`cpu_options`, nouveau code de motif) après le pilote, seulement si les relevés montrent des écarts réels |
| 3 | **Défaut dans le patch « codes de motif » d'origine** : `v_codes := v_codes \|\| 'code'` échoue (« malformed array literal »). Je l'ai constaté sur les quatre règles. Conséquence : tout relevé qui devait passer en attente (RAM au-dessus du maximum, RAM ou stockage hors liste, prix bas) aurait été **refusé avec une erreur** au lieu d'arriver chez le modérateur | La file d'attente serait restée vide et les agents n'auraient pas compris leurs erreurs | 🛠 Corrigé aux quatre endroits (`array_append`) dans une version corrigée de `pcbuilder237_reason_codes_patch.sql` et, au cas où l'ancienne version serait déjà exécutée, dans le patch `config_hash`. Les deux chemins aboutissent à la même fonction. Vérifié : RAM 64 Go → `impossible` / `ram_above_max` ; 10 Go → `suspect` / `ram_not_allowed` ; disque 300 Go → `suspect` / `storage_not_allowed` ; prix à 60 000 FCFA face à trois relevés autour de 190 000 → `suspect` / `price_low`, tous **en attente** |
| 4 | Ordre des patchs | Voir la liste ci-dessous | ✅ Vérifié |
| 5 | Le serveur n'exige qu'**une** photo, même pour l'occasion et le reconditionné, alors que la section 5.3 en demande deux | La preuve de configuration repose sur la discipline de l'agent | ✅ Décision n°7 tranchée le 4 octobre 2026 (D4) : deux preuves imposées par la base ; 🛠 patch à écrire |

**Ordre d'exécution vérifié** : schéma v1 → agents → propriétaire de boutique → produits → lancement → adresse et horaires → codes de motif (corrigé, version du zip « 08 ») → `config_hash` → contrat de données (document 09, **toujours le dernier**). Le catalogue de départ s'exécute après le patch produits. Rejouer l'un des patchs « propriétaire », « produits » ou « lancement » remet d'anciennes versions de fonctions : rejouer ensuite « codes de motif » (qui s'arrête de lui-même s'il détecte une version inconnue), puis `config_hash`.

**Comportements des patchs « agents » et « propriétaire de boutique » vérifiés** : un propriétaire sans abonnement actif ne peut ni envoyer de relevé ni modifier sa fiche ; un propriétaire abonné envoie un relevé qui arrive **toujours en attente** avec l'origine « boutique », peut changer les horaires mais pas le nom ; il ne peut pas agir sur une autre boutique ; un compte sans rôle ni boutique est refusé ; un relevé d'agent sans anomalie est publié aussitôt ; le visiteur anonyme ne lit ni `shops.phone` ni `shops.address` directement, mais lit la vue `shops_public` (téléphone ouvert en période de lancement, adresse et horaires réservés aux boutiques abonnées).

**Limite de ces vérifications** : base locale PostgreSQL 16 avec des simulations de `auth` et `storage`. Les fonctions d'administration (`grant_agent`, `grant_shop_owner`, `record_subscription`) ont été appelées avec les droits du propriétaire de la base ; leur restriction d'exécution aux autres rôles n'a pas été testée, ni le comportement exact de Supabase Auth, du stockage ou de PostgREST. Refait sur le projet de test Supabase au lot P0-1 (🧫) ; les points restés 🔎 sont listés dans le document 09, section 14.

---

## 13. Décisions à trancher

| # | Question | Statut |
|---|---|---|
| 1 | Qui relève les prix à Yaoundé et à Douala (document 01, question 1) | ✅ Le porteur du projet, Yaoundé puis Douala (MVP) |
| 2 | Rémunération : forfait par tournée avec contrôle par échantillon (proposé) | ❓ sans objet tant que le porteur relève lui-même ; à reprendre si des agents sont recrutés |
| 3 | Qui modère, avec quel délai (24 h ouvrées proposé) | ✅ Le porteur du projet ; ❓ délai (24 h ouvrées proposé) |
| 4 | Seuils de lancement de la section 8 | ❓ |
| 5 | Si Douala est en retard : retarder tout ou ouvrir Yaoundé seul | ❓ |
| 6 | Taux du contrôle par échantillon (10 % proposé) | ❓ |
| 7 | Deux preuves obligatoires côté serveur pour l'occasion et le reconditionné | ✅ D4, 4 octobre 2026 (patch à écrire) |
| 8 | Durée de validité du badge « vérifiée » (6 mois proposé) | ❓ |
| 9 | Texte de l'accord des boutiques pour photographier les prix, relu par un juriste | ❓ |
| 10 | Processeur (D5, 4 octobre 2026) en deux temps : **maintenant**, champ « configuration lue sur la machine / sur l'étiquette » dans le formulaire agent (P1-1), emplacement (`reported_specs` ou colonne) à fixer à l'écart 2 ; **après le pilote**, règle de contrôle (`cpu_options`, nouveau code de motif, nouveau texte au document 07) si les relevés montrent des écarts réels | ✅ (champ) / ❓ (règle) |

---

## 14. Suite proposée

Voir `00-ROADMAP-MAITRE.md` (sections 4 et 7). La chaîne de 9 scripts est exécutée sur la base de test (P0-1 ✅) ; le document 09 est en v0.4. D3 ✅ confirmée ; prochaines étapes : P0-4 (socle du site), puis le pilote de collecte (lots P1-1 et P1-2).
