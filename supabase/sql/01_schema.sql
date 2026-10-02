-- =====================================================================
-- PC Builder 237 : schéma Supabase v1
-- Comparateur de prix + assembleur de PC (neuf / reconditionné / occasion)
--
-- À EXÉCUTER D'ABORD SUR UN PROJET SUPABASE DE TEST.
-- Ce script :
--   * renomme l'ancienne table price_reports en price_reports_legacy
--     (le site actuel cessera de fonctionner tant que le front n'est pas migré)
--   * supprime TOUTES les policies existantes sur les tables listées
--     (pour qu'aucune ancienne policy permissive ne contourne le RLS)
--   * est rejouable : relancer le script ne casse rien
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Types
-- ---------------------------------------------------------------------
do $$ begin create type public.app_role as enum ('admin', 'moderator', 'agent');
exception when duplicate_object then null; end $$;

do $$ begin create type public.product_category as enum
  ('cpu','motherboard','ram','gpu','storage','psu','case','cooler','laptop','prebuilt','other');
exception when duplicate_object then null; end $$;

do $$ begin create type public.item_condition as enum ('new', 'refurbished', 'used');
exception when duplicate_object then null; end $$;

do $$ begin create type public.check_level as enum ('ok', 'suspect', 'impossible');
exception when duplicate_object then null; end $$;

do $$ begin create type public.report_status as enum ('pending', 'published', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin create type public.shop_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin create type public.flag_status as enum ('open', 'reviewed', 'dismissed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Profils et rôles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(_role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = _role
  )
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'moderator')
  )
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. Géographie (existe déjà : on ne touche pas aux données)
-- ---------------------------------------------------------------------
create table if not exists public.countries (
  id   uuid primary key default gen_random_uuid(),
  name text not null
);
create table if not exists public.cities (
  id         uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name       text not null
);
create table if not exists public.neighborhoods (
  id      uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name    text not null
);
create index if not exists idx_cities_country on public.cities(country_id);
create index if not exists idx_neighborhoods_city on public.neighborhoods(city_id);

-- ---------------------------------------------------------------------
-- 4. Boutiques
-- ---------------------------------------------------------------------
create table if not exists public.shops (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  phone           text,
  neighborhood_id uuid references public.neighborhoods(id)
);
alter table public.shops add column if not exists address text;
alter table public.shops add column if not exists status public.shop_status not null default 'active';
alter table public.shops add column if not exists is_verified boolean not null default false;
alter table public.shops add column if not exists offers_assembly boolean not null default false;
alter table public.shops add column if not exists assembly_fee_fcfa integer check (assembly_fee_fcfa >= 0);
alter table public.shops add column if not exists created_by uuid references auth.users(id) default auth.uid();
alter table public.shops add column if not exists created_at timestamptz not null default now();

-- Numéro WhatsApp camerounais au format +237 6XXXXXXXX (not valid : les anciennes lignes ne bloquent pas)
do $$ begin
  alter table public.shops add constraint shops_phone_format
    check (phone ~ '^\+237[26][0-9]{8}$') not valid;
exception when duplicate_object then null; end $$;

create index if not exists idx_shops_neighborhood on public.shops(neighborhood_id);

-- ---------------------------------------------------------------------
-- 5. Produits (composants, portables, PC complets)
--
-- specs (jsonb) : clés conseillées selon la catégorie
--   cpu         : socket, cores, tdp_w, generation
--   motherboard : socket, chipset, ram_type, ram_slots, form_factor
--   ram         : type (DDR4/DDR5), capacity_gb, speed_mhz, modules
--   gpu         : chip, vram_gb, tdp_w, length_mm, power_connectors
--   storage     : kind (ssd/hdd/nvme), capacity_gb
--   psu         : watts, efficiency
--   case        : form_factors, max_gpu_length_mm, max_cooler_height_mm
--   laptop / prebuilt : max_ram_gb, allowed_ram_gb [..], allowed_storage_gb [..]
--     -> ces 3 dernières clés alimentent la détection d'arnaque côté serveur
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  category   public.product_category not null,
  brand      text not null,
  name       text not null,
  specs      jsonb not null default '{}'::jsonb,
  is_active  boolean not null default true,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  constraint products_unique unique (category, brand, name),
  constraint products_specs_is_object check (jsonb_typeof(specs) = 'object')
);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_specs on public.products using gin (specs);

-- ---------------------------------------------------------------------
-- 6. Relevés de prix
-- ---------------------------------------------------------------------
-- L'ancienne table (modèles de PC complets) est conservée en lecture seule.
do $$ begin
  if to_regclass('public.price_reports') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'price_reports' and column_name = 'product_id'
     ) then
    alter table public.price_reports rename to price_reports_legacy;
  end if;
end $$;

create table if not exists public.price_reports (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete restrict,
  shop_id         uuid not null references public.shops(id) on delete restrict,
  condition       public.item_condition not null,
  price_fcfa      integer not null check (price_fcfa > 0 and price_fcfa < 100000000),
  in_stock        boolean not null default true,
  warranty_months smallint check (warranty_months between 0 and 60),
  -- configuration réellement annoncée : {"ram_gb":16,"storage_gb":256,"battery_health_pct":82,...}
  reported_specs  jsonb not null default '{}'::jsonb check (jsonb_typeof(reported_specs) = 'object'),
  config_hash     text not null default '',
  -- chemins dans le bucket privé "proofs" : <agent_uid>/<fichier>
  proof_paths     text[] not null default '{}',
  -- calculés par le serveur (trigger), jamais par le client
  check_level     public.check_level not null default 'ok',
  check_reason    text,
  status          public.report_status not null default 'pending',
  reported_by     uuid references auth.users(id) default auth.uid(),
  reported_at     timestamptz not null default now(),
  reviewed_by     uuid references auth.users(id),
  reviewed_at     timestamptz,
  review_note     text,
  constraint price_reports_needs_proof check (cardinality(proof_paths) >= 1)
);
create index if not exists idx_pr_lookup
  on public.price_reports (product_id, shop_id, condition, reported_at desc)
  where status = 'published';
create index if not exists idx_pr_status on public.price_reports (status);
create index if not exists idx_pr_reported_by on public.price_reports (reported_by);

-- Validation côté serveur : le client ne peut pas contourner ces contrôles.
create or replace function public.price_reports_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p          public.products%rowtype;
  v_uid      uuid := auth.uid();
  v_lvl      int := 0;                -- 0 ok, 1 suspect, 2 impossible
  v_reasons  text[] := '{}';
  v_ram      int;
  v_storage  int;
  v_max_ram  int;
  v_n        int;
  v_median   numeric;
  v_shop     public.shop_status;
begin
  select * into p from public.products where id = new.product_id;
  if not found or not p.is_active then
    raise exception 'produit inconnu ou inactif';
  end if;

  select status into v_shop from public.shops where id = new.shop_id;
  if v_shop is distinct from 'active' then
    raise exception 'boutique inconnue ou suspendue';
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
    raise exception 'chemin de preuve invalide';
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
    end if;
  end if;
  if v_ram is not null and v_lvl < 2
     and jsonb_typeof(p.specs->'allowed_ram_gb') = 'array'
     and not (p.specs->'allowed_ram_gb' @> to_jsonb(v_ram)) then
    v_lvl := greatest(v_lvl, 1);
    v_reasons := v_reasons || format('RAM %s Go non standard pour %s', v_ram, p.name);
  end if;

  -- Stockage
  if v_storage is not null
     and jsonb_typeof(p.specs->'allowed_storage_gb') = 'array'
     and not (p.specs->'allowed_storage_gb' @> to_jsonb(v_storage)) then
    v_lvl := greatest(v_lvl, 1);
    v_reasons := v_reasons || format('Stockage %s Go non standard pour %s', v_storage, p.name);
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
  end if;

  new.check_level  := (array['ok', 'suspect', 'impossible'])[v_lvl + 1]::public.check_level;
  new.check_reason := nullif(array_to_string(v_reasons, ' ; '), '');
  -- un relevé sans anomalie est publié ; sinon il attend un modérateur
  new.status := (case when v_lvl = 0 then 'published' else 'pending' end)::public.report_status;
  return new;
end $$;

drop trigger if exists trg_price_reports_before_insert on public.price_reports;
create trigger trg_price_reports_before_insert
  before insert on public.price_reports
  for each row execute function public.price_reports_before_insert();

-- Traçabilité de la modération
create or replace function public.price_reports_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_price_reports_before_update on public.price_reports;
create trigger trg_price_reports_before_update
  before update on public.price_reports
  for each row execute function public.price_reports_before_update();

-- Dernier prix publié par produit / boutique / état / configuration (45 jours)
create or replace view public.current_prices with (security_invoker = true) as
select distinct on (r.product_id, r.shop_id, r.condition, r.config_hash)
  r.id as report_id,
  r.product_id, r.shop_id, r.condition,
  r.price_fcfa, r.in_stock, r.warranty_months,
  r.reported_specs, r.check_level, r.check_reason, r.reported_at,
  p.category, p.brand, p.name as product_name, p.specs as product_specs,
  s.name as shop_name, s.phone as shop_phone,
  s.neighborhood_id, s.is_verified as shop_verified
from public.price_reports r
join public.products p on p.id = r.product_id
join public.shops s on s.id = r.shop_id
where r.status = 'published'
  and r.reported_at > now() - interval '45 days'
order by r.product_id, r.shop_id, r.condition, r.config_hash, r.reported_at desc;

-- ---------------------------------------------------------------------
-- 7. Configurations (builder) et signalements
-- ---------------------------------------------------------------------
create table if not exists public.builds (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null default 'Ma configuration',
  is_public  boolean not null default false,
  share_slug text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_at timestamptz not null default now()
);
create index if not exists idx_builds_owner on public.builds(owner_id);

create table if not exists public.build_items (
  id                  uuid primary key default gen_random_uuid(),
  build_id            uuid not null references public.builds(id) on delete cascade,
  product_id          uuid not null references public.products(id),
  quantity            smallint not null default 1 check (quantity between 1 and 8),
  accepted_conditions public.item_condition[] not null
                      default array['new', 'refurbished', 'used']::public.item_condition[],
  constraint build_items_unique unique (build_id, product_id)
);
create index if not exists idx_build_items_build on public.build_items(build_id);

create table if not exists public.flags (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid references public.shops(id) on delete cascade,
  report_id  uuid references public.price_reports(id) on delete cascade,
  reason     text not null check (char_length(reason) between 5 and 1000),
  status     public.flag_status not null default 'open',
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  constraint flags_has_target check (shop_id is not null or report_id is not null)
);

-- ---------------------------------------------------------------------
-- 8. RLS : on repart de zéro
-- ---------------------------------------------------------------------
do $$ declare r record; begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('countries','cities','neighborhoods','shops','products','price_reports',
                        'price_reports_legacy','models','profiles','user_roles',
                        'builds','build_items','flags')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.profiles       enable row level security;
alter table public.user_roles     enable row level security;
alter table public.countries      enable row level security;
alter table public.cities         enable row level security;
alter table public.neighborhoods  enable row level security;
alter table public.shops          enable row level security;
alter table public.products       enable row level security;
alter table public.price_reports  enable row level security;
alter table public.builds         enable row level security;
alter table public.build_items    enable row level security;
alter table public.flags          enable row level security;

-- Tables historiques (si elles existent) : lecture seule
do $$ begin
  if to_regclass('public.price_reports_legacy') is not null then
    alter table public.price_reports_legacy enable row level security;
    create policy legacy_reports_read on public.price_reports_legacy
      for select to authenticated using ((select public.is_staff()));
  end if;
  if to_regclass('public.models') is not null then
    alter table public.models enable row level security;
    create policy models_read on public.models for select to anon, authenticated using (true);
    create policy models_staff_write on public.models for all to authenticated
      using ((select public.is_staff())) with check ((select public.is_staff()));
  end if;
end $$;

-- Profils
create policy profiles_read_own on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Rôles : chacun voit les siens, seul l'admin attribue
create policy roles_read on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy roles_admin_write on public.user_roles for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- Géographie : lecture publique, écriture admin
do $$ declare t text; begin
  foreach t in array array['countries', 'cities', 'neighborhoods'] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)',
                   t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated
                    using ((select public.has_role(''admin'')))
                    with check ((select public.has_role(''admin'')))',
                   t || '_admin_write', t);
  end loop;
end $$;

-- Boutiques
create policy shops_read on public.shops for select to anon, authenticated
  using (status = 'active' or (select public.is_staff()));
create policy shops_staff_insert on public.shops for insert to authenticated
  with check ((select public.is_staff()));
create policy shops_staff_update on public.shops for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy shops_admin_delete on public.shops for delete to authenticated
  using ((select public.has_role('admin')));

-- Produits
create policy products_read on public.products for select to anon, authenticated
  using (is_active or (select public.is_staff()));
create policy products_staff_insert on public.products for insert to authenticated
  with check ((select public.is_staff()));
create policy products_staff_update on public.products for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy products_admin_delete on public.products for delete to authenticated
  using ((select public.has_role('admin')));

-- Relevés de prix
create policy reports_read on public.price_reports for select to anon, authenticated
  using (
    status = 'published'
    or reported_by = (select auth.uid())
    or (select public.is_staff())
  );
create policy reports_agent_insert on public.price_reports for insert to authenticated
  with check (
    ((select public.has_role('agent')) or (select public.is_staff()))
    and reported_by = (select auth.uid())
  );
create policy reports_staff_update on public.price_reports for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy reports_admin_delete on public.price_reports for delete to authenticated
  using ((select public.has_role('admin')));

-- Configurations
create policy builds_read on public.builds for select to anon, authenticated
  using (is_public or owner_id = (select auth.uid()) or (select public.is_staff()));
create policy builds_insert on public.builds for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy builds_update on public.builds for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy builds_delete on public.builds for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy build_items_read on public.build_items for select to anon, authenticated
  using (exists (
    select 1 from public.builds b
    where b.id = build_id
      and (b.is_public or b.owner_id = (select auth.uid()) or (select public.is_staff()))
  ));
create policy build_items_write on public.build_items for all to authenticated
  using (exists (select 1 from public.builds b where b.id = build_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.builds b where b.id = build_id and b.owner_id = (select auth.uid())));

-- Signalements : tout utilisateur connecté (y compris anonyme Supabase) peut signaler
create policy flags_insert on public.flags for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy flags_staff_read on public.flags for select to authenticated
  using ((select public.is_staff()));
create policy flags_staff_update on public.flags for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Défense en profondeur : le rôle anon n'écrit nulle part
do $$ declare t text; begin
  foreach t in array array['countries','cities','neighborhoods','shops','products','price_reports',
                           'profiles','user_roles','builds','build_items','flags'] loop
    execute format('revoke insert, update, delete, truncate on public.%I from anon', t);
  end loop;
end $$;

grant select on public.current_prices to anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. Stockage des preuves (bucket privé)
-- Convention de chemin : <uid de l'agent>/<id du relevé ou horodatage>/<fichier>.jpg
-- Compresser les photos côté client avant l'envoi (< 1 Mo conseillé, limite 5 Mo).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists proofs_agent_insert on storage.objects;
drop policy if exists proofs_read on storage.objects;
drop policy if exists proofs_staff_delete on storage.objects;

create policy proofs_agent_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and ((select public.has_role('agent')) or (select public.is_staff()))
  );

create policy proofs_read on storage.objects for select to authenticated
  using (
    bucket_id = 'proofs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_staff()))
  );

-- Une preuve ne se supprime pas après coup : seul le personnel peut le faire.
create policy proofs_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and (select public.is_staff()));

-- OPTIONNEL : rendre publiques les preuves des relevés publiés (confiance acheteurs).
-- À n'activer que si les photos ne contiennent pas de données personnelles.
-- drop policy if exists proofs_public_read on storage.objects;
-- create policy proofs_public_read on storage.objects for select to anon, authenticated
--   using (
--     bucket_id = 'proofs'
--     and exists (
--       select 1 from public.price_reports r
--       where r.status = 'published' and name = any (r.proof_paths)
--     )
--   );

commit;

-- =====================================================================
-- APRÈS L'EXÉCUTION (à lancer à la main dans l'éditeur SQL)
-- =====================================================================
-- 1) Premier administrateur (remplacer par l'UUID de votre compte, visible dans Authentication > Users) :
--    insert into public.user_roles (user_id, role) values ('<UUID>', 'admin');
--
-- 2) Attribuer le rôle agent à un utilisateur :
--    insert into public.user_roles (user_id, role, granted_by) values ('<UUID_AGENT>', 'agent', '<UUID_ADMIN>');
--
-- 3) Exemple de produit avec règles anti-arnaque (à vérifier avec la fiche constructeur avant usage) :
--    insert into public.products (category, brand, name, specs) values
--      ('laptop', 'Lenovo', 'ThinkPad T480',
--       '{"max_ram_gb":32,"allowed_ram_gb":[4,8,12,16,24,32],"allowed_storage_gb":[128,256,512,1024]}');
--
-- 4) Dans le tableau de bord Supabase : activer l'authentification par téléphone (OTP)
--    pour les agents, et "Anonymous sign-ins" si les visiteurs doivent sauvegarder des configurations.
