-- =====================================================================
-- PC Builder 237 : script de test du contrat de données (document 09, v0.4)
-- À COLLER EN UNE SEULE FOIS dans l'éditeur SQL Supabase du PROJET DE TEST,
-- APRÈS toute la chaîne de patchs :
--   schéma -> agents -> propriétaire -> produits -> lancement
--   -> adresse et horaires -> codes de motif -> config_hash -> contrat de données
--
-- COMMENT ÇA MARCHE
--   * Tout le script est un seul bloc qui se termine volontairement par une
--     ERREUR : cela annule TOUT (utilisateurs, boutiques, relevés de test).
--     Rien n'est conservé dans la base, aucune donnée existante n'est touchée.
--   * Le rapport PASS / FAIL est dans le message de cette erreur
--     (« RAPPORT DE TEST … »). Une erreur d'une autre nature (avant le
--     rapport) signale un problème de préparation : voir plus bas.
--   * Les rôles sont simulés depuis l'éditeur (set local role + jeton simulé).
--     Ils reproduisent ce que voit l'API, mais ne remplacent pas le test
--     client (voir la liste « À TESTER AVEC supabase-js » en bas de fichier,
--     couverte en grande partie par supabase/tests/test_supabase_js.mjs).
--
-- SI LA PRÉPARATION ÉCHOUE sur « insert into auth.users » (Supabase peut exiger
-- des colonnes que ce script ne remplit pas) : créez les six utilisateurs dans
-- Authentication > Users, puis remplacez les six identifiants v_admin … v_anon
-- ci-dessous par les leurs et supprimez le bloc « 1. Utilisateurs ». Dans ce
-- cas les utilisateurs ne seront PAS annulés : les supprimer à la main ensuite.
--
-- Exécuté sur le projet Supabase de TEST le 02 octobre 2026 : 71 PASS ; 
-- le 04 octobre 2026, après le patch 08b : 73 PASS ; 
-- le 05 octobre 2026, après le patch 10 (modération des relevés d'agent) : 90 PASS, 0 FAIL.
-- =====================================================================

create or replace function pg_temp.t(
  _label text, _role text, _uid uuid, _sql text, _expect text, _mode text default 'q')
returns text language plpgsql as $f$
declare v_got text; n bigint; v_ok boolean;
begin
  execute format('set local role %I', _role);
  perform set_config('request.jwt.claim.sub', coalesce(_uid::text, ''), true);
  perform set_config('request.jwt.claims',
    case when _uid is null then ''
         else json_build_object('sub', _uid, 'role', _role)::text end, true);
  begin
    if _mode = 'q' then
      execute 'select count(*) from (' || _sql || ') q' into n;
    else
      execute _sql;
      get diagnostics n = row_count;
    end if;
    v_got := 'OK=' || n;
  exception when others then
    v_got := 'ERR ' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  v_ok := case when _expect = 'OK' then v_got like 'OK=%' else v_got = _expect end;
  return format('%s  %s  [attendu %s, obtenu %s]',
                case when v_ok then 'PASS' else 'FAIL' end, _label, _expect, v_got);
end $f$;

-- Vérification de valeur, exécutée avec les droits de l'éditeur
create or replace function pg_temp.v(_label text, _sql text, _expect text)
returns text language plpgsql as $f$
declare v_got text;
begin
  begin
    execute _sql into v_got;
  exception when others then
    v_got := 'ERR ' || sqlstate;
  end;
  return format('%s  %s  [attendu %s, obtenu %s]',
                case when v_got is not distinct from _expect then 'PASS' else 'FAIL' end,
                _label, _expect, coalesce(v_got, 'NULL'));
end $f$;

do $test$
declare
  v_out     text := '';
  -- identifiants de test (fixes, annulés à la fin)
  v_admin   uuid := 'f0000000-0000-0000-0000-0000000000a1';
  v_mod     uuid := 'f0000000-0000-0000-0000-0000000000b1';
  v_agent1  uuid := 'f0000000-0000-0000-0000-0000000000c1';
  v_agent2  uuid := 'f0000000-0000-0000-0000-0000000000c2';
  v_agent3  uuid := 'f0000000-0000-0000-0000-0000000000c3';  -- nouvel agent, sans historique
  v_owner   uuid := 'f0000000-0000-0000-0000-0000000000d1';
  v_anon    uuid := 'f0000000-0000-0000-0000-0000000000e1';  -- sans rôle, comme une connexion anonyme
  v_city    uuid := 'f1000000-0000-0000-0000-000000000001';
  v_quartier uuid := 'f1000000-0000-0000-0000-000000000002';
  v_country uuid := 'f1000000-0000-0000-0000-000000000003';
  v_shopA   uuid := 'f2000000-0000-0000-0000-00000000000a';  -- abonnée, avec quartier
  v_shopB   uuid := 'f2000000-0000-0000-0000-00000000000b';  -- sans quartier, sans abonnement
  v_prod    uuid := 'f3000000-0000-0000-0000-000000000001';
  v_ref1    uuid := 'f4000000-0000-0000-0000-000000000001';
  v_ref2    uuid := 'f4000000-0000-0000-0000-000000000002';
  v_ref3    uuid := 'f4000000-0000-0000-0000-000000000003';
  v_shopC   uuid := 'f2000000-0000-0000-0000-00000000000c';  -- boutique des relevés de départ
  v_prodh   uuid := 'f3000000-0000-0000-0000-000000000002';  -- produit de l'historique des agents
  v_i       int;
  v_col     text;
  v_n       int;
  v_pass    int;
  v_fail    int;
begin
  -- -------------------------------------------------------------------
  -- 0. Contrôle : le patch contrat de données est bien en place
  -- -------------------------------------------------------------------
  if to_regclass('public.price_reports_visible') is null
     or not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'price_reports'
                      and column_name = 'client_ref') then
    raise exception 'PRÉPARATION : le patch pcbuilder237_data_contract_patch.sql n''est pas exécuté. Lancer la chaîne de patchs d''abord.';
  end if;

  if position('new_agent' in pg_get_functiondef('public.price_reports_shop_rules()'::regprocedure)) = 0 then
    raise exception 'PRÉPARATION : le patch 10 (modération des relevés d''agent) n''est pas exécuté.';
  end if;
  -- -------------------------------------------------------------------
  -- 1. Utilisateurs, rôles, données de test (tout sera annulé)
  -- -------------------------------------------------------------------
  insert into auth.users (id, email) values
    (v_admin,  'test-admin@pcb237.invalid'),
    (v_mod,    'test-mod@pcb237.invalid'),
    (v_agent1, 'test-agent1@pcb237.invalid'),
    (v_agent2, 'test-agent2@pcb237.invalid'),
    (v_agent3, 'test-agent3@pcb237.invalid'),
    (v_owner,  'test-owner@pcb237.invalid'),
    (v_anon,   'test-anon@pcb237.invalid');

  insert into public.user_roles (user_id, role) values
    (v_admin, 'admin'), (v_mod, 'moderator'), (v_agent1, 'agent'), (v_agent2, 'agent'), (v_agent3, 'agent');

  insert into public.countries (id, name) values (v_country, 'Pays de test');
  insert into public.cities (id, country_id, name) values (v_city, v_country, 'Ville de test');
  insert into public.neighborhoods (id, city_id, name) values (v_quartier, v_city, 'Quartier de test');

  insert into public.shops (id, name, phone, neighborhood_id, address) values
    (v_shopA, 'Boutique A (test)', '+237699000001', v_quartier, 'Rue de test 1'),
    (v_shopB, 'Boutique B (test, sans quartier)', '+237699000002', null, 'Rue de test 2'),
    (v_shopC, 'Boutique C (test, référence)', '+237699000003', null, 'Rue de test 3');

  insert into public.shop_subscriptions (shop_id, starts_on, ends_on, amount_fcfa)
    values (v_shopA, public.today_douala() - 1, public.today_douala() + 20, 1);
  insert into public.shop_members (user_id, shop_id) values (v_owner, v_shopA);

  insert into public.products (id, category, brand, name, specs) values
    (v_prod, 'laptop', 'TestBrand', 'ThinkPad Test 480',
     '{"max_ram_gb":32,"allowed_ram_gb":[8,16,32],"allowed_storage_gb":[256,512]}');
  insert into public.products (id, category, brand, name, specs)
    values (v_prodh, 'laptop', 'TestBrand', 'Historique agents (test)', '{}');

  -- historique : 5 relevés publiés par agent, pour qu'ils ne soient plus « nouveaux »
  for v_i in 1..5 loop
    insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths, reported_by, source)
      values (v_prodh, v_shopC, 'new', 100000 + v_i, '{"ram_gb":16,"storage_gb":256}', array['seed/a.jpg'], v_agent1, 'agent'),
             (v_prodh, v_shopC, 'new', 110000 + v_i, '{"ram_gb":16,"storage_gb":256}', array['seed/a.jpg'], v_agent2, 'agent');
  end loop;

  -- référence de prix sur le produit principal (occasion, 16 Go / 256 Go)
  insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths, reported_by, source)
    values (v_prod, v_shopC, 'used', 200000, '{"ram_gb":16,"storage_gb":256}',
            array['seed/a.jpg', 'seed/b.jpg'], v_mod, 'agent');

  -- -------------------------------------------------------------------
  -- 2. Relevés de départ, envoyés comme un vrai agent
  -- -------------------------------------------------------------------
  v_out := v_out || pg_temp.t('agent1 : relevé conforme boutique A (avec client_ref)', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths, client_ref)
              values (%L, %L, 'used', 200000, '{"ram_gb":16,"storage_gb":256}', %L, %L)$q$,
           v_prod, v_shopA, array[v_agent1::text || '/1/a.jpg', v_agent1::text || '/1/b.jpg'], v_ref1), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : relevé RAM hors liste boutique B (doit passer en attente)', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'used', 210000, '{"ram_gb":10,"storage_gb":256}', %L)$q$,
           v_prod, v_shopB, array[v_agent1::text || '/2/a.jpg', v_agent1::text || '/2/b.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : relevé conforme boutique B', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'used', 195000, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopB, array[v_agent1::text || '/3/a.jpg', v_agent1::text || '/3/b.jpg']), 'OK=1', 'x') || E'\n';

  v_out := v_out || pg_temp.v('état du relevé hors liste = pending, suspect, ram_not_allowed',
    format($q$select status::text || ',' || check_level::text || ',' || check_codes::text
              from public.price_reports where product_id = %L and price_fcfa = 210000$q$, v_prod),
    'pending,suspect,{ram_not_allowed}') || E'\n';

  -- -------------------------------------------------------------------
  -- 3. C3 : lecture directe de price_reports fermée
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- C3 : lecture de price_reports\n';
  v_out := v_out || pg_temp.t('anon : check_reason refusé', 'anon', null, format('select check_reason from public.price_reports where product_id = %L', v_prod), 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.t('anon : reported_by refusé', 'anon', null, format('select reported_by from public.price_reports where product_id = %L', v_prod), 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.t('anon : proof_paths refusé', 'anon', null, format('select proof_paths from public.price_reports where product_id = %L', v_prod), 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.t('anon : review_note refusé', 'anon', null, format('select review_note from public.price_reports where product_id = %L', v_prod), 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.t('anon : select * refusé', 'anon', null, 'select * from public.price_reports', 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.t('anon : colonnes ouvertes, 3 relevés publiés', 'anon', null, format('select id, price_fcfa, status, check_codes, config_hash from public.price_reports where product_id = %L', v_prod), 'OK=3') || E'\n';
  v_out := v_out || pg_temp.t('connexion anonyme : reported_by refusé', 'authenticated', v_anon, format('select reported_by from public.price_reports where product_id = %L', v_prod), 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : check_reason direct refusé (passer par la vue)', 'authenticated', v_agent1, format('select check_reason from public.price_reports where product_id = %L', v_prod), 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.t('modérateur : check_reason direct refusé (passer par la vue)', 'authenticated', v_mod, format('select check_reason from public.price_reports where product_id = %L', v_prod), 'ERR 42501') || E'\n';

  -- -------------------------------------------------------------------
  -- 4. current_prices (C1, C2, C3) et shops_public (C1)
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- current_prices et shops_public\n';
  v_out := v_out || pg_temp.t('anon : current_prices avec city_id et config_hash, 3 lignes', 'anon', null, format('select report_id, city_id, config_hash, check_codes from public.current_prices where product_id = %L', v_prod), 'OK=3') || E'\n';
  v_out := v_out || pg_temp.t('anon : current_prices n''a plus check_reason', 'anon', null, 'select check_reason from public.current_prices', 'ERR 42703') || E'\n';
  v_out := v_out || pg_temp.t('anon : filtre city_id = ville de test, 1 ligne (boutique A)', 'anon', null, format('select report_id from public.current_prices where product_id = %L and city_id = %L', v_prod, v_city), 'OK=1') || E'\n';
  v_out := v_out || pg_temp.t('anon : shops_public lisible, 2 boutiques de test', 'anon', null, format('select id, city_id from public.shops_public where id in (%L, %L)', v_shopA, v_shopB), 'OK=2') || E'\n';
  v_out := v_out || pg_temp.t('anon : select * sur shops refusé', 'anon', null, 'select * from public.shops', 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.v('shops_public : city_id de la boutique A = la ville de test',
    format('select city_id::text from public.shops_public where id = %L', v_shopA), v_city::text) || E'\n';
  v_out := v_out || pg_temp.v('shops_public : city_id de la boutique B (sans quartier) = NULL',
    format('select city_id::text from public.shops_public where id = %L', v_shopB), null) || E'\n';

  -- -------------------------------------------------------------------
  -- 5. price_reports_visible : qui voit quoi
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- price_reports_visible\n';
  v_out := v_out || pg_temp.t('anon : vue refusée', 'anon', null, 'select * from public.price_reports_visible', 'ERR 42501') || E'\n';
  v_out := v_out || pg_temp.t('connexion anonyme (sans rôle) : 0 ligne', 'authenticated', v_anon, format('select * from public.price_reports_visible where product_id = %L', v_prod), 'OK=0') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : voit ses 3 relevés', 'authenticated', v_agent1, format('select * from public.price_reports_visible where product_id = %L', v_prod), 'OK=3') || E'\n';
  v_out := v_out || pg_temp.t('agent2 : ne voit pas ceux de l''agent1', 'authenticated', v_agent2, format('select * from public.price_reports_visible where product_id = %L', v_prod), 'OK=0') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : voit son check_reason (1 relevé en attente)', 'authenticated', v_agent1, format('select 1 from public.price_reports_visible where product_id = %L and check_reason is not null', v_prod), 'OK=1') || E'\n';
  v_out := v_out || pg_temp.t('propriétaire boutique A : voit 1 relevé (celui de sa boutique)', 'authenticated', v_owner, format('select * from public.price_reports_visible where product_id = %L', v_prod), 'OK=1') || E'\n';
  v_out := v_out || pg_temp.t('propriétaire : check_reason masqué (il n''est pas l''auteur)', 'authenticated', v_owner, format('select 1 from public.price_reports_visible where product_id = %L and check_reason is not null', v_prod), 'OK=0') || E'\n';
  v_out := v_out || pg_temp.t('modérateur : voit les 4 relevés, en attente compris', 'authenticated', v_mod, format('select * from public.price_reports_visible where product_id = %L', v_prod), 'OK=4') || E'\n';
  v_out := v_out || pg_temp.t('modérateur : voit le check_reason (1 relevé)', 'authenticated', v_mod, format('select 1 from public.price_reports_visible where product_id = %L and check_reason is not null', v_prod), 'OK=1') || E'\n';

  -- -------------------------------------------------------------------
  -- 6. Insertion : colonnes à relire (règle du site)
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- insertion et relecture\n';
  v_out := v_out || pg_temp.t('agent1 : insert + returning colonnes ouvertes', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'new', 300000, '{"ram_gb":16,"storage_gb":256}', %L)
              returning id, status, check_level, check_codes$q$,
           v_prod, v_shopA, array[v_agent1::text || '/5/a.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : insert + returning * refusé (colonnes fermées)', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'new', 310000, '{"ram_gb":16,"storage_gb":256}', %L)
              returning *$q$,
           v_prod, v_shopA, array[v_agent1::text || '/6/a.jpg']), 'ERR 42501', 'x') || E'\n';
  v_out := v_out || pg_temp.t('personne sans rôle : insertion refusée par le déclencheur (PB030)', 'authenticated', v_anon,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'new', 100000, '{"ram_gb":16}', %L)$q$,
           v_prod, v_shopA, array[v_anon::text || '/1/a.jpg']), 'ERR PB030', 'x') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : occasion avec une seule photo refusée (23514, deux preuves exigées)', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'used', 190000, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopA, array[v_agent1::text || '/8/a.jpg']), 'ERR 23514', 'x') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : reconditionné avec une seule photo refusé (23514)', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'refurbished', 191000, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopA, array[v_agent1::text || '/9/a.jpg']), 'ERR 23514', 'x') || E'\n';

  -- -------------------------------------------------------------------
  -- 7. C5 : clé d'idempotence
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- C5 client_ref\n';
  v_out := v_out || pg_temp.t('agent1 : même client_ref renvoyé = doublon 23505', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths, client_ref)
              values (%L, %L, 'used', 200000, '{"ram_gb":16,"storage_gb":256}', %L, %L)$q$,
           v_prod, v_shopA, array[v_agent1::text || '/1/a.jpg', v_agent1::text || '/1/b.jpg'], v_ref1), 'ERR 23505', 'x') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : autre client_ref accepté', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths, client_ref)
              values (%L, %L, 'used', 201000, '{"ram_gb":16,"storage_gb":256}', %L, %L)$q$,
           v_prod, v_shopA, array[v_agent1::text || '/4/a.jpg', v_agent1::text || '/4/b.jpg'], v_ref2), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.t('agent2 : le même client_ref qu''un autre auteur est accepté (unicité par auteur)', 'authenticated', v_agent2,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths, client_ref)
              values (%L, %L, 'used', 202000, '{"ram_gb":16,"storage_gb":256}', %L, %L)$q$,
           v_prod, v_shopA, array[v_agent2::text || '/1/a.jpg', v_agent2::text || '/1/b.jpg'], v_ref1), 'OK=1', 'x') || E'\n';

  -- -------------------------------------------------------------------
  -- 8. C8 : note obligatoire au rejet
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- C8 note de rejet\n';
  v_out := v_out || pg_temp.t('modérateur : rejet sans note = PB032', 'authenticated', v_mod,
    format($q$update public.price_reports set status = 'rejected' where product_id = %L and check_level = 'suspect'$q$, v_prod), 'ERR PB032', 'x') || E'\n';
  v_out := v_out || pg_temp.t('modérateur : rejet avec note d''espaces = PB032', 'authenticated', v_mod,
    format($q$update public.price_reports set status = 'rejected', review_note = '   ' where product_id = %L and check_level = 'suspect'$q$, v_prod), 'ERR PB032', 'x') || E'\n';
  v_out := v_out || pg_temp.t('modérateur : rejet avec note accepté', 'authenticated', v_mod,
    format($q$update public.price_reports set status = 'rejected', review_note = 'Photo illisible' where product_id = %L and check_level = 'suspect'$q$, v_prod), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('le serveur a fixé l''auteur de la décision (reviewed_by = modérateur)',
    format($q$select (reviewed_by = %L)::text from public.price_reports where product_id = %L and check_level = 'suspect'$q$, v_mod, v_prod), 'true') || E'\n';
  v_out := v_out || pg_temp.t('modérateur : update puis returning * refusé (colonnes fermées)', 'authenticated', v_mod,
    format($q$update public.price_reports set in_stock = false where product_id = %L and price_fcfa = 195000 returning *$q$, v_prod), 'ERR 42501', 'x') || E'\n';
  v_out := v_out || pg_temp.t('agent1 : ne peut pas modifier un relevé', 'authenticated', v_agent1,
    format($q$update public.price_reports set status = 'published' where product_id = %L$q$, v_prod), 'OK=0', 'x') || E'\n';

  -- -------------------------------------------------------------------
  -- 8b. Propriétaire de boutique : colonnes réservées à l'auteur et au personnel
  --     Relevé suspect sur la boutique A, puis rejeté avec note : les sept
  --     colonnes sont renseignées dans la table.
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- propriétaire : colonnes masquées\n';
  v_out := v_out || pg_temp.t('agent1 : relevé suspect sur la boutique A (avec client_ref)', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths, client_ref)
              values (%L, %L, 'used', 205000, '{"ram_gb":10,"storage_gb":256}', %L, %L)$q$,
           v_prod, v_shopA, array[v_agent1::text || '/7/a.jpg', v_agent1::text || '/7/b.jpg'], v_ref3), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.t('modérateur : rejette ce relevé avec une note', 'authenticated', v_mod,
    format($q$update public.price_reports set status = 'rejected', review_note = 'Photo illisible'
              where product_id = %L and price_fcfa = 205000$q$, v_prod), 'OK=1', 'x') || E'\n';

  -- Contrôle de la donnée : le modérateur doit voir les sept colonnes renseignées.
  -- Sans cela, un NULL côté propriétaire ne prouverait rien.
  foreach v_col in array array['proof_paths','check_reason','review_note',
                               'reported_by','reviewed_by','reviewed_at','client_ref'] loop
    v_out := v_out || pg_temp.t(format('modérateur : %s renseigné sur ce relevé', v_col),
      'authenticated', v_mod,
      format('select 1 from public.price_reports_visible where product_id = %L and price_fcfa = 205000 and %I is not null',
             v_prod, v_col), 'OK=1') || E'\n';
  end loop;

  -- Le propriétaire de la boutique A voit le relevé, mais aucune de ces colonnes.
  v_out := v_out || pg_temp.t('propriétaire : voit ce relevé rejeté (prix, statut, niveau)', 'authenticated', v_owner,
    format('select 1 from public.price_reports_visible where product_id = %L and price_fcfa = 205000 and status is not null and check_level is not null',
           v_prod), 'OK=1') || E'\n';
  foreach v_col in array array['proof_paths','check_reason','review_note',
                               'reported_by','reviewed_by','reviewed_at','client_ref'] loop
    v_out := v_out || pg_temp.t(format('propriétaire : %s masqué (relevé d''un autre auteur)', v_col),
      'authenticated', v_owner,
      format('select 1 from public.price_reports_visible where product_id = %L and price_fcfa = 205000 and %I is not null',
             v_prod, v_col), 'OK=0') || E'\n';
  end loop;

  -- -------------------------------------------------------------------
  -- 8c. Relevé envoyé par une boutique : il naît toujours en attente,
  --     avec l origine « boutique » (règle du MVP, document 02, section 10)
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- propriétaire : relevé de boutique\n';
  v_out := v_out || pg_temp.t('propriétaire abonné : insère un relevé conforme sur sa boutique', 'authenticated', v_owner,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'used', 199000, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopA, array[v_owner::text || '/1/a.jpg', v_owner::text || '/1/b.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('ce relevé conforme est enregistré pending, source shop (jamais publié sans modération)',
    format($q$select status::text || ',' || source::text from public.price_reports
              where product_id = %L and price_fcfa = 199000$q$, v_prod),
    'pending,shop') || E'\n';
  v_out := v_out || pg_temp.t('propriétaire : envoie status published et source agent', 'authenticated', v_owner,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths, status, source)
              values (%L, %L, 'used', 198000, '{"ram_gb":16,"storage_gb":256}', %L, 'published', 'agent')$q$,
           v_prod, v_shopA, array[v_owner::text || '/2/a.jpg', v_owner::text || '/2/b.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('... les valeurs envoyées sont écrasées : pending, source shop',
    format($q$select status::text || ',' || source::text from public.price_reports
              where product_id = %L and price_fcfa = 198000$q$, v_prod),
    'pending,shop') || E'\n';
  v_out := v_out || pg_temp.t('propriétaire auteur : voit proof_paths et reported_by sur son propre relevé', 'authenticated', v_owner,
    format('select 1 from public.price_reports_visible where product_id = %L and price_fcfa = 199000 and proof_paths is not null and reported_by is not null',
           v_prod), 'OK=1') || E'\n';

  -- -------------------------------------------------------------------
  -- 8d. Modération des relevés d'agent (patch 10)
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- modération des relevés d''agent\n';

  v_out := v_out || pg_temp.t('agent1 (confirmé) : prix proche de la médiane', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'used', 205500, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopB, array[v_agent1::text || '/10/a.jpg', v_agent1::text || '/10/b.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('... publié, sans motif',
    format($q$select status::text || ',' || check_level::text || ',' || check_codes::text
              from public.price_reports where product_id = %L and price_fcfa = 205500$q$, v_prod),
    'published,ok,{}') || E'\n';

  v_out := v_out || pg_temp.t('agent1 : prix 40 % au-dessus de la médiane', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'used', 280000, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopB, array[v_agent1::text || '/11/a.jpg', v_agent1::text || '/11/b.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('... en attente, motif price_deviation, niveau ok',
    format($q$select status::text || ',' || check_level::text || ',' || check_codes::text
              from public.price_reports where product_id = %L and price_fcfa = 280000$q$, v_prod),
    'pending,ok,{price_deviation}') || E'\n';

  v_out := v_out || pg_temp.t('agent1 : état sans aucun relevé de référence (reconditionné)', 'authenticated', v_agent1,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'refurbished', 150000, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopB, array[v_agent1::text || '/12/a.jpg', v_agent1::text || '/12/b.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('... en attente, motif no_reference',
    format($q$select status::text || ',' || check_level::text || ',' || check_codes::text
              from public.price_reports where product_id = %L and price_fcfa = 150000$q$, v_prod),
    'pending,ok,{no_reference}') || E'\n';

  -- agent3 : 5 premiers relevés (prix 203001 à 203005) puis un sixième
  for v_i in 1..5 loop
    v_out := v_out || pg_temp.t(format('agent3 : relevé n° %s (conforme)', v_i), 'authenticated', v_agent3,
      format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
                values (%L, %L, 'used', %s, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
             v_prod, v_shopB, 203000 + v_i,
             array[v_agent3::text || '/' || v_i || '/a.jpg', v_agent3::text || '/' || v_i || '/b.jpg']), 'OK=1', 'x') || E'\n';
  end loop;
  v_out := v_out || pg_temp.v('agent3 : le 1er relevé est en attente, motif new_agent',
    format($q$select status::text || ',' || check_level::text || ',' || check_codes::text
              from public.price_reports where product_id = %L and price_fcfa = 203001$q$, v_prod),
    'pending,ok,{new_agent}') || E'\n';
  v_out := v_out || pg_temp.v('agent3 : ses 5 premiers relevés sont tous en attente',
    format($q$select count(*)::text from public.price_reports where reported_by = %L and status = 'pending'$q$, v_agent3),
    '5') || E'\n';

  v_out := v_out || pg_temp.t('agent3 : 6e relevé conforme', 'authenticated', v_agent3,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'used', 203006, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopB, array[v_agent3::text || '/6/a.jpg', v_agent3::text || '/6/b.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('... le 6e est publié',
    format($q$select status::text || ',' || check_codes::text from public.price_reports
              where product_id = %L and price_fcfa = 203006$q$, v_prod),
    'published,{}') || E'\n';

  v_out := v_out || pg_temp.t('modérateur : prix très écarté, publié quand même (personnel exempté)', 'authenticated', v_mod,
    format($q$insert into public.price_reports (product_id, shop_id, condition, price_fcfa, reported_specs, proof_paths)
              values (%L, %L, 'used', 281000, '{"ram_gb":16,"storage_gb":256}', %L)$q$,
           v_prod, v_shopB, array[v_mod::text || '/1/a.jpg', v_mod::text || '/1/b.jpg']), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('... publié, sans motif',
    format($q$select status::text || ',' || check_codes::text from public.price_reports
              where product_id = %L and price_fcfa = 281000$q$, v_prod),
    'published,{}') || E'\n';

  -- -------------------------------------------------------------------
  -- 9. C9 : un signalement naît toujours 'open'
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- C9 signalements\n';
  v_out := v_out || pg_temp.t('connexion anonyme : signalement avec status dismissed accepté', 'authenticated', v_anon,
    format($q$insert into public.flags (shop_id, reason, status) values (%L, 'Prix faux pour ce test', 'dismissed')$q$, v_shopA), 'OK=1', 'x') || E'\n';
  v_out := v_out || pg_temp.v('... mais enregistré avec status = open',
    format($q$select status::text from public.flags where shop_id = %L and created_by = %L$q$, v_shopA, v_anon), 'open') || E'\n';
  v_out := v_out || pg_temp.t('connexion anonyme : created_by usurpé refusé', 'authenticated', v_anon,
    format($q$insert into public.flags (shop_id, reason, created_by) values (%L, 'Prix faux pour ce test', %L)$q$, v_shopA, v_agent1), 'ERR 42501', 'x') || E'\n';
  v_out := v_out || pg_temp.t('anon sans session : signalement refusé', 'anon', null,
    format($q$insert into public.flags (shop_id, reason) values (%L, 'Prix faux pour ce test')$q$, v_shopA), 'ERR 42501', 'x') || E'\n';
  v_out := v_out || pg_temp.t('connexion anonyme : ne relit pas les signalements (0 ligne)', 'authenticated', v_anon,
    format('select * from public.flags where shop_id = %L', v_shopA), 'OK=0') || E'\n';
  v_out := v_out || pg_temp.t('modérateur : voit le signalement dans sa file', 'authenticated', v_mod,
    format($q$select * from public.flags where shop_id = %L and status = 'open'$q$, v_shopA), 'OK=1') || E'\n';

  -- -------------------------------------------------------------------
  -- 10. Expiration de l'abonnement : le propriétaire perd l'accès
  -- -------------------------------------------------------------------
  v_out := v_out || E'\n-- expiration d''abonnement\n';
  update public.shop_subscriptions
     set starts_on = public.today_douala() - 30, ends_on = public.today_douala() - 1
   where shop_id = v_shopA;
  v_out := v_out || pg_temp.t('propriétaire : ne voit plus les relevés des autres après expiration', 'authenticated', v_owner,
    format('select * from public.price_reports_visible where product_id = %L and price_fcfa not in (198000, 199000)', v_prod), 'OK=0') || E'\n';
  v_out := v_out || pg_temp.t('propriétaire : garde ses 2 propres relevés (il en est l''auteur)', 'authenticated', v_owner,
    format('select * from public.price_reports_visible where product_id = %L and price_fcfa in (198000, 199000)', v_prod), 'OK=2') || E'\n';

  -- -------------------------------------------------------------------
  -- 11. Rapport et annulation de tout
  -- -------------------------------------------------------------------
  select count(*) into v_pass from regexp_matches(v_out, '^PASS', 'gn');
  select count(*) into v_fail from regexp_matches(v_out, '^FAIL', 'gn');
  raise exception using
    errcode = 'P0001',
    message = format(E'RAPPORT DE TEST (tout est annulé, rien n''a été conservé) : %s PASS, %s FAIL\n\n%s\n%s',
                     v_pass, v_fail,
                     case when v_fail = 0 then 'Tous les tests ont réussi.' else 'Des tests ont échoué : lire les lignes FAIL.' end,
                     v_out);
end
$test$;

-- =====================================================================
-- À TESTER AVEC supabase-js (ce qu'un script SQL ne peut pas montrer)
-- Les points 1 à 4 et 6 sont couverts par supabase/tests/test_supabase_js.mjs
-- (31 PASS). Le détail et l'état de chaque vérification sont dans le
-- document 09, section 14.
-- 1. Une insertion refusée par un déclencheur (par exemple rejeter un relevé
--    sans note) : error.code vaut-il bien 'PB032' ? Même question pour
--    l'envoi d'un relevé déjà envoyé : error.code = '23505'.   [vérifié]
-- 2. .from('price_reports').insert({...}).select('id,status,check_level,check_codes')
--    réussit pour un agent ; .select() sans argument échoue (42501).   [vérifié]
-- 3. Un modérateur : .from('price_reports').update({status:'rejected', review_note:'…'})
--    sans .select() réussit ; un échec de relecture ne doit pas être pris
--    pour un échec de la mise à jour.   [vérifié]
-- 4. Connexion anonyme (signInAnonymously) : insérer un signalement avec
--    status 'dismissed' réussit ; le relire par select renvoie 0 ligne ; la
--    ligne est 'open'.   [vérifié ; insert puis .select() (42501) : à tester]
-- 5. .from('price_reports_visible').select('*') : sans session, refusé ;
--    avec une session d'agent, ne renvoie que ses relevés. Le tableau de bord
--    Supabase peut avertir que la vue n'a pas security_invoker : c'est attendu.
--    [refus sans session et lecture agent : vérifiés ; avertissement du tableau
--    de bord : à regarder]
-- 6. Une photo envoyée sous <uid>/<horodatage>/x.jpg est acceptée ; sous un
--    autre dossier, refusée ; upsert et suppression par l'agent, refusés.   [vérifié]
-- =====================================================================
