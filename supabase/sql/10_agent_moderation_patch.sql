-- supabase/sql/10_agent_moderation_patch.sql (rejouable)

-- 1. autoriser les trois codes de la modération des relevés d'agent
alter table public.price_reports
  drop constraint if exists price_reports_check_codes_known;

alter table public.price_reports
  add constraint price_reports_check_codes_known
  check (check_codes <@ array[
    'ram_above_max', 'ram_not_allowed', 'storage_not_allowed', 'price_low',
    'price_deviation', 'no_reference', 'new_agent'
  ]::text[]) not valid;

-- 2. règle de modération des relevés d'agent
create or replace function public.price_reports_shop_rules()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  c_ecart_max  constant numeric := 0.20;  -- écart toléré par rapport à la médiane
  c_jours      constant int     := 45;    -- fenêtre des relevés de référence
  c_nouveaux   constant int     := 5;     -- nombre de premiers relevés modérés par agent
  v_deja       int;
  v_n          int;
  v_median     numeric;
  v_reasons    text[] := '{}';
  v_codes      text[] := '{}';
begin
  if auth.uid() is null then
    return new;                      -- éditeur SQL / service_role : on ne touche à rien
  end if;

  if public.is_shop_owner(new.shop_id) then
    new.source := 'shop';
    new.status := 'pending';         -- toujours modéré, même sans anomalie
  elsif public.is_staff() then
    new.source := 'agent';           -- le personnel publie directement
  elsif public.has_role('agent') then
    new.source := 'agent';

    -- les contrôles ci-dessous ne s'ajoutent qu'à un relevé sans anomalie
    if new.status = 'published' then

      -- 1. nouvel agent : ses c_nouveaux premiers relevés (la ligne courante n'est pas encore en base)
      select count(*) into v_deja
      from public.price_reports r
      where r.reported_by = auth.uid() and r.source = 'agent';
      if v_deja < c_nouveaux then
        v_reasons := v_reasons || format('Relevé n° %s d''un nouvel agent (modéré jusqu''à %s)', v_deja + 1, c_nouveaux);
        v_codes := array_append(v_codes, 'new_agent');
      end if;

      -- 2. référence de prix : même produit, même état, même configuration
      select count(*), percentile_cont(0.5) within group (order by r.price_fcfa)
        into v_n, v_median
      from public.price_reports r
      where r.product_id = new.product_id
        and r.condition = new.condition
        and r.config_hash = new.config_hash
        and r.status = 'published'
        and r.reported_at > now() - make_interval(days => c_jours);

      if v_n = 0 then
        v_reasons := array_append(v_reasons, 'Aucun relevé publié récent pour ce produit, cet état et cette configuration');
        v_codes := array_append(v_codes, 'no_reference');
      elsif v_median > 0 and abs(new.price_fcfa - v_median) > c_ecart_max * v_median then
        v_reasons := v_reasons || format('Prix écarté de %s %% par rapport à la médiane récente (%s FCFA)',
                       round(100 * (new.price_fcfa - v_median) / v_median)::int, round(v_median)::bigint);
        v_codes := array_append(v_codes, 'price_deviation');
      end if;

      if array_length(v_reasons, 1) > 0 then
        new.status       := 'pending';
        new.check_reason := array_to_string(v_reasons, ' ; ');
        new.check_codes  := coalesce(new.check_codes, '{}') || v_codes;
        -- check_level reste 'ok' : modéré par règle de confiance, pas par incohérence de spécifications
      end if;
    end if;
  else
    raise exception 'droit insuffisant pour ce relevé' using errcode = 'PB030';
  end if;
  return new;
end $function$;