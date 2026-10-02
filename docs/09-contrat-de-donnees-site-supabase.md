# Contrat de données site ↔ Supabase — PC Builder 237

> **Statut** : brouillon v0.3 — 2 octobre 2026 (schéma v1 et tous les patchs relus ; patch « contrat de données » écrit et testé sur PostgreSQL local, pas sur Supabase)
> **Légende** : ✅ décidé par le porteur du projet · 🛠 lu dans le schéma v1, un patch ou un document reçu · 🧪 écrit dans `pcbuilder237_data_contract_patch.sql` et vérifié sur une base PostgreSQL locale (pas encore sur Supabase) · 🔎 reste à vérifier sur Supabase · ❓ proposition à valider

Ce document dit, **page par page**, ce que le site lit dans Supabase, ce qu'il y écrit, avec quel client, et ce qu'il fait quand ça échoue. Il prolonge le document 03 (architecture : « la base est la source de vérité »), le document 05 (pages), le document 07 (textes et codes d'erreur) et le document 08 (modération). Il sert de référence à tout développeur, humain ou IA, qui écrit le code du site.

---

## 1. Ce qui a servi de source

**Lus** : documents 01 à 08 (dernières versions), `pcbuilder237_schema.sql` (v1), et les patchs « agents », « propriétaire de boutique », « produits », « lancement », « adresse et horaires », « codes de motif » (version corrigée), `config_hash`, le catalogue de départ, ainsi que `pcbuilder237_data_contract_patch.sql`, écrit à partir de la version 0.2 de ce document. **Tous les fichiers sont désormais disponibles** : les noms de tables, colonnes, politiques et fonctions de ce document sont relus dans ces fichiers (🛠).

**Reste 🔎**, parce qu'aucun fichier ne peut le dire :

- le comportement réel de Supabase : code `PB…` présent dans `error.code`, relecture d'une ligne juste après une insertion, limites des connexions anonymes, filtre sur une clé JSON d'une vue ;
- les noms des contraintes `CHECK` sans nom explicite (noms par défaut de PostgreSQL, par exemple `price_reports_price_fcfa_check`) ;
- le résultat de la chaîne de patchs sur Supabase.

**Rien n'a été exécuté sur Supabase.** Les patchs « adresse et horaires », « codes de motif » et `config_hash` n'ont pas non plus été exécutés (le premier jamais, les deux autres seulement sur une base PostgreSQL locale). **Depuis la v0.3**, la chaîne complète (schéma, agents, propriétaire, produits, lancement, adresse et horaires, codes de motif corrigé, `config_hash`, contrat de données) s'exécute sans erreur sur PostgreSQL 16 local, avec des simulations de `auth` et `storage` et des rôles simulés (`anon`, agent, propriétaire, personnel, connexion anonyme). Le patch « contrat de données » se rejoue sans erreur. Aucun de ces tests ne remplace Supabase.

**Ce que la relecture du schéma a changé** : trois problèmes de sécurité absents de la version 0.1 (R1 élargi, R10, R11, section 11), des chemins de photos différents (section 6.6), et la fin des points 🔎 sur les signalements, les configurations et la modération.

**Ce que la v0.3 a changé** : le patch « contrat de données » traite C1, C2, C3, C5, C8 et C9 (🧪) ; `check_reason` disparaît de `current_prices` ; `price_reports` n'est plus lisible en entier par personne (nouvelle vue `price_reports_visible` pour les auteurs, les propriétaires de boutique et le personnel) ; `city_id` et `config_hash` sont dans les vues ; un relevé a une clé d'idempotence (`client_ref`) ; le rejet d'un relevé exige une note (`PB032`) ; un signalement naît toujours `open`. Les décisions n°1, 2, 6 et 11 y sont **retenues par défaut**, en attente de confirmation (section 15).

---

## 2. Principes

1. ✅ **La base décide, le site affiche** (document 03). Le site n'envoie jamais un statut, un niveau de contrôle, une origine, un auteur ou une date : le serveur les fixe (section 7).
2. **Jamais de `select *`.** Sur `shops`, il échoue depuis le patch lancement 🛠 ; sur `price_reports`, après le patch contrat de données 🧪. Ailleurs, il exposerait des colonnes inutiles. Chaque lecture liste ses colonnes.
3. **Les pages publiques lisent avec le client `anon`, sans session** (section 3). Le contenu de certaines colonnes dépend de la personne connectée.
4. **Les calculs partent de `current_prices`**, jamais de relevés bruts (document 03, section 6.3).
5. **Le message d'erreur se choisit d'après un code**, jamais d'après le texte renvoyé (document 07, section 7.2 ✅).
6. **L'alerte d'incohérence se choisit d'après `check_codes`**, jamais d'après `check_reason` (document 07, section 4.4 ✅).
7. **Une page ne lit qu'une page de résultats à la fois.** L'API plafonne une réponse (1 000 lignes par défaut sur Supabase, réglable) : toute liste est paginée avec `.range()`.

---

## 3. Clients Supabase et clés

| Client | Clé | Session | Utilisé par |
|---|---|---|---|
| **Public serveur** | clé publique (`anon`) | **aucune** (pas de cookies) | pages publiques rendues côté serveur : `/`, `/produits`, `/produits/[id]`, `/boutiques/[id]`, `/builder/[slug]` |
| **Navigateur** | clé publique | session de l'utilisateur | formulaires et écrans interactifs (agent, boutique, admin, signalement) |
| **Serveur avec session** | clé publique | cookies de l'utilisateur | protection des routes `/agent`, `/boutique`, `/admin` (vérification avec `getUser()`, pas avec `getSession()`) |
| ~~`service_role`~~ | — | — | **non utilisée en v1** ✅ (document 03, section 2) |

**Pourquoi le client public n'a pas de session.** Le numéro de téléphone, l'adresse et les horaires dépendent de la personne qui lit (`shop_visible_phone`, `shop_visible_address`, `shop_visible_hours` 🛠 : personnel, agent, propriétaire lié, ou public selon la règle). Une page publique mise en cache, générée une fois avec la session d'un modérateur, montrerait à tous ce que seul le personnel doit voir. Règle : **toute page susceptible d'être mise en cache est générée par le client public sans cookies**. Les écrans qui ont besoin des données « riches » (l'agent qui lit l'adresse d'une boutique) sont rendus sans cache, avec la session.

**Variables d'environnement** ❓ : l'URL du projet et la clé publique, côté front ; aucune clé secrète dans le dépôt ni dans une variable `NEXT_PUBLIC_*` (document 03, section 10).

**Ville** ❓ : le choix de ville (document 05, section 4.4) est mémorisé dans un cookie, mais **la ville fait partie de l'adresse de la page** (`?ville=yaounde`). Sinon une page en cache ne pourrait pas varier selon la ville, et un lien partagé sur WhatsApp ouvrirait la mauvaise ville. Le cookie ne sert qu'à pré-remplir.

### Connaître le rôle de la personne connectée 🛠

- **Rôles stockés** : `user_roles`, valeurs `admin`, `moderator`, `agent`. Chacun lit **ses propres lignes** (`roles_read`) : un `select role from user_roles` sans filtre suffit à choisir l'espace à afficher.
- **Propriétaire de boutique** : rôle calculé, jamais stocké. `rpc('has_active_shop')`, ou lecture de ses lignes de `shop_members` et `shop_subscriptions`.
- **Fonctions appelables par l'application** (paramètres avec un trait bas initial) : `has_role(_role)`, `is_staff()`, `is_shop_owner(_shop)`, `has_active_shop()`. Droits d'exécution par défaut, jamais retirés dans les patchs 🔎. Elles servent à **adapter l'interface** ; la protection réelle reste la RLS.
- **Une connexion anonyme Supabase a le rôle de base `authenticated`** : elle n'a aucun rôle ni boutique, mais passe toutes les politiques « utilisateur connecté » (signalements, configurations). Ne jamais lire `authenticated` comme « compte identifié » ; tester `user.is_anonymous`.

---

## 4. Objets lus par le site

### 4.1 `current_prices` (vue) 🛠

Une ligne par **(produit, boutique, état, configuration)** : le dernier relevé **publié** de moins de **45 jours**. Colonnes, dans l'ordre de la vue (patch `reason_codes`, puis patch contrat de données 🧪 : `check_reason` retiré, `city_id` et `config_hash` ajoutés à la fin) :

| Colonne | Type | Usage côté site |
|---|---|---|
| `report_id` | uuid | clé de liste ; cible d'un signalement |
| `product_id`, `shop_id` | uuid | liens `/produits/[id]`, `/boutiques/[id]` |
| `condition` | `new`, `refurbished`, `used` | libellé (document 07, 3.1) ; filtre |
| `price_fcfa` | nombre | prix ; tri ; meilleur prix |
| `in_stock` | booléen | ligne grisée si faux ; hors calcul du meilleur prix |
| `warranty_months` | nombre ou `null` | `null` = « non précisée », `0` = « aucune » (document 07, 3.3) |
| `reported_specs` | json | configuration annoncée : `ram_gb`, `storage_gb`, `cpu`, `battery_health_pct` |
| `check_level` | `ok`, `suspect`, `impossible` | `ok` : rien ; sinon alerte (le public ne voit pas la différence) |
| `reported_at` | date-heure | « il y a N jours » ; date complète au toucher |
| `category`, `brand`, `product_name`, `product_specs` | | nom et caractéristiques du modèle |
| `shop_name`, `neighborhood_id`, `shop_verified` | | boutique, quartier, badge |
| `shop_phone` | texte ou `null` | numéro, seulement si visible (section 5.3) |
| `source` | `agent`, `shop` | « Constaté par un agent » / « Déclaré par la boutique » |
| `shop_subscribed`, `shop_contactable` | booléens | affichage des informations limitées ; bouton WhatsApp |
| `check_codes` | liste de textes | codes de motif : `ram_above_max`, `ram_not_allowed`, `storage_not_allowed`, `price_low` ; vide si `ok` |
| `city_id` | uuid ou `null` | filtre par ville (🧪, C1) ; `null` si la boutique n'a pas de quartier |
| `config_hash` | texte | empreinte de configuration (🧪, C2) : regroupe les lignes d'une même configuration ; **jamais affichée** |

**Ce que la vue ne contient pas, et que le site doit contourner :**

- **Pas de ville ni d'empreinte avant le patch contrat de données.** Après lui (🧪), `city_id` et `config_hash` sont dans la vue : le site n'a plus à passer par les quartiers (section 5.1) ni à normaliser le processeur lui-même.
- **Plus de `check_reason`** (🧪, C3). Le motif en français reste lisible par l'auteur du relevé et par le personnel dans `price_reports_visible` (section 4.6). Avant l'exécution du patch sur Supabase, la colonne existe encore dans la vue (R1) : le site ne la demande jamais.
- **Pas de nom de quartier.** Table de correspondance chargée depuis `neighborhoods`.
- **Pas de preuves** (`proof_paths`) ni d'auteur dans la vue. Depuis C3 🧪, la **table** `price_reports` ne les laisse plus lire à `anon` ni à `authenticated` : seule la vue `price_reports_visible` les donne, à ses ayants droit (R10).

**La vue dépend de qui l'interroge** 🛠 (`security_invoker`) : les politiques de `shops` et de `products` s'appliquent à la jointure. Pour le public, les prix d'une **boutique suspendue** ou d'un **produit inactif** disparaissent ; pour le personnel, ils apparaissent. Toute page publique, et tout écran du personnel qui montre « ce que voit le public », lit donc avec le client public.

**Un nouveau relevé en attente ne remplace pas l'ancien prix** : la vue prend le dernier relevé **publié**. Le prix d'une boutique ne change à l'écran que lorsqu'un nouveau relevé est publié (immédiatement pour un agent sans alerte, après un modérateur sinon). Un relevé « hors stock » publié remplace l'ancien, lui.

Un relevé `suspect` ou `impossible` n'est visible du public que **si un modérateur l'a publié** après examen (document 05, 4.2) : une ligne avec `check_level` différent de `ok` est donc normale et s'affiche avec l'alerte.

### 4.2 `shops_public` (vue) 🛠

Colonnes : `id`, `name`, `neighborhood_id`, `address`, `status`, `is_verified`, `offers_assembly`, `assembly_fee_fcfa`, `opening_hours`, `created_at`, `phone`, `contactable`, `subscribed`, et, depuis le patch contrat de données (🧪, C1), `city_id` en dernière colonne (`null` si la boutique n'a pas de quartier).

- `address` et `opening_hours` : donnés au public **seulement si la boutique est abonnée** (patch `hide_address` 🛠, non exécuté) ; toujours au personnel, aux agents et aux propriétaires liés. `NULL` veut dire « non visible » **ou** « non renseigné ». Le site distingue les deux avec `subscribed` : `subscribed = false` et valeur `NULL` → « Adresse et horaires réservés aux boutiques abonnées » ; `subscribed = true` et `NULL` → champ non renseigné.
- `phone` : voir section 5.3. `NULL` ne veut pas dire « boutique sans téléphone ».
- Une boutique suspendue est absente pour le public 🔎 (le patch lancement l'affirme, la politique de lecture de `shops` n'a pas été relue).
- Le montage (`offers_assembly`, `assembly_fee_fcfa`) reste public (patch `hide_address`).

### 4.3 `products` (table) 🛠

Lecture publique : fiches **actives** seulement (`products_read`). Colonnes de la table : `id`, `category`, `brand`, `name`, `specs`, `is_active`, `created_by`, `created_at`, `status`, `reviewed_by`, `reviewed_at`, `review_note`. Le site demande seulement `id`, `category`, `brand`, `name`, `specs`, jamais les colonnes d'audit (R6, confirmé : la ligne entière est lisible par `anon`).

Clés de `specs` lues par le site : `max_ram_gb`, `allowed_ram_gb`, `allowed_storage_gb` (alerte), et, si présentes, `ram_type`, `ram_slots`, `ram_soldered_gb`, `cpu_options`, `source_url`, `verified_on` (informatives, document 06, section 2.1). Une clé absente n'est jamais une erreur : l'écran s'en passe.

### 4.4 Géographie 🛠

`countries` (`id`, `name`), `cities` (`id`, `country_id`, `name`), `neighborhoods` (`id`, `city_id`, `name`). Lecture publique, écriture réservée à l'admin. Données quasi statiques : chargées une fois par page, cache long (section 9).

### 4.5 `launch_settings` (table) 🛠

Une ligne, colonne `contact_open_until` (date ou `NULL`). Lecture publique. Le site s'en sert pour afficher « contact ouvert jusqu'au … » ; il **ne recalcule pas** l'ouverture du contact : il lit `contactable` / `shop_contactable`, que la base calcule avec `today_douala()`.

### 4.6 Tables privées lues avec une session

| Objet | Qui | Colonnes utiles | Statut |
|---|---|---|---|
| `price_reports` (table) | tout le monde, **colonnes ouvertes seulement** (🧪, C3) | `id`, `product_id`, `shop_id`, `condition`, `price_fcfa`, `in_stock`, `warranty_months`, `reported_specs`, `config_hash`, `check_level`, `check_codes`, `status`, `source`, `reported_at`. Toute autre colonne, et `select *`, répondent `42501`. Une colonne ajoutée plus tard reste fermée jusqu'à un `grant select (colonne)` | 🧪 (avant le patch : lecture complète des relevés publiés par tous, R10) |
| `price_reports_visible` (vue) | auteur du relevé ; propriétaire de la boutique (abonnement actif) ; personnel. Une connexion anonyme Supabase n'a **aucune ligne** | `id`, `product_id`, `shop_id`, `condition`, `price_fcfa`, `in_stock`, `warranty_months`, `reported_specs`, `config_hash`, `proof_paths`, `check_level`, `check_reason`, `check_codes`, `status`, `source`, `reported_by`, `reported_at`, `reviewed_by`, `reviewed_at`, `review_note`, `client_ref`. `check_reason` n'est rempli que pour le personnel et pour l'auteur du relevé (il contient la médiane des prix pour `price_low`) | 🧪 |
| `shop_requests` | auteur, personnel | `id`, `name`, `neighborhood_id`, `address`, `phone`, `note`, `status`, `shop_id`, `handled_note`, `created_at` | 🛠 |
| `products` (ses fiches) | propriétaire | + `status`, `review_note` | 🛠 (`products_owner_read`) |
| `products_to_review` (vue) | personnel | `id`, `category`, `brand`, `name`, `specs`, `created_at`, `created_by`, `proposer_shops` | 🛠 |
| `shop_members` | ses lignes ; personnel | `shop_id`, `granted_at` | 🛠 |
| `shop_subscriptions` | membres de la boutique ; personnel | `shop_id`, `starts_on`, `ends_on`, `cancelled_at` ; `amount_fcfa`, `payment_method`, `payment_ref` jamais affichés au public | 🛠 |
| `profiles` | soi-même ; personnel | `id`, `display_name`, `phone` (le personnel y lit le nom d'un agent) | 🛠 |
| `flags` | **personnel seulement** (un visiteur écrit, mais ne relit pas) | `id`, `shop_id`, `report_id`, `reason`, `status`, `created_by`, `created_at` | 🛠 |
| `agents_overview` (vue) | **éditeur SQL seulement** | — | 🛠 : **non lisible par l'application** (document 08, section 9) |

---

## 5. Règles de calcul côté site

Fonctions pures, testées (Vitest, document 03, section 6.3), sans accès à la base.

### 5.1 Filtrer par ville

Après le patch contrat de données 🧪, `current_prices` et `shops_public` ont `city_id` : **une seule requête**, `.eq('city_id', <ville>)`. Une boutique sans quartier a `city_id` nul et ne ressort dans aucun filtre de ville. Tant que le patch n'est pas exécuté, méthode de repli :

1. lire les `id` des quartiers de la ville : `neighborhoods` où `city_id` = la ville ;
2. lire `current_prices` avec `.in('neighborhood_id', <ces id>)`.

Deux requêtes, sans jointure : PostgREST ne sait pas relier de façon fiable une vue construite avec `distinct on` à une table.

### 5.2 Meilleur prix et ordre d'affichage

D'après le document 02, section 3, et le document 05, sections 3.2 et 3.3 :

- **Éligible au meilleur prix** : `check_level = 'ok'` **et** `in_stock`. Au sein d'un même état (et d'une même configuration sur la fiche produit).
- **Ordre sur la fiche produit** : en stock par prix croissant (relevés avec alerte compris, **sans** étiquette « meilleur prix »), puis hors stock grisés. L'abonnement n'entre jamais dans le tri ✅.
- **« À partir de X FCFA »** sur une carte : le meilleur prix éligible de l'état filtré. Sans ligne éligible, la carte n'affiche pas de prix de départ (texte à écrire, décision n°9).
- **Configuration de base** : les `specs` n'ont pas de configuration de base, donc « afficher si elle diffère du modèle » (document 05, 4.1) n'est pas calculable. Proposition ❓ : afficher `ram_gb` et `storage_gb` sur toute ligne de portable.

### 5.3 Contact et lien WhatsApp

- Le bouton apparaît si `shop_contactable` (ou `contactable`) est vrai **et** que `shop_phone` (ou `phone`) n'est pas `NULL`. Le site ne teste jamais la date de fin de la période de lancement lui-même.
- Le numéro est stocké `+237XXXXXXXXX` 🛠 ; le lien `https://wa.me/237XXXXXXXXX?text=…` s'écrit **sans le `+`**, avec le texte encodé (`encodeURIComponent`).
- Message : clé `whatsapp.single_product` de `fr.json` (document 07, 5.2), variables nommées, prix avec espace simple, date au format jour/mois.
- Boutique non contactable (après le lancement, non abonnée) : nom et quartier, pas de bouton ✅.
- Devis du builder vers le contact du porteur du projet : numéro à fournir (document 05, section 10, point 2) ❓.

### 5.4 Dates

`reported_at` est l'heure du serveur. Le site affiche « aujourd'hui », « hier », « il y a N jours » dans le fuseau **Africa/Douala** (`Intl.RelativeTimeFormat` en `fr`), avec la date complète au toucher (document 07, section 2). La limite de 45 jours est appliquée par la vue ; le site ne la recalcule pas. 🛠 **L'âge court depuis l'envoi, pas depuis la publication** : `reported_at` est fixé à l'insertion et ne bouge pas quand un modérateur publie. Un relevé resté 10 jours dans la file n'a plus que 35 jours d'affichage (indicateur K1, document 08).

### 5.5 Alerte d'incohérence

1. Si `check_level = 'ok'` : aucune alerte.
2. Sinon, un paragraphe par code de `check_codes`, texte dans `fr.json` (`alert.reason.<code>`), avec les nombres tirés de `reported_specs.ram_gb` et `product_specs.max_ram_gb`.
3. `check_codes` vide avec `check_level` différent de `ok` (relevés d'avant le patch des codes) : alerte générale, sans motif.
4. Jamais « arnaque », jamais la boutique désignée comme fautive (document 05, section 1.5). Pas de badge « vérifiée » ni « meilleur prix » sur la même ligne.

---

## 6. Pages, une par une

### 6.1 Accueil `/`
- **Client** : public serveur.
- **Lit** : villes (`cities`) ; portables « en vedette » = les portables de la ville avec le plus de boutiques, calculés depuis `current_prices` (catégorie `laptop`, ville, `check_level = 'ok'`, en stock) ; `launch_settings` pour le bandeau de contact.
- **Écrit** : rien.
- **Cache** : 10 minutes (section 9).
- **États** : aucune vedette → catégories ; erreur → message avec « Réessayer » (document 07, 7.1).
- **Attention** : au volume du pilote (quelques dizaines de modèles), le calcul côté site suffit. Au-delà d'environ un millier de lignes de prix, passer à une vue agrégée (C4).

### 6.2 Liste `/produits`
- **Client** : public serveur ; filtres dans l'adresse (`?ville=&etat=&marque=&quartier=&min=&max=&ram=&stockage=&q=`).
- **Lit** : (1) `products` actifs filtrés par catégorie, marque, texte ; (2) `current_prices` pour ces produits, la ville, l'état, la fourchette de prix ; (3) agrégation par produit côté site, puis pagination par produit.
- **Filtres RAM et stockage** : sur `reported_specs->>ram_gb` et `->>storage_gb` (comparaison de texte, `.eq('reported_specs->>ram_gb', '16')`) 🔎 à tester sur une vue.
- **Recherche texte** : `ilike` sur `name` et `brand`. Échapper `%` et `_` dans la saisie ; si la requête passe par `.or(...)`, échapper aussi `,`, `(`, `)` et `*` (risque R4). La recherche ne ignore pas les accents ❓.
- **Tri** : prix de départ croissant par défaut.
- **États** : « Aucun produit ne correspond à « {texte} » » (document 07, 7.1) ; événement « recherche sans résultat » (section 6.12).

### 6.3 Fiche produit `/produits/[id]`
- **Client** : public serveur.
- **Lit** : `products` (une fiche, active) ; `current_prices` où `product_id` = la fiche, filtré par ville et état ; `neighborhoods` pour les noms.
- **Fiche introuvable** : identifiant mal formé (erreur `22P02`), fiche inactive, en attente ou refusée (aucune ligne) → page « introuvable », jamais une erreur technique. Utiliser `.maybeSingle()`.
- **Affichage** : une ligne par relevé (composant « ligne de prix », document 05, 4.1) dans l'ordre de la section 5.2.
- **Données structurées** : `AggregateOffer` avec `lowPrice` et `highPrice` sur les lignes éligibles, `offerCount` = nombre de boutiques distinctes, `priceCurrency` = `XAF` ❓ (document 03, section 9).
- **Écrit** : signalement (section 6.11).
- **Aucune ligne** : « Aucun prix récent pour ce produit dans cette ville… » (document 05, 3.3).

### 6.4 Fiche boutique `/boutiques/[id]`
- **Client** : public serveur.
- **Lit** : `shops_public` (une ligne) ; `current_prices` où `shop_id` = la boutique.
- **Affichage** : tableau du document 05, 3.4. Adresse et horaires : règle de la section 4.2. Bouton WhatsApp : section 5.3.
- **Boutique absente de `shops_public`** (suspendue ou inconnue) : « introuvable ».
- **Statistiques publiques** : aucune source de données ; question ouverte (document 05, 3.4).

### 6.5 Builder `/builder` et `/builder/[slug]` (phase 3)
Contrat de la **sauvegarde et du partage** 🛠 ; les `specs` des composants (phase 2) et les règles de compatibilité restent à définir.

- `builds` : `id`, `owner_id` (la personne connectée), `name` (défaut « Ma configuration »), `is_public` (défaut **faux**), `share_slug` (10 caractères générés, unique), `created_at`.
- `build_items` : `build_id`, `product_id`, `quantity` (1 à 8), `accepted_conditions` (liste d'états, les trois par défaut). **Un produit n'apparaît qu'une fois par configuration** (`build_items_unique`) : deux exemplaires = `quantity` 2. Aucun prix n'est stocké.
- **Lecture de `/builder/[slug]`** : client public ; `builds` où `share_slug` = le slug, puis `build_items`. Cela ne fonctionne **que si `is_public` est vrai** (sinon aucune ligne : « introuvable »). Le bouton « Partager » met donc `is_public` à vrai avant d'afficher le lien.
- **Écriture** : il faut une session, **connexion anonyme comprise** (à activer dans le tableau de bord, R12). Sans session, `anon` n'écrit nulle part. Qui efface les données de son navigateur perd ses configurations anonymes : le dire (« Créez un compte pour les conserver »).
- Prix et totaux sont **recalculés à chaque lecture** depuis `current_prices` (document 03, 6.3).
- Un produit devenu inactif n'est plus lisible : prévoir la ligne « produit indisponible ».
- `owner_id` d'une configuration publique est lisible par tous : ne pas le demander.

### 6.6 Espace agent `/agent`
- **Client** : navigateur avec session ; route protégée côté serveur (`getUser()` + rôle agent).
- **Connexion** : email + code agent comme mot de passe (`signInWithPassword`) ✅. Rôle lu dans `user_roles` (ses lignes, section 3) 🛠.
- **Lit** : `shops_public` filtré par quartier et `status = 'active'` (l'agent reçoit l'adresse, patch `hide_address`) ; `products` actifs ; ses relevés (`price_reports_visible` 🧪 : il y voit aussi `check_reason`, `proof_paths` et `review_note` de ses propres relevés) ; ses demandes (`shop_requests`).
- **Écrit, dans cet ordre** :
  1. photos → Storage, bucket **`proofs`**, objet `<uid>/<horodatage>/<fichier>.jpg` (convention du schéma ; bucket privé, 5 Mo, JPEG, PNG ou WebP). La valeur à mettre dans `proof_paths` est ce chemin **sans** le nom du bucket ; le déclencheur exige qu'il commence par `<uid>/` (`PB003` sinon). Un nom unique par photo : **pas de remplacement** (`upsert` refusé, aucune politique de mise à jour) et **pas de suppression par l'agent** (réservée au personnel). Si l'insertion échoue après l'envoi, les photos restent orphelines : le brouillon garde donc les chemins déjà envoyés et les réutilise au renvoi, sans renvoyer les fichiers ;
  2. relevé → insertion dans `price_reports` (champs de la section 7), `proof_paths` = les chemins des photos déjà envoyées, `client_ref` = un uuid généré à l'ouverture du formulaire et conservé dans le brouillon (🧪, C5) ;
  3. relecture de la ligne créée : `insert(...).select('id,status,check_level,check_codes')`, qui ne demande que des **colonnes ouvertes** (🧪 : un `.select()` complet échoue en `42501` après C3). Le motif technique `check_reason` se relit ensuite dans `price_reports_visible`, où l'auteur le voit : « Il est visible par les acheteurs » ou « Il sera examiné par un modérateur » avec la raison (document 07, section 6 ; décision n°7). Le propriétaire de boutique relit les siens par la même vue.
- **Demande d'ajout de boutique** : insertion dans `shop_requests` (`name`, `neighborhood_id`, `address`, `phone`, `note`). Plafond de 10 demandes ouvertes (`PB020`). Suivi de l'état par relecture.
- **Photos** : réduites (moins de 1 Mo conseillé), **métadonnées EXIF retirées** avant l'envoi (un ré-encodage par canevas les supprime) ; deux photos exigées par le formulaire pour l'occasion et le reconditionné, alors que le serveur n'en exige qu'une (document 08, écart 5 ; décision à prendre).
- **Brouillon et reprise** ❓ : formulaire conservé dans le stockage du navigateur, avec les chemins de photos déjà envoyés et le `client_ref`. Après une coupure, le site renvoie **le même `client_ref`** : si l'insertion avait abouti, la base répond `23505` sur `price_reports_client_ref_key` (🧪, C5), que le site lit comme « déjà envoyé ». Avant l'exécution du patch (pas de clé d'idempotence 🛠) : chercher parmi ses relevés des 10 dernières minutes un relevé identique (produit, boutique, état, prix) et ne pas renvoyer.
- **Session expirée** : reconnexion sans perdre le brouillon (document 07, 7.1).
- **Patch « agents »** : il ne produit aucune erreur visible de l'application (`grant_agent` et `revoke_agent` ne s'exécutent que dans l'éditeur SQL). Le trou signalé au document 07, section 7.2, ne concerne donc pas les agents.

### 6.7 Espace boutique `/boutique`
- **Client** : navigateur avec session ; route protégée côté serveur.
- **Rôle** : calculé, pas stocké 🛠 (`is_shop_owner`, abonnement actif). À l'expiration, le rôle s'éteint tout seul ; l'écran affiche les données en lecture seule et le message de renouvellement (document 05, 2.5).
- **Lit** : boutiques liées (`shop_members`) ; `shops_public` de ces boutiques (le propriétaire voit adresse et horaires même sans abonnement) ; abonnement (`shop_subscriptions` : `starts_on`, `ends_on`, `cancelled_at`) ; ses relevés (`price_reports_visible` 🧪 : ceux de ses boutiques ; `check_reason` masqué pour ceux qu'il n'a pas envoyés lui-même) ; ses fiches produit (`products` où `created_by` = lui : `status`, `review_note`).
- **Écrit** :
  - `shops` : mise à jour de `phone`, `address`, `opening_hours` et des champs de montage, **sans** `returning` et sans envoyer le nom, le quartier, le statut ni le badge (`PB031`) ;
  - `price_reports` : même insertion que l'agent (`client_ref` compris) ; la base force `source = 'shop'` et `status = 'pending'` ;
  - `products` : insertion (`category`, `brand`, `name`, `specs`) ; la fiche naît en attente et inactive ; plafonds : 4 000 caractères de `specs` (`PB011`), 20 fiches en attente (`PB012`) ; correction seulement tant qu'elle est en attente (`PB013` ensuite).
- **Statistiques** (vues, contacts) : aucune table n'existe (section 6.12).
- **Abonnement expiré** : le site masque les formulaires, mais **la base reste l'autorité** : une écriture tentée reçoit `42501` ou `PB030`.

### 6.8 Administration `/admin`
- **Client** : navigateur avec session de personnel ; routes protégées côté serveur ; interface selon le rôle (modérateur : modération et boutiques ; admin : tout) ✅.
- **File des relevés** : `price_reports_visible` 🧪 où `status = 'pending'`, du plus ancien au plus récent, avec le produit, la boutique, l'auteur (`reported_by` ; nom dans `profiles.display_name`, lisible par le personnel), `check_codes`, `check_reason` et les preuves. Preuves : `createSignedUrl(chemin, durée courte)` (quelques minutes), jamais d'URL publique.
- **Historique d'un agent** : requête sur `price_reports_visible` 🧪 (comme la requête K4 du document 08, à adapter si elle passe par l'application), **pas** `agents_overview`, qui n'est lisible que depuis l'éditeur SQL.
- **Décision sur un relevé** : mise à jour de `status` (`published` ou `rejected`) et de `review_note` (obligatoire au rejet, document 02) ; auteur et date de décision fixés par le serveur à chaque changement de statut (`price_reports_before_update`) 🛠. **La base exige la note de rejet** (`PB032`, 🧪 C8, comme pour les fiches produit et les demandes de boutique) ; l'interface l'impose aussi. Un modérateur met à jour `price_reports` **sans `.select()` complet** (droits de colonne) et relit par `price_reports_visible`. Le personnel peut aussi modifier d'autres colonnes d'un relevé (`reports_staff_update`) : « un relevé n'est jamais modifié » est une règle du site pour lui, pas une contrainte de la base.
- **Fiches produit** : lecture de `products_to_review` ; mise à jour de `status` en `approved` ou `rejected` (+ `review_note`, `PB010` sinon) ; le serveur fixe `is_active`, `reviewed_by`, `reviewed_at` 🛠.
- **Demandes de boutique** : refus = mise à jour `status = 'rejected'` + `handled_note` (`PB022` sinon) ; création = appel de la fonction `create_shop_from_request` avec le paramètre `_request` (renvoie l'identifiant de la boutique ; `PB023`, `PB024`, `PB025`) 🛠.
- **Signalements** : lecture et mise à jour du statut (`open`, `reviewed`, `dismissed`) 🛠.
- **Boutiques** : mise à jour de `status` et `is_verified` (réservé au personnel, `shops_protect_columns` 🛠).
- **Période de lancement** : l'admin met à jour `launch_settings.contact_open_until` par la table (politique `launch_admin_write` 🛠). La fonction `set_launch_end` n'est **pas** appelable par l'application : son exécution est retirée aux rôles connectés.
- **Hors interface en v1** : `grant_agent`, `revoke_agent`, `grant_shop_owner`, `revoke_shop_owner`, `record_subscription` (éditeur SQL, document 05, 2.6) ; l'interface vient ensuite. L'admin peut écrire directement dans `user_roles`, `shop_members` et `shop_subscriptions` par l'API (politiques admin), mais `grant_agent` renseigne aussi le nom d'affichage : à reprendre dans une fonction le moment venu ❓.

### 6.9 Pages de confiance et pages légales
Aucune donnée Supabase. Textes : document 07, section 10, rangés dans `fr.json`.

### 6.10 Choix de la ville (composant)
Lit `cities` (et `neighborhoods` pour le filtre par quartier). Écrit un cookie ; la ville réellement utilisée vient de l'adresse de la page (section 3).

### 6.11 Signalement (composant)
- **Écrit** : insertion dans `flags` : `shop_id` ou `report_id` (au moins un, contrainte `flags_has_target`) et `reason` de 5 à 1 000 caractères (`23514`). **Sans `.select()` après l'insertion** : le visiteur ne peut pas relire un signalement (lecture réservée au personnel), la relecture échouerait en `42501`.
- **Visiteur sans compte** : `flags_insert` est réservée au rôle `authenticated`. Un visiteur **sans session ne peut pas signaler** : il faut d'abord une **connexion anonyme Supabase** (à activer dans le tableau de bord), créée au premier signalement. Le document 05 (« sans compte obligatoire ») reste vrai à cette condition. Voir R12 pour les limites.
- **Limite de fréquence** : **aucune dans la base**. Un compteur dans le navigateur ne protège de rien. Il faut un contrôle côté serveur (action serveur avec limite par IP et par utilisateur), valeurs à fixer (document 03, décision n°3). Message : « Vous avez envoyé plusieurs signalements récemment. Réessayez plus tard. » (document 07, section 8).
- **Statut forcé** (🧪, C9) : le déclencheur `flags_force_open` met `status = 'open'` à toute insertion faite avec une session ; une valeur envoyée est écrasée. Le site n'envoie jamais de statut. Avant l'exécution du patch (R11), un client malveillant pouvait envoyer `dismissed`.
- **Réponse affichée** : toujours « Merci, nous vérifions. », sans rien dire de la boutique visée ni de la suite (document 05, 4.6).

### 6.12 Mesure de l'usage (document 05, section 7)
Les événements prévus (vue de fiche, clic « Contacter sur WhatsApp », recherche sans résultat, signalement, relevé) **n'ont aucune table** dans le modèle de données 🛠. Les statistiques des boutiques abonnées (phase 4) en dépendent. Options ❓ : un outil d'analyse externe en phase 1 (comptages sans données personnelles), puis une table `events` et un patch SQL en phase 4. Voir C7 et décision n°3.

---

## 7. Écritures : ce que le client envoie, ce que le serveur fixe

| Table | Le client envoie | Le serveur fixe (écrase toute valeur envoyée) | Source |
|---|---|---|---|
| `price_reports` | `product_id`, `shop_id`, `condition`, `price_fcfa`, `in_stock`, `warranty_months`, `reported_specs`, `proof_paths`, `client_ref` (🧪) | `reported_at`, `reported_by`, `reviewed_by`, `reviewed_at`, `review_note`, `config_hash`, `check_level`, `check_reason`, `check_codes`, `status`, `source` | 🛠 `price_reports_before_insert`, `price_reports_shop_rules` ; 🧪 index unique `price_reports_client_ref_key` |
| `products` (propriétaire) | `category`, `brand`, `name`, `specs` | `status`, `is_active`, `created_by`, `reviewed_by`, `reviewed_at`, `review_note` | 🛠 `products_review_rules` |
| `shop_requests` | `name`, `neighborhood_id`, `address`, `phone`, `note` | `requested_by`, `status`, `shop_id`, `handled_by`, `handled_at`, `handled_note` | 🛠 `shop_requests_rules` |
| `shops` (propriétaire) | `phone`, `address`, `opening_hours`, champs de montage | refus si `name`, `neighborhood_id`, `status`, `is_verified`, `created_by` ou `created_at` changent (`PB031`) | 🛠 `shops_protect_columns` |
| `flags` | `shop_id` ou `report_id`, `reason` | `created_by` et `created_at` par défaut (la politique exige `created_by` = la personne connectée) ; **`status` forcé à `open`** (🧪 `flags_force_open`, C9) | 🛠 `flags_insert` ; 🧪 |
| `builds`, `build_items` | `name`, `is_public` ; lignes (`product_id`, `quantity`, `accepted_conditions`) | `owner_id`, `share_slug`, `created_at` par défaut ; la politique impose `owner_id` = la personne connectée | 🛠 |
| `launch_settings` (admin) | `contact_open_until` | `updated_by`, `updated_at` ne sont pas fixés par un déclencheur : le site les envoie ou les laisse | 🛠 |

Règles de format :

- **Nombres, pas du texte** dans `reported_specs` : `{ "ram_gb": 16, "storage_gb": 256 }`, pas « 16 Go » (document 06, 2.5). Sinon le serveur ne reconnaît pas la valeur et le contrôle ne s'applique pas, sans message.
- `cpu` : texte libre ; la base le normalise pour l'empreinte (« i5-8350U » et « I5 8350u » sont équivalents, patch `config_hash` 🛠). Aucun contrôle sur le processeur pour l'instant.
- `warranty_months` : `0` = aucune garantie ; vide = non précisée. Les deux sont **distincts** ; le formulaire ne les confond pas.
- Un relevé **n'est jamais modifié** : corriger un prix = envoyer un nouveau relevé ✅.
- Téléphone : `+237` suivi de 9 chiffres commençant par 2 ou 6 (contrainte vue dans `shop_requests` 🛠). Le formulaire accepte « 6XX XX XX XX » et le convertit.

---

## 8. Erreurs

Le client Supabase renvoie un objet `error` avec `code`, `message`, `details`, `hint`. La fonction `mapError(error, contexte)` renvoie **une clé de `fr.json`** ; le détail va au journal, pas à l'écran (document 07, 7.2).

| Source | Code | Clé de message |
|---|---|---|
| Déclencheurs et fonctions 🛠 | `PB001` à `PB003`, `PB010` à `PB013`, `PB020` à `PB025`, `PB030` à `PB032` (🧪 `PB032` : note de rejet manquante) | table du document 07, section 7.2 |
| Contraintes | `23514` + nom de contrainte : `price_reports_needs_proof` (nom explicite), `price_reports_price_fcfa_check` (prix de 1 à moins de 100 000 000), `price_reports_warranty_months_check` (0 à 60), `flags_reason_check`, `flags_has_target`, `shops_phone_format` (sauf `price_reports_needs_proof`, `flags_has_target` et `shops_phone_format`, noms posés par le schéma, les autres sont des noms par défaut de PostgreSQL 🔎) | idem ; **lire le nom de la contrainte dans `message`** |
| Doublon | `23505` + `products_unique` | « Ce produit existe déjà… » |
| Relevé déjà envoyé | `23505` + `price_reports_client_ref_key` (🧪, C5) | « Ce relevé a déjà été envoyé. » ❓ (texte à ajouter au document 07) |
| Droits | `42501` (y compris une relecture refusée après une insertion, par exemple `flags`) | « Cette action n'est pas autorisée pour votre compte. » |
| Identifiant mal formé | `22P02` | page introuvable |
| Aucune ligne alors qu'une était attendue | `PGRST116` (avec `.single()`) | page introuvable (préférer `.maybeSingle()`) |
| Jeton expiré ou invalide | `PGRST30x` ou statut 401 | reconnexion, **brouillon conservé** |
| Délai dépassé | `57014` | « Le service est momentanément indisponible… » |
| Pas de réponse | pas de `code` (échec réseau) | « Impossible de charger les prix… » + Réessayer |
| Autre | — | « Une erreur est survenue… » |

**À vérifier sur Supabase** : que le code `PB…` arrive bien dans `error.code` avec le client JavaScript (patch `reason_codes`, jamais testé hors base locale).

Une écriture **refusée** par le serveur n'est jamais réessayée automatiquement. Une lecture qui échoue peut l'être une fois, après une courte pause.

---

## 9. Cache et fraîcheur ❓

| Page | Durée de cache | Remarque |
|---|---|---|
| `/` | 10 minutes | |
| `/produits`, `/produits/[id]`, `/boutiques/[id]` | 5 minutes | un prix publié par un modérateur apparaît au plus 5 minutes plus tard |
| Villes, quartiers | 1 jour | quasi statiques |
| `/builder/[slug]` | 5 minutes | |
| `/agent`, `/boutique`, `/admin` | **aucun** | données personnelles ; ne jamais les mettre en cache partagé |

Option : après une publication par un modérateur, invalider à la demande les pages concernées (action serveur) ; la durée de cache reste le filet de sécurité. Critère de lancement « aucun relevé de plus de 45 jours affiché » (document 04) : un cache de 5 à 10 minutes ne le remet pas en cause, la vue filtrant déjà par âge.

---

## 10. Types TypeScript ❓

Les types des tables viennent de la génération automatique de la CLI Supabase (document 03, section 1). **Les vues sortent avec tous leurs champs « nullables »** : leurs types sont écrits à la main, dans un seul fichier. Base de départ (lecture publique ; `check_reason` est **volontairement absent**) :

```ts
type Condition = 'new' | 'refurbished' | 'used';
type CheckLevel = 'ok' | 'suspect' | 'impossible';
type CheckCode = 'ram_above_max' | 'ram_not_allowed' | 'storage_not_allowed' | 'price_low';

interface ReportedSpecs {
  ram_gb?: number;
  storage_gb?: number;
  cpu?: string;
  battery_health_pct?: number;
}

interface CurrentPriceRow {
  report_id: string;
  product_id: string;
  shop_id: string;
  condition: Condition;
  price_fcfa: number;
  in_stock: boolean;
  warranty_months: number | null;
  reported_specs: ReportedSpecs;
  check_level: CheckLevel;
  reported_at: string;                 // date-heure ISO
  category: string;
  brand: string;
  product_name: string;
  product_specs: Record<string, unknown>;
  shop_name: string;
  shop_phone: string | null;
  neighborhood_id: string;
  shop_verified: boolean;
  source: 'agent' | 'shop';
  shop_subscribed: boolean;
  shop_contactable: boolean;
  check_codes: CheckCode[];
  city_id: string | null;             // 🧪 C1
  config_hash: string;                // 🧪 C2, jamais affiché
}

// Ce que le client a le droit d'envoyer pour un relevé (section 7)
interface ReportInsert {
  product_id: string;
  shop_id: string;
  condition: Condition;
  price_fcfa: number;
  in_stock: boolean;
  warranty_months: number | null;
  reported_specs: ReportedSpecs;
  proof_paths: string[];               // '<uid>/<horodatage>/<fichier>'
  client_ref: string;                  // 🧪 C5 : uuid généré à l'ouverture du formulaire
}
```

La liste des colonnes de chaque lecture est écrite **une seule fois**, dans une constante, et réutilisée par les pages (jamais de chaîne de colonnes recopiée à la main). Les lignes de `price_reports_visible` (🧪) se typent à part : elles ajoutent `proof_paths`, `check_reason` (nul pour qui n'y a pas droit), `reported_by`, `reviewed_by`, `reviewed_at`, `review_note`, `client_ref`.

---

## 11. Risques de lecture et d'écriture

| # | Risque | Constat | Réponse |
|---|---|---|---|
| R1 | **`check_reason` lisible par tout le monde** | Avant le patch : la vue `current_prices` expose `check_reason` à `anon`. Pour `price_low`, il contient **la médiane des prix récents**. Retirer la colonne de la vue ne suffisait pas : la table était lisible aussi (R10). | **Traité par C3 🧪** : colonne retirée de la vue et de la table pour `anon` et `authenticated` ; `check_reason` passe par `price_reports_visible` (personnel et auteur seulement). Tant que le patch n'est pas exécuté sur Supabase, le site ne la demande jamais. |
| R2 | Page en cache générée avec une session | Montre téléphone, adresse ou horaires réservés (section 3) | Client public sans cookies pour toute page cachable |
| R3 | `select *` | Échoue sur `shops` ; expose des colonnes superflues ailleurs | Constante de colonnes par lecture |
| R4 | Injection dans un filtre `.or()` | Une chaîne construite avec la saisie de l'utilisateur peut modifier le filtre | Échapper `, ( ) % * _`, ou faire deux requêtes |
| R5 | Preuves en URL publique | Les photos peuvent contenir lieux et personnes | URL signées de quelques minutes, bucket privé ✅ |
| R6 | Colonnes d'audit de `products` lisibles | **Confirmé** : `products_read` ouvre la ligne entière à `anon`. `created_by` d'une fiche proposée par une boutique identifie le compte du propriétaire ; `review_note` est lisible. | Ne pas les demander ; idéalement une vue publique des produits (C6) |
| R7 | Réponse tronquée à 1 000 lignes | Une liste « complète » peut être incomplète sans erreur | Pagination obligatoire (principe 7) |
| R8 | Signalements en rafale | Pas de limite dans la base (document 03, 4.4) | Contrôle côté serveur (section 6.11) |
| R9 | Envoi en double après coupure | Pas de clé d'idempotence avant le patch 🛠 | **Traité par C5 🧪** : `client_ref` et index unique par auteur ; un renvoi échoue en `23505`. Contrôle avant renvoi (6.6) tant que le patch n'est pas exécuté. |
| R10 | **Lecture directe de `price_reports` par tous** | Avant le patch, `reports_read` donnait à tout visiteur, connexion anonyme comprise, les relevés publiés avec **toutes** leurs colonnes (`reported_by`, `proof_paths`, `config_hash`, `check_reason`, `reviewed_by`, `review_note`). | **Traité par C3 🧪** : droits de colonne (14 colonnes ouvertes) et vue `price_reports_visible` pour les ayants droit. Vérifié en local : `42501` sur les colonnes fermées et sur `select *`, y compris pour une connexion anonyme. À refaire sur Supabase. |
| R11 | Statut d'un signalement non protégé | Avant le patch, `flags_insert` ne vérifiait que `created_by` : un client pouvait créer un signalement `dismissed` ou `reviewed`. | **Traité par C9 🧪** : `flags_force_open` écrase le statut envoyé. Vérifié en local. |
| R12 | Connexions anonymes sur réseau mobile | Signalements et configurations exigent une connexion anonyme. Supabase limite ces connexions par adresse IP ; les réseaux mobiles partagent souvent une adresse entre de nombreux abonnés 🔎. | Tester ; test anti-robot ; pour les configurations, proposer un compte en repli. |

---

## 12. Modifications demandées à la base

C1, C2, C3, C5, C8 et C9 sont écrits dans `pcbuilder237_data_contract_patch.sql` 🧪 (retenus par défaut, en attente de confirmation) ; C4, C6 et C7 ne sont **pas** écrits. **C1 à C3 touchent la même vue** (`current_prices`) et sont faites en **un seul patch**, car retirer une colonne impose de recréer la vue (document 07, décision n°9) ; l'ordre des colonnes existantes ne doit pas changer.

| # | Changement | Raison | Priorité |
|---|---|---|---|
| C1 | Ajouter `city_id` à la fin de `current_prices` et de `shops_public` | Une requête au lieu de deux ; filtre par ville fiable | 🧪 écrit, avant la phase 1 |
| C2 | Ajouter `config_hash` à la fin de `current_prices` | Regrouper par configuration sans recopier la normalisation du processeur côté site | 🧪 écrit, avant la phase 1 |
| C3 | **Retirer `check_reason` de `current_prices` et fermer la lecture directe de `price_reports`** (droits de colonne ; vue `price_reports_visible` pour les auteurs, les propriétaires et le personnel) | Risques R1 et R10 | 🧪 écrit, avant l'ouverture au public ✅ recommandé (doc. 07) |
| C4 | Vue agrégée « prix de départ par produit, ville et état » (nombre de boutiques, relevé le plus récent) | Cartes de la liste sans tout charger | quand les lignes dépassent ~1 000 |
| C5 | Colonne `client_ref` (uuid) sur `price_reports`, index unique par auteur | Envoi qui reprend sans doublon (document 05, section 5) | 🧪 écrit, phase 1 |
| C6 | Vue publique `products_public` ou retrait de lecture des colonnes d'audit | Risque R6 | phase 1 ❓ |
| C7 | Table `events` (sans donnée personnelle) | Mesure de l'usage et statistiques des boutiques (phase 4) | phase 4 ❓ |
| C8 | Déclencheur : note obligatoire quand un relevé passe à `rejected` (`PB032`) | Le document 05 (2.4) l'exige | 🧪 écrit, phase 1 |
| C9 | Déclencheur : `flags.status` forcé à `open` à l'insertion | Risque R11 | 🧪 écrit, avant l'ouverture au public |

---

## 13. Écarts avec les autres documents

1. **Document 02, section 10, point 4** : toujours barré « déjà corrigé ». C'est faux (document 08, section 12). Le remettre en « à faire », puis en « fait » après exécution du patch `config_hash` sur la base de test.
2. **Document 05, sections 4.1 et 4.2** : « relevé par un agent » côté acheteur, à aligner sur « Constaté par un agent » (document 07, section 3.0, décision n°10).
3. **Document 05, section 2.3** : « au moins une photo » ; le document 08 en veut deux pour l'occasion et le reconditionné. Décision n°7 du document 08.
4. **Document 03, section 3** : la liste des objets ne cite pas `shop_requests`, `launch_settings`, `products_to_review`, `agents_overview`, ni la colonne `check_codes`. À compléter.
5. **Document 03, section 4.4 et document 05, section 2.1** : « un visiteur anonyme peut signaler » et « sans compte obligatoire » supposent une **connexion anonyme Supabase** (`flags_insert` exige le rôle `authenticated`). À préciser.
6. **Document 03, section 4.2, règle 5** : « un relevé n'est jamais modifié » est vrai pour les agents et les propriétaires, pas pour le personnel (`reports_staff_update`).
7. **Document 07, section 7.2 (limite)** : le patch « agents » n'a aucune erreur visible de l'application ; cette partie de la limite disparaît.
8. **Document 05, section 2.4** : « note obligatoire en cas de rejet » d'un relevé n'était pas imposé par la base ; C8 🧪 le rend obligatoire (`PB032`). À vérifier sur Supabase.
9. **Document 07, section 7.2** : ajouter `PB032` (note de rejet manquante) et le message du relevé déjà envoyé (`23505` sur `price_reports_client_ref_key`).
10. **Document 07, décision n°9** (retirer `check_reason` de la vue publique) : faite dans le patch contrat de données 🧪. L'agent lit désormais son motif dans `price_reports_visible` (document 07, section 6).
11. **Document 08** : les requêtes de suivi (K1 à K4) lisent `price_reports` ; dans l'éditeur SQL rien ne change, mais celles qui passent par l'application doivent lire `price_reports_visible` ❓ (à vérifier).

---

## 14. Vérifications sur le projet de test

À faire après l'exécution de la chaîne de patchs (ordre : schéma → agents → propriétaire → produits → lancement → adresse et horaires → codes de motif → `config_hash` → contrat de données). Les points marqués 🧪 ont **déjà réussi en local** sur PostgreSQL 16 ; ils sont à refaire sur Supabase :

1. un visiteur anonyme lit `current_prices` sans erreur ; la vue n'a plus `check_reason` (`42703` si on le demande) et a `city_id` et `config_hash` 🧪 ;
2. `select *` sur `shops` échoue pour `anon` ; `shops_public` répond ;
3. un relevé hors liste (RAM 10 Go sur un ThinkPad T480) : l'insertion réussit, `status = 'pending'`, `check_codes = ['ram_not_allowed']` ; le code `PB…` d'une erreur arrive bien dans `error.code` côté client JavaScript ;
4. l'auteur peut relire la ligne qu'il vient d'insérer (`status`, `check_level`, `check_codes`) ;
5. après `set_launch_end(hier)` : `phone` est `NULL` pour une boutique non abonnée, présent pour une abonnée, dans `shops_public` et dans `current_prices` ;
6. adresse et horaires : `NULL` pour une boutique non abonnée vue par `anon`, visibles pour un agent ;
7. le filtre `reported_specs->>ram_gb` fonctionne sur la vue ;
8. une requête `.in('neighborhood_id', …)` avec tous les quartiers d'une ville passe sans dépasser la taille d'adresse acceptée ;
9. une photo envoyée sous `<uid>/…` est acceptée, sous un autre dossier refusée ; une URL signée expire ;
10. le personnel met à jour le statut d'un relevé et le serveur renseigne l'auteur de la décision ;
11. `create_shop_from_request` s'appelle avec `{ _request: id }` ; un agent reçoit `PB023` ou `42501` ;
12. l'admin met à jour `launch_settings` par la table ; un modérateur non admin ne le peut pas ;
13. **R10** : un visiteur sans session, ou une connexion anonyme, lit `reported_by`, `proof_paths`, `review_note`, `check_reason` ou `select *` dans `price_reports` : refusé (`42501`) 🧪 ; les colonnes ouvertes (`id`, `price_fcfa`, `status`, `check_codes`…) restent lisibles 🧪 ;
14. **R11** : avec une connexion anonyme, insérer un signalement avec `status = 'dismissed'` crée un signalement `open` 🧪 ; sans aucune session, l'insertion échoue (`42501`) 🧪 ; 🔎 relire le signalement échoue (`42501`) ;
15. un agent insère avec `.select('id,status,check_level,check_codes')` : réussi 🧪 ; avec `.select()` complet ou `returning *` : `42501` 🧪 ; il relit ses relevés (motif compris) par `price_reports_visible` 🧪 ; un propriétaire abonné relit ceux de sa boutique 🧪 ;
16. un modérateur rejette un relevé sans note, ou avec une note faite d'espaces : `PB032` 🧪 ; avec une note : accepté, auteur et date fixés 🧪 ;
17. photo sous `<uid>/<horodatage>/x.jpg` acceptée, remplacement avec `upsert` refusé, suppression par l'agent refusée ;
18. `/builder/[slug]` : configuration non publique introuvable pour un visiteur, publique lisible, modifiable par son seul propriétaire ;
19. `select role from user_roles` ne renvoie que les rôles de la personne connectée ; `rpc('has_active_shop')` et `rpc('is_staff')` répondent ;
20. une boutique suspendue ou un produit inactif disparaît de `current_prices` pour `anon`, mais pas pour un modérateur.
21. `price_reports_visible` : une connexion anonyme Supabase n'a aucune ligne 🧪 ; un agent ne voit pas les relevés d'un autre 🧪 ; un propriétaire ne voit plus rien après l'expiration de son abonnement 🧪 ; le personnel voit tout, en attente compris 🧪 ;
22. `check_reason` dans `price_reports_visible` : renseigné pour le personnel et pour l'auteur, **nul** pour un propriétaire qui n'est pas l'auteur 🧪 ;
23. `client_ref` : le même uuid envoyé deux fois par le même agent donne `23505` 🧪 ; deux uuid différents passent 🧪 ; 🔎 le code `23505` et le nom `price_reports_client_ref_key` arrivent bien dans `error` côté client JavaScript ;
24. `city_id` : `.eq('city_id', …)` fonctionne sur `current_prices` et `shops_public` 🧪 ; une boutique sans quartier a `city_id` nul 🧪 ;
25. 🔎 sur Supabase : la mise à jour du statut par un modérateur, **sans** `.select()` complet, réussit malgré les droits de colonne ; la vue `price_reports_visible` est bien servie par l'API aux seuls utilisateurs connectés ; l'avertissement du tableau de bord sur une vue sans `security_invoker` est attendu (le filtre est écrit dans la vue) ;
26. rejeu : rejouer le patch contrat de données seul est sans erreur 🧪 ; rejouer le patch lancement ou le patch adresse retire `city_id` de `shops_public` : rejouer le patch contrat de données ensuite.

---

## 15. Décisions à trancher

| # | Question | Statut |
|---|---|---|
| 1 | Filtre par ville : deux requêtes (v1) ou `city_id` dans la vue (C1) ? | 🧪 `city_id` retenu par défaut dans le patch ; à confirmer |
| 2 | Fermer la fuite de `check_reason` et la lecture directe de `price_reports` (C3 élargi : droits de colonne + vue `price_reports_visible`) | 🧪 retenu par défaut dans le patch ; recommandé avant l'ouverture ; à confirmer |
| 3 | Mesure de l'usage : outil externe en phase 1, table `events` en phase 4 ? | ❓ |
| 4 | Limite de fréquence des signalements et des envois : où (action serveur) et quelles valeurs ? | ❓ (document 03, n°3) |
| 5 | Durées de cache et invalidation à la demande après modération | ❓ |
| 6 | Clé d'idempotence des relevés (C5) | 🧪 `client_ref` retenu par défaut dans le patch ; à confirmer |
| 7 | Ville dans l'adresse de la page (proposé) plutôt que dans un cookie seul | ❓ |
| 8 | Afficher `ram_gb` et `storage_gb` sur toute ligne de portable (pas de configuration de base dans les `specs`) | ❓ |
| 9 | Texte d'une carte produit dont aucune ligne n'est éligible au prix de départ (tous suspects ou hors stock) | ❓ |
| 10 | Vue publique des produits (C6) ou simple discipline de colonnes | ❓ |
| 11 | Exiger la note de rejet des relevés (C8) et forcer `status = 'open'` des signalements (C9) | 🧪 retenu par défaut dans le patch ; recommandé ; à confirmer |
| 12 | Connexion anonyme pour les signalements et les configurations : l'activer, avec un test anti-robot ? | ❓ |

---

## 16. Suite proposée

1. **Confirmer** les décisions n°1, 2, 6 et 11 (section 15) ou demander des changements ; le patch en tient compte aujourd'hui telles que proposées.
2. Exécuter la chaîne complète puis `pcbuilder237_data_contract_patch.sql` sur le projet Supabase de test, et refaire la liste de la section 14 (en particulier les points 🔎 : codes d'erreur dans `error.code`, mise à jour du personnel sans `.select()`, comportement de la vue `price_reports_visible`).
3. Reporter dans les autres documents les écarts de la section 13 (07 : `PB032`, message de relevé déjà envoyé ; 08 : requêtes de suivi ; 02 : point 10.4).
4. Écrire `fr.json` (document 07, section 11) et le module de lecture (constantes de colonnes, `mapError`, fonctions pures de la section 5), en lisant les relevés d'un auteur ou d'une boutique par `price_reports_visible`.
5. Restent sans patch : C4 (vue agrégée), C6 (vue publique des produits), C7 (table `events`) et les décisions n°3, 4, 5, 7 à 10 et 12.
