-- =====================================================================
-- PC Builder 237 : patch "lancement"
-- À exécuter APRÈS pcbuilder237_schema.sql et pcbuilder237_shop_owner_patch.sql
-- (il utilise today_douala(), shop_has_active_subscription(), shop_members).
-- À TESTER D'ABORD SUR UN PROJET SUPABASE DE TEST. Rejouable.
--
-- Contenu :
--   1. Période de lancement : contact ouvert à toutes les boutiques jusqu'à une date
--   2. Masquage du numéro de téléphone des boutiques une fois la période terminée
--   3. Demandes d'ajout de boutique (agent -> personnel)
--
-- Règle de contact : une boutique est contactable si la période de lancement est
-- ouverte OU si elle a un abonnement actif.
--
-- IMPORTANT : ce patch change la façon dont le site lit les boutiques.
--   * anon et authenticated n'ont plus le droit de lire la colonne shops.phone.
--     Un "select *" sur public.shops échoue : le site doit lire la vue
--     public.shops_public (ou lister les colonnes sans phone).
--   * Le numéro n'est donné que par la fonction shop_visible_phone() : au public
--     si la boutique est contactable, toujours au personnel et aux propriétaires
--     de la boutique.
--   * Éviter "returning *" ou "returning phone" après un insert ou update sur shops.
--   * Après l'ajout d'une colonne à shops, penser à l'ouvrir en lecture :
--       grant select (<colonne>) on public.shops to anon, authenticated;
--     (ou rejouer ce patch).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Période de lancement
-- ---------------------------------------------------------------------
-- Une seule ligne. contact_open_until : dernier jour (inclus, heure de Douala) où le
-- contact est ouvert à toutes les boutiques.
-- NULL = ouvert jusqu'à nouvel ordre (valeur de départ : la durée n'est pas décidée).
create table if not exists public.launch_settings (
  id                 boolean primary key default true check (id),
  contact_open_until date,
  updated_by         uuid references auth.users(id),
  updated_at         timestamptz not null default now()
);
insert into public.launch_settings (id) values (true) on conflict do nothing;

alter table public.launch_settings enable row level security;

-- Lecture publique (le site peut afficher « contact ouvert jusqu'au … »).
drop policy if exists launch_read on public.launch_settings;
drop policy if exists launch_admin_write on public.launch_settings;
create policy launch_read on public.launch_settings for select to anon, authenticated
  using (true);
create policy launch_admin_write on public.launch_settings for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

revoke insert, update, delete, truncate on public.launch_settings from anon;

-- Vrai tant que la période de lancement est ouverte.
create or replace function public.contact_period_open()
returns boolean language sql stable set search_path = public as $$
  select coalesce(
    public.today_douala() <= (select contact_open_until from public.launch_settings where id),
    true
  )
$$;

-- Vrai si le public peut contacter cette boutique.
create or replace function public.shop_contact_available(_shop uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.contact_period_open() or public.shop_has_active_subscription(_shop)
$$;

-- Fixe la fin de la période de lancement (éditeur SQL, ou interface admin via la table).
--   select public.set_launch_end('2026-12-31');          -- ouvert jusqu'au 31/12 inclus
--   select public.set_launch_end(public.today_douala() - 1);  -- fermer tout de suite
--   select public.set_launch_end(null);                  -- rouvrir sans date de fin
create or replace function public.set_launch_end(_date date)
returns void language plpgsql set search_path = public as $$
begin
  update public.launch_settings
     set contact_open_until = _date, updated_by = auth.uid(), updated_at = now()
   where id;
end $$;

revoke execute on function public.set_launch_end(date) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Masquage du numéro de téléphone
-- ---------------------------------------------------------------------
-- Numéro visible : personnel, propriétaires liés à la boutique, ou public si la
-- boutique est contactable. La fonction lit la colonne avec ses propres droits.
create or replace function public.shop_visible_phone(_shop uuid)
returns text language sql stable security definer set search_path = public as $$
  select s.phone
  from public.shops s
  where s.id = _shop
    and (s.status = 'active' or public.is_staff())
    and (
      public.is_staff()
      or exists (select 1 from public.shop_members m
                 where m.user_id = auth.uid() and m.shop_id = s.id)
      or public.shop_contact_available(s.id)
    )
$$;

grant execute on function public.shop_visible_phone(uuid) to anon, authenticated;
grant execute on function public.shop_contact_available(uuid) to anon, authenticated;
grant execute on function public.contact_period_open() to anon, authenticated;

-- Retire la lecture directe de shops.phone (les droits d'écriture ne changent pas).
revoke select on public.shops from anon, authenticated;
do $$
declare r record;
begin
  for r in
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'shops'
      and column_name not in ('phone', 'created_by')
  loop
    execute format('grant select (%I) on public.shops to anon, authenticated', r.column_name);
  end loop;
end $$;
grant select (created_by) on public.shops to authenticated;

-- Lecture des boutiques pour le site : tout sauf le numéro brut.
create or replace view public.shops_public with (security_invoker = true) as
select
  s.id, s.name, s.neighborhood_id, s.address, s.status, s.is_verified,
  s.offers_assembly, s.assembly_fee_fcfa, s.opening_hours, s.created_at,
  public.shop_visible_phone(s.id)           as phone,
  public.shop_contact_available(s.id)       as contactable,
  public.shop_has_active_subscription(s.id) as subscribed
from public.shops s;

grant select on public.shops_public to anon, authenticated;

-- Vue des prix : même colonnes que dans le patch "propriétaire de boutique",
-- avec le numéro filtré par la fonction, et une colonne ajoutée à la fin.
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
  public.shop_contact_available(s.id) as shop_contactable
from public.price_reports r
join public.products p on p.id = r.product_id
join public.shops s on s.id = r.shop_id
where r.status = 'published'
  and r.reported_at > now() - interval '45 days'
order by r.product_id, r.shop_id, r.condition, r.config_hash, r.reported_at desc;

grant select on public.current_prices to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Demandes d'ajout de boutique (un agent signale une boutique absente)
-- ---------------------------------------------------------------------
do $$ begin create type public.request_status as enum ('open', 'done', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.shop_requests (
  id              uuid primary key default gen_random_uuid(),
  requested_by    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null check (char_length(name) between 2 and 120),
  neighborhood_id uuid references public.neighborhoods(id),
  address         text check (char_length(address) <= 300),
  phone           text check (phone is null or phone ~ '^\+237[26][0-9]{8}$'),
  note            text check (char_length(note) <= 1000),
  status          public.request_status not null default 'open',
  shop_id         uuid references public.shops(id) on delete set null,  -- boutique créée en réponse
  handled_by      uuid references auth.users(id),
  handled_at      timestamptz,
  handled_note    text check (char_length(handled_note) <= 1000),
  created_at      timestamptz not null default now()
);
create index if not exists idx_shop_requests_status on public.shop_requests (status, created_at);
create index if not exists idx_shop_requests_by on public.shop_requests (requested_by);

alter table public.shop_requests enable row level security;

drop policy if exists shop_requests_read   on public.shop_requests;
drop policy if exists shop_requests_insert on public.shop_requests;
drop policy if exists shop_requests_update on public.shop_requests;
drop policy if exists shop_requests_delete on public.shop_requests;

-- L'agent voit ses demandes ; le personnel voit tout.
create policy shop_requests_read on public.shop_requests for select to authenticated
  using (requested_by = (select auth.uid()) or (select public.is_staff()));
create policy shop_requests_insert on public.shop_requests for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and ((select public.has_role('agent')) or (select public.is_staff()))
  );
create policy shop_requests_update on public.shop_requests for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy shop_requests_delete on public.shop_requests for delete to authenticated
  using ((select public.has_role('admin')));

revoke all on public.shop_requests from anon;

-- Le serveur fixe le statut et les champs de traitement.
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
      raise exception 'trop de demandes en cours (10 maximum)';
    end if;
    new.requested_by := auth.uid();
    new.status       := 'open';
    new.shop_id      := null;
    new.handled_by   := null;
    new.handled_at   := null;
    new.handled_note := null;
  else
    if not public.is_staff() then
      raise exception 'modification réservée au personnel';
    end if;
    if new.status is distinct from old.status then
      if new.status = 'rejected' and coalesce(btrim(new.handled_note), '') = '' then
        raise exception 'une note est obligatoire pour refuser une demande';
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

drop trigger if exists trg_shop_requests_rules on public.shop_requests;
create trigger trg_shop_requests_rules
  before insert or update on public.shop_requests
  for each row execute function public.shop_requests_rules();

-- Crée la boutique à partir d'une demande et clôt la demande (personnel).
-- Les droits de l'appelant s'appliquent : seul le personnel peut créer une boutique.
create or replace function public.create_shop_from_request(_request uuid)
returns uuid language plpgsql set search_path = public as $$
declare
  r      public.shop_requests%rowtype;
  v_shop uuid;
begin
  if not public.is_staff() then
    raise exception 'réservé au personnel';
  end if;

  select * into r from public.shop_requests where id = _request for update;
  if not found then
    raise exception 'demande inconnue';
  end if;
  if r.status <> 'open' then
    raise exception 'demande déjà traitée';
  end if;

  insert into public.shops (name, phone, neighborhood_id, address)
  values (r.name, r.phone, r.neighborhood_id, r.address)
  returning id into v_shop;

  update public.shop_requests set status = 'done', shop_id = v_shop where id = _request;
  return v_shop;
end $$;

revoke execute on function public.create_shop_from_request(uuid) from public, anon;
grant execute on function public.create_shop_from_request(uuid) to authenticated;

commit;

-- =====================================================================
-- UTILISATION
-- =====================================================================
-- Période de lancement (éditeur SQL) :
--   select public.set_launch_end('2026-12-31');              -- date de fin (incluse)
--   select public.set_launch_end(public.today_douala() - 1); -- fermer tout de suite
--   select public.set_launch_end(null);                      -- rouvrir sans date de fin
--   select * from public.launch_settings;
--
-- Demandes d'ajout de boutique (personnel) :
--   select * from public.shop_requests where status = 'open' order by created_at;
--   select public.create_shop_from_request('<UUID_DEMANDE>');   -- crée la boutique et clôt
--   update public.shop_requests set status = 'rejected',
--          handled_note = 'Boutique déjà présente' where id = '<UUID_DEMANDE>';
--
-- Côté site : lire public.shops_public (et non public.shops) ; afficher le bouton
-- WhatsApp seulement si "contactable" (shops_public) ou "shop_contactable"
-- (current_prices) est vrai.
--
-- VÉRIFICATIONS À FAIRE SUR LA BASE DE TEST
--   * période ouverte (contact_open_until null ou future) : un visiteur anonyme
--     voit le numéro de toute boutique active dans shops_public et current_prices ;
--   * après set_launch_end(hier) : le numéro est null pour une boutique sans abonnement,
--     présent pour une boutique avec abonnement actif ;
--   * un visiteur anonyme ne peut plus lire shops.phone directement
--     (select phone from public.shops -> permission refusée) ;
--   * "select * from public.shops" échoue pour anon (attendu) ; shops_public fonctionne ;
--   * le personnel et le propriétaire de la boutique voient toujours le numéro ;
--   * un propriétaire abonné peut encore modifier le téléphone de sa boutique
--     (update sans "returning phone") ;
--   * une boutique suspendue reste absente de shops_public pour le public ;
--   * un agent crée une demande : elle est 'open', requested_by = lui ; 11e demande refusée ;
--   * un agent ne peut ni lire les demandes des autres, ni modifier une demande ;
--   * create_shop_from_request crée la boutique et passe la demande en 'done' ;
--   * rejeter sans note est refusé ; un agent ne peut pas appeler create_shop_from_request.
-- =====================================================================
