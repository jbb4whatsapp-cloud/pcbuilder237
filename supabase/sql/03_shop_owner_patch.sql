-- =====================================================================
-- PC Builder 237 : patch "propriétaire de boutique"
-- À exécuter APRÈS pcbuilder237_schema.sql (et pcbuilder237_agents_patch.sql).
-- À TESTER D'ABORD SUR UN PROJET SUPABASE DE TEST. Rejouable.
--
-- Décisions reprises des documents 01 et 02 :
--   * une même personne peut gérer plusieurs boutiques ;
--   * le rôle n'est actif que tant que l'abonnement de la boutique l'est ;
--   * les relevés d'une boutique passent TOUJOURS par un modérateur ;
--   * l'abonnement est payé par Mobile Money, enregistré à la main par l'admin.
--
-- Choix technique : "propriétaire de boutique" n'est pas une ligne de
-- user_roles. Le rôle est CALCULÉ à partir du lien compte/boutique et de
-- l'abonnement en cours. À l'expiration, il s'éteint tout seul, sans rien
-- à nettoyer.
--
-- Modifier un prix = envoyer un nouveau relevé (l'historique est conservé
-- et chaque relevé est modéré). Les relevés ne sont jamais modifiés.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Types, colonnes
-- ---------------------------------------------------------------------
do $$ begin create type public.report_source as enum ('agent', 'shop');
exception when duplicate_object then null; end $$;

-- Origine du relevé : renseignée par le serveur (voir le déclencheur plus bas)
alter table public.price_reports
  add column if not exists source public.report_source not null default 'agent';

-- Horaires affichés sur la fiche boutique (modifiables par le propriétaire)
alter table public.shops add column if not exists opening_hours text;

-- ---------------------------------------------------------------------
-- 2. Tables : lien compte/boutique et abonnements
-- ---------------------------------------------------------------------
create table if not exists public.shop_members (
  user_id    uuid not null references auth.users(id) on delete cascade,
  shop_id    uuid not null references public.shops(id) on delete cascade,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, shop_id)
);
create index if not exists idx_shop_members_shop on public.shop_members(shop_id);

create table if not exists public.shop_subscriptions (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  starts_on      date not null,
  ends_on        date not null,
  amount_fcfa    integer check (amount_fcfa >= 0),
  payment_method text not null default 'mobile_money',
  payment_ref    text,                       -- référence de la transaction Mobile Money
  cancelled_at   timestamptz,                -- non nul = abonnement annulé
  recorded_by    uuid references auth.users(id) default auth.uid(),
  created_at     timestamptz not null default now(),
  constraint shop_subscriptions_dates check (ends_on >= starts_on)
);
create index if not exists idx_shop_subscriptions_shop
  on public.shop_subscriptions (shop_id, ends_on desc);

-- ---------------------------------------------------------------------
-- 3. Fonctions de droits
-- ---------------------------------------------------------------------
-- Date du jour au Cameroun (UTC+1) : évite les décalages en fin de journée.
create or replace function public.today_douala()
returns date language sql stable as $$
  select (now() at time zone 'Africa/Douala')::date
$$;

create or replace function public.shop_has_active_subscription(_shop uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.shop_subscriptions s
    where s.shop_id = _shop
      and s.cancelled_at is null
      and public.today_douala() between s.starts_on and s.ends_on
  )
$$;

-- Vrai si l'utilisateur connecté gère cette boutique ET qu'elle est abonnée.
create or replace function public.is_shop_owner(_shop uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.shop_members m
    where m.user_id = auth.uid() and m.shop_id = _shop
  ) and public.shop_has_active_subscription(_shop)
$$;

-- Vrai si l'utilisateur gère au moins une boutique abonnée.
create or replace function public.has_active_shop()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.shop_members m
    where m.user_id = auth.uid()
      and public.shop_has_active_subscription(m.shop_id)
  )
$$;

-- ---------------------------------------------------------------------
-- 4. RLS : nouvelles tables
-- ---------------------------------------------------------------------
alter table public.shop_members       enable row level security;
alter table public.shop_subscriptions enable row level security;

drop policy if exists members_read        on public.shop_members;
drop policy if exists members_admin_write on public.shop_members;
create policy members_read on public.shop_members for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy members_admin_write on public.shop_members for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- Le propriétaire voit les abonnements de ses boutiques (même expirés, pour renouveler).
drop policy if exists subscriptions_read        on public.shop_subscriptions;
drop policy if exists subscriptions_admin_write on public.shop_subscriptions;
create policy subscriptions_read on public.shop_subscriptions for select to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1 from public.shop_members m
      where m.shop_id = shop_subscriptions.shop_id and m.user_id = (select auth.uid())
    )
  );
create policy subscriptions_admin_write on public.shop_subscriptions for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

revoke all on public.shop_members, public.shop_subscriptions from anon;

-- ---------------------------------------------------------------------
-- 5. Fiche boutique : le propriétaire modifie, mais pas tout
-- ---------------------------------------------------------------------
drop policy if exists shops_owner_update on public.shops;
create policy shops_owner_update on public.shops for update to authenticated
  using (public.is_shop_owner(id)) with check (public.is_shop_owner(id));

-- Un propriétaire peut changer : téléphone, adresse, horaires, montage et son tarif.
-- Le reste (nom, quartier, statut, badge vérifié) est réservé au personnel.
create or replace function public.shops_protect_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    if (new.name, new.neighborhood_id, new.status, new.is_verified, new.created_by, new.created_at)
       is distinct from
       (old.name, old.neighborhood_id, old.status, old.is_verified, old.created_by, old.created_at) then
      raise exception 'modification réservée au personnel';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_shops_protect_columns on public.shops;
create trigger trg_shops_protect_columns
  before update on public.shops
  for each row execute function public.shops_protect_columns();

-- ---------------------------------------------------------------------
-- 6. Relevés envoyés par une boutique
-- ---------------------------------------------------------------------
drop policy if exists reports_shop_insert on public.price_reports;
create policy reports_shop_insert on public.price_reports for insert to authenticated
  with check (public.is_shop_owner(shop_id) and reported_by = (select auth.uid()));

-- Le propriétaire suit tous les relevés de sa boutique (en attente, rejetés, publiés).
drop policy if exists reports_shop_read on public.price_reports;
create policy reports_shop_read on public.price_reports for select to authenticated
  using (public.is_shop_owner(shop_id));

-- S'exécute APRÈS price_reports_before_insert (ordre alphabétique des déclencheurs).
-- Il fixe l'origine du relevé et force la modération pour une boutique.
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
    raise exception 'droit insuffisant pour ce relevé';
  end if;
  return new;
end $$;

drop trigger if exists trg_price_reports_shop_rules on public.price_reports;
create trigger trg_price_reports_shop_rules
  before insert on public.price_reports
  for each row execute function public.price_reports_shop_rules();

-- ---------------------------------------------------------------------
-- 7. Preuves photo : les propriétaires de boutiques abonnées peuvent en envoyer
-- ---------------------------------------------------------------------
drop policy if exists proofs_shop_insert on storage.objects;
create policy proofs_shop_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.has_active_shop())
  );

-- ---------------------------------------------------------------------
-- 8. Vue publique : ajoute l'origine du relevé et l'état d'abonnement
-- (colonnes ajoutées à la fin, la vue existante reste compatible)
-- ---------------------------------------------------------------------
create or replace view public.current_prices with (security_invoker = true) as
select distinct on (r.product_id, r.shop_id, r.condition, r.config_hash)
  r.id as report_id,
  r.product_id, r.shop_id, r.condition,
  r.price_fcfa, r.in_stock, r.warranty_months,
  r.reported_specs, r.check_level, r.check_reason, r.reported_at,
  p.category, p.brand, p.name as product_name, p.specs as product_specs,
  s.name as shop_name, s.phone as shop_phone,
  s.neighborhood_id, s.is_verified as shop_verified,
  r.source,
  public.shop_has_active_subscription(s.id) as shop_subscribed
from public.price_reports r
join public.products p on p.id = r.product_id
join public.shops s on s.id = r.shop_id
where r.status = 'published'
  and r.reported_at > now() - interval '45 days'
order by r.product_id, r.shop_id, r.condition, r.config_hash, r.reported_at desc;

grant select on public.current_prices to anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. Outils admin (éditeur SQL uniquement : l'exécution est retirée aux autres rôles)
-- ---------------------------------------------------------------------
create or replace function public.grant_shop_owner(_email text, _shop uuid)
returns void language plpgsql set search_path = public, auth as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(_email);
  if v_id is null then
    raise exception 'Aucun compte pour %. Créez-le d''abord dans Authentication > Users.', _email;
  end if;
  if not exists (select 1 from public.shops where id = _shop) then
    raise exception 'Boutique inconnue : %', _shop;
  end if;
  insert into public.shop_members (user_id, shop_id) values (v_id, _shop)
  on conflict do nothing;
end $$;

create or replace function public.revoke_shop_owner(_email text, _shop uuid)
returns void language plpgsql set search_path = public, auth as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(_email);
  if v_id is null then
    raise exception 'Aucun compte pour %.', _email;
  end if;
  delete from public.shop_members where user_id = v_id and shop_id = _shop;
end $$;

-- Enregistre un paiement Mobile Money et active l'abonnement.
create or replace function public.record_subscription(
  _shop uuid, _starts date, _ends date, _amount integer, _payment_ref text default null)
returns uuid language plpgsql set search_path = public as $$
declare v_id uuid;
begin
  insert into public.shop_subscriptions (shop_id, starts_on, ends_on, amount_fcfa, payment_ref)
  values (_shop, _starts, _ends, _amount, _payment_ref)
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.grant_shop_owner(text, uuid)  from public, anon, authenticated;
revoke execute on function public.revoke_shop_owner(text, uuid) from public, anon, authenticated;
revoke execute on function public.record_subscription(uuid, date, date, integer, text)
  from public, anon, authenticated;

commit;

-- =====================================================================
-- UTILISATION (éditeur SQL)
-- =====================================================================
-- 1) Le propriétaire crée son compte (ou vous le créez dans Authentication > Users).
-- 2) Enregistrer le paiement Mobile Money et activer l'abonnement :
--      select public.record_subscription('<UUID_BOUTIQUE>', '2026-10-01', '2026-10-31', 15000, 'MM-REF-001');
-- 3) Lier le compte à sa boutique (répéter pour chaque boutique gérée) :
--      select public.grant_shop_owner('proprio@exemple.cm', '<UUID_BOUTIQUE>');
-- 4) Retirer l'accès :
--      select public.revoke_shop_owner('proprio@exemple.cm', '<UUID_BOUTIQUE>');
--
-- Le montant ci-dessus est un exemple, pas un tarif.
--
-- VÉRIFICATIONS À FAIRE SUR LA BASE DE TEST
--   * propriétaire sans abonnement actif : ne peut ni envoyer un relevé ni modifier sa fiche ;
--   * propriétaire abonné : un relevé "ok" arrive bien en statut 'pending' avec source = 'shop' ;
--   * propriétaire abonné : changer le nom, le quartier, le statut ou le badge est refusé ;
--   * un agent : un relevé "ok" est toujours publié automatiquement (source = 'agent') ;
--   * une personne sans rôle ni boutique : toute insertion de relevé est refusée.
-- =====================================================================
