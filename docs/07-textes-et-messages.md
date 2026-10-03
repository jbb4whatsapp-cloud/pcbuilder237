# Textes et messages — PC Builder 237

> **Statut** : brouillon v0.4 — 3 octobre 2026 (décisions 1, 2 et 3 intégrées : vouvoiement, codes de motif, « prix constaté en boutique » ; `messages/fr.json` écrit)
> **Historique** : v0.4 — 3 octobre 2026 : `messages/fr.json` écrit (libellés, alerte, WhatsApp, états, signalement, erreurs) et relié à `mapError` par un test ; textes ajoutés hors de ce document : voir la section 11. v0.3 — documents 01, 02 et 05 alignés sur la section 3.0 ; messages `PB032` et « relevé déjà envoyé » ajoutés (7.2, 7.3) ; motif de l'agent relu par `price_reports_visible` (section 6) ; décisions 6, 9 et 10 mises à jour ; « suite proposée » remplacée. Statuts de vérification passés de 🧪 à 🧫 après P0-1 (base de test).
> **Légende** : ✅ décidé par le porteur du projet · 🛠 déjà en place dans le schéma, les patchs ou les documents · 🧫 vérifié sur le projet Supabase de test · ❓ proposition à valider

Ce document fixe **les mots** du produit : libellés, alertes, messages d'erreur, messages WhatsApp pré-remplis, textes de modération et pages de confiance. Il suit le document 05 (pages, composants, états) et lit les valeurs réelles de la base dans le schéma SQL v1 et les patchs 🛠.

**Tous les textes sont des propositions de rédaction.** Ils doivent être relus par quelqu'un qui connaît l'usage des acheteurs de Yaoundé et de Douala (voir décision n°8, section 12). Les textes des mentions légales et de la politique de confidentialité ne sont **pas** écrits ici : ils relèvent d'une relecture juridique.

---

## 1. Principes de rédaction ❓

1. **Français courant, phrases courtes.** Pas de jargon technique dans les textes publics. Les termes de la base (`check_level`, `config_hash`, `published`…) n'apparaissent jamais à l'écran.
2. ✅ **Vouvoiement** partout.
3. **Jamais d'accusation.** Le mot « arnaque » n'apparaît dans aucun texte qui désigne une boutique, un relevé ou un prix (document 02, section 2). Un texte parle de **spécifications**, de **cohérence** ou de **vérification**, jamais de la boutique.
4. **Dire quoi faire.** Chaque message d'erreur ou d'alerte se termine par une action possible (réessayer, vérifier, demander à voir la machine).
5. **Même mot pour la même chose.** Voir le vocabulaire de la section 3 : un seul libellé par notion, dans toute l'interface.
6. **Une alerte n'est pas un verdict.** Elle vient d'une comparaison automatique ; elle le dit.
7. **Pas d'humour, pas de majuscules d'alarme.** Pas de « ATTENTION ! », pas de points d'exclamation dans les alertes.

---

## 2. Formats ❓

| Élément | Format | Exemple |
|---|---|---|
| Prix | Séparateur de milliers, devise après, jamais de décimales | `235 000 FCFA` |
| Prix dans un message WhatsApp | Espace simple (pas d'espace insécable fine) | `235 000 FCFA` |
| Date d'un prix | Relative d'abord : « aujourd'hui », « hier », « il y a N jours » (de 2 à 45). La date complète s'affiche au toucher ou au survol | `il y a 5 jours` puis `28/09/2026` |
| Date dans un message WhatsApp | Jour/mois, sans année | `28/09` |
| Mémoire et stockage | Nombre + « Go » ; 1 000 Go et plus en « To » | `16 Go`, `1 To` |
| Garantie | Mois si connue ; voir tableau 3.3 | `3 mois` |
| Batterie | Pourcentage de santé | `Batterie : 82 %` |
| Quartier et ville | `Quartier, Ville` | `Mokolo, Yaoundé` |

Le formatage des prix et des dates est fait par l'interface (`Intl` avec la langue `fr-FR`), pas écrit en dur dans les textes. Le prix dans un lien WhatsApp utilise une espace normale, car l'espace insécable fine peut s'afficher de travers dans certaines applications.

---

## 3. Libellés des valeurs de la base

### 3.0 Vocabulaire public et vocabulaire interne ✅

Décision : pour l'acheteur, un prix n'est pas un « relevé » mais **un prix constaté en boutique**. Le mot « relevé » reste dans l'interface des **agents, des modérateurs et des propriétaires de boutique**, où il décrit l'objet qu'ils envoient ou examinent.

| Notion | Texte public (acheteur) | Texte interne (agent, modérateur, propriétaire) |
|---|---|---|
| L'observation d'un prix | un prix constaté en boutique | un relevé |
| Sa date | « constaté le 28/09 », « il y a 5 jours » | « relevé le 28/09 » |
| Son auteur, côté agent | « constaté par un agent » | « relevé par un agent » |
| Son auteur, côté boutique | « déclaré par la boutique » | « déclaré par la boutique » |
| Le statut en attente | (jamais visible) | « relevé en attente de vérification » |

Les documents 01 (section 4), 02 (section 4) et 05 (sections 4.1 et 4.2) sont alignés sur ce tableau (01 v0.3, 02 v0.3, 05 v0.4).

### 3.1 États du produit (`item_condition`) 🛠

| Valeur | Libellé |
|---|---|
| `new` | Neuf |
| `refurbished` | Reconditionné |
| `used` | Occasion |

### 3.2 Origine du prix (`source`) ✅

| Valeur | Libellé | Remarque |
|---|---|---|
| `agent` | Constaté par un agent | Côté agent et modérateur : « Relevé par un agent » |
| `shop` | Déclaré par la boutique | Même libellé partout |

### 3.3 Garantie, stock, configuration ❓

La garantie peut valoir `NULL` (non renseignée) ou `0` (aucune). Ce sont deux cas différents, à distinguer à l'écran.

| Donnée | Libellé |
|---|---|
| `warranty_months` = 0 | Aucune garantie |
| `warranty_months` = 1 | Garantie 1 mois |
| `warranty_months` > 1 | Garantie N mois |
| `warranty_months` vide | Garantie non précisée |
| `in_stock` vrai | En stock |
| `in_stock` faux | Hors stock (ligne grisée) |
| `reported_specs.ram_gb` | Mémoire : N Go |
| `reported_specs.storage_gb` | Disque principal : N Go |
| `reported_specs.battery_health_pct` | Batterie : N % |

Pour l'occasion et le reconditionné, la garantie « non précisée » est signalée en clair : c'est une information utile à l'acheteur. ❓ Si la garantie devient obligatoire hors neuf (document 02, section 10, point 5), ce libellé disparaît pour ces états.

### 3.4 Niveaux de contrôle (`check_level`) 🛠

Un acheteur ne voit **que** deux cas : pas d'alerte, ou l'alerte de la section 4.

| Valeur | Public | Agent, modérateur |
|---|---|---|
| `ok` | Aucune mention | Cohérent |
| `suspect` | Alerte « À vérifier » | À vérifier (possible) |
| `impossible` | Alerte « À vérifier » (même libellé) | Incohérent (impossible) |

Ne pas montrer au public la différence entre `suspect` et `impossible` : elle sert au tri des modérateurs, pas à l'acheteur, et un mot comme « impossible » serait lu comme un verdict.

### 3.5 Statut d'un relevé (`report_status`) 🛠

Vu par l'agent et par le propriétaire de boutique (jamais par le public, qui ne lit que les relevés publiés).

| Valeur | Libellé | Texte d'aide |
|---|---|---|
| `pending` | En attente de vérification | « Un modérateur va examiner ce relevé. » |
| `published` | Publié | « Ce relevé est visible par les acheteurs. » |
| `rejected` | Refusé | « Ce relevé n'est pas publié. Motif : (note du modérateur). » |

### 3.6 Autres statuts 🛠

| Objet | Valeur | Libellé |
|---|---|---|
| Boutique (`shop_status`) | `active` | Active |
| | `suspended` | Suspendue (n'apparaît plus dans les résultats) |
| Fiche produit (`product_status`) | `pending` | En attente de validation |
| | `approved` | Validée |
| | `rejected` | Refusée (la note est visible par le propriétaire) |
| Demande d'ajout de boutique (`request_status`) | `open` | En cours d'examen |
| | `done` | Boutique créée |
| | `rejected` | Refusée (la note est visible par l'agent) |
| Signalement (`flag_status`) | `open` / `reviewed` / `dismissed` | À traiter / Examiné / Classé (personnel seulement) |

### 3.7 Catégories (`product_category`) 🛠

| Valeur | Libellé |
|---|---|
| `laptop` | Portables |
| `prebuilt` | PC complets |
| `cpu` | Processeurs |
| `motherboard` | Cartes mères |
| `ram` | Mémoire (RAM) |
| `gpu` | Cartes graphiques |
| `storage` | Stockage (SSD, disques durs) |
| `psu` | Alimentations |
| `case` | Boîtiers |
| `cooler` | Refroidissement |
| `other` | Autres |

### 3.8 Badges ✅ ❓

| Badge | Libellé court | Infobulle (au toucher) |
|---|---|---|
| Boutique vérifiée | Vérifiée | « Un agent de PC Builder 237 a visité cette boutique. Ce badge ne s'achète pas. » |
| Origine | Constaté par un agent / Déclaré par la boutique | « Qui a constaté ou communiqué ce prix. » |
| Alerte | À vérifier | « Les spécifications annoncées ne correspondent pas aux configurations connues pour ce modèle. » |
| Stock | Hors stock | « Cette boutique n'avait pas ce produit en stock lors du dernier constat. » |

Chaque badge porte **un texte**, pas seulement une couleur ni une icône (document 05, section 6).

---

## 4. Texte d'alerte de cohérence ❓

### 4.1 Structure

Trois blocs, dans cet ordre :

1. **Titre** (fixe) : « Spécifications incohérentes, à vérifier »
2. **Raison** (une ou deux phrases, selon le contrôle déclenché, voir 4.2)
3. **Conseil** (fixe) : « Demandez à voir la machine et vérifiez la mémoire et le stockage avant de payer. »

Une ligne de pied, en petit : « Cette alerte vient d'une comparaison automatique avec la fiche du modèle. Elle ne signifie pas que la boutique a mal agi. »

Le **badge court** sur la ligne de prix est « À vérifier » ; le texte complet s'affiche au toucher ou sous la ligne.

### 4.2 Raisons

Les nombres entre crochets sont ceux du prix constaté et de la fiche du modèle. L'interface les insère ; ils ne sont jamais écrits à la main.

| Contrôle déclenché (document 02, section 2) 🛠 | Raison affichée |
|---|---|
| RAM absente de la liste autorisée (`suspect`) | « La mémoire annoncée ([N] Go) ne correspond pas aux configurations connues pour ce modèle. » |
| RAM supérieure au maximum (`impossible`) | « La mémoire annoncée ([N] Go) dépasse ce que le constructeur prévoit pour ce modèle ([MAX] Go au maximum). » |
| Stockage absent de la liste autorisée (`suspect`) | « Le stockage annoncé ([N] Go) ne correspond pas aux capacités habituelles pour ce modèle. » |
| Prix inférieur à 50 % de la médiane (`suspect`) | « Ce prix est nettement plus bas que les autres prix constatés pour ce produit. Vérifiez l'état exact et la configuration. » |

Règles d'assemblage :

- **Une seule raison** : on l'affiche seule.
- **Plusieurs raisons** : on affiche les deux premières, dans l'ordre du tableau, puis « D'autres points sont à vérifier. »
- Pour la RAM au-dessus du maximum, **c'est le maximum officiel de la fiche** qui est cité. Une mise à niveau non officielle est possible (document 06, section 2.3) : le texte dit « ce que le constructeur prévoit », pas « ce qui est possible ».

### 4.3 Ce que le texte public ne montre jamais ❓

- Le texte brut de `check_reason`. La vue publique `current_prices` ne le contient plus (patch contrat de données 🧫, décision n°9) ; il reste lisible par l'auteur du relevé et par le personnel dans `price_reports_visible` (par exemple « RAM annoncée 64 Go > maximum 32 Go pour ThinkPad T480 », « Prix très inférieur à la médiane récente (235 000 FCFA) »). C'est un texte **pour le personnel et l'agent** : trop sec pour le public, et il expose la médiane de prix. Le site public ne l'affiche jamais.
- Le nom de la boutique **dans** le texte d'alerte (il est déjà sur la ligne de prix).
- Les mots « arnaque », « faux », « fraude », « mensonge », « trompeur ».
- La différence `suspect` / `impossible` (section 3.4).

### 4.4 Codes de motif ✅ 🛠

Décision : le site choisit la raison d'après un **code**, pas d'après la phrase de `check_reason`. Le patch `pcbuilder237_reason_codes_patch.sql` 🛠 (écrit et exécuté sur le projet Supabase de test 🧫 ; version corrigée, celle du zip « 08 ») ajoute `price_reports.check_codes` (tableau de textes), rempli par le serveur et exposé dans `current_prices`.

| Code | Contrôle | Niveau | Texte public (section 4.2) |
|---|---|---|---|
| `ram_above_max` | RAM annoncée supérieure au maximum | `impossible` | « La mémoire annoncée ([N] Go) dépasse… » |
| `ram_not_allowed` | RAM absente de la liste autorisée | `suspect` | « La mémoire annoncée ([N] Go) ne correspond pas… » |
| `storage_not_allowed` | Stockage absent de la liste autorisée | `suspect` | « Le stockage annoncé ([N] Go) ne correspond pas… » |
| `price_low` | Prix inférieur à 50 % de la médiane | `suspect` | « Ce prix est nettement plus bas… » |

Règles d'utilisation :

- Un relevé `ok` a un tableau vide. `ram_above_max` et `ram_not_allowed` ne sont **jamais** donnés ensemble (le serveur ne retient que le premier, comme `check_reason`).
- Les nombres de la phrase viennent de `reported_specs` (RAM annoncée) et de `product_specs` (maximum), déjà présents dans la vue. La médiane n'est jamais nécessaire.
- **Code inconnu** (un futur code que le site ne connaît pas encore) ou **tableau vide avec un niveau différent de `ok`** (relevé créé avant le patch) : le site affiche le titre et le conseil **sans raison précise**. Il ne casse pas et n'invente rien.
- Ajouter une règle anti-arnaque demande trois choses : la règle dans le déclencheur, son code dans la contrainte `price_reports_check_codes_known` du patch, et sa phrase dans `fr.json`.
- Le champ `check_reason` reste en français pour le personnel et l'agent (section 6). Si l'anglais est ajouté plus tard, les codes évitent de retraiter les relevés existants (document 03, section 6.1).

### 4.5 Prix à alerte publié après examen ❓

Un modérateur peut publier un relevé `suspect` ou `impossible` (document 05, section 4.2). L'alerte reste affichée, avec le même texte. La vue `current_prices` n'indique pas qu'il a été examiné ; l'acheteur ne le sait donc pas. Variante possible plus tard, si la colonne est exposée : « Ce relevé a été examiné par un modérateur. » (décision n°5).

---

## 5. Messages WhatsApp pré-remplis

### 5.1 Règles de construction ❓

- Le lien est `https://wa.me/<numéro sans « + »>?text=<message encodé>` (document 03, section 4.4). L'interface encode le message (`encodeURIComponent`) ; les modèles ci-dessous sont écrits en clair.
- Le message est **modifiable** par l'acheteur avant l'envoi : il ne s'envoie pas tout seul.
- **Aucune donnée personnelle** de l'acheteur n'y est insérée (ni nom, ni numéro, ni position).
- Il rappelle **la date du constat** : un prix peut avoir changé depuis (« prix constaté le 28/09 »).
- Il se termine par **une question** simple et fermée.
- Longueur : 600 caractères au plus pour un produit ; voir 5.4 pour une liste.
- Le numéro de téléphone n'existe côté site que si la boutique est **contactable** (document 03, section 4.4 🛠). Sinon le bouton n'est pas affiché.

### 5.2 Un produit (cas principal) ❓

Modèle :

> Bonjour, j'ai vu sur PC Builder 237 : {marque} {modèle}, {état}, {mémoire} Go / {stockage}, {prix} FCFA (prix constaté le {jj/mm}). Est-il toujours disponible ?

Exemple (fictif) :

> Bonjour, j'ai vu sur PC Builder 237 : Lenovo ThinkPad T480, occasion, 16 Go / 256 Go, 235 000 FCFA (prix constaté le 28/09). Est-il toujours disponible ?

Variantes :

| Cas | Modification |
|---|---|
| Configuration inconnue (pas de `ram_gb` ou `storage_gb`) | Retirer le bloc « 16 Go / 256 Go » |
| Garantie renseignée | Ajouter avant la question : « Garantie annoncée : {N} mois. » |
| Produit neuf | « neuf » à la place de « occasion » ; pas de mention de batterie |
| Occasion ou reconditionné avec batterie renseignée | Ajouter : « Batterie annoncée : {N} %. » |
| Prix **avec alerte** (`suspect` ou `impossible`) | Remplacer la question par : « Pouvez-vous me confirmer la mémoire et le stockage de cette machine ? » |
| Ligne **hors stock** | Le bouton est remplacé par « Hors stock au dernier constat » (pas de message) ❓ |

Le message d'un prix avec alerte **ne reprend pas la configuration comme un fait** : on la présente comme « annoncée » et on demande confirmation. C'est utile à l'acheteur, et c'est neutre pour la boutique.

### 5.3 Devis d'une configuration (builder, phase 3) ❓

Modèle, boutique contactable qui a **tous** les composants :

> Bonjour, je prépare un PC avec PC Builder 237. Pouvez-vous me confirmer la disponibilité et le prix de ces composants ?
> - {composant 1} : {prix} FCFA
> - {composant 2} : {prix} FCFA
> …
> Total constaté le {jj/mm} : {total} FCFA. Le montage est-il possible ?

La dernière phrase n'apparaît que si la boutique propose le montage (`offers_assembly` 🛠).

Cas où **la boutique n'est pas contactable** ✅ : le devis part au contact du porteur du projet. Modèle :

> Bonjour, je souhaite un devis pour cette configuration préparée sur PC Builder 237 :
> - {liste}
> Total constaté le {jj/mm} : {total} FCFA. Boutique visée : {boutique, quartier, ville}.
> Lien de la configuration : {adresse /builder/slug}

Cas d'un **panier réparti sur plusieurs boutiques** ❓ (décision n°4) : proposition de départ : **un message par boutique**, avec seulement les composants qu'elle propose, plus un bouton « Envoyer le devis complet au contact PC Builder 237 ».

### 5.4 Longueur ❓

Un lien contient tout le message, encodé : les lettres accentuées prennent trois caractères. Au-delà d'environ 10 composants, le message est tronqué : « … et {N} autres composants : voir la configuration sur {adresse /builder/slug} ». Cela suppose que la configuration ait été sauvegardée et partagée (`builds`, `share_slug` 🛠).

### 5.5 Partage d'une configuration ❓

> Voici ma configuration PC sur PC Builder 237 : {adresse}

Le lien partagé affiche aussi un titre et une description pour l'aperçu WhatsApp (balises Open Graph, document 03, section 8) : « Configuration PC : {total} FCFA » et « {N} composants, prix constatés à {ville}. »

---

## 6. Formulaire de l'agent : libellés et aides ❓

Les clés sont celles de `reported_specs` 🛠. Le formulaire envoie des **nombres** (document 06, section 2.5).

| Champ | Libellé | Aide (sous le champ) |
|---|---|---|
| Boutique | Boutique | « Choisissez la boutique où vous êtes. Elle n'est pas dans la liste ? Demandez son ajout. » |
| Produit | Produit | « Cherchez le modèle exact. Il n'est pas dans la liste ? Prévenez un modérateur. » |
| `condition` | État | « Neuf, reconditionné ou occasion, tel que l'annonce la boutique. » |
| `price_fcfa` | Prix (FCFA) | « Le prix demandé, sans négociation. » |
| `in_stock` | En stock | « Cochez si la machine est là, devant vous. » |
| `warranty_months` | Garantie (mois) | « 0 si la boutique ne donne aucune garantie. Laissez vide si elle ne l'a pas dit. » |
| `ram_gb` | Mémoire (Go) | « La mémoire annoncée, ou celle que vous voyez dans les paramètres de la machine. » |
| `storage_gb` | Disque principal (Go) | « La capacité du disque principal. Un second disque ne se note pas ici. » |
| `battery_health_pct` | Batterie (%) | « Santé de la batterie si la boutique la donne. Facultatif. » |
| `proof_paths` | Photos de preuve | « Au moins une photo : l'étiquette de prix, ou la machine avec son prix. Une photo de l'écran montrant la mémoire est idéale. » |

Textes de contrôle avant envoi :

- Compression : « Réduction des photos en cours… »
- Succès : « Relevé envoyé. » Si publié aussitôt : « Il est visible par les acheteurs. » Sinon : « Il sera examiné par un modérateur. »
- Si le serveur le met en attente, l'agent voit la **raison technique** (texte de `check_reason`), car elle l'aide à corriger une faute de saisie : par exemple « RAM 10 Go non standard pour ThinkPad T480 ». Elle n'est pas réservée au personnel pour l'auteur du relevé. Elle se lit dans `price_reports_visible` (le patch contrat de données 🧫 retire `check_reason` de `current_prices` et ferme la lecture directe de `price_reports`) ; après l'insertion, ne demander que `id, status, check_level, check_codes` (document 09, section 7).

---

## 7. Messages d'erreur et d'état ❓

### 7.1 Situations générales (document 05, section 5)

| Situation | Message | Bouton |
|---|---|---|
| Chargement long (au-delà de 300 ms) | « Chargement… » avec squelettes de lignes | |
| Chargement très long (plus de 10 s) | « Cela prend plus de temps que prévu. La connexion est peut-être lente. » | Réessayer |
| Aucun résultat | « Aucun prix récent pour ce produit dans cette ville. Essayez l'autre ville ou un autre état. » (texte du document 05) | Changer de ville |
| Recherche sans résultat | « Aucun produit ne correspond à « {texte} ». Vérifiez l'orthographe ou cherchez la marque seule. » | |
| Erreur réseau | « Impossible de charger les prix. Vérifiez votre connexion et réessayez. » | Réessayer |
| Envoi interrompu | « L'envoi a été interrompu. Votre relevé est conservé, vous pouvez le renvoyer. » | Renvoyer |
| Session expirée (agent) | « Votre session a expiré. Reconnectez-vous, votre formulaire est conservé. » | Se reconnecter |
| Accès refusé (page protégée) | « Cette page est réservée. Connectez-vous avec un compte autorisé. » | Se connecter |
| Page introuvable | « Cette page n'existe pas ou a été déplacée. » | Retour à l'accueil |
| Panne de service | « Le service est momentanément indisponible. Réessayez dans quelques minutes. » | Réessayer |

### 7.2 Correspondance avec les erreurs du serveur ✅ 🛠

Décision : l'interface choisit le message d'après le **code d'erreur** (`error.code`), pas d'après le texte. Le patch `pcbuilder237_reason_codes_patch.sql` 🛠 (écrit et exécuté sur le projet Supabase de test 🧫) donne un code SQLSTATE de la classe `PB` aux erreurs des déclencheurs et fonctions que j'ai pu relire.

| Code | Erreur du serveur | Message affiché |
|---|---|---|
| `PB001` | produit inconnu ou inactif | « Ce produit n'est pas disponible. Choisissez un autre produit ou prévenez un modérateur. » |
| `PB002` | boutique inconnue ou suspendue | « Cette boutique n'est pas disponible pour le moment. » |
| `PB003` | chemin de preuve invalide | « Une photo n'a pas pu être enregistrée. Renvoyez-la et réessayez. » |
| `PB010` | note obligatoire pour rejeter une fiche produit | (personnel) « Ajoutez une note pour rejeter cette fiche. » |
| `PB011` | caractéristiques trop volumineuses | « Les caractéristiques sont trop longues. Raccourcissez-les. » |
| `PB012` | trop de fiches en attente (20) | « Vous avez déjà 20 fiches en attente de validation. Attendez leur examen avant d'en proposer d'autres. » |
| `PB013` | modification réservée au personnel (fiche produit) | « Cette fiche a été validée : seul le personnel peut la modifier. » |
| `PB020` | trop de demandes en cours (10) | « Vous avez déjà 10 demandes en cours. Attendez qu'elles soient traitées. » |
| `PB021` | modification réservée au personnel (demande) | « Cette demande ne peut être modifiée que par le personnel. » |
| `PB022` | note obligatoire pour refuser une demande | (personnel) « Ajoutez une note pour refuser cette demande. » |
| `PB023` | réservé au personnel (création de boutique) | « Cette action est réservée au personnel. » |
| `PB024` | demande inconnue | « Cette demande n'existe pas. » |
| `PB025` | demande déjà traitée | « Cette demande a déjà été traitée. » |
| `PB030` | droit insuffisant pour ce relevé | « Votre compte n'est pas autorisé à envoyer un relevé. Pour une boutique, un abonnement actif est nécessaire. » |
| `PB031` | modification réservée au personnel (fiche boutique) | « Le nom, le quartier, le statut et le badge de la boutique ne peuvent être modifiés que par le personnel. » |
| `PB032` 🧫 | note obligatoire pour rejeter un relevé (patch contrat de données) | (personnel) « Ajoutez une note pour rejeter ce relevé. » ❓ |
| `23505` + `price_reports_client_ref_key` 🧫 | relevé déjà envoyé (renvoi après coupure) | « Ce relevé a déjà été envoyé. » ❓ (l'interface le traite comme un succès, sans doublon) |
| `23514` + `price_reports_needs_proof` | contrainte « au moins une preuve » | « Ajoutez au moins une photo de preuve. » |
| `23514` + contrainte de `price_fcfa` | prix hors bornes | « Le prix doit être un nombre supérieur à zéro. » |
| `23514` + contrainte des signalements | motif de 5 à 1 000 caractères | voir section 8 |
| `23514` + `flags_has_target` | signalement sans boutique ni relevé visé | « Indiquez la boutique ou le prix concerné par votre signalement. » ❓ |
| `23514` + contrainte de `warranty_months` | garantie hors de 0 à 60 mois | « La garantie doit être comprise entre 0 et 60 mois. » ❓ |
| `23514` + `shops_phone_format` | numéro mal formé | « Le numéro doit commencer par +237, suivi de 9 chiffres commençant par 2 ou 6. » ❓ |
| `23505` + `products_unique` | doublon de produit | « Ce produit existe déjà dans le catalogue. » (fiche refusée : « Un produit de ce nom a déjà été refusé. Contactez le personnel. », document 03, décision n°8) |
| `42501` | refus par la sécurité de la base (RLS, droits de colonne) | « Cette action n'est pas autorisée pour votre compte. » |
| autre | erreur inconnue | « Une erreur est survenue. Réessayez ; si elle persiste, contactez-nous. » (le détail va au journal, pas à l'écran) |

Pour les contraintes `23514` et `23505`, le code seul ne suffit pas : l'interface lit aussi le **nom de la contrainte** dans le message renvoyé par la base (c'est un nom stable, pas une phrase rédigée).

**Limite** : les messages des outils admin (`grant_agent`, `revoke_agent`, `grant_shop_owner`, `revoke_shop_owner`, `record_subscription`) ne s'exécutent que depuis l'éditeur SQL : ils n'ont pas de code et n'apparaissent pas dans l'application (le patch « agents » est reçu ; il n'a aucune erreur visible de l'application). Même méthode si l'on en ajoute (numéros `PB040` et suivants).

### 7.3 Messages côté personnel (non publics) 🛠

Messages des fonctions et déclencheurs, réservés au personnel (interface d'administration) : « une note est obligatoire pour rejeter une fiche produit », « une note est obligatoire pour rejeter un relevé » 🧫, « une note est obligatoire pour refuser une demande », « réservé au personnel », « demande inconnue », « demande déjà traitée ». Ils sont compréhensibles tels quels ; l'interface les affiche sans transformation.

---

## 8. Signalement ❓

| Élément | Texte |
|---|---|
| Bouton | Signaler |
| Titre du formulaire | « Signaler ce prix » / « Signaler cette boutique » |
| Invitation | « Dites-nous ce qui ne va pas. Nous vérifions chaque signalement. » |
| Champ | « Que souhaitez-vous signaler ? » (de 5 à 1 000 caractères 🛠) |
| Aide | « Décrivez les faits : prix demandé en boutique différent du prix affiché, machine différente de l'annonce, etc. Pas d'insultes. » |
| Erreur, trop court | « Écrivez au moins 5 caractères. » |
| Erreur, trop long | « 1 000 caractères au maximum. » |
| Confirmation (document 05) | « Merci, nous vérifions. » |
| Limite de fréquence (document 03, section 4.4) | « Vous avez envoyé plusieurs signalements récemment. Réessayez plus tard. » |

Le texte de confirmation **ne dit rien sur la boutique visée** ni sur la suite donnée (document 05, section 4.6). Il n'est jamais promis de délai ❓ (le délai cible est ouvert, document 02, section 8).

---

## 9. Textes de modération (visibles par l'auteur) ❓

Ces notes sont écrites par les modérateurs. Elles sont visibles par l'agent ou le propriétaire (colonnes `review_note` 🛠). Elles sont **obligatoires** pour un rejet. Modèles pour gagner du temps et rester neutre :

### 9.1 Rejet d'un relevé

| Cas | Note |
|---|---|
| Preuve illisible | « Photo illisible. Renvoyez le relevé avec une photo nette de l'étiquette de prix. » |
| Preuve sans lien avec le produit | « La photo ne montre pas le produit ou son prix. » |
| Configuration incohérente et non justifiée | « Mémoire ou stockage incompatibles avec la fiche du modèle. Vérifiez la machine et renvoyez le relevé. » |
| Prix irréaliste | « Prix très éloigné des autres relevés. Vérifiez le prix et renvoyez le relevé. » |
| Doublon | « Un relevé identique est déjà publié. » |
| Boutique ou produit erroné | « Le produit ou la boutique ne correspond pas à la photo. » |

### 9.2 Rejet d'une fiche produit proposée par une boutique 🛠

| Cas | Note |
|---|---|
| Doublon | « Ce produit existe déjà : {nom du produit du catalogue}. » |
| Caractéristiques non conformes à la fiche constructeur | « Les valeurs de mémoire ou de stockage ne correspondent pas à la fiche constructeur. Corrigez-les. » |
| Informations insuffisantes | « Précisez la marque et le nom exact du modèle. » |
| Hors catalogue | « Ce produit ne fait pas partie du catalogue de départ pour l'instant. » |

### 9.3 Refus d'une demande d'ajout de boutique 🛠

| Cas | Note |
|---|---|
| Déjà présente | « Cette boutique existe déjà sous le nom : {nom}. » |
| Informations manquantes | « Adresse et téléphone manquants. Complétez la demande. » |
| Hors zone | « Cette boutique est en dehors de Yaoundé et de Douala. » |
| Non confirmée | « Nous n'avons pas pu confirmer l'existence de cette boutique. » |

Ces notes **ne doivent pas** contenir de jugement sur la personne (« vous avez menti ») ni d'accusation. Elles décrivent le problème et disent quoi faire.

---

## 10. Pages de confiance : texte de base ❓

Les pages sont décrites au document 05, section 3.9. Voici le **texte de départ**, à relire et à compléter avec les vraies pratiques du projet.

### 10.1 Accueil

- Accroche (document 05) : « Comparez les prix des PC et composants à Yaoundé et Douala »
- Sous-titre : « Prix constatés en boutique par des agents, avec preuves photo. Neuf, reconditionné et occasion. »
- Champ de recherche : « Cherchez un modèle (par exemple ThinkPad T480) »
- Choix de la ville : « Ville : Yaoundé / Douala »
- Bloc de confiance : « Comment sont constatés les prix ? Des agents visitent les boutiques et photographient les prix. Chaque prix indique sa date, son origine et son état. »

### 10.2 Comment ça marche

1. « Des agents constatent les prix en boutique et joignent une photo de preuve. »
2. « Le site compare la configuration annoncée (mémoire, stockage) avec les configurations connues du modèle. »
3. « Un prix incohérent est vérifié par un modérateur avant d'être publié. »
4. « Un prix constaté il y a plus de 45 jours n'est plus affiché. »
5. « Vous contactez la boutique directement par WhatsApp. PC Builder 237 ne vend pas et n'encaisse aucun paiement. »

Ce dernier point vient du périmètre v1 ✅ (pas de paiement intégré, pas de vente directe).

### 10.3 Ce que signifient les badges

Reprendre le tableau 3.8, avec une phrase par badge. Ajouter : « L'abonnement d'une boutique n'influence jamais le classement des prix. » (document 02, section 7 ❓)

### 10.4 Conseils pour acheter en sécurité (`/securite`)

Conseils généraux, vrais pour tout achat d'un PC d'occasion :

- Demandez à voir la machine et à l'allumer avant de payer.
- Vérifiez la mémoire et le stockage dans les paramètres du système, pas seulement sur l'étiquette.
- Vérifiez l'état de la batterie et le chargeur.
- Demandez la garantie **par écrit** (durée, ce qu'elle couvre).
- Comparez le prix avec celui des autres boutiques sur ce site.
- Un prix très bas par rapport aux autres est une raison de vérifier davantage, pas de se précipiter.
- Payez après avoir vérifié la machine, et gardez une preuve de paiement.

❓ Ces conseils sont génériques. Les adapter aux pratiques réelles du marché local (par exemple Mokolo à Yaoundé) avec les agents.

### 10.5 Avertissement sur les prix

> « Les prix affichés ont été constatés en boutique à la date indiquée. Ils peuvent avoir changé depuis. PC Builder 237 ne vend pas les produits : le prix final est celui de la boutique. »

Ce texte figure sur la fiche produit et dans le pied de page ❓.

---

## 11. Organisation technique des textes ❓

Le document 05 (section 6) recommande de ranger les textes dans des fichiers de traduction dès le départ, même avec le français seul en phase 1 ✅.

- **Un fichier par langue** (par exemple `messages/fr.json`), clés **stables** et hiérarchiques : `alert.title`, `alert.reason.ram_not_allowed`, `badge.verified.label`, `error.proof_missing`, `whatsapp.single_product`.
- **Variables nommées**, pas de concaténation : `"{brand} {model}, {condition}, {price} FCFA"`.
- **Pluriels** gérés par la bibliothèque (« 1 jour », « 5 jours »), pas à la main.
- **Aucun texte dans le code** des composants, sauf en tout début de développement.
- Les **libellés de la section 3** sont indexés par la valeur de la base (`condition.new`, `check_level.suspect`).
- Les **motifs d'alerte** (section 4.2) sont indexés par le code de motif si l'option B de la section 4.4 est retenue.

**État au 3 octobre 2026** : `messages/fr.json` est écrit (sections 3, 4, 5.2, 7 et 8 ; les formulaires, notes de modération et pages de confiance suivront avec leurs écrans). Un test (`src/lib/db/erreurs.cles.test.ts`) vérifie que chaque clé renvoyée par `mapError` existe. Textes ajoutés hors de ce document, à valider ❓ : `error.warranty_invalid`, `error.flag_reason_invalid`, `error.flag_target_missing`, `error.phone_invalid` ; `badge.best_price` (« Meilleur prix » et son infobulle) ; `contact.whatsapp` ; `product.seen`, `product.back` ; `stock.out_last` ; les libellés de connexion (`login.*`). Le message WhatsApp est assemblé par morceaux (`whatsapp.config`, `whatsapp.warranty`, `whatsapp.battery`, deux questions).

---

## 12. Décisions

| # | Question | Statut |
|---|---|---|
| 1 | Vouvoiement dans l'interface | ✅ décidé |
| 2 | Codes de motif (`check_codes`) et codes d'erreur plutôt que lecture des phrases du serveur | ✅ décidé, patch écrit 🛠 et exécuté sur la base de test 🧫 |
| 3 | Vocabulaire public : « prix constaté en boutique » ; « relevé » réservé à l'interface agent, modérateur et propriétaire (section 3.0) | ✅ décidé |
| 4 | Devis d'un panier réparti sur plusieurs boutiques : un message par boutique plus un devis complet au contact du projet (proposé), ou autre ? Numéro du porteur du projet à fournir | ❓ |
| 5 | Indiquer qu'un prix à alerte a été examiné par un modérateur ? Demande d'exposer une colonne dans la vue `current_prices` | ❓ |
| 6 | Garantie « non précisée » : l'afficher en clair (proposé) ou la rendre obligatoire hors neuf (document 02, section 10, point 5) ? | ❓ renvoyée à la **décision D7** (registre `00-ROADMAP-MAITRE.md`) |
| 7 | Les raisons techniques de mise en attente (`check_reason`) sont-elles montrées à l'agent auteur du relevé ? (proposé : oui, section 6) | ❓ |
| 8 | Ton des pages de confiance et des conseils de sécurité : à relire avec les agents et un juriste pour les mentions légales | ❓ |
| 9 | Retirer `check_reason` de la vue publique `current_prices` (il contient la médiane de prix) : l'agent et le personnel le lisent déjà dans `price_reports`. Recommandé ; la vue doit être recréée, donc à faire avec une autre modification de la vue | ✅ fait dans le patch contrat de données 🧫 (vérifié sur la base de test) |
| 10 | Aligner les documents 01, 02 et 05 sur le vocabulaire de la section 3.0 | ✅ fait (01 v0.3, 02 v0.3, 04 v0.4, 05 v0.4) |

---

## 13. Suite proposée

Voir `00-ROADMAP-MAITRE.md` (sections 4 et 7). Le fichier `fr.json` et le module de lecture sont faits (lot P0-4 terminé le 3 octobre 2026). Les patchs « codes de motif » et « adresse et horaires » sont exécutés dans la chaîne 1→9 sur la base de test (P0-1 ✅). Restent à valider les textes marqués ❓.
