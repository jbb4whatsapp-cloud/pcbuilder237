-- =====================================================================
-- PC Builder 237 : patch "codes de motif et codes d'erreur"
-- À exécuter APRÈS pcbuilder237_schema.sql, pcbuilder237_shop_owner_patch.sql,
-- pcbuilder237_shop_products_patch.sql et pcbuilder237_launch_patch.sql.
-- À TESTER D'ABORD SUR UN PROJET SUPABASE DE TEST. Rejouable.
-- NON EXÉCUTÉ par son auteur : écrit sans accès à une base.
--
-- CORRECTION v0.2 : dans la version précédente, "v_codes := v_codes || 'code'" échouait
-- (« malformed array literal ») : tout relevé avec anomalie était refusé avec une erreur
-- au lieu de passer en attente. Remplacé par array_append(v_codes, 'code') aux 4 endroits.
-- Vérifié sur une base PostgreSQL 16 locale (pas sur Supabase).
--
-- Pourquoi (documents 03 section 6.1 et 07 sections 4 et 7) :
--   * le site choisit le texte d'alerte public d'après un CODE, pas en lisant la
--     phrase française de check_reason (qui reste un texte pour le personnel et
--     l'agent) ;
--   * le site choisit le message d'erreur d'après un CODE SQLSTATE, pas d'après le
--     texte de l'exception.
--
-- 1. Codes de motif : nouvelle colonne price_reports.check_codes (text[]), remplie
--    par le serveur, exposée dans la vue current_prices (colonne ajoutée à la fin).
--      ram_above_max        RAM annoncée > maximum du produit     (impossible)
--      ram_not_allowed      RAM annoncée hors liste autorisée     (suspect)
--      storage_not_allowed  stockage annoncé hors liste           (suspect)
--      price_low            prix < 50 % de la médiane récente     (suspect)
--    Un relevé 'ok' a un tableau vide. Les nombres affichés dans l'alerte (RAM
--    annoncée, maximum) viennent de reported_specs et product_specs, déjà dans la
--    vue. La médiane n'est jamais exposée par ce mécanisme.
--    Les relevés créés AVANT ce patch ont un tableau vide : voir plus bas.
--
-- 2. Codes d'erreur : chaque "raise exception" des fonctions ci-dessous reçoit un
--    SQLSTATE personnalisé (classe PB). PostgREST/Supabase le renvoie dans error.code.
--    Le texte du message ne change pas.
--
--      PB001  produit inconnu ou inactif
--      PB002  boutique inconnue ou suspendue
--      PB003  chemin de preuve invalide
--      PB010  une note est obligatoire pour rejeter une fiche produit
--      PB011  caractéristiques trop volumineuses (4000 caractères maximum)
--      PB012  trop de fiches en attente de validation (20 maximum)
--      PB013  modification réservée au personnel (fiche produit)
--      PB020  trop de demandes en cours (10 maximum)
--      PB021  modification réservée au personnel (demande de boutique)
--      PB022  une note est obligatoire pour refuser une demande
--      PB023  réservé au personnel (création de boutique)
--      PB024  demande inconnue
--      PB025  demande déjà traitée
--      PB030  droit insuffisant pour ce relevé (déclencheur price_reports_shop_rules)
--      PB031  modification réservée au personnel (fiche boutique, shops_protect_columns)
--
--    Erreurs qui ont DÉJÀ un code standard (pas de changement) :
--      23514  contrainte CHECK : price_reports_needs_proof (preuve manquante),
--             prix hors bornes (contrainte sur price_fcfa), flags (motif 5 à 1000)
--      23505  doublon : products_unique (catégorie, marque, nom)
--      42501  refus par la sécurité de la base (RLS, droits de colonne)
--
--    NON couvertes : les messages des outils admin du patch "propriétaire de boutique"
--    (grant_shop_owner, revoke_shop_owner), réservés à l'éditeur SQL et déjà lisibles,
--    et les erreurs du patch "agents", que je n'ai pas reçu. Même méthode : ajouter
--    "using errcode = 'PBxxx'" avec un numéro libre (PB040 et suivants).
--
-- ATTENTION AU REJEU : rejouer pcbuilder237_shop_owner_patch.sql,
-- pcbuilder237_shop_products_patch.sql ou pcbuilder237_launch_patch.sql remet les
-- anciennes versions des fonctions price_reports_shop_rules, shops_protect_columns,
-- products_review_rules, shop_requests_rules et create_shop_from_request (sans code
-- d'erreur). Rejouer ce patch ensuite.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Garde : la fonction price_reports_before_insert doit être celle du schéma v1
--    reçu (empreinte MD5 du corps). Ce patch la REMPLACE ; si un autre patch l'a
--    déjà modifiée (par exemple la correction de config_hash du document 02,
--    section 10, point 4), il faut fusionner à la main au lieu d'écraser.
--    Pour voir la version en base :
--      select pg_get_functiondef('public.price_reports_before_insert()'::regprocedure);
--    Si vous avez comparé et fusionné, supprimez ce bloc DO et adaptez la
--    section 2 avec votre version.
-- ---------------------------------------------------------------------
do $$
declare v_md5 text;
begin
  select md5(prosrc) into v_md5
  from pg_proc where oid = 'public.price_reports_before_insert()'::regprocedure;
  if v_md5 is distinct from 'd0e4e9f639262bfe58028083910430c4' then
    raise exception 'price_reports_before_insert() diffère de la version du schéma v1 (md5 %). Comparer et fusionner à la main avant de continuer.', v_md5;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Colonne des codes de motif
-- ---------------------------------------------------------------------
alter table public.price_reports
  add column if not exists check_codes text[] not null default '{}';

do $$ begin
  alter table public.price_reports add constraint price_reports_check_codes_known
    check (check_codes <@ array['ram_above_max','ram_not_allowed','storage_not_allowed','price_low']::text[])
    not valid;      -- les nouveaux relevés sont contrôlés ; ajouter ici tout nouveau code
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Contrôle des relevés : mêmes règles que le schéma v1, plus les codes
--    (corps identique au schéma v1 ; ajouts : v_codes, check_codes, errcode)
-- ---------------------------------------------------------------------
create or replace function public.price_reports_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p          public.products%rowtype;
  v_uid      uuid := auth.uid();
  v_lvl      int := 0;                -- 0 ok, 1 suspect, 2 impossible
  v_reasons  text[] := '{}';
  v_codes    text[] := '{}';              -- codes de motif (voir check_codes)
  v_ram      int;
  v_storage  int;
  v_max_ram  int;
  v_n        int;
  v_median   numeric;
  v_shop     public.shop_status;
begin
  select * into p from public.products where id = new.product_id;
  if not found or not p.is_active then
    raise exception 'produit inconnu ou inactif' using errcode = 'PB001';
  end if;

  select status into v_shop from public.shops where id = new.shop_id;
  if v_shop is distinct from 'active' then
    raise exception 'boutique inconnue ou suspendue' using errcode = 'PB002';
  end if;

  -- champs maîtrisés par le serveur
  new.reported_at := now();
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.review_note := null;
  if v_uid is not null then new.reported_by := v_uid; end if;

  -- chaque preuve doit être dans le dossier de l'agent
  if v_uid is not null and exists (
    select 1 from unnest(new.proof_paths) as x where x not like v_uid::text || '/%'
  ) then
    raise exception 'chemin de preuve invalide' using errcode = 'PB003';
  end if;

  new.config_hash := md5(new.reported_specs::text);

  if (new.reported_specs->>'ram_gb') ~ '^[0-9]{1,5}$' then
    v_ram := (new.reported_specs->>'ram_gb')::int;
  end if;
  if (new.reported_specs->>'storage_gb') ~ '^[0-9]{1,6}$' then
    v_storage := (new.reported_specs->>'storage_gb')::int;
  end if;

  -- RAM : plafond physique puis valeurs standard
  if v_ram is not null and (p.specs->>'max_ram_gb') ~ '^[0-9]{1,5}$' then
    v_max_ram := (p.specs->>'max_ram_gb')::int;
    if v_ram > v_max_ram then
      v_lvl := 2;
      v_reasons := v_reasons || format('RAM annoncée %s Go > maximum %s Go pour %s', v_ram, v_max_ram, p.name);
      v_codes := array_append(v_codes, 'ram_above_max');
    end if;
  end if;
  if v_ram is not null and v_lvl < 2
     and jsonb_typeof(p.specs->'allowed_ram_gb') = 'array'
     and not (p.specs->'allowed_ram_gb' @> to_jsonb(v_ram)) then
    v_lvl := greatest(v_lvl, 1);
    v_reasons := v_reasons || format('RAM %s Go non standard pour %s', v_ram, p.name);
    v_codes := array_append(v_codes, 'ram_not_allowed');
  end if;

  -- Stockage
  if v_storage is not null
     and jsonb_typeof(p.specs->'allowed_storage_gb') = 'array'
     and not (p.specs->'allowed_storage_gb' @> to_jsonb(v_storage)) then
    v_lvl := greatest(v_lvl, 1);
    v_reasons := v_reasons || format('Stockage %s Go non standard pour %s', v_storage, p.name);
    v_codes := array_append(v_codes, 'storage_not_allowed');
  end if;

  -- Prix « trop beau pour être vrai » : moins de 50 % de la médiane récente
  -- (même produit, même état, même configuration, au moins 3 relevés publiés)
  select count(*), percentile_cont(0.5) within group (order by r.price_fcfa)
    into v_n, v_median
  from public.price_reports r
  where r.product_id = new.product_id
    and r.condition = new.condition
    and r.config_hash = new.config_hash
    and r.status = 'published'
    and r.reported_at > now() - interval '60 days';

  if v_n >= 3 and new.price_fcfa < 0.5 * v_median then
    v_lvl := greatest(v_lvl, 1);
    v_reasons := v_reasons || format('Prix très inférieur à la médiane récente (%s FCFA)', round(v_median)::bigint);
    v_codes := array_append(v_codes, 'price_low');
  end if;

  new.check_level  := (array['ok', 'suspect', 'impossible'])[v_lvl + 1]::public.check_level;
  new.check_reason := nullif(array_to_string(v_reasons, ' ; '), '');
  new.check_codes  := v_codes;             -- fixé par le serveur, le client ne l'envoie pas
  -- un relevé sans anomalie est publié ; sinon il attend un modérateur
  new.status := (case when v_lvl = 0 then 'published' else 'pending' end)::public.report_status;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 3. Codes d'erreur : fiches produit (patch produits)
-- ---------------------------------------------------------------------
create or replace function public.products_review_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pending int;
begin
  if auth.uid() is null then
    return new;                       -- éditeur SQL / service_role : on ne touche à rien
  end if;

  -- Personnel : une décision est tracée, et son effet est appliqué ici.
  if public.is_staff() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      if new.status = 'approved' then
        new.is_active := true;
      elsif new.status = 'rejected' then
        if coalesce(btrim(new.review_note), '') = '' then
          raise exception 'une note est obligatoire pour rejeter une fiche produit' using errcode = 'PB010';
        end if;
        new.is_active := false;
      else                            -- retour en attente
        new.is_active := false;
        new.reviewed_by := null;
        new.reviewed_at := null;
        return new;
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  -- Propriétaire de boutique
  if length(new.specs::text) > 4000 then
    raise exception 'caractéristiques trop volumineuses (4000 caractères maximum)' using errcode = 'PB011';
  end if;

  if tg_op = 'INSERT' then
    select count(*) into v_pending
    from public.products
    where created_by = auth.uid() and status = 'pending';
    if v_pending >= 20 then
      raise exception 'trop de fiches en attente de validation (20 maximum)' using errcode = 'PB012';
    end if;

    new.status      := 'pending';
    new.is_active   := false;
    new.created_by  := auth.uid();
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
  else
    if (new.status, new.is_active, new.created_by, new.created_at,
        new.reviewed_by, new.reviewed_at, new.review_note)
       is distinct from
       (old.status, old.is_active, old.created_by, old.created_at,
        old.reviewed_by, old.reviewed_at, old.review_note) then
      raise exception 'modification réservée au personnel' using errcode = 'PB013';
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 4. Codes d'erreur : demandes d'ajout de boutique (patch lancement)
-- ---------------------------------------------------------------------
create or replace function public.shop_requests_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_open int;
begin
  if auth.uid() is null then
    return new;                       -- éditeur SQL / service_role
  end if;

  if tg_op = 'INSERT' then
    select count(*) into v_open
    from public.shop_requests
    where requested_by = auth.uid() and status = 'open';
    if v_open >= 10 then
      raise exception 'trop de demandes en cours (10 maximum)' using errcode = 'PB020';
    end if;
    new.requested_by := auth.uid();
    new.status       := 'open';
    new.shop_id      := null;
    new.handled_by   := null;
    new.handled_at   := null;
    new.handled_note := null;
  else
    if not public.is_staff() then
      raise exception 'modification réservée au personnel' using errcode = 'PB021';
    end if;
    if new.status is distinct from old.status then
      if new.status = 'rejected' and coalesce(btrim(new.handled_note), '') = '' then
        raise exception 'une note est obligatoire pour refuser une demande' using errcode = 'PB022';
      end if;
      if new.status = 'open' then
        new.handled_by := null;
        new.handled_at := null;
      else
        new.handled_by := auth.uid();
        new.handled_at := now();
      end if;
    end if;
  end if;
  return new;
end $$;

create or replace function public.create_shop_from_request(_request uuid)
returns uuid language plpgsql set search_path = public as $$
declare
  r      public.shop_requests%rowtype;
  v_shop uuid;
begin
  if not public.is_staff() then
    raise exception 'réservé au personnel' using errcode = 'PB023';
  end if;

  select * into r from public.shop_requests where id = _request for update;
  if not found then
    raise exception 'demande inconnue' using errcode = 'PB024';
  end if;
  if r.status <> 'open' then
    raise exception 'demande déjà traitée' using errcode = 'PB025';
  end if;

  insert into public.shops (name, phone, neighborhood_id, address)
  values (r.name, r.phone, r.neighborhood_id, r.address)
  returning id into v_shop;

  update public.shop_requests set status = 'done', shop_id = v_shop where id = _request;
  return v_shop;
end $$;

revoke execute on function public.create_shop_from_request(uuid) from public, anon;
grant execute on function public.create_shop_from_request(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 4 bis. Codes d'erreur : relevés d'une boutique et fiche boutique (patch propriétaire)
--        Les déclencheurs liés à ces fonctions ne changent pas.
-- ---------------------------------------------------------------------
create or replace function public.price_reports_shop_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;                      -- éditeur SQL / service_role : on ne touche à rien
  end if;

  if public.is_shop_owner(new.shop_id) then
    new.source := 'shop';
    new.status := 'pending';         -- toujours modéré, même sans anomalie
  elsif public.is_staff() or public.has_role('agent') then
    new.source := 'agent';
  else
    raise exception 'droit insuffisant pour ce relevé' using errcode = 'PB030';
  end if;
  return new;
end $$;

create or replace function public.shops_protect_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    if (new.name, new.neighborhood_id, new.status, new.is_verified, new.created_by, new.created_at)
       is distinct from
       (old.name, old.neighborhood_id, old.status, old.is_verified, old.created_by, old.created_at) then
      raise exception 'modification réservée au personnel' using errcode = 'PB031';
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 5. Vue des prix : mêmes colonnes que dans le patch lancement, check_codes en dernier
-- ---------------------------------------------------------------------
create or replace view public.current_prices with (security_invoker = true) as
select distinct on (r.product_id, r.shop_id, r.condition, r.config_hash)
  r.id as report_id,
  r.product_id, r.shop_id, r.condition,
  r.price_fcfa, r.in_stock, r.warranty_months,
  r.reported_specs, r.check_level, r.check_reason, r.reported_at,
  p.category, p.brand, p.name as product_name, p.specs as product_specs,
  s.name as shop_name,
  public.shop_visible_phone(s.id) as shop_phone,
  s.neighborhood_id, s.is_verified as shop_verified,
  r.source,
  public.shop_has_active_subscription(s.id) as shop_subscribed,
  public.shop_contact_available(s.id) as shop_contactable,
  r.check_codes
from public.price_reports r
join public.products p on p.id = r.product_id
join public.shops s on s.id = r.shop_id
where r.status = 'published'
  and r.reported_at > now() - interval '45 days'
order by r.product_id, r.shop_id, r.condition, r.config_hash, r.reported_at desc;

grant select on public.current_prices to anon, authenticated;

commit;

-- =====================================================================
-- RELEVÉS ANTÉRIEURS (optionnel)
-- =====================================================================
-- Les relevés insérés avant ce patch ont check_codes = '{}' même s'ils sont
-- 'suspect' ou 'impossible'. Le site affiche alors l'alerte SANS raison précise
-- (titre + conseil seulement, document 07). Sur une base de test, le plus simple
-- est de les recréer. Pour les convertir, il faut désactiver temporairement les
-- déclencheurs de mise à jour de price_reports (journal de modération) ; à ne
-- faire qu'en connaissance de cause, et seulement avec cette correspondance,
-- qui lit les anciennes phrases une dernière fois :
--   update public.price_reports set check_codes = array_remove(array[
--       case when check_reason like 'RAM annoncée %'          then 'ram_above_max' end,
--       case when check_reason like 'RAM % non standard%'     then 'ram_not_allowed' end,
--       case when check_reason like 'Stockage % non standard%' then 'storage_not_allowed' end,
--       case when check_reason like 'Prix très inférieur%'    then 'price_low' end
--     ], null)
--   where check_level <> 'ok' and check_codes = '{}';
--
-- =====================================================================
-- UTILISATION CÔTÉ SITE
-- =====================================================================
--   const { data } = await supabase.from('current_prices').select('*')...
--   // data[i].check_codes : ['ram_not_allowed'] -> texte « La mémoire annoncée (N Go) ... »
--   const { error } = await supabase.from('price_reports').insert(...)
--   // error.code === 'PB001' -> message « Ce produit n'est pas disponible... »
--   // error.code === '23514' && error.message.includes('price_reports_needs_proof') -> « Ajoutez au moins une photo... »
--
-- VÉRIFICATIONS À FAIRE SUR LA BASE DE TEST
--   * le patch s'arrête avec un message clair si price_reports_before_insert() a été modifiée ;
--   * relevé conforme : check_level ok, check_codes = {} ;
--   * ThinkPad T480 avec ram_gb 10 : suspect, check_codes = {ram_not_allowed} ;
--   * ram_gb 64 : impossible, check_codes = {ram_above_max} (et PAS ram_not_allowed) ;
--   * storage_gb 300 : suspect, {storage_not_allowed} ;
--   * ram_gb 10 et storage_gb 300 : {ram_not_allowed, storage_not_allowed} ;
--   * prix < 50 % de la médiane (3 relevés publiés minimum) : {price_low} ;
--   * un client qui envoie lui-même check_codes = '{price_low}' : la valeur est écrasée par le serveur ;
--   * relevé sur un produit inactif : erreur de code PB001 ; boutique suspendue : PB002 ;
--   * chemin de preuve d'un autre utilisateur : PB003 ;
--   * relevé sans preuve : erreur 23514 (price_reports_needs_proof) ;
--   * rejet d'une fiche produit sans note : PB010 ; 21e fiche en attente : PB012 ;
--   * 11e demande de boutique : PB020 ; rejet d'une demande sans note : PB022 ;
--   * personne sans rôle ni boutique qui insère un relevé : PB030 ;
--   * propriétaire abonné qui change le nom ou le quartier de sa boutique : PB031 ;
--   * current_prices expose check_codes et ne casse pas les requêtes existantes du site.
-- =====================================================================
