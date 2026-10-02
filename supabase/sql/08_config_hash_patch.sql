-- =====================================================================
-- PC Builder 237 : patch "empreinte de configuration (config_hash)"
-- À exécuter APRÈS tous les autres patchs, y compris
-- pcbuilder237_reason_codes_patch.sql (il remplace la version de
-- price_reports_before_insert posée par ce dernier).
-- À TESTER D'ABORD SUR UN PROJET SUPABASE DE TEST. Rejouable.
-- NON EXÉCUTÉ sur Supabase : vérifié seulement sur une base PostgreSQL 16
-- locale, avec des simulations des schémas auth et storage.
--
-- Problème 1 (documents 02 section 10 point 4, 06 décision 7, 08 section 12) :
--   config_hash = md5(reported_specs::text) couvre TOUTE la configuration
--   annoncée. Deux relevés identiques sauf la batterie (ou toute autre clé
--   facultative) ont des empreintes différentes : ils restent deux lignes
--   dans current_prices, et la règle "prix bas" ne les compte pas ensemble.
--
-- Règle posée par ce patch : l'empreinte ne porte que sur
--     ram_gb, storage_gb, cpu
--   * ram_gb et storage_gb : nombres entiers (comme le contrôle du serveur) ;
--     absents ou invalides = pas de valeur ;
--   * cpu : texte, normalisé (minuscules, uniquement lettres et chiffres),
--     donc "i5-8350U", "I5 8350u" et "i5 8350U" donnent la même empreinte.
--     Un relevé SANS cpu forme un groupe à part des relevés AVEC cpu ;
--   * toutes les autres clés (battery_health_pct, notes...) sont ignorées.
--
-- Ce patch NE crée PAS de règle de contrôle sur le processeur : il fixe
-- seulement le nom de la clé (cpu) et son rôle dans l'empreinte. La règle
-- (cpu_options dans specs, nouveau code de motif) reste à décider.
--
-- Problème 2, découvert pendant les tests : dans pcbuilder237_reason_codes_patch.sql
--   (version d'origine), "v_codes := v_codes || 'code'" échoue avec
--   « malformed array literal ». Conséquence : tout relevé qui devait passer en
--   attente (RAM au-dessus du maximum, RAM ou stockage hors liste, prix bas)
--   était REFUSÉ avec une erreur au lieu d'être mis en attente. La fonction
--   posée ici utilise array_append aux 4 endroits ; une version corrigée du patch
--   des codes de motif existe aussi (même correction). Les deux chemins mènent
--   à la même fonction finale.
--
-- Effets à connaître :
--   * les relevés EXISTANTS sont recalculés (section 3) : des lignes qui
--     différaient seulement par la batterie se regroupent, et le dernier relevé
--     publié du groupe devient le prix affiché ;
--   * rejouer pcbuilder237_reason_codes_patch.sql APRÈS celui-ci échoue sur sa
--     garde (la fonction a changé) : c'est voulu, pour ne pas écraser ce
--     correctif. Si un rejeu est nécessaire, rejouer ce patch en dernier.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Garde : la fonction doit être l'une des versions connues
--    (empreinte MD5 du corps) :
--      patch des codes de motif d'origine, patch des codes corrigé, ou
--      version posée par le présent patch (rejeu).
--    Toute autre empreinte = fonction modifiée à la main : fusionner à la main.
-- ---------------------------------------------------------------------
do $$
declare v_md5 text;
begin
  select md5(prosrc) into v_md5
  from pg_proc where oid = 'public.price_reports_before_insert()'::regprocedure;
  if v_md5 <> all (array['9599a26d7c0b8234dca44315de917cf6', '8cdb70b3f4f704c7e6a937094daf8906', '0908d243849b6bc22a74eca75b0e7b76']) then
    raise exception 'price_reports_before_insert() est dans une version inconnue (md5 %). Comparer et fusionner à la main.', v_md5;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Fonction d'empreinte (pure, utilisable dans l'éditeur SQL pour contrôle)
-- ---------------------------------------------------------------------
create or replace function public.report_config_hash(_specs jsonb)
returns text language sql immutable set search_path = public as $$
  select md5(jsonb_build_object(
    'ram_gb',
      case when (_specs->>'ram_gb') ~ '^[0-9]{1,5}$' then (_specs->>'ram_gb')::int end,
    'storage_gb',
      case when (_specs->>'storage_gb') ~ '^[0-9]{1,6}$' then (_specs->>'storage_gb')::int end,
    'cpu',
      case when jsonb_typeof(_specs->'cpu') = 'string'
           then nullif(regexp_replace(lower(_specs->>'cpu'), '[^a-z0-9]', '', 'g'), '')
      end
  )::text)
$$;

-- ---------------------------------------------------------------------
-- 2. Contrôle des relevés : corps du patch des codes de motif, avec deux
--    changements : config_hash (public.report_config_hash) et les ajouts de
--    codes par array_append.
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

  new.config_hash := public.report_config_hash(new.reported_specs);

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
-- 3. Recalcul des relevés existants
--    price_reports_before_update ne touche que reviewed_by / reviewed_at
--    quand le statut change : cette mise à jour n'en modifie aucun.
-- ---------------------------------------------------------------------
update public.price_reports
   set config_hash = public.report_config_hash(reported_specs)
 where config_hash is distinct from public.report_config_hash(reported_specs);

commit;

-- =====================================================================
-- VÉRIFICATIONS (éditeur SQL, base de test)
-- =====================================================================
-- 1) La batterie est ignorée :
--      select public.report_config_hash('{"ram_gb":16,"storage_gb":256}')
--           = public.report_config_hash('{"ram_gb":16,"storage_gb":256,"battery_health_pct":80}');   -- true
-- 2) Le processeur est normalisé :
--      select public.report_config_hash('{"ram_gb":16,"cpu":"i5-8350U"}')
--           = public.report_config_hash('{"ram_gb":16,"cpu":"I5 8350u"}');                          -- true
-- 3) Une RAM différente change l'empreinte :
--      select public.report_config_hash('{"ram_gb":8}') <> public.report_config_hash('{"ram_gb":16}');  -- true
-- 4) Doublons restants dans current_prices (produit, boutique, état) : à examiner,
--    seules de vraies configurations différentes doivent subsister :
--      select product_id, shop_id, condition, count(*) from public.current_prices
--      group by 1,2,3 having count(*) > 1;
-- 5) Un relevé avec RAM hors liste doit passer en attente (et non provoquer une erreur) :
--      statut 'pending', check_level 'suspect', check_codes = {ram_not_allowed}
-- =====================================================================
