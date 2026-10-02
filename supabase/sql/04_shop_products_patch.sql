-- =====================================================================
-- PC Builder 237 : patch "produits proposés par les boutiques"
-- À exécuter APRÈS pcbuilder237_schema.sql et pcbuilder237_shop_owner_patch.sql
-- (il utilise has_active_shop() défini dans ce dernier).
-- À TESTER D'ABORD SUR UN PROJET SUPABASE DE TEST. Rejouable.
--
-- Décision : un propriétaire de boutique abonnée peut proposer un produit
-- absent du catalogue. La fiche reste EN ATTENTE : elle n'est pas publique et
-- ne peut recevoir aucun relevé tant qu'un modérateur ne l'a pas validée,
-- parce que les caractéristiques du produit (specs) servent de référence aux
-- contrôles anti-arnaque.
--
-- Mécanisme : une fiche en attente a is_active = false. La politique de lecture
-- (products_read) la cache au public, et le déclencheur de contrôle des relevés
-- la refuse déjà comme "produit inconnu ou inactif". Aucune fonction existante
-- n'est modifiée.
--
-- Le propriétaire peut corriger sa fiche tant qu'elle est en attente. Une fois
-- validée, seul le personnel la modifie (sinon il pourrait changer les valeurs
-- qui servent à contrôler ses propres relevés).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Statut de validation
-- ---------------------------------------------------------------------
do $$ begin create type public.product_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- Les produits existants et ceux créés par le personnel sont "approved" par défaut.
alter table public.products
  add column if not exists status      public.product_status not null default 'approved',
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

create index if not exists idx_products_pending
  on public.products (created_at) where status = 'pending';

-- ---------------------------------------------------------------------
-- 2. RLS : ce que peut faire un propriétaire de boutique abonnée
--    (les politiques du personnel et la lecture publique ne changent pas)
-- ---------------------------------------------------------------------
-- Il voit ses propres fiches, quel que soit leur statut (et la note de rejet).
drop policy if exists products_owner_read on public.products;
create policy products_owner_read on public.products for select to authenticated
  using (created_by = (select auth.uid()));

-- Il peut proposer une fiche tant qu'il gère au moins une boutique abonnée.
drop policy if exists products_owner_insert on public.products;
create policy products_owner_insert on public.products for insert to authenticated
  with check (created_by = (select auth.uid()) and (select public.has_active_shop()));

-- Il peut corriger sa fiche tant qu'elle est en attente.
drop policy if exists products_owner_update on public.products;
create policy products_owner_update on public.products for update to authenticated
  using (created_by = (select auth.uid()) and status = 'pending' and (select public.has_active_shop()))
  with check (created_by = (select auth.uid()) and status = 'pending' and (select public.has_active_shop()));

-- ---------------------------------------------------------------------
-- 3. Déclencheur : le serveur fixe le statut, le client ne décide de rien
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
          raise exception 'une note est obligatoire pour rejeter une fiche produit';
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
    raise exception 'caractéristiques trop volumineuses (4000 caractères maximum)';
  end if;

  if tg_op = 'INSERT' then
    select count(*) into v_pending
    from public.products
    where created_by = auth.uid() and status = 'pending';
    if v_pending >= 20 then
      raise exception 'trop de fiches en attente de validation (20 maximum)';
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
      raise exception 'modification réservée au personnel';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_products_review_rules on public.products;
create trigger trg_products_review_rules
  before insert or update on public.products
  for each row execute function public.products_review_rules();

-- ---------------------------------------------------------------------
-- 4. File des modérateurs : fiches en attente
--    (security_invoker : seul le personnel voit toutes les fiches ; un
--    propriétaire ne verrait que les siennes)
-- ---------------------------------------------------------------------
create or replace view public.products_to_review with (security_invoker = true) as
select
  p.id, p.category, p.brand, p.name, p.specs, p.created_at, p.created_by,
  (select array_agg(s.name order by s.name)
     from public.shop_members m
     join public.shops s on s.id = m.shop_id
    where m.user_id = p.created_by) as proposer_shops
from public.products p
where p.status = 'pending';

revoke all on public.products_to_review from anon;
grant select on public.products_to_review to authenticated;

commit;

-- =====================================================================
-- UTILISATION (personnel : modérateur ou admin, connecté à l'application,
-- ou éditeur SQL)
-- =====================================================================
-- Voir la file :
--   select * from public.products_to_review order by created_at;
--
-- Avant de valider : comparer les caractéristiques avec la fiche constructeur
-- (max_ram_gb, allowed_ram_gb, allowed_storage_gb pour un portable ou un PC complet).
--
-- Valider (la fiche devient publique et peut recevoir des relevés) :
--   update public.products set status = 'approved' where id = '<UUID_PRODUIT>';
--
-- Rejeter (note obligatoire, visible par le propriétaire) :
--   update public.products set status = 'rejected',
--          review_note = 'Doublon de ThinkPad T480' where id = '<UUID_PRODUIT>';
--
-- ATTENTION : la contrainte products_unique (catégorie, marque, nom) s'applique
-- aussi aux fiches rejetées. Un nom rejeté ne peut pas être proposé à nouveau
-- tant que la fiche rejetée existe : la corriger (nom) ou la supprimer (admin).
--
-- VÉRIFICATIONS À FAIRE SUR LA BASE DE TEST
--   * propriétaire abonné : crée une fiche, elle est 'pending' et is_active = false,
--     même s'il envoie status = 'approved' ou is_active = true ;
--   * la fiche en attente n'apparaît pas pour un visiteur anonyme ;
--   * envoyer un relevé sur une fiche en attente est refusé ;
--   * le propriétaire corrige sa fiche en attente, mais ne peut pas changer son statut ;
--   * le propriétaire ne peut pas modifier une fiche approuvée ;
--   * propriétaire sans abonnement actif : ne peut plus créer ni corriger de fiche ;
--   * 21e fiche en attente d'un même propriétaire : refusée ;
--   * modérateur : valider rend la fiche publique ; rejeter sans note est refusé ;
--   * un agent ne peut pas créer de produit.
-- =====================================================================
