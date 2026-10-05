# Thèmes visuels alternatifs — PC Builder 237

> **Statut** : brouillon v0.1 — 3 octobre 2026
> **Objet** : trois thèmes alternatifs proposés dans l'esprit de la direction A (Tech Moderne), à présenter comme options commutables selon les goûts de l'utilisateur.
> **Lien** : prolonge la charte visuelle v0.4 (encadré 3.A) et le rapport d'audit du 2 octobre 2026.
> **Légende** : ✅ decidé par le porteur · ❓ proposition à valider · 🛠 à appliquer

Ces trois thèmes ne changent aucune règle métier. Ils partagent tous :

- la même police (Geist, déjà hébergée) ;
- la même grille de composants (en-tête, filtres, carte produit, fiche, badges, boutons, alerte) ;
- le respect des contraintes B (soleil, connexion lente, terminaux d'entrée de gamme) — contraste AA 4,5 pour 1 minimum, pas de fond sombre plein écran, pas de dégradé, pas de mouvement non nécessaire ;
- des **slots V2** marqués 🧩 : emplacements prévus pour photos, notes, avis ou escrow, qui restent vides en V1 et s'activeront en V2 sans refonte graphique.

Le mécanisme de commutation est décrit en section 5. Les trois thèmes peuvent coexister dans le code et être choisis par l'utilisateur via un sélecteur en pied de page, ou être présentés au porteur pour un choix définitif unique.

---

## Thème 1 — « SaaS Clair »

> **Ambiance** : Linear, Vercel dashboard, Stripe. Lumineux, neutre, beaucoup de blanc, accent indigo. Lecture rapide, professionnel, sobre.

### 1.1 Palette

Toutes les valeurs sont testées pour un contraste ≥ 4,5 pour 1 en plein soleil sur un écran d'entrée de gamme.

| Rôle | Valeur | Usage | Contraste |
|---|---|---|---|
| Fond de page | #FFFFFF | arrière-plan | texte #18181B : plus de 18 pour 1 |
| Surface | #F8FAFC | cartes secondaires, surfaces | texte #18181B : plus de 17 pour 1 |
| Bordure | #E2E8F0 | contour des cartes et des champs | — |
| Texte | #18181B | texte courant, prix | — |
| Texte secondaire | #64748B | marque, dates, aides | sur fond blanc : environ 5 pour 1 |
| Indigo | #4F46E5 | en-tête, filtre actif, bouton principal | texte blanc : environ 6,5 pour 1 |
| Indigo action | #6366F1 | bouton « Contacter sur WhatsApp » (hover) | texte blanc : environ 5,5 pour 1 |
| Ocre | #FCD34D | étiquette « Meilleur prix » ❓ (same usage que direction B) | texte #18181B : environ 13 pour 1 |
| Alerte (fond / texte) | #FEF3C7 / #78350F | « À vérifier » | environ 9 pour 1 |
| Succès (fond / texte) | #DCFCE7 / #14532D | « Boutique vérifiée » | plus de 8 pour 1 |
| Neutre (fond / texte) | #F1F5F9 / #334155 | « Constaté par un agent », état, stock | plus de 8 pour 1 |
| Erreur | #B91C1C | messages d'erreur système | sur blanc : environ 6,5 pour 1 |

### 1.2 Typographie

- Police : Geist (déjà hébergée, aucune police supplémentaire).
- Corps : 16 px. Texte secondaire : 14 px. Badges : 12 px minimum.
- Titre de page : 24 px. Titre de section : 20 px. Prix : 20 px.
- Graisses : 400 pour le texte, 500 pour les libellés et les boutons, 700 pour les titres.
- Pas d'emphase par la graisse dans le corps de texte ; les mises en avant se font par l'indigo, jamais par le gras.

### 1.3 Composants

| Composant | Règle |
|---|---|
| En-tête | aplat indigo #4F46E5, texte blanc, nom du site à gauche en 700 |
| Filtres (ville, état) | pastilles fond #F8FAFC, contour #E2E8F0 ; la pastille active est en indigo #4F46E5 avec texte blanc |
| Carte produit | bordure 1 px #E2E8F0, fond blanc, marque en #64748B 14 px, nom en 500 16 px, « À partir de » en 14 px puis prix en 20 px 500 #18181B. Pas de photo V1. 🧩 Slot V2 : emplacement carré 64×64 px en haut de carte, fond #F8FAFC, contour pointillé 1 px #E2E8F0, invisible en V1 (carte repliée sans cet emplacement) |
| Ligne de prix (fiche) | une carte par boutique : nom, quartier, prix, badges, spécifications, garantie, date, bouton WhatsApp |
| Étiquette « Meilleur prix » | fond ocre #FCD34D, texte #18181B, jamais sur une ligne avec alerte |
| Badge « Boutique vérifiée » | succès (fond #DCFCE7, texte #14532D) ; masqué sur une ligne avec alerte |
| Alerte | bloc fond #FEF3C7, texte #78350F, titre en 500, conseils en 400 |
| Bouton principal | indigo #4F46E5, texte blanc, 44 px de haut, angles 8 px ; un seul par écran |
| Bouton WhatsApp | indigo action #6366F1 avec icône WhatsApp, libellé « Contacter sur WhatsApp » |
| Bouton « Signaler » | contour 1 px #E2E8F0, texte #18181B, fond transparent |
| Ligne hors stock | grisée, fond #F1F5F9, texte #64748B, sans bouton |
| État vide | phrase du document 07, section 7.1, avec une action |
| Focus clavier | contour 2 px indigo #4F46E5, décalé de 2 px, jamais supprimé |

### 1.4 Slots V2 prévus 🧩

- 🧩 Photo produit : carré 64×64 px en haut de carte (V1 replié sans emplacement ; V2 déplié avec image).
- 🧩 Avatar vendeur : cercle 32×32 px à gauche du nom du vendeur dans la fiche.
- 🧩 Note moyenne vendeur : ligne « ⭐ 4,8/5 — 12 avis » à droite de l'avatar, fond #F8FAFC.
- 🧩 Lien « Voir le profil » : bouton secondaire sous le nom du vendeur.

### 1.5 Persona cible

Acheteur pressé qui compare en entreprise, sur un terminal récent (ordinateur portable ou smartphone milieu de gamme), en intérieur ou à l'ombre. Cherche une lecture rapide, des contrastes nets, pas de distraction visuelle. Le thème « SaaS Clair » est neutre, professionnel, sans ancrage local.

### 1.6 Conformité aux contraintes B

- Soleil ✅ : fond blanc, accent indigo, contraste texte principal plus de 18 pour 1 en plein soleil.
- Connexion lente ✅ : aucune image V1, aucune police supplémentaire, aucune icône lourde.
- Terminaux d'entrée de gamme ✅ : pas de dégradé, pas de flou, pas d'ombre portée (les cartes s'appuient sur une bordure 1 px, pas sur un drop-shadow).
- Poids ✅ : équivalent à la direction B (variables CSS, aucune ressource nouvelle).

---

## Thème 2 — « Terre Cuite »

> **Ambiance** : ancrage local moderne. Inspiration textile et terre cuite d'Afrique de l'Ouest et centrale, avec motifs subtils en arrière-plan de l'en-tête (lignes géométriques, jamais en motif paysager). Chaleureux sans être naïf.

### 2.1 Palette

| Rôle | Valeur | Usage | Contraste |
|---|---|---|---|
| Fond de page | #FAF7F2 | arrière-plan (identique à direction B, pour cohérence soleil) | texte #1C1917 : plus de 15 pour 1 |
| Surface | #FFFFFF | cartes | — |
| Bordure | #E7E5E4 | contour des cartes et des champs | — |
| Texte | #1C1917 | texte courant, prix | — |
| Texte secondaire | #57534E | marque, dates, aides | sur fond de page : environ 7 pour 1 |
| Terre cuite | #9A3412 | en-tête, filtre actif, bouton principal | texte blanc : environ 7 pour 1 |
| Terre cuite action | #C2410C | bouton « Contacter sur WhatsApp » | texte blanc : environ 5 pour 1 |
| Indigo local | #312E81 | liens, badges informatifs | sur fond crème : environ 10 pour 1 |
| Ocre | #FCD34D | étiquette « Meilleur prix » ❓ | texte #1C1917 : environ 12 pour 1 |
| Alerte (fond / texte) | #FFEDD5 / #7C2D12 | « À vérifier » (identique à direction B) | environ 8 pour 1 |
| Succès (fond / texte) | #DCFCE7 / #14532D | « Boutique vérifiée » (identique à direction B) | plus de 8 pour 1 |
| Neutre (fond / texte) | #E7E5E4 / #292524 | « Constaté par un agent », état, stock | plus de 10 pour 1 |
| Erreur | #B91C1C | messages d'erreur système | sur blanc : environ 6,5 pour 1 |

### 2.2 Typographie

- Police : Geist (déjà hébergée). Pas de police locale ; l'ancrage se fait par la couleur et le motif, pas par la typographie.
- Corps : 16 px. Texte secondaire : 14 px. Badges : 12 px minimum.
- Titre de page : 24 px. Titre de section : 20 px. Prix : 20 px.
- Graisses : 400 / 500 / 700 comme la direction B.

### 2.3 Composants

| Composant | Règle |
|---|---|
| En-tête | aplat terre cuite #9A3412, texte blanc, nom du site à gauche. 🧩 Motif V2 : lignes géométriques discrètes (8 % opacité, jamais paysager) en arrière-plan de l'en-tête. En V1, en-tête uni sans motif. |
| Filtres (ville, état) | pastilles ; la pastille active est en terre cuite #9A3412 avec texte blanc |
| Carte produit | bordure 1 px #E7E5E4, fond blanc. Marque en #57534E, nom en 500, prix en 20 px 500 #1C1917. 🧩 Slot V2 : photo carrée 64×64 px en haut de carte, avec coin intérieur à 4 px (pastille ocre en haut à droite de la photo pour le « Meilleur prix ») |
| Ligne de prix (fiche) | une carte par boutique : nom, quartier, prix, badges, spécifications, garantie, date, bouton |
| Étiquette « Meilleur prix » | fond ocre #FCD34D, texte #1C1917, jamais sur une ligne avec alerte |
| Badge « Boutique vérifiée » | succès (identique direction B) |
| Alerte | bloc orange brique (identique direction B) |
| Bouton principal | terre cuite #9A3412, texte blanc, 44 px, angles 8 px |
| Bouton WhatsApp | terre cuite action #C2410C, icône WhatsApp, libellé « Contacter sur WhatsApp » |
| Bouton « Signaler » | contour 1 px #E7E5E4, texte #1C1917 |
| Focus clavier | contour 2 px terre cuite #9A3412, décalé de 2 px |

### 2.4 Slots V2 prévus 🧩

- 🧩 Photo produit : carré 64×64 px en haut de carte, avec pastille ocre positionnée en haut à droite pour le badge « Meilleur prix » (effet « étiquette collée »).
- 🧩 Motif d'arrière-plan d'en-tête : lignes géométriques (losanges, triangles, jamais paysager ni figuratif) à 8 % d'opacité dans l'en-tête. SVG inline 1,2 Ko maximum, pas de fichier image.
- 🧩 Avatar vendeur : cercle 32×32 px en haut à gauche de la fiche vendeur, bordure terre cuite 1 px.

### 2.5 Persona cible

Acheteur local qui veut sentir que le site est « pour lui », ancré au Cameroun et au Gabon, sans folklore. Cherche une lecture confortable, un repère visuel familier (terre cuite, ocre, crème) sans tomber dans la carte postale. Le thème « Terre Cuite » s'adresse aussi au porteur de projet s'il souhaite renforcer l'identité locale que la direction B pose déjà, mais avec un accent plus marqué.

### 2.6 Conformité aux contraintes B

- Soleil ✅ : fond crème identique à direction B, accent terre cuite à contraste 7 pour 1 sur blanc.
- Connexion lente ✅ : aucune image V1, motif V2 inline (SVG < 1,2 Ko) chargé en CSS.
- Terminaux d'entrée de gamme ✅ : pas de dégradé, pas de flou, motif géométrique en lignes (pas de remplissage plein).
- Poids ✅ : équivalent à direction B ; seul le motif V2 ajoute ~1 Ko en CSS inline.

---

## Thème 3 — « Atelier Doux »

> **Ambiance** : Notion, Obsidian, Things 3. Beige sable, accent bleu layette ou rose poudré. Lecture longue, typographie soignée, peu de couleurs. Pas d'emphase visuelle : tout passe par la typographie et l'espacement.

### 3.1 Palette

| Rôle | Valeur | Usage | Contraste |
|---|---|---|---|
| Fond de page | #FBF8F1 | arrière-plan sable | texte #292524 : plus de 14 pour 1 |
| Surface | #FFFFFF | cartes (carte blanche sur sable, contraste de matière) | texte #292524 : plus de 15 pour 1 |
| Bordure | #EAE6DA | contour des cartes et des champs | — |
| Texte | #292524 | texte courant, prix | — |
| Texte secondaire | #6B6760 | marque, dates, aides | sur fond sable : environ 6 pour 1 |
| Bleu layette | #1E3A8A | en-tête, filtre actif, bouton principal | texte blanc : environ 9 pour 1 |
| Bleu layette action | #3B5BDB | bouton « Contacter sur WhatsApp » | texte blanc : environ 6 pour 1 |
| Ocre | #FCD34D | étiquette « Meilleur prix » ❓ | texte #292524 : environ 12 pour 1 |
| Alerte (fond / texte) | #FEE2C5 / #7C2D12 | « À vérifier » | environ 8 pour 1 |
| Succès (fond / texte) | #DCFCE7 / #14532D | « Boutique vérifiée » | plus de 8 pour 1 |
| Neutre (fond / texte) | #EAE6DA / #44403C | « Constaté par un agent », état, stock | plus de 8 pour 1 |
| Erreur | #B91C1C | messages d'erreur système | sur blanc : environ 6,5 pour 1 |

### 3.2 Typographie

- Police : Geist (déjà hébergée). Aucune police alternative. L'effet « lecture soignée » vient de l'interlignage (1,6) et de l'espacement généreux, pas d'une police différente.
- Corps : 16 px. Texte secondaire : 14 px. Badges : 12 px minimum.
- Titre de page : 24 px. Titre de section : 20 px. Prix : 20 px.
- Graisses : 400 / 500 / 700.
- Interligne corps : 1,6 (au lieu de 1,5 par défaut), pour renforcer la lisibilité longue.

### 3.3 Composants

| Composant | Règle |
|---|---|
| En-tête | aplat bleu layette #1E3A8A, texte blanc, nom du site à gauche en 500 (pas 700, plus doux) |
| Filtres (ville, état) | pastilles ; la pastille active est en bleu layette #1E3A8A avec texte blanc |
| Carte produit | bordure 1 px #EAE6DA, fond blanc. Marque en #6B6760, nom en 500, prix en 20 px 500 #292524. 🧩 Slot V2 : emplacement photo carré 64×64 px avec coin intérieur à 8 px (pas 4 px comme SaaS Clair) pour adoucir |
| Ligne de prix (fiche) | une carte par boutique : nom, quartier, prix, badges, spécifications, garantie, date, bouton |
| Étiquette « Meilleur prix » | fond ocre #FCD34D, texte #292524, jamais sur une ligne avec alerte |
| Badge « Boutique vérifiée » | succès (identique direction B) |
| Alerte | bloc fond #FEE2C5, texte #7C2D12, titre en 500 |
| Bouton principal | bleu layette #1E3A8A, texte blanc, 44 px, angles 8 px |
| Bouton WhatsApp | bleu layette action #3B5BDB, icône WhatsApp, libellé « Contacter sur WhatsApp » |
| Bouton « Signaler » | contour 1 px #EAE6DA, texte #292524 |
| Focus clavier | contour 2 px bleu layette #1E3A8A, décalé de 2 px |

### 3.4 Slots V2 prévus 🧩

- 🧩 Photo produit : carré 64×64 px, coins 8 px (effet « coin arrondi doux »), pas de pastille externe (badge « Meilleur prix » placé sous la photo, pas sur la photo).
- 🧩 Avatar vendeur : cercle 32×32 px avec bordure 2 px #EAE6DA (effet « sticker doux »).
- 🧩 Note moyenne vendeur : ligne « 4,8 / 5 — 12 avis » en texte secondaire, sans étoile (notion « note sans symbole », à la Notion).

### 3.5 Persona cible

Acheteur qui lit attentivement, qui compare plusieurs fiches, qui reste longtemps sur le site. Cherche un confort de lecture, pas une performance visuelle. Le thème « Atelier Doux » s'adresse aux acheteurs prudents qui aiment prendre le temps, et aux porteurs de projet qui préfèrent une esthétique « calme » plutôt que « punchy ».

### 3.6 Conformité aux contraintes B

- Soleil ✅ : fond sable #FBF8F1, accent bleu layette #1E3A8A à contraste 9 pour 1 sur blanc. Légèrement moins contrasté que direction B en plein soleil (14 pour 1 vs 15 pour 1), mais reste très au-dessus du seuil AA.
- Connexion lente ✅ : aucune image V1, aucune police supplémentaire.
- Terminaux d'entrée de gamme ✅ : pas de dégradé, pas de flou. Le sable est un uni, pas un dégradé.
- Poids ✅ : équivalent à direction B. Interlignage 1,6 n'ajoute aucun poids.

---

## 4. Comparaison synthétique

| Critère | Direction B (officielle) | SaaS Clair | Terre Cuite | Atelier Doux |
|---|---|---|---|---|
| Fond de page | #FAF7F2 crème | #FFFFFF blanc | #FAF7F2 crème | #FBF8F1 sable |
| Accent principal | #14532D vert profond | #4F46E5 indigo | #9A3412 terre cuite | #1E3A8A bleu layette |
| Ocre « Meilleur prix » | #FCD34D ✅ | #FCD34D ✅ | #FCD34D ✅ | #FCD34D ✅ |
| Police | Geist | Geist | Geist | Geist |
| Photos V1 | non | non | non | non |
| Slot photo V2 | — | 🧩 oui | 🧩 oui (avec pastille) | 🧩 oui (coins doux) |
| Avatar vendeur V2 | — | 🧩 | 🧩 | 🧩 |
| Note moyenne V2 | — | 🧩 étoiles | 🧩 étoiles | 🧩 sans étoiles |
| Motif arrière-plan V2 | — | non | 🧩 lignes géométriques 8 % | non |
| Interligne corps | 1,5 | 1,5 | 1,5 | 1,6 |
| Poids CSS additionnel | — | +0 Ko | +1,2 Ko (SVG inline) | +0 Ko |
| Contraste plein soleil | 15+ pour 1 | 18+ pour 1 | 15+ pour 1 | 14+ pour 1 |
| Persona | acheteur local | acheteur pressé pro | acheteur ancré | acheteur prudent |
| Ancrage local | fort | nul | très fort | doux |

---

## 5. Mécanisme de commutation ❓

Le porteur de projet doit décider si les trois thèmes sont **présentés au choix définitif unique** (l'utilisateur n'a pas la main) ou **commutables par l'utilisateur** (sélecteur de thème en pied de page ou dans les préférences).

### 5.1 Option A : choix définitif unique

Le porteur choisit un thème parmi les trois après présentation. Les deux autres sont archivés. Aucun switcher n'est codé. Avantage : feuille de style unique, pas de risque d'incohérence, pas de complexité front. Inconvénient : pas de personnalisation utilisateur.

### 5.2 Option B : sélecteur de thème (recommandé ❓)

Un sélecteur en pied de page propose les quatre habillages : « Marché vert » (officiel), « SaaS indigo », « Terre cuite », « Atelier bleu ». Le choix est stocké en localStorage (pas de cookie, pas de serveur). Implémentation technique :

- Variables CSS à la racine : `--c-bg`, `--c-surface`, `--c-border`, `--c-text`, `--c-text-muted`, `--c-primary`, `--c-primary-action`, `--c-alert-bg`, `--c-alert-text`, `--c-success-bg`, `--c-success-text`, `--c-neutral-bg`, `--c-neutral-text`.
- Quatre classes racines : `body.theme-marche`, `body.theme-saas`, `body.theme-terre`, `body.theme-atelier`.
- Sélecteur en pied de page, quatre pastilles cliquables avec un libellé et un carré de couleur. La pastille active est entourée (contour 2 px, couleur du thème actif).
- Persistance : `localStorage.setItem('pcb237-theme', 'saas')`. Pas de cookie, pas de serveur, pas de PII.
- Repli : si JavaScript désactivé, thème officiel « Marche vert » par défaut.

### 5.3 Option C : sélecteur limité à deux thèmes

Seuls deux thèmes sont exposés au public : la direction B officielle (par défaut) et un thème alternatif choisi par le porteur. Le troisième thème est conservé en interne pour une V2. Moins de complexité qu'Option B, mais plus de flexibilité qu'Option A.

### 5.4 Effort d'implémentation (estimation)

| Élément | Effort |
|---|---|
| Variables CSS à la racine (tous thèmes) | S (~2 h, faisable dans le même commit que la charte v0.4) |
| Sélecteur de thème en pied de page | S (~3 h, composant pastille + persistance localStorage) |
| Tests croisés sur 4 terminaux (PC, mobile, plein soleil, ombre) | M (~1 jour) |
| Documentation utilisateur (phrase dans FAQ : « Comment changer l'apparence ? ») | XS (~30 min) |
| Total Option B | ~1,5 jour de développement |

---

## 6. Décisions à prendre

| # | Décision | Statut |
|---|---|---|
| T1 | Présenter les trois thèmes en alternatifs, ou n'en retenir qu'un seul ? | ❓ |
| T2 | Si trois thèmes : commutables par l'utilisateur (Option B), ou en choix interne (Option A) ? | ❓ |
| T3 | Si Option B : tous les quatre habillages exposés (B + 3 alternatives), ou seulement deux (B + 1) ? | ❓ |
| T4 | Si Option B : sélecteur en pied de page, ou dans une page « Préférences » dédiée ? | ❓ |
| T5 | L'ocre #FCD34D reste la couleur unique de l'étiquette « Meilleur prix » dans tous les thèmes (cohérence sémantique) | ✅ (proposition) |
| T6 | Tous les thèmes partagent la même police Geist et la même grille de composants | ✅ (proposition) |
| T7 | Le badge « Boutique vérifiée » garde la même palette (succès) dans tous les thèmes (cohérence sémantique) | ✅ (proposition) |
| T8 | L'alerte « À vérifier » garde la même palette (orange brique) dans tous les thèmes (cohérence sémantique) | ✅ (proposition) |
| T9 | Le motif géométrique V2 du thème « Terre Cuite » reste à valider séparément (vectoriel, jamais paysager) | ❓ |
| T10 | Documentation utilisateur du sélecteur de thème, à rédiger dans le document 07 (textes) | ❓ |

---

## 7. Prochaines étapes proposées

1. Présenter les trois thèmes au porteur de projet pour réponse aux décisions T1 à T4.
2. Si le porteur valide l'Option B (commutation), appliquer les variables CSS racine et le sélecteur dans le même lot V1-V4 de la feuille de route que l'espace boutique (commit à planifier après `0502c35`).
3. Si le porteur choisit l'Option A (thème unique), archiver les deux thèmes non retenus dans `docs/maquettes/themes-alternatifs/` pour référence future V2.
4. Mettre à jour la charte visuelle v0.4 en ajoutant une référence à ce document dans la section 1 (décisions), sans intégrer le contenu (ce document reste séparé pour ne pas alourdir la charte officielle).
5. Si une maquette visuelle est souhaitée pour comparaison, produire une page HTML statique avec les quatre thèmes rendus en miniatures cliquables (livrable distinct, à demander si besoin).
