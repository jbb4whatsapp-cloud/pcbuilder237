-- =====================================================================
-- PC Builder 237 : patch "agents par code attribué"
-- À exécuter APRÈS pcbuilder237_schema.sql, dans l'éditeur SQL Supabase.
--
-- Principe : chaque agent a un compte Supabase Auth (email + mot de passe),
-- le "code agent" est le mot de passe. Le rôle 'agent' dans user_roles
-- donne le droit d'écrire (relevés + preuves). Retirer le rôle = accès
-- coupé immédiatement (les policies lisent user_roles en direct).
--
-- Ces fonctions sont réservées à l'éditeur SQL (administrateur du projet) :
-- l'exécution est retirée aux rôles anon / authenticated.
-- =====================================================================

begin;

-- Donne le rôle agent à un compte existant et renseigne son nom.
create or replace function public.grant_agent(_email text, _display_name text default null)
returns uuid
language plpgsql
set search_path = public, auth
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(_email);
  if v_id is null then
    raise exception 'Aucun compte pour %. Créez-le d''abord dans Authentication > Users.', _email;
  end if;

  insert into public.user_roles (user_id, role)
  values (v_id, 'agent')
  on conflict do nothing;

  insert into public.profiles (id, display_name)
  values (v_id, _display_name)
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return v_id;
end $$;

-- Retire le rôle agent (effet immédiat). Les relevés déjà envoyés restent.
create or replace function public.revoke_agent(_email text)
returns void
language plpgsql
set search_path = public, auth
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(_email);
  if v_id is null then
    raise exception 'Aucun compte pour %.', _email;
  end if;

  delete from public.user_roles where user_id = v_id and role = 'agent';
end $$;

revoke execute on function public.grant_agent(text, text) from public, anon, authenticated;
revoke execute on function public.revoke_agent(text)      from public, anon, authenticated;

-- Liste des agents actifs (pour l'admin, via l'éditeur SQL)
create or replace view public.agents_overview with (security_invoker = true) as
select
  ur.user_id,
  p.display_name,
  ur.granted_at,
  (select count(*) from public.price_reports r where r.reported_by = ur.user_id) as reports_total,
  (select max(r.reported_at) from public.price_reports r where r.reported_by = ur.user_id) as last_report_at
from public.user_roles ur
left join public.profiles p on p.id = ur.user_id
where ur.role = 'agent';

revoke all on public.agents_overview from anon, authenticated;

commit;

-- =====================================================================
-- UTILISATION
-- =====================================================================
-- 1) Authentication > Users > Add user > Create new user
--      email    : a001@votre-domaine.cm   (domaine que vous contrôlez)
--      password : le code agent (10 caractères aléatoires minimum)
--      cochez "Auto Confirm User"
--
-- 2) select public.grant_agent('a001@votre-domaine.cm', 'Prénom - Mokolo');
--
-- 3) Retirer un agent :
--      select public.revoke_agent('a001@votre-domaine.cm');
--
-- 4) Voir les agents :
--      select * from public.agents_overview;
-- =====================================================================
