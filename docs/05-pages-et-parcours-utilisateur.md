# Pages et parcours utilisateur — PC Builder 237

> **Statut** : brouillon v0.4 — 2 octobre 2026 (décisions des sections 9 et 10 intégrées)
> **Historique** : v0.4 — vocabulaire public « constaté par un agent » ; renvois aux décisions D4 (photos) et D7 (garantie) ; connexion anonyme précisée pour le signalement ; note de rejet obligatoire imposée par la base 🧫.
> **Légende** : ✅ décidé par le porteur du projet · 🛠 déjà en place (schéma SQL, site actuel) · ❓ proposition à valider · 🧫 vérifié sur le projet Supabase de test

Ce document décrit ce que voit et fait chaque type d'utilisateur. Il s'appuie sur les documents 01 (vision), 02 (règles métier), 03 (architecture) et 04 (feuille de route). Les prix et noms de produits cités en exemple sont fictifs.

---

## 1. Principes

1. ❓ **Mobile d'abord.** La plupart des acheteurs et tous les agents utilisent un téléphone, souvent avec une connexion lente ou instable. Chaque page doit être utilisable sur un écran étroit et rester légère.
2. ❓ **Le résultat avant le formulaire.** Le site actuel s'arrête après quatre menus déroulants sans rien afficher. Une recherche doit toujours aboutir à un résultat, ou à un message vide explicite.
3. ✅ **Chaque prix montre sa fiabilité** : état, garantie, date, origine (« constaté par un agent » ou « déclaré par la boutique »).
4. ✅ **L'abonnement n'influence jamais l'ordre des prix** (documents 01 et 02).
5. ❓ **Vocabulaire neutre.** Jamais « arnaque » à propos d'une boutique ou d'un relevé. Le texte public est « spécifications incohérentes, à vérifier ».
6. ✅ **WhatsApp est l'action principale.** C'est le canal d'achat réel. Pendant la période de lancement, toutes les boutiques sont contactables ; ensuite, le contact est réservé aux boutiques abonnées (décisions 1 et 7).
7. ❓ **Aucune impasse.** Chaque page propose une suite : autre état, autre quartier, autre boutique, signaler, retour.

---

## 2. Parcours par profil

### 2.1 Acheteur de portable (parcours principal) ❓

| Étape | Ce que fait l'acheteur | Ce que fait le site |
|---|---|---|
| 1 | Arrive depuis un lien partagé sur WhatsApp ou une recherche Google | Page d'accueil ou fiche produit directe |
| 2 | Choisit sa ville (Yaoundé ou Douala) | Mémorise le choix sur l'appareil |
| 3 | Cherche un modèle (« ThinkPad T480 ») ou parcourt les portables | Propose recherche et liste ; filtres par état, budget, quartier |
| 4 | Ouvre la fiche d'un modèle | Affiche les prix par boutique, triés par prix croissant |
| 5 | Compare : état, garantie, date du relevé, origine | Signale les écarts de spécifications, grise les prix hors stock |
| 6 | Contacte une boutique | Ouvre WhatsApp avec un message pré-rempli. Après la période de lancement, boutique non abonnée : nom et quartier seulement, pas de bouton de contact ✅ |
| 7 | (Optionnel) Signale une incohérence | Formulaire court, sans compte à créer : une connexion anonyme Supabase est ouverte au premier signalement (décision D10 ❓) |

**Réussite** : l'acheteur identifie la boutique qui l'intéresse et la contacte (toute boutique pendant le lancement, ensuite les abonnées) en moins de trois écrans après son arrivée.

### 2.2 Acheteur qui assemble un PC ❓ (phase 3)

| Étape | Ce que fait l'acheteur | Ce que fait le site |
|---|---|---|
| 1 | Ouvre le builder, choisit sa ville | Liste des catégories de composants |
| 2 | Ajoute un processeur, puis une carte mère… | Filtre les options incompatibles avec les choix déjà faits |
| 3 | Voit le total en FCFA | Total en deux vues : une seule boutique, ou panier le moins cher |
| 4 | Lit les erreurs et avertissements | Message clair par règle (socket, RAM, alimentation, boîtier…) |
| 5 | Sauvegarde ou partage | Compte ou connexion anonyme pour sauvegarder ; lien de partage 🛠 |
| 6 | Demande un devis | WhatsApp avec la liste des composants pré-remplie |

### 2.3 Agent de terrain 🛠 ❓

| Étape | Ce que fait l'agent | Ce que fait le site |
|---|---|---|
| 1 | Se connecte avec son identifiant et son code agent | Ouvre l'écran de relevé |
| 2 | Choisit la boutique dans la liste (seul le personnel crée une boutique ✅) | Liste filtrée par quartier. Boutique absente : l'agent envoie une demande d'ajout au personnel (nom, quartier, adresse, téléphone, note) et suit son état : en attente, créée, refusée avec la note 🛠 |
| 3 | Choisit le produit, l'état, le prix, le stock, la garantie | Champs obligatoires selon l'état (garantie : **décision D7 ❓**, document 02, section 10, point 5) |
| 4 | Renseigne la configuration réellement annoncée (RAM, stockage, batterie…) | Champs adaptés à la catégorie |
| 5 | Photographie les preuves | Compression avant envoi, aperçu, au moins une photo obligatoire 🛠 (deux pour l'occasion et le reconditionné : **décision D4 ❓**, document 08, section 5.3) |
| 6 | Envoie | Confirmation claire : « publié » ou « envoyé pour vérification » |
| 7 | Enchaîne avec un autre produit dans la même boutique | Garde la boutique sélectionnée |

Pour le MVP, ce rôle est tenu par le porteur du projet (Yaoundé d'abord, Douala ensuite ✅).

**Contraintes terrain** : envoi qui reprend après une coupure de réseau, brouillon conservé si l'envoi échoue, aucun formulaire perdu sur un rechargement ❓.

### 2.4 Modérateur 🛠 ❓
1. Ouvre la file des relevés en attente, triée du plus ancien au plus récent.
2. Voit pour chacun : produit, boutique, prix, configuration annoncée, raison du contrôle, photos de preuve, historique de l'agent.
3. Publie ou rejette, avec une note obligatoire en cas de rejet (imposée par la base : `PB032` 🧫).
4. Valide ou rejette les fiches produit proposées par les boutiques, après comparaison avec la fiche constructeur ✅.
5. Traite ensuite les signalements ouverts.
6. Traite les demandes d'ajout de boutique : création en un geste ou refus avec note 🛠.

### 2.5 Propriétaire de boutique abonnée 🛠 ❓ (phase 4)
1. Se connecte ; voit l'état de son abonnement (actif, date de fin).
2. Modifie sa fiche : téléphone, adresse, horaires, tarif de montage. Il ne peut pas changer le nom, le quartier, le statut ni le badge « vérifié » 🛠.
3. Envoie un relevé (même formulaire que l'agent, origine « boutique »). Il est toujours modéré 🛠.
4. Produit absent du catalogue : propose une fiche produit ✅. Elle reste en attente, invisible du public, jusqu'à la validation d'un modérateur ; il la corrige tant qu'elle est en attente, et voit la note en cas de rejet.
5. Suit l'état de chacun de ses relevés : en attente, publié, rejeté avec la note.
6. Consulte ses statistiques de vues et de contacts.
7. Abonnement expiré : il voit ses données mais ne peut plus envoyer ni modifier 🛠, avec un message expliquant comment renouveler.

### 2.6 Admin 🛠 ❓
Gère les boutiques (statut, badge « vérifié » après visite d'un agent), les produits (dont les valeurs autorisées de RAM et de stockage), les agents, les liens compte-boutique et les abonnements. Au démarrage, ces actions passent par des fonctions SQL (`grant_agent`, `grant_shop_owner`, `record_subscription`) 🛠 ; une interface vient ensuite.

---

## 3. Pages

### 3.1 Accueil `/` ❓
- **Objectif** : amener à une fiche produit en un geste.
- **Contenu** : accroche orientée bénéfice (exemple : « Comparez les prix des PC et composants à Yaoundé et Douala »), choix de la ville, champ de recherche, portables en vedette, lien vers le builder (quand disponible), bloc de confiance (comment les prix sont relevés).
- **États** : liste de vedettes vide → remplacée par les catégories ; erreur de chargement → message avec bouton « Réessayer ».
- **Remplace** la page actuelle à quatre menus déroulants ; la logique pays → ville → quartier → modèle devient un enchaînement facultatif de filtres.

### 3.2 Liste des produits `/produits` ❓
- **Filtres** : catégorie, état, fourchette de prix, marque, quartier ; pour les portables, RAM et stockage.
- **Tri** : prix croissant par défaut (le prix « à partir de » d'un produit est le meilleur prix de l'état filtré, règle du document 02, section 3).
- **Carte produit** : nom, spécifications clés, « à partir de X FCFA », nombre de boutiques, date du relevé le plus récent.
- Pagination ou chargement progressif ; indicateur de chargement visible.

### 3.3 Fiche produit `/produits/[id]` ❓
- **En-tête** : nom, spécifications du modèle, filtre par état (neuf, reconditionné, occasion).
- **Tableau des prix** : une ligne par relevé publié (voir le composant « ligne de prix », section 4).
- **Ordre** : en stock par prix croissant, puis hors stock grisés.
- **Historique des prix** : ✅ plus tard, hors v1.
- **Actions** : contacter la boutique, signaler, partager le lien.
- **Aucun relevé** : « Aucun prix récent pour ce produit dans cette ville. Essayez l'autre ville ou un autre état. »
- **Données structurées** : `AggregateOffer` avec fourchette de prix (document 03, section 9).

### 3.4 Fiche boutique `/boutiques/[id]` ❓
| Élément | Boutique non abonnée | Boutique abonnée |
|---|---|---|
| Nom, quartier | ✔ | ✔ |
| Prix relevés par les agents, avec date et état | ✔ | ✔ |
| Badge « boutique vérifiée » | ✔ si visite d'un agent | ✔ si visite d'un agent |
| Contact WhatsApp depuis le site | ✔ pendant le lancement, ✗ ensuite ✅ | ✔ |
| Adresse, horaires, services, montage | | ✔ |
| Statistiques publiques | | ❓ |

Le contenu exact pour une boutique non abonnée est la question ouverte n°3 du document 01. Le tableau reprend la proposition de départ.

### 3.5 Builder `/builder` et `/builder/[slug]` ❓ (phase 3)
- Une étape par catégorie, avec un récapitulatif fixe (en bas sur mobile) : composants choisis, total, nombre d'erreurs et d'avertissements.
- Une erreur bloque le devis ; un avertissement informe sans bloquer (document 02, section 5).
- Le total propose les deux vues ; la disponibilité et la date du relevé sont affichées pour chaque ligne.
- `/builder/[slug]` : configuration partagée, en lecture, avec bouton « Copier cette configuration ».

### 3.6 Espace agent `/agent` 🛠 ❓
Écran de relevé (parcours 2.3), liste de mes relevés avec leur statut. Pas d'accès aux relevés des autres agents.

### 3.7 Espace boutique `/boutique` 🛠 ❓
Tableau de bord (abonnement, relevés, statistiques), édition de la fiche, formulaire de relevé, proposition de produit et suivi de ses fiches (en attente, validée, rejetée avec la note).

### 3.8 Administration `/admin` 🛠 ❓
Modération des relevés et des fiches produit, signalements, boutiques, produits, agents, abonnements. Les routes sont protégées côté serveur ; l'interface s'ajuste au rôle (modérateur : modération et boutiques ; admin : tout).

### 3.9 Pages de confiance et pages légales ❓
`/comment-ca-marche` (comment les prix sont relevés, ce que signifie chaque badge), `/securite` (conseils pour acheter en toute sécurité, contrôle des spécifications), `/a-propos`, `/contact`, mentions légales, confidentialité, conditions d'utilisation. Elles sont liées depuis le pied de page de chaque page.

---

## 4. Composants transverses

### 4.1 Ligne de prix ❓
Chaque relevé affiche, dans cet ordre :

1. **Prix** en FCFA, lisible en gros.
2. **Boutique** et quartier, avec le badge « vérifiée » si applicable.
3. **État** : neuf, reconditionné, occasion.
4. **Garantie** : « 3 mois », « Aucune garantie ».
5. **Configuration annoncée** si elle diffère du modèle de base (RAM, stockage, batterie).
6. **Date** : « constaté il y a 5 jours ».
7. **Origine** : « constaté par un agent » ou « déclaré par la boutique ».
8. **Stock** : en stock, ou « hors stock » (ligne grisée).
9. **Alerte** si `check_level` ≠ `ok` (voir 4.3).
10. **Actions** : « Contacter sur WhatsApp » (toute boutique pendant le lancement, ensuite les abonnées uniquement ✅), « Signaler ».

### 4.2 Badges ❓
| Badge | Sens | Règle |
|---|---|---|
| Vérifiée | La boutique a reçu la visite d'un agent | S'obtient, ne s'achète pas ✅ |
| Constaté par un agent / Déclaré par la boutique | Origine du prix | Toujours affiché |
| Hors stock | Non disponible | Ligne grisée, hors du calcul du meilleur prix |
| Spécifications incohérentes, à vérifier | Contrôle `suspect` ou `impossible` | Jamais combiné avec « vérifiée » ni « meilleur prix » |

✅ Il n'y a **pas** d'étiquette « prix ancien » : un relevé est affiché avec sa date jusqu'à 45 jours, puis il disparaît (règle 🛠 du document 02). La date reste toujours visible.

Un relevé `suspect` peut être publié par un modérateur après examen ; il apparaît alors avec l'alerte, sans être présenté comme meilleur prix ❓ (document 02, section 2).

### 4.3 Texte d'alerte ❓
> « Spécifications incohérentes, à vérifier. La mémoire annoncée ne correspond pas aux configurations connues pour ce modèle. Demandez à voir la machine avant de payer. »

Le texte est adapté à la raison (RAM, stockage, prix inhabituellement bas) mais ne désigne jamais la boutique comme fautive.

### 4.4 Choix de la ville ❓
Deux villes au lancement ✅. Choix mémorisé, modifiable depuis l'en-tête de chaque page. Les prix d'une autre ville ne sont jamais mélangés dans les résultats.

### 4.5 Bouton WhatsApp ❓
Message pré-rempli (exemple fictif) :

> « Bonjour, j'ai vu sur PC Builder 237 : Lenovo ThinkPad T480, occasion, 16 Go / 256 Go, 235 000 FCFA (prix constaté le 28/09). Est-il toujours disponible ? »

Pendant la période de lancement, le bouton apparaît pour toutes les boutiques ; ensuite, pour les boutiques abonnées seulement ✅. Le lien utilise le numéro sans le `+` (document 03, section 4.4). Pour le builder, le message contient la liste des composants avec leurs prix. ✅ Si la boutique n'est pas contactable, le devis est envoyé au contact du porteur du projet (numéro à renseigner, ❓). Cas d'un panier réparti sur plusieurs boutiques : ❓ à trancher.

### 4.6 Signalement ❓
Formulaire court : cible (boutique ou relevé), motif de 5 à 1000 caractères 🛠. Confirmation neutre : « Merci, nous vérifions. » Aucun retour sur l'identité de la boutique visée.

### 4.7 Droit de réponse ✅ après la période de lancement (détails ❓)
Une boutique concernée par une alerte ou un signalement peut répondre, et sa réponse est **visible** sous l'alerte. Proposition :
- réponse courte (limite de caractères), relue par un modérateur avant affichage ;
- boutique abonnée : elle répond depuis son espace ;
- boutique non abonnée (elle n'a pas de compte ✅) : elle écrit au personnel, qui enregistre la réponse ;
- la réponse est rattachée au relevé concerné et disparaît avec lui ;
- jamais d'identité du signalant.

---

## 5. États, erreurs et connexion lente ❓

| Situation | Comportement |
|---|---|
| Chargement | Indicateur visible dès 300 ms ; squelettes de lignes plutôt qu'une page vide |
| Aucun résultat | Message explicatif et suggestions (autre état, autre quartier, autre ville) |
| Erreur réseau | Message en français courant avec bouton « Réessayer » ; jamais de page blanche |
| Envoi de relevé interrompu | Brouillon conservé, reprise manuelle ; pas de doublon à la reprise |
| Relevé refusé par le serveur | Message précis (« boutique suspendue », « preuve manquante ») |
| Session expirée (agent) | Reconnexion sans perdre le formulaire |
| Images | Chargement différé, formats compressés ; photos de preuve réduites avant envoi |

---

## 6. Accessibilité et langue ❓

- Chaque champ a un libellé visible associé (le site actuel n'en a aucun).
- Contrastes suffisants, zones tactiles confortables, navigation au clavier.
- Les badges ne reposent pas sur la couleur seule : texte ou icône avec libellé.
- `lang="fr"` ; prix formatés à la française (« 235 000 FCFA »).
- ✅ **Français seulement en phase 1.** La version anglaise est reportée (date non fixée). ❓ Ranger dès maintenant les textes de l'interface dans des fichiers de traduction, pour ne pas tout reprendre le jour où l'anglais sera ajouté.

---

## 7. Mesure de l'usage ❓

Événements à enregistrer, sans données personnelles : vue de fiche produit, vue de fiche boutique, clic « Contacter sur WhatsApp » (par boutique), recherche sans résultat, signalement envoyé, relevé envoyé par un agent.

Ils servent à : repérer les produits cherchés mais sans prix (priorité de collecte), alimenter les statistiques des boutiques abonnées (phase 4), et mesurer la réussite du parcours principal (contact en moins de trois écrans).

---

## 8. Écarts avec le site actuel

| Aujourd'hui | Cible |
|---|---|
| Quatre menus sans libellé, aucun résultat | Recherche + liste + fiche produit |
| Formulaire agent factice | Envoi réel avec preuves, retours clairs |
| Page admin ouverte | Routes protégées côté serveur, interface par rôle |
| Aucun menu, aucun pied de page | En-tête (ville, recherche, builder) et pied de page (confiance, légal) |
| Badge « ANTI-ARNAQUE » seul | Fonctions visibles : date, origine, preuve, alerte de cohérence, signalement |
| Pas de retour pendant le chargement | Indicateurs et états d'erreur |

---

## 9. Décisions prises ✅

| # | Question | Décision |
|---|---|---|
| 1 | Boutique non abonnée contactable par WhatsApp depuis le site ? | **Non, sauf pendant la période de lancement** (voir 7) |
| 2 | Étiquette « prix ancien » avant les 45 jours ? | **Non.** Seule la règle des 45 jours s'applique |
| 3 | Qui crée une boutique ? | **Le personnel seulement** |
| 4 | Historique des prix public | **Plus tard** |
| 5 | Version anglaise | **Annulée pour la phase 1 : français seulement** |
| 6 | Droit de réponse visible pour une boutique concernée par un signalement | **Oui, après la période de lancement** |
| 7 | Contact au lancement | **Ouvert à toutes les boutiques pendant la période de lancement** ; devis du builder envoyé au contact du porteur du projet si la boutique n'est pas contactable |

---

## 10. Points restant à traiter ❓

1. **Période de lancement.** Le réglage existe 🛠 (`launch_settings`, patch lancement) : une date de fin, modifiable à tout moment ; sans date, le contact reste ouvert. **Reste à décider : la durée.**
2. **Numéro du porteur du projet** pour les devis du builder, et comportement d'un devis qui concerne plusieurs boutiques.
3. **Demande d'ajout de boutique** : la table `shop_requests` existe 🛠 (patch lancement). Restent à concevoir l'écran de l'agent et l'écran de traitement.
4. **Droit de réponse** : à préparer après la période de lancement. Table de réponses rattachées aux relevés, modération, saisie par le personnel pour une boutique sans compte. Le patch SQL sera écrit à ce moment-là.
5. **Anglais** : reporté. Le motif des contrôles (`check_reason`) reste écrit en français dans la base, pour le personnel et l'agent ; le public lit les codes de motif (`check_codes`, document 07, section 4.4), donc l'anglais n'exigera pas de retraiter les relevés (document 03, section 6.1).
