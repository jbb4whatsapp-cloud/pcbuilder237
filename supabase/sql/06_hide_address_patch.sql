-- =====================================================================
-- PC Builder 237 : patch "adresse et horaires réservés"
-- À exécuter APRÈS pcbuilder237_schema.sql, pcbuilder237_shop_owner_patch.sql
-- et pcbuilder237_launch_patch.sql (il redéfinit la vue shops_public de ce dernier
-- et utilise shop_has_active_subscription(), shop_members, has_role(), is_staff()).
-- À TESTER D'ABORD SUR UN PROJET SUPABASE DE TEST. Rejouable.
-- NON EXÉCUTÉ par son auteur : écrit sans accès à une base.
--
-- Règle (document 05, section 3.4) : l'adresse et les horaires d'une boutique ne
-- sont donnés au public que si la boutique a un abonnement ACTIF. Contrairement au
-- numéro de téléphone, la période de lancement n'ouvre PAS ces deux champs : elle
-- ouvre seulement le contact WhatsApp.
--
-- Ils sont toujours donnés :
--   * au personnel (modérateur, admin) ;
--   * aux agents (ils ont besoin de l'adresse pour distinguer deux boutiques de
--     même nom lors d'un relevé) ;
--   * aux propriétaires liés à la boutique (shop_members), abonnement actif ou non.
-- Une boutique suspendue n'est donnée qu'au personnel.
--
-- Mécanisme (le même que pour shops.phone, patch lancement) :
--   * anon et authenticated perdent le droit de lire shops.address et
--     shops.opening_hours ;
--   * les fonctions shop_visible_address() et shop_visible_hours() appliquent la
--     règle avec leurs propres droits (security definer) ;
--   * la vue shops_public appelle ces fonctions ; ses colonnes, leur ordre et leurs
--     types ne changent pas : le site n'a rien à modifier, sauf qu'une valeur NULL
--     signifie « non visible » (utiliser la colonne subscribed pour afficher
--     « Adresse et horaires réservés aux boutiques abonnées »).
--
-- CONSÉQUENCES POUR LE DÉVELOPPEMENT
--   * Lire les boutiques par shops_public, jamais par "select *" sur shops (déjà
--     vrai depuis le patch lancement : le téléphone bloque déjà le "select *").
--   * Pas de "returning address" ni "returning opening_hours" après un insert ou
--     une mise à jour sur shops. Écrire ces champs reste permis.
--   * L'écran de saisie du propriétaire relit sa fiche par shops_public : il voit
--     ses valeurs puisqu'il est lié à la boutique.
--   * Si le formulaire de l'agent affiche l'adresse d'une boutique, il la lit par
--     shops_public (visible pour le rôle agent).
--
-- ATTENTION AU REJEU : la boucle de droits du patch lancement redonne la lecture de
-- toutes les colonnes de shops sauf phone et created_by. Rejouer pcbuilder237_launch_patch.sql
-- annule donc la section 2 de ce patch : le rejouer ensuite. Toute nouvelle colonne
-- ajoutée à shops est ouverte en lecture par la même boucle ; si elle est sensible,
-- l'ajouter à la liste d'exclusion ci-dessous.
--
-- Les champs offers_assembly et assembly_fee_fcfa (montage) restent publics : le
-- builder s'en sert pour ajouter le montage au total (document 02, section 6). Les
-- masquer est une décision à part (document 08, à écrire).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Fonctions de lecture contrôlée
-- ---------------------------------------------------------------------
-- Vrai si l'utilisateur courant a le droit de voir l'adresse et les horaires de cette
-- boutique, sans tenir compte du statut de la boutique.
create or replace function public.shop_details_visible(_shop uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_staff()
    or public.has_role('agent')
    or exists (select 1 from public.shop_members m
               where m.user_id = auth.uid() and m.shop_id = _shop)
    or public.shop_has_active_subscription(_shop)
$$;

create or replace function public.shop_visible_address(_shop uuid)
returns text language sql stable security definer set search_path = public as $$
  select s.address
  from public.shops s
  where s.id = _shop
    and (s.status = 'active' or public.is_staff())
    and public.shop_details_visible(s.id)
$$;

create or replace function public.shop_visible_hours(_shop uuid)
returns text language sql stable security definer set search_path = public as $$
  select s.opening_hours
  from public.shops s
  where s.id = _shop
    and (s.status = 'active' or public.is_staff())
    and public.shop_details_visible(s.id)
$$;

grant execute on function public.shop_details_visible(uuid) to anon, authenticated;
grant execute on function public.shop_visible_address(uuid) to anon, authenticated;
grant execute on function public.shop_visible_hours(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Retire la lecture directe des deux colonnes
--    (les droits d'écriture ne changent pas)
-- ---------------------------------------------------------------------
revoke select (address, opening_hours) on public.shops from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Vue shops_public : mêmes colonnes, même ordre, mêmes types que dans le
--    patch lancement ; address et opening_hours passent par les fonctions.
-- ---------------------------------------------------------------------
create or replace view public.shops_public with (security_invoker = true) as
select
  s.id, s.name, s.neighborhood_id,
  public.shop_visible_address(s.id) as address,
  s.status, s.is_verified,
  s.offers_assembly, s.assembly_fee_fcfa,
  public.shop_visible_hours(s.id)   as opening_hours,
  s.created_at,
  public.shop_visible_phone(s.id)           as phone,
  public.shop_contact_available(s.id)       as contactable,
  public.shop_has_active_subscription(s.id) as subscribed
from public.shops s;

grant select on public.shops_public to anon, authenticated;

commit;

-- =====================================================================
-- VÉRIFICATIONS À FAIRE SUR LA BASE DE TEST
--   Préparer : une boutique A avec abonnement actif, une boutique B sans abonnement,
--   toutes deux avec adresse et horaires renseignés ; période de lancement OUVERTE.
--
--   * visiteur anonyme, shops_public : A donne adresse et horaires, B donne NULL pour les deux ;
--   * B : le téléphone est toujours visible (période de lancement), adresse et horaires non ;
--   * visiteur anonyme : "select address from public.shops" -> permission refusée ;
--   * visiteur anonyme : "select opening_hours from public.shops" -> permission refusée ;
--   * compte connecté sans rôle (y compris anonyme Supabase) : même résultat que le visiteur ;
--   * agent : B donne adresse et horaires ;
--   * modérateur ou admin : B donne adresse et horaires, y compris une boutique suspendue ;
--   * propriétaire de B (abonnement expiré) : voit ses propres adresse et horaires dans
--     shops_public, mais pas ceux d'une autre boutique non abonnée ;
--   * propriétaire abonné : peut modifier adresse et horaires (update sans "returning") ;
--   * après abonnement actif de B (record_subscription) : B devient visible, sans autre action ;
--   * après expiration de l'abonnement de B : B redevient masquée, sans autre action ;
--   * une boutique suspendue : absente de shops_public pour le public ;
--   * le site lit toujours shops_public sans erreur ; current_prices fonctionne comme avant ;
--   * après avoir rejoué le patch lancement : refaire le premier test (il doit échouer),
--     puis rejouer ce patch.
-- =====================================================================
