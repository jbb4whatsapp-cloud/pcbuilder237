-- =====================================================================
-- PC Builder 237 : patch "contrat de données" (document 09, v0.2)
-- À exécuter APRÈS tous les autres patchs, dans cet ordre :
--   schéma -> agents -> propriétaire -> produits -> lancement
--   -> adresse et horaires -> codes de motif -> config_hash -> CE PATCH
-- À TESTER D'ABORD SUR UN PROJET SUPABASE DE TEST. Rejouable.
-- NON EXÉCUTÉ sur Supabase : vérifié seulement sur une base PostgreSQL 16
-- locale, avec des simulations des schémas auth et storage.
--
-- Contenu (changements du document 09, section 12) :
--   C1  city_id ajouté à la fin de current_prices et de shops_public
--   C2  config_hash ajouté à la fin de current_prices
--   C3  check_reason retiré de current_prices ET lecture de price_reports
--       fermée par droits de colonne ; vue price_reports_visible pour les
--       auteurs, les propriétaires de boutique et le personnel
--   C5  price_reports.client_ref : un renvoi après coupure ne crée pas de doublon
--   C8  note obligatoire quand un relevé passe à 'rejected' (PB032)
--   C9  flags.status forcé à 'open' à l'insertion
--
-- Décisions du document 09 (section 15) prises ici par défaut, à confirmer :
--   n°1 (C1), n°2 (C3), n°6 (C5), n°11 (C8 et C9).
-- C4, C6 et C7 ne sont PAS dans ce patch.
--
-- CONSÉQUENCES POUR LE SITE (à reporter dans le document 09)
--   * Nouvelle vue public.price_reports_visible : elle remplace la lecture
--     directe de price_reports pour tout ce qui touche à check_reason,
--     proof_paths, reported_by, reviewed_*, review_note, client_ref.
--     Écrans concernés : espace agent, espace boutique, file de modération.
--   * Lire price_reports directement : seules ces colonnes restent ouvertes
--     (anon et authenticated) : id, product_id, shop_id, condition,
--     price_fcfa, in_stock, warranty_months, reported_specs, config_hash,
--     check_level, check_codes, status, source, reported_at.
--     "select *" sur price_reports échoue donc pour tout le monde.
--   * Après un insert sur price_reports, ne demander avec .select() que
--     des colonnes ouvertes (status, check_level, check_codes, id). Le
--     motif en français (check_reason) se relit dans price_reports_visible.
--   * Après un update par le personnel, pas de .select() sur la table :
--     relire par price_reports_visible.
--   * Toute colonne ajoutée plus tard à price_reports reste FERMÉE par
--     défaut ; l'ouvrir explicitement (grant select (col)) si elle est publique.
--
-- ATTENTION AU REJEU DES AUTRES PATCHS : rejouer le patch lancement ou le
-- patch adresse remet shops_public sans city_id ; rejouer le patch des codes de
-- motif échoue sur la vue (colonnes supprimées). Rejouer CE PATCH en dernier.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Gardes : la chaîne de patchs doit avoir été exécutée
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'price_reports'
                   and column_name = 'check_codes') then
    raise exception 'colonne price_reports.check_codes absente : exécuter d''abord le patch des codes de motif';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'price_reports'
                   and column_name = 'source') then
    raise exception 'colonne price_reports.source absente : exécuter d''abord le patch propriétaire de boutique';
  end if;
  if to_regprocedure('public.report_config_hash(jsonb)') is null then
    raise exception 'fonction report_config_hash absente : exécuter d''abord le patch config_hash';
  end if;
  if to_regprocedure('public.shop_visible_phone(uuid)') is null
     or to_regprocedure('public.shop_visible_address(uuid)') is null then
    raise exception 'fonctions shop_visible_* absentes : exécuter les patchs lancement puis adresse et horaires';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. C5 : clé d'idempotence des relevés
--    Le site génère un identifiant (uuid) par relevé à l'ouverture du
--    formulaire et le renvoie tel quel après une coupure. Un second envoi
--    échoue avec 23505 (index price_reports_client_ref_key) : le site le
--    lit comme "déjà envoyé".
-- ---------------------------------------------------------------------
alter table public.price_reports add column if not exists client_ref uuid;

create unique index if not exists price_reports_client_ref_key
  on public.price_reports (reported_by, client_ref)
  where client_ref is not null;

-- ---------------------------------------------------------------------
-- 2. C3 : fermer la lecture directe de price_reports
--    Un droit de colonne ne distingue pas un agent d'une connexion
--    anonyme (même rôle "authenticated") : les colonnes sensibles sont
--    donc fermées aux deux, et les ayants droit passent par une vue.
-- ---------------------------------------------------------------------
revoke select on public.price_reports from anon, authenticated;

grant select (
  id, product_id, shop_id, condition, price_fcfa, in_stock, warranty_months,
  reported_specs, config_hash, check_level, check_codes, status, source, reported_at
) on public.price_reports to anon, authenticated;

-- Vue des ayants droit. Elle s'exécute avec les droits de son propriétaire
-- (elle contourne donc la RLS) : le filtre est écrit ici, en clair.
--   * auteur du relevé           : ses relevés
--   * propriétaire de la boutique : les relevés de sa boutique (abonnement actif)
--   * personnel                  : tout
-- proof_paths, check_reason : personnel et auteur seulement (il contient la médiane de
-- prix pour 'price_low'). Les autres propriétaires de la boutique ne le voient pas.
drop view if exists public.price_reports_visible;
create view public.price_reports_visible with (security_barrier = true) as
select
  r.id, r.product_id, r.shop_id, r.condition,
  r.price_fcfa, r.in_stock, r.warranty_months,
  r.reported_specs, r.config_hash,
  case when public.is_staff() or r.reported_by = auth.uid()
       then r.proof_paths end as proof_paths,
  r.check_level,
  case when public.is_staff() or r.reported_by = auth.uid()
       then r.check_reason end as check_reason,
  r.check_codes, r.status, r.source,
  r.reported_by, r.reported_at,
  r.reviewed_by, r.reviewed_at,
  case when public.is_staff() or r.reported_by = auth.uid()
       then r.review_note end as review_note,
  r.client_ref
from public.price_reports r
where auth.uid() is not null
  and (
    r.reported_by = auth.uid()
    or public.is_staff()
    or public.is_shop_owner(r.shop_id)
  );

revoke all on public.price_reports_visible from public, anon, authenticated;
grant select on public.price_reports_visible to authenticated;

-- ---------------------------------------------------------------------
-- 3. C1, C2, C3 : vue current_prices recréée en UNE fois
--    - check_reason retiré ; l'ordre des autres colonnes ne change pas
--    - city_id et config_hash ajoutés à la fin
-- ---------------------------------------------------------------------
drop view if exists public.current_prices;
create view public.current_prices with (security_invoker = true) as
select distinct on (r.product_id, r.shop_id, r.condition, r.config_hash)
  r.id as report_id,
  r.product_id, r.shop_id, r.condition,
  r.price_fcfa, r.in_stock, r.warranty_months,
  r.reported_specs, r.check_level, r.reported_at,
  p.category, p.brand, p.name as product_name, p.specs as product_specs,
  s.name as shop_name,
  public.shop_visible_phone(s.id) as shop_phone,
  s.neighborhood_id, s.is_verified as shop_verified,
  r.source,
  public.shop_has_active_subscription(s.id) as shop_subscribed,
  public.shop_contact_available(s.id) as shop_contactable,
  r.check_codes,
  n.city_id,
  r.config_hash
from public.price_reports r
join public.products p on p.id = r.product_id
join public.shops s on s.id = r.shop_id
left join public.neighborhoods n on n.id = s.neighborhood_id
where r.status = 'published'
  and r.reported_at > now() - interval '45 days'
order by r.product_id, r.shop_id, r.condition, r.config_hash, r.reported_at desc;

grant select on public.current_prices to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. C1 : shops_public avec city_id en dernière colonne
--    (mêmes colonnes que le patch adresse et horaires, dans le même ordre)
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
  public.shop_has_active_subscription(s.id) as subscribed,
  n.city_id
from public.shops s
left join public.neighborhoods n on n.id = s.neighborhood_id;

grant select on public.shops_public to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. C8 : note obligatoire pour rejeter un relevé
--    PB032 (PB030 et PB031 sont déjà pris par les relevés et les boutiques).
--    Ne s'applique pas à l'éditeur SQL (auth.uid() nul), comme les autres règles.
-- ---------------------------------------------------------------------
create or replace function public.price_reports_reject_note()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null
     and new.status = 'rejected'
     and old.status is distinct from 'rejected'
     and coalesce(btrim(new.review_note), '') = '' then
    raise exception 'une note est obligatoire pour rejeter un relevé' using errcode = 'PB032';
  end if;
  return new;
end $$;

drop trigger if exists trg_price_reports_reject_note on public.price_reports;
create trigger trg_price_reports_reject_note
  before update on public.price_reports
  for each row execute function public.price_reports_reject_note();

-- ---------------------------------------------------------------------
-- 6. C9 : un signalement naît toujours 'open'
-- ---------------------------------------------------------------------
create or replace function public.flags_force_open()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null then
    new.status := 'open';
  end if;
  return new;
end $$;

drop trigger if exists trg_flags_force_open on public.flags;
create trigger trg_flags_force_open
  before insert on public.flags
  for each row execute function public.flags_force_open();

commit;

-- =====================================================================
-- CODES D'ERREUR AJOUTÉS (à reporter dans le document 07, section 7)
--   PB032  une note est obligatoire pour rejeter un relevé
--   23505  + index price_reports_client_ref_key : relevé déjà envoyé
--
-- VÉRIFICATIONS À FAIRE SUR LA BASE DE TEST (rôles : anon, agent, propriétaire
-- abonné, personnel, connexion anonyme Supabase)
--   * anon : "select check_reason from price_reports" -> 42501 ; idem reported_by,
--     proof_paths, review_note ; "select *" -> 42501 ;
--   * anon : current_prices répond, n'a plus check_reason, a city_id et config_hash ;
--   * connexion anonyme Supabase : price_reports_visible renvoie 0 ligne ;
--   * agent : price_reports_visible renvoie ses relevés avec check_reason,
--     jamais ceux d'un autre agent ;
--   * propriétaire abonné : voit les relevés de sa boutique ; check_reason vide
--     pour ceux qu'il n'a pas écrits ; plus rien après expiration de l'abonnement ;
--   * personnel : voit tout, y compris les relevés en attente ;
--   * un agent insère un relevé avec .select('id,status,check_level,check_codes') : réussi ;
--     avec .select() complet : refusé ;
--   * un modérateur met 'rejected' sans note : PB032 ; avec une note : accepté ;
--   * même client_ref envoyé deux fois par le même agent : 23505 la seconde fois ;
--   * connexion anonyme : insérer un signalement avec status 'dismissed' -> créé
--     avec status 'open' ; le personnel le voit dans sa file ;
--   * shops_public : city_id présent, une boutique sans quartier donne city_id nul ;
--   * le filtre .eq('city_id', ...) sur current_prices fonctionne ;
--   * 🔎 sur Supabase : l'UPDATE du personnel (sans .select()) réussit malgré
--     les droits de colonne ; le tableau de bord n'affiche pas d'alerte bloquante
--     sur la vue price_reports_visible (avertissement "security definer" attendu).
-- =====================================================================
