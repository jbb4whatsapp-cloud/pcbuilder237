# Règles métier — PC Builder 237

> **Statut** : brouillon v0.3 — 2 octobre 2026
> **Historique** : v0.3 — section 10 réécrite d'après les documents 08 et 09 (le point 4 n'était **pas** corrigé ; point 5 renvoyé à la décision D7 du registre `00-ROADMAP-MAITRE.md`).
> **Légende** : ✅ décidé par le porteur du projet · 🛠 déjà implémenté dans le schéma SQL v1 · ❓ proposition à valider

Ce document décrit la logique propre au marché. Un développeur ne peut pas la deviner : elle doit être respectée dans le code, côté serveur en priorité.

---

## 1. Les relevés de prix

Un **relevé** est une observation de prix faite pour un produit, dans une boutique, à une date donnée.

### Contenu d'un relevé
- 🛠 produit, boutique, **état** (`new`, `refurbished`, `used`), prix en FCFA, en stock ou non ;
- 🛠 **garantie** en mois ;
- 🛠 **configuration réellement annoncée** (RAM, stockage, batterie…) ;
- 🛠 **au moins une preuve photo** (relevé impossible sans preuve) ;
- 🛠 auteur, date, statut de modération.
- ❓ **origine** du relevé : « agent » ou « boutique ». Absente du schéma v1.
- ❓ garantie obligatoire pour l'occasion et le reconditionné (facultative dans le schéma v1) : **décision D7 ouverte** (obligatoire, ou « non précisée » affichée en clair, document 07, décision n°6).

### Cycle de vie
1. Le relevé est créé avec le statut `pending`.
2. 🛠 Le serveur le contrôle (section 2). Sans anomalie, il passe en `published` ; sinon il reste en `pending` pour un modérateur.
3. 🛠 Un modérateur peut le publier ou le rejeter, avec une note. La date et l'auteur de la décision sont conservés.
4. ✅ Un relevé publié par une **boutique** passe toujours par un modérateur avant publication (même sans anomalie). Le schéma v1 ne le prévoit pas encore.

### Validité
- 🛠 Pour un même produit, une même boutique, un même état et une même configuration, seul le **dernier relevé publié** compte.
- 🛠 Un relevé de plus de **45 jours** n'est plus affiché.
- ❓ La date du relevé est toujours visible à côté du prix.

---

## 2. Contrôles anti-arnaque

Ils sont calculés **côté serveur** à l'enregistrement. Le navigateur ne décide jamais du niveau d'un relevé.

### Niveaux
| Niveau | Sens | Effet |
|---|---|---|
| `ok` | Aucune anomalie | Publié automatiquement (sauf origine boutique, voir 1) |
| `suspect` | Anomalie possible | En attente d'un modérateur |
| `impossible` | Incohérence physique | En attente d'un modérateur |

### Règles actuelles 🛠
| Règle | Niveau |
|---|---|
| RAM annoncée supérieure au maximum du produit (`max_ram_gb`) | impossible |
| RAM annoncée absente de la liste autorisée (`allowed_ram_gb`) | suspect |
| Stockage annoncé absent de la liste autorisée (`allowed_storage_gb`) | suspect |
| Prix inférieur à 50 % de la médiane (même produit, état et configuration, au moins 3 relevés publiés sur 60 jours) | suspect |

### Principes
- ✅ Les règles viennent des **données du produit** (champ `specs`), pas du code.
- ❓ Les valeurs autorisées sont tirées de la fiche constructeur et validées par un modérateur ou un admin. Exemple : un ThinkPad T480 accepte 24 Go (8 + 16), donc 24 ne doit pas être signalé.
- ❓ Un relevé `suspect` ou `impossible` n'est **jamais** présenté comme « meilleur prix » ni comme « vérifié ».
- ❓ Le texte public parle de **« spécifications incohérentes, à vérifier »**, jamais d'« arnaque » : une boutique ne doit pas être accusée sur une simple comparaison de chiffres.

### Règles à ajouter ❓
- processeur annoncé différent du processeur possible pour le modèle ;
- état de batterie plausible pour un portable d'occasion ;
- prix plancher par catégorie (par exemple un SSD de 2 To à un prix irréaliste) ;
- puissance d'alimentation annoncée plausible ;
- signaux de carte graphique reconditionnée ou falsifiée.

---

## 3. Meilleur prix

- ❓ Calculé **par produit et par configuration**, jamais tous modèles confondus.
- ❓ Calculé **au sein d'un même état** : un neuf et un occasion ne se comparent pas directement. L'interface propose un filtre par état.
- ❓ Seuls les relevés publiés de niveau `ok` et **en stock** entrent dans le calcul. Un prix hors stock reste visible mais grisé.
- ❓ Le tri se fait par prix croissant. **L'abonnement d'une boutique n'influence jamais l'ordre** (voir section 7).
- ❓ Les prix sont affichés dans la ville choisie (Yaoundé ou Douala).

---

## 4. Confiance affichée à l'acheteur

Chaque prix indique clairement :
- ❓ son **origine** : « constaté par un agent » ou « déclaré par la boutique » (vocabulaire du document 07, section 3.0 ✅) ;
- ❓ sa **date**, l'**état** du produit et la **garantie** ;
- 🛠 l'existence d'une preuve (les photos sont dans un stockage privé ; les rendre publiques est optionnel, ❓ à décider) ;
- 🛠 le badge **boutique vérifiée** (champ `is_verified`). ❓ Il s'obtient après la visite d'un agent et ne s'achète pas.

---

## 5. Compatibilité du builder

Le builder concerne les **PC de bureau assemblés à partir de composants**. Il ne s'applique pas aux portables (voir le document de vision).

Chaque règle est une fonction pure qui reçoit la configuration et renvoie un résultat avec un message lisible. Les caractéristiques utilisées sont dans le champ `specs` du produit.

| Règle | Caractéristiques utilisées |
|---|---|
| Socket du processeur = socket de la carte mère | `socket` |
| Type de RAM (DDR4 ou DDR5) pris en charge par la carte mère, et nombre de barrettes ≤ nombre d'emplacements | `ram_type`, `ram_slots`, `modules` |
| Puissance de l'alimentation ≥ (TDP processeur + TDP carte graphique) avec une marge d'environ 30 % | `watts`, `tdp_w` |
| Format de la carte mère accepté par le boîtier | `form_factor`, `form_factors` |
| Longueur de la carte graphique ≤ place disponible dans le boîtier | `length_mm`, `max_gpu_length_mm` |
| Hauteur du ventirad ≤ limite du boîtier | `max_cooler_height_mm` |
| Connecteurs d'alimentation de la carte graphique présents sur le bloc | `power_connectors` |

- ❓ Une incompatibilité certaine est une **erreur** ; un doute (marge d'alimentation faible, mise à jour du BIOS possible sur une carte mère d'occasion) est un **avertissement**.
- ❓ Les options incompatibles avec les choix déjà faits sont filtrées dans l'interface.

---

## 6. Prix total d'une configuration

- 🛠 Une configuration est composée de produits avec une quantité et des **états acceptés** (neuf, reconditionné, occasion).
- ❓ Deux vues du total :
  1. **Une seule boutique** : tous les composants chez la même boutique. Une boutique qui n'a pas tout n'est pas proposée.
  2. **Panier le moins cher** : le meilleur prix de chaque composant, avec le nombre de boutiques à visiter et l'économie par rapport à la meilleure boutique unique.
- ❓ La disponibilité et la date du relevé sont affichées pour chaque ligne.
- ❓ Si une boutique propose le montage (`offers_assembly`, `assembly_fee_fcfa`), son tarif peut être ajouté au total en option.
- ✅ Le partage et la sauvegarde d'une configuration sont gratuits.

---

## 7. Boutiques et abonnements

- ✅ Une boutique **non abonnée** apparaît dans le comparateur avec des informations limitées (contenu exact ❓).
- ✅ Le contact WhatsApp depuis le site est un avantage de l'abonnement, **ouvert à toutes les boutiques pendant la période de lancement** (durée ❓). Réglage : `launch_settings` 🛠 (patch lancement). Le numéro de téléphone n'est renvoyé au public que pour les boutiques contactables.
- ✅ Une boutique **abonnée** publie et modifie ses prix, avec validation par un modérateur (pack complet ❓).
- ✅ Le paiement de l'abonnement se fait par Mobile Money, encaissé à la main au démarrage.
- ❓ L'admin enregistre le paiement et active l'abonnement (début, fin, référence). Table créée par le patch « propriétaire de boutique » 🛠 (à exécuter).
- ❓ L'abonnement n'a **aucun effet sur le classement des prix**. Une mise en avant éventuelle, plus tard, serait un emplacement séparé, étiqueté « Boutique partenaire ».
- 🛠 Une boutique **suspendue** disparaît des résultats.
- ❓ Quand un abonnement expire : la boutique redevient non abonnée, et ses relevés déjà publiés suivent la règle de validité de 45 jours.

---

## 8. Modération et signalements

- 🛠 Les relevés en attente forment la file des modérateurs. Chaque décision est tracée.
- ✅ Les fiches produit proposées par les boutiques forment une seconde file de modération (vue `products_to_review`, patch produits 🛠).
- 🛠 Tout utilisateur connecté, y compris un visiteur anonyme, peut signaler une boutique ou un relevé (motif de 5 à 1000 caractères). Seul le personnel lit les signalements.
- ❓ Délai cible de traitement d'un relevé en attente.
- ✅ Droit de réponse visible pour une boutique concernée par un signalement, **après la période de lancement** (détails ❓, voir document 05, section 4.7).

---

## 9. Droits par rôle

| Action | Visiteur | Agent | Propriétaire de boutique | Modérateur | Admin |
|---|---|---|---|---|---|
| Lire les prix publiés | ✔ | ✔ | ✔ | ✔ | ✔ |
| Sauvegarder une configuration | connecté | ✔ | ✔ | ✔ | ✔ |
| Envoyer un relevé avec preuves | | ✔ | ✔ pour ses boutiques, abonnement actif, toujours modéré | ✔ | ✔ |
| Voir tous les relevés de sa boutique (en attente, rejetés, publiés) | | | ✔ | ✔ | ✔ |
| Publier ou rejeter un relevé | | | | ✔ | ✔ |
| Gérer sa ou ses boutiques (téléphone, adresse, horaires, montage et son tarif) | | | ✔ abonnement actif | ✔ | ✔ |
| Changer le nom, le quartier, le statut ou le badge « vérifié » d'une boutique | | | | ✔ | ✔ |
| Gérer toutes les boutiques | | | | ✔ | ✔ |
| Proposer une fiche produit (en attente de validation) | | | ✔ abonnement actif | ✔ | ✔ |
| Valider ou rejeter une fiche produit proposée | | | | ✔ | ✔ |
| Modifier un produit validé du catalogue | | | | ✔ | ✔ |
| Voir les statistiques de sa boutique (phase 4) | | | ✔ | ✔ | ✔ |
| Enregistrer un abonnement, lier un compte à une boutique | | | | | ✔ |
| Attribuer les rôles, supprimer des données | | | | | ✔ |

### Propriétaire de boutique
- ✅ 🛠 Une même personne peut gérer **plusieurs boutiques** (table `shop_members`, un lien par boutique).
- ✅ 🛠 Le rôle est **calculé** : il n'est actif que tant que l'abonnement de la boutique l'est. À l'expiration, le propriétaire voit ses données mais ne peut plus envoyer de relevé ni modifier sa fiche.
- ✅ 🛠 L'admin lie le compte à la boutique et enregistre le paiement Mobile Money de l'abonnement.
- 🛠 **Ce qu'il peut faire** : modifier la fiche de sa boutique (téléphone, adresse, horaires, montage et son tarif) ; envoyer des relevés avec preuves photo (origine « boutique », toujours modérés) ; suivre l'état de tous ses relevés ; consulter ses statistiques (❓ phase 4).
- 🛠 **Ce qu'il ne peut pas faire** : modifier le nom, le quartier, le statut, le badge « vérifié » ou l'abonnement ; agir sur une autre boutique ; publier lui-même un relevé ; modifier un relevé déjà envoyé. Changer un prix, c'est envoyer un nouveau relevé ; l'historique est conservé.
- ✅ **Produits** : le propriétaire crée lui-même des fiches produit, mais **elles passent par un modérateur avant de servir aux contrôles** (patch `pcbuilder237_shop_products_patch.sql` 🛠). Le catalogue est la référence des contrôles anti-arnaque (valeurs autorisées de RAM et de stockage) ; une fiche non validée ne doit jamais en faire partie.
  - la fiche est créée **en attente** : invisible du public, aucun relevé possible dessus ;
  - le propriétaire la corrige tant qu'elle est en attente ; une fois validée, seul le personnel la modifie ;
  - le modérateur compare les caractéristiques (maximum et valeurs autorisées de RAM, valeurs de stockage) avec la fiche constructeur avant de valider ;
  - un rejet exige une note, visible par le propriétaire ;
  - limite de 20 fiches en attente par propriétaire ;
  - un propriétaire dont l'abonnement a expiré ne peut plus proposer ni corriger de fiche.

---

## 10. Écarts connus entre ces règles et le schéma v1

À traiter dans la phase 0. Chaque écart indique le script qui le couvre ; **aucun n'est encore exécuté sur Supabase** (lot P0-1 du `00-ROADMAP-MAITRE.md`). Un écart ne passe à ✅ qu'après ce test.

| # | Écart | Couvert par | État |
|---|---|---|---|
| 1 | Pas d'**origine** du relevé (agent ou boutique), ni de rôle propriétaire de boutique | `supabase/sql/03_shop_owner_patch.sql` | 🛠 écrit, 🧫 vérifié sur la base de test, 🔎 production |
| 2 | Pas de table d'**abonnements** | `supabase/sql/03_shop_owner_patch.sql` | 🛠 écrit, 🧫 vérifié sur la base de test, 🔎 production |
| 3 | Un relevé `ok` était publié automatiquement, même venant d'une boutique (la règle ✅ de la section 1 demande une validation) | `supabase/sql/03_shop_owner_patch.sql` : un relevé de boutique est toujours `pending` | 🛠 écrit, 🔎 à vérifier sur Supabase (test à ajouter) |
| 4 | **`config_hash` calculé sur toute la configuration annoncée** (`md5(reported_specs::text)`) : la batterie compte, deux relevés presque identiques donnent deux lignes. ⚠ Une version précédente de ce document l'indiquait à tort comme « déjà corrigé » (document 08, section 12, écart 1) | `supabase/sql/08_config_hash_patch.sql` : empreinte limitée à `ram_gb`, `storage_gb`, `cpu` | **FAIT sur la base de test** : 🛠 patch écrit, 🧫 exécuté sur le projet Supabase de test (P0-1 ✅). Production à faire (P1-5) |
| 5 | Garantie facultative, même pour l'occasion et le reconditionné | Aucun patch : **décision D7** | ❓ |
| 6 | Règles anti-arnaque limitées à la RAM, au stockage et au prix | Partiel : `pcbuilder237_reason_codes_patch.sql` (version du zip « 08 ») pose les **codes de motif** pour ces trois règles ; la règle processeur reste à décider (**D5**) | 🛠 codes de motif écrits ; ❓ règle processeur |

Rappel : ne jamais utiliser la version de `pcbuilder237_reason_codes_patch.sql` du zip « 07 » (défectueuse, document 08, section 12, écart 3).
