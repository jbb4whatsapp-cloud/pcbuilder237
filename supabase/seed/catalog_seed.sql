-- =====================================================================
-- PC Builder 237 : catalogue de départ des portables (document 06)
-- À exécuter APRÈS pcbuilder237_schema.sql et pcbuilder237_shop_products_patch.sql.
-- À TESTER D'ABORD SUR UN PROJET SUPABASE DE TEST. Rejouable (upsert).
-- NON EXÉCUTÉ par son auteur : écrit sans accès à une base.
--
-- !! LES VALEURS NE SONT PAS VÉRIFIÉES sur les fiches constructeur. !!
-- Elles viennent de la connaissance générale des gammes. Pour cette raison,
-- chaque fiche est insérée INACTIVE (is_active = false) : le public ne la voit
-- pas et aucun relevé ne peut la viser (le déclencheur de contrôle refuse un
-- produit inactif). Procédure : voir la section ACTIVATION en bas du fichier.
--
-- Clés specs lues par le serveur (price_reports_before_insert) :
--   max_ram_gb, allowed_ram_gb, allowed_storage_gb
-- Clés informatives (non lues pour l'instant) :
--   ram_type, ram_slots, ram_soldered_gb, to_verify, source_url, verified_on
--
-- Les listes allowed_ram_gb sont CALCULÉES (toutes combinaisons de barrettes de
-- 4, 8 et 16 Go dans les emplacements libres, plus la mémoire soudée, plafonnées
-- au maximum officiel).
-- Un reconditionneur peut annoncer 1000 ou 1024 Go pour un même disque : les
-- deux valeurs sont autorisées.
-- =====================================================================

begin;

insert into public.products (category, brand, name, specs, is_active)
values
  ('laptop', 'Lenovo', 'ThinkPad T470',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'Lenovo', 'ThinkPad T480',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'Lenovo', 'ThinkPad T480s',
   '{"ram_type": "DDR4", "ram_slots": 1, "ram_soldered_gb": [8], "max_ram_gb": 24, "allowed_ram_gb": [8, 12, 16, 24], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'Lenovo', 'ThinkPad X270',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'Dell', 'Latitude 5480',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'Dell', 'Latitude 5490',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'Dell', 'Latitude 7490',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'HP', 'EliteBook 840 G3',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'HP', 'EliteBook 840 G5',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'HP', 'ProBook 450 G5',
   '{"ram_type": "DDR4", "ram_slots": 2, "ram_soldered_gb": [], "max_ram_gb": 32, "allowed_ram_gb": [4, 8, 12, 16, 20, 24, 32], "allowed_storage_gb": [120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 960, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'Apple', 'MacBook Air 13 (2017)',
   '{"ram_type": "soudée", "ram_slots": 0, "ram_soldered_gb": [8], "max_ram_gb": 8, "allowed_ram_gb": [8], "allowed_storage_gb": [128, 256, 512], "to_verify": true}'::jsonb, false),
  ('laptop', 'Apple', 'MacBook Air 13 Retina (2018-2019)',
   '{"ram_type": "soudée", "ram_slots": 0, "ram_soldered_gb": [8, 16], "max_ram_gb": 16, "allowed_ram_gb": [8, 16], "allowed_storage_gb": [128, 256, 512, 1000, 1024], "to_verify": true}'::jsonb, false),
  ('laptop', 'Apple', 'MacBook Pro 13 (2017)',
   '{"ram_type": "soudée", "ram_slots": 0, "ram_soldered_gb": [8, 16], "max_ram_gb": 16, "allowed_ram_gb": [8, 16], "allowed_storage_gb": [128, 256, 512, 1000, 1024], "to_verify": true}'::jsonb, false),
  ('laptop', 'Apple', 'MacBook Air M1 (2020)',
   '{"ram_type": "soudée", "ram_slots": 0, "ram_soldered_gb": [8, 16], "max_ram_gb": 16, "allowed_ram_gb": [8, 16], "allowed_storage_gb": [256, 512, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false),
  ('laptop', 'Apple', 'MacBook Pro 13 M1 (2020)',
   '{"ram_type": "soudée", "ram_slots": 0, "ram_soldered_gb": [8, 16], "max_ram_gb": 16, "allowed_ram_gb": [8, 16], "allowed_storage_gb": [256, 512, 1000, 1024, 2000, 2048], "to_verify": true}'::jsonb, false)
on conflict (category, brand, name) do update
  set specs = excluded.specs
  where public.products.is_active = false;   -- ne jamais écraser une fiche déjà activée

commit;

-- =====================================================================
-- ACTIVATION (fiche par fiche, APRÈS vérification sur la fiche constructeur)
-- =====================================================================
-- 1) Voir ce qui reste à vérifier :
--      select brand, name, specs from public.products
--      where category = 'laptop' and specs->>'to_verify' = 'true' order by brand, name;
--
-- 2) Corriger si besoin les valeurs et renseigner la source, puis activer :
--      update public.products
--         set specs = (specs - 'to_verify')
--                     || jsonb_build_object('source_url', 'https://…',
--                                           'verified_on', current_date::text),
--             is_active = true
--       where category = 'laptop' and brand = 'Lenovo' and name = 'ThinkPad T480';
--
-- 3) Contrôle : aucun portable actif sans les trois clés lues par le serveur
--    (sans elles, le contrôle ne s'applique pas, en silence) :
--      select brand, name from public.products
--       where category = 'laptop' and is_active
--         and not (specs ? 'max_ram_gb' and specs ? 'allowed_ram_gb' and specs ? 'allowed_storage_gb');
--
-- VÉRIFICATIONS À FAIRE SUR LA BASE DE TEST (par un agent de test, un relevé avec preuve)
--   * ThinkPad T480, ram_gb 24, storage_gb 256 : check_level = ok, relevé publié ;
--   * ThinkPad T480, ram_gb 10 : suspect, en attente ;
--   * ThinkPad T480, ram_gb 64 : impossible, en attente ;
--   * ThinkPad T480, storage_gb 300 : suspect ;
--   * MacBook Air M1, ram_gb 32 : impossible ;
--   * un relevé sur une fiche encore inactive : refusé (produit inconnu ou inactif).
-- =====================================================================
