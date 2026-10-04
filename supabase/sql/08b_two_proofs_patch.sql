-- D4 (4 octobre 2026) : deux photos de preuve pour l'occasion et le reconditionné.
-- À exécuter après 08_config_hash_patch.sql et avant 09 (contrat de données, toujours le dernier).
-- Rejouable sans danger.
begin;

alter table public.price_reports
  drop constraint if exists price_reports_needs_two_proofs;

alter table public.price_reports
  add constraint price_reports_needs_two_proofs
  check (condition = 'new' or cardinality(proof_paths) >= 2)
  not valid;

alter table public.price_reports
  validate constraint price_reports_needs_two_proofs;

commit;
