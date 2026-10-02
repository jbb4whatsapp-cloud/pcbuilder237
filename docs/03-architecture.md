# Architecture technique — PC Builder 237

> **Statut** : brouillon v0.3 — 2 octobre 2026
> **Historique** : v0.3 — liste des objets de base complétée (section 3) ; règle 5 précisée pour le personnel (4.2) ; connexion anonyme pour les signalements (4.4) ; flux 5.1 et 5.5 alignés sur les patchs « codes de motif » et « contrat de données » (écrits, 🧫 vérifiés sur le projet Supabase de test, **pas en production**).
> **Légende** : ✅ décidé par le porteur du projet · 🛠 déjà en place (schéma SQL v1 et patchs, ou site actuel) · ❓ proposition à valider · 🧫 vérifié sur le projet Supabase de test

Ce document décrit comment le produit décrit dans les documents 01 (vision) et 02 (règles métier) est construit. Principe directeur : **la base de données est la source de vérité et la barrière de sécurité**. Le navigateur affiche et propose, il ne décide jamais d'un niveau de confiance, d'un statut de relevé ou d'un droit d'accès.

---

## 1. Stack

| Couche | Choix | Statut |
|---|---|---|
| Front | Next.js (App Router), Tailwind CSS | 🛠 observé sur le site actuel |
| Hébergement | Vercel | 🛠 |
| Base de données, authentification, stockage | Supabase (PostgreSQL, Auth, Storage) | 🛠 |
| Langage | TypeScript | ❓ |
| Tests de la logique métier | Vitest (fonctions pures de compatibilité et de prix) | ❓ |
| Migrations | Phase 1 : patchs rejouables dans `supabase/sql/` (D6 ✅, chaîne 1→9 rejouée une seule fois en production, lot P1-5). Après le go/no-go : dossier `supabase/migrations/` appliqué avec la CLI Supabase | ✅ |

Deux projets Supabase : **test** et **production**. Chaque script SQL est d'abord exécuté sur le projet de test (c'est déjà la consigne en tête des scripts 🛠).

---

## 2. Vue d'ensemble

```
Visiteur ──► Next.js (Vercel) ──► Supabase
 Agent    ──►   pages publiques       ├─ PostgreSQL : tables + RLS + déclencheurs
 Boutique ──►   espaces protégés      ├─ Auth : comptes et rôles
 Admin    ──►   server actions        └─ Storage : bucket privé « proofs »
```

- **Lecture publique** : le front lit la vue `current_prices`, la vue `shops_public` et les tables de référence avec la clé publique (`anon`). Le numéro de téléphone d'une boutique n'est pas lisible directement : il passe par une fonction qui applique la règle de contact (patch lancement 🛠). Aucune autre donnée n'est lisible sans compte.
- **Écriture** : toujours avec la session de l'utilisateur. Les politiques RLS décident, les déclencheurs contrôlent le contenu.
- **Clé `service_role`** : jamais dans le navigateur, jamais dans une variable `NEXT_PUBLIC_*`. ❓ Elle n'est utilisée que dans du code serveur (server actions, route handlers), et seulement si un besoin précis l'exige.

---

## 3. Modèle de données (résumé) 🛠

| Domaine | Tables et objets |
|---|---|
| Géographie | `countries`, `cities`, `neighborhoods` |
| Boutiques | `shops` (statut, badge `is_verified`, montage), `shop_members`, `shop_subscriptions` |
| Catalogue | `products` (catégorie + `specs` en JSON, statut de validation : en attente, validé, rejeté) |
| Relevés | `price_reports` (état, prix, garantie, configuration annoncée, preuves, niveau de contrôle, `check_codes` (codes de motif), statut de modération, origine, `client_ref` 🧫 pour un renvoi sans doublon) ; vue `price_reports_visible` 🧫 pour l'auteur, le propriétaire de la boutique et le personnel (la lecture directe des colonnes sensibles est fermée) |
| Lecture publique | vue `current_prices` (dernier relevé publié de moins de 45 jours, par produit, boutique, état et configuration ; `city_id` et `config_hash` ajoutés, `check_reason` retiré 🧫 patch contrat de données) |
| Builder | `builds`, `build_items` |
| Modération | `flags` (signalements), champs de revue sur `price_reports` |
| Lancement | `launch_settings` (fin de la période de contact ouvert), `shop_requests` (demandes d'ajout de boutique), vue `shops_public` 🛠 |
| Comptes | `profiles`, `user_roles` (admin, modérateur, agent) |
| Vues et fonctions de suivi | `agents_overview` (éditeur SQL seulement), `products_to_review` (file des fiches proposées), fonctions de droits `is_staff()`, `has_role()`, `is_shop_owner()`, `has_active_shop()`, `shop_visible_phone()`, `shop_visible_address()`, `shop_visible_hours()` |
| Stockage | bucket privé `proofs` (5 Mo max, JPEG, PNG, WebP) |
| Ancien site | `price_reports_legacy` et `models`, en lecture seule |

**Le rôle propriétaire de boutique n'est pas stocké** 🛠 : il est calculé à partir de `shop_members` et de l'abonnement en cours (fonction `is_shop_owner`). À l'expiration, il s'éteint sans rien à nettoyer.

---

## 4. Sécurité

### 4.1 Authentification et rôles
| Profil | Connexion | Statut |
|---|---|---|
| Agent | Compte Supabase (email + mot de passe) ; le « code agent » est le mot de passe. Rôle `agent` attribué par l'admin | ✅ 🛠 |
| Agent, plus tard | OTP par téléphone | ✅ (prévu quand le nombre d'agents le justifiera) |
| Propriétaire de boutique | Compte email, lien à une boutique par l'admin, abonnement actif | ✅ 🛠 |
| Modérateur, admin | Comptes avec rôle dans `user_roles` | 🛠 |
| Visiteur | Anonyme en lecture. Connexion anonyme Supabase ou compte pour sauvegarder une configuration | 🛠 |

Retirer un rôle coupe l'accès immédiatement : les politiques lisent `user_roles` en direct, il n'y a pas de rôle copié dans un jeton.

### 4.2 Règles d'or
1. **RLS activé sur toutes les tables** ; le rôle `anon` n'a aucun droit d'écriture 🛠.
2. **Contrôles métier dans des déclencheurs** (`price_reports_before_insert`, `price_reports_shop_rules`, `shops_protect_columns`), pas dans le front 🛠.
3. **Le client n'envoie pas** : niveau de contrôle, statut, origine, auteur, date. Le serveur les fixe 🛠.
4. **Preuves photo privées** : seul l'auteur et le personnel les lisent. Le front les affiche via des URL signées à durée courte ❓.
5. **Un relevé n'est jamais modifié par son auteur** (agent ou propriétaire) : corriger un prix = envoyer un nouveau relevé 🛠. Le **personnel** peut mettre à jour le statut et la note de revue (`reports_staff_update`) ; l'auteur et la date de la décision sont conservés.

### 4.3 En-têtes HTTP ❓
Le site actuel n'envoie aucun en-tête de sécurité (hors HSTS). À ajouter dans `next.config.js` : `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

Pour la `Content-Security-Policy`, partir d'une version stricte et l'assouplir seulement si nécessaire. Points d'attention : `connect-src` et `img-src` doivent autoriser le domaine Supabase (les URL signées des preuves) ; éviter `'unsafe-eval'` en production.

### 4.4 Points de vigilance ❓
- **Abus des signalements** : un visiteur peut en créer **sans compte**, grâce à une **connexion anonyme Supabase** (la politique `flags_insert` exige le rôle `authenticated`) ; à activer et à protéger (décision D10). Prévoir une limite de fréquence (par utilisateur et par IP) et un test de plausibilité côté serveur.
- **Photos de preuve** : retirer les métadonnées EXIF (position GPS) avant l'envoi. À faire d'office si les preuves deviennent publiques.
- **Numéro de téléphone des boutiques** ✅ 🛠 : le numéro était lisible par tous, à la fois dans la vue `current_prices` et directement dans la table `shops`. Le patch lancement retire la lecture directe de `shops.phone` pour `anon` et `authenticated`, et ne renvoie le numéro que par la fonction `shop_visible_phone()` : au public si la boutique est contactable (période de lancement ouverte ou abonnement actif), toujours au personnel et aux propriétaires de la boutique. Conséquence pour le développement : le site lit `shops_public`, jamais `select *` sur `shops`.
- **Numéros WhatsApp** : stockés au format `+237…` (contrainte 🛠). Le lien `wa.me` exige les chiffres seuls, sans le `+` : le retirer au moment de construire le lien.
- **Données personnelles** : ne stocker que ce qui sert (nom d'affichage, téléphone d'un compte). Rédiger la politique de confidentialité avant le lancement.

---

## 5. Flux de données

### 5.1 Un agent envoie un relevé 🛠
1. L'agent se connecte, choisit boutique, produit, état, prix, stock, garantie, configuration annoncée.
2. Le front compresse les photos (< 1 Mo conseillé) et les envoie dans `proofs/<uid>/…`.
3. Le front insère la ligne dans `price_reports` avec les chemins des preuves et un `client_ref` généré à l'ouverture du formulaire (un renvoi après coupure échoue avec `23505` : « déjà envoyé » 🧫).
4. Les déclencheurs vérifient le produit, la boutique, les preuves, calculent `check_level`, `check_reason` et `check_codes`, fixent `source = 'agent'`. Le front relit seulement `id, status, check_level, check_codes` ; le motif en français se relit dans `price_reports_visible` 🧫.
5. Niveau `ok` : publié automatiquement. Sinon : `pending`, file des modérateurs.

### 5.2 Une boutique envoie un relevé 🛠
Même chemin, mais le déclencheur `price_reports_shop_rules` fixe `source = 'shop'` et force `pending` : **toujours modéré**.

### 5.3 Un acheteur compare 🛠 ❓
1. Il choisit une ville, un quartier, un produit (le front lit géographie et catalogue).
2. Le front lit `current_prices`, filtrée par produit, ville et état.
3. Le **meilleur prix** est calculé selon les règles du document 02, section 3 ❓ : par produit, par état, relevés `ok` en stock uniquement.
4. Il contacte la boutique par WhatsApp avec un message pré-rempli (produit, état, prix relevé, date du relevé). ✅ Pendant la période de lancement, toute boutique est contactable ; ensuite, seulement les boutiques abonnées.

### 5.4 Un acheteur assemble un PC ❓
1. Il ajoute des composants (`build_items`) ; chaque ajout passe par le **moteur de compatibilité**.
2. Le total est calculé selon les deux vues du document 02, section 6.
3. Il sauvegarde (`builds`), partage via `share_slug`, ou demande un devis WhatsApp avec la liste pré-remplie. ✅ Le devis va à la boutique si elle est contactable, sinon au contact du porteur du projet (panier sur plusieurs boutiques : ❓).

### 5.5 Un modérateur traite la file 🛠
Il lit les relevés `pending` (par `price_reports_visible`) avec leurs preuves, publie ou rejette avec une note, **obligatoire au rejet** (`PB032` 🧫). Auteur et date de décision sont conservés.

### 5.6 Une boutique propose un produit ✅ (patch produits 🛠)
1. Le propriétaire abonné saisit marque, nom, catégorie et caractéristiques d'un produit absent du catalogue.
2. Le serveur crée la fiche **en attente** et inactive : le public ne la voit pas, aucun relevé ne peut la viser (le déclencheur de contrôle refuse un produit inactif).
3. Un modérateur compare avec la fiche constructeur, puis valide ou rejette (note obligatoire).
4. Validée, la fiche devient publique et peut recevoir des relevés. Seul le personnel la modifie ensuite.

---

## 6. Moteurs métier

### 6.1 Anti-arnaque
Calculé dans la base (déclencheur) 🛠, à partir de `products.specs` ✅. Les règles à ajouter (processeur, batterie, prix plancher…) sont listées au document 02.

❓ **Décision à trancher** : garder les règles dans des déclencheurs SQL (simple, impossible à contourner) tant qu'elles restent peu nombreuses ; les réorganiser en table de règles ou en fonction par catégorie quand elles dépasseront une dizaine. Pour le moment, chaque nouvelle règle = un script de migration testé.

❓ **Langue des motifs.** Le motif d'un contrôle (`check_reason`) est écrit en français dans la base, ce qui convient tant que le site est en français seulement ✅ (phase 1). Le code de motif existe déjà (`check_codes`, patch « codes de motif » 🧫) : si l'anglais est ajouté, le texte public se compose côté site à partir du code, sans retraiter les relevés existants.

### 6.2 Compatibilité (builder) ❓
- Module TypeScript indépendant de l'interface : une fonction pure par règle, qui reçoit la configuration et renvoie `{ niveau: 'erreur' | 'avertissement', message }`.
- Le même module sert au filtrage des options dans l'interface et à la vérification finale avant sauvegarde ou envoi d'un devis.
- Chaque règle a ses tests unitaires, avec des cas réels du marché (socket, DDR4/DDR5, puissance avec marge de 30 %, dimensions du boîtier).

### 6.3 Prix et totaux ❓
Fonctions pures également (meilleur prix, boutique unique, panier le moins cher), testées avec des jeux de relevés fictifs. Le calcul se fait à partir des lignes de `current_prices`, jamais à partir de relevés bruts.

---

## 7. Pages ❓

| Route | Contenu | Accès |
|---|---|---|
| `/` | Accroche, recherche (ville, quartier, catégorie, produit), portables en vedette | Public |
| `/produits/[id]` | Prix par boutique, état, garantie, date, origine, historique | Public |
| `/boutiques/[id]` | Fiche boutique (complète si abonnée) | Public |
| `/builder` | Assembleur et total | Public ; sauvegarde avec compte |
| `/builder/[slug]` | Configuration partagée | Public |
| `/agent` | Formulaire de relevé avec photos | Agent |
| `/boutique` | Espace propriétaire : fiche, relevés, statistiques | Propriétaire abonné |
| `/admin` | Modération, boutiques, produits, agents, abonnements | Personnel |
| `/securite`, `/comment-ca-marche`, `/a-propos`, `/contact`, mentions et confidentialité | Pages de confiance et SEO | Public |

Les routes protégées sont vérifiées **côté serveur** (middleware + RLS). Masquer un lien dans le menu ne protège rien.

---

## 8. Référencement et partage ❓

- Titre et description propres à chaque page, `lang="fr"`, balises Open Graph (le partage sur WhatsApp est le principal canal de diffusion).
- `robots.txt` bloquant `/admin`, `/agent`, `/boutique`, `/api` ; `sitemap.xml` généré à partir des produits actifs.
- Données structurées : voir section 9.

---

## 9. Rapport d'audit externe du 2 octobre : ce qui est retenu

Le rapport décrit le site **actuel** (quatre menus, aucun résultat). Ses constats sur l'état du site sont exacts et recoupent l'analyse de départ. En revanche, il part d'un autre produit : **une marketplace de PC d'occasion avec paiement séquestre, comptes vendeurs, avis et annonces**, sur le Cameroun et le Gabon. Cela contredit le document 01.

### Retenu ✅❓
| Recommandation du rapport | Traitement |
|---|---|
| Corriger titre, description, `lang="fr"`, favicon | À faire immédiatement |
| Labels sur les menus, bouton de réinitialisation, indicateurs de chargement | À faire (accessibilité) |
| Afficher des résultats après la sélection | À faire, **à partir de `current_prices`** et non d'une table `listings` |
| En-têtes de sécurité | À faire (section 4.3) |
| Open Graph, `robots.txt`, `sitemap.xml`, favicon | À faire |
| Footer, pages sécurité / comment ça marche / à propos | À faire |
| Bouton « Signaler » | Déjà prévu en base (`flags`) ; à brancher dans l'interface, avec le vocabulaire du document 02 (« spécifications incohérentes, à vérifier ») |
| Données structurées Schema.org | Reprendre le principe, mais en `AggregateOffer` (fourchette de prix sur plusieurs boutiques), pas en `Offer` d'un vendeur unique |
| Migration des appels vers le serveur, rate limiting | Retenu en partie : RLS déjà en place, limite de fréquence à ajouter |

### Écarté ou reporté (hors périmètre v1, doc 01)
| Recommandation du rapport | Raison |
|---|---|
| Paiement séquestre MTN MoMo / Orange Money | Pas de paiement intégré ni de vente directe en v1 |
| Table `listings`, comptes vendeurs particuliers, ventes, avis d'acheteurs | Le produit relève des **prix en boutique**, pas des annonces de particuliers |
| Badge vendeur à 3 niveaux (CNI, OCR, livreur) | Le badge « boutique vérifiée » s'obtient après visite d'un agent |
| Gabon et autres pays | Lancement à Yaoundé et Douala |
| Application native, multilingue, PWA | Plus tard ; la PWA est la plus pertinente si la connexion est instable |
| Calendrier de 12 mois pour 2-3 développeurs | Remplacé par la feuille de route (document 04) |

❓ **À confirmer** : le rapport laisse entendre une vision « marketplace ». Si cette direction vous intéresse pour plus tard, elle doit passer par une décision explicite et par un document de vision révisé, pas par le plan d'audit.

---

## 10. Environnements et déploiement ❓

- Branche `main` → Vercel production ; chaque branche → aperçu Vercel branché sur la base **de test**.
- Variables d'environnement : URL et clé publique Supabase côté front ; aucune clé secrète dans le dépôt.
- Sauvegardes : activer les sauvegardes quotidiennes Supabase avant le lancement ; tester une restauration.
- Suivi : journaux Vercel et Supabase ; alerte sur les erreurs de déclencheurs (relevés refusés).

---

## 11. Décisions à trancher

| # | Question | Statut |
|---|---|---|
| 1 | Règles anti-arnaque : déclencheurs SQL ou table de règles ? (section 6.1) | ❓ |
| 2 | Preuves photo publiques pour les relevés publiés ? (nécessite le retrait des EXIF) | ❓ |
| 3 | Limites de fréquence : quelles valeurs pour signalements et envois de relevés ? | ❓ |
| 4 | Direction « marketplace » du rapport d'audit : écartée pour la v1, à confirmer | ❓ |
| 5 | Hébergement des données : région Supabase retenue pour la production | ❓ |
| 6 | Période de lancement : durée à fixer ; le réglage existe (`launch_settings`, patch lancement 🛠) | ❓ |
| 7 | Droit de réponse des boutiques : table de réponses et saisie par le personnel, après la période de lancement | ✅ prévu, ❓ détails (document 05, section 4.7) |
| 8 | Un nom de produit rejeté bloque une nouvelle proposition du même nom (contrainte d'unicité) : corriger ou supprimer la fiche rejetée, ou assouplir la contrainte | ❓ |
