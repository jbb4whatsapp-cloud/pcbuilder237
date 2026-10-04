import './garde-fou.mjs'
// =====================================================================
// PC Builder 237 : vérifications côté client (supabase-js), BASE DE TEST UNIQUEMENT
// Complète pcbuilder237_test_supabase.sql (qui ne passe pas par l'API).
//
// Exécuté sur le projet de TEST : 31 PASS, 0 FAIL. Rejeu complet 01 à 09
// sur une base de test vide, puis ce script : réussi.
//
// PRÉPARATION
//   npm init -y && npm i @supabase/supabase-js        (Node 18.17 ou plus)
//   Avoir sur le projet de TEST : la chaîne de patchs complète, une boutique
//   active, un portable ACTIF dont la fiche a allowed_ram_gb (catalogue de départ
//   activé), un compte agent (grant_agent), un compte modérateur (rôle moderator),
//   un compte propriétaire rattaché à SHOP_ID (shop_members) avec un abonnement
//   actif (shop_subscriptions), et « Allow anonymous sign-ins » activé
//   (Authentication > Providers). Comptes créés avec Auto Confirm User coché.
//
// LANCEMENT (variables d'environnement, jamais de clé secrète ici ;
//            fichier .env.test.local, ignoré par git)
//   TEST_SUPABASE_URL=https://xxxx.supabase.co
//   TEST_SUPABASE_PUBLISHABLE_KEY=...            (clé publique)
//   AGENT_EMAIL=... AGENT_PASSWORD=...
//   MOD_EMAIL=...   MOD_PASSWORD=...
//   OWNER_EMAIL=... OWNER_PASSWORD=...      (propriétaire abonné de SHOP_ID)
//   SHOP_ID=<uuid d'une boutique active>
//   PRODUCT_ID=<uuid d'un portable actif, avec allowed_ram_gb>
//   npm run test:supabase
//
// CE QUE LE SCRIPT LAISSE DANS LA BASE DE TEST : quelques relevés (dont un
// rejeté), un signalement, une photo de 1 octet dans le bucket proofs.
// À nettoyer à la main ; ne jamais le lancer en production.
// =====================================================================
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const need = (k) => { const v = process.env[k]; if (!v) { console.error(`Variable manquante : ${k}`); process.exit(2); } return v; };
const URL = need('TEST_SUPABASE_URL'), KEY = need('TEST_SUPABASE_PUBLISHABLE_KEY');
const AGENT = { email: need('AGENT_EMAIL'), password: need('AGENT_PASSWORD') };
const MOD = { email: need('MOD_EMAIL'), password: need('MOD_PASSWORD') };
const OWNER = { email: need('OWNER_EMAIL'), password: need('OWNER_PASSWORD') };
const SHOP_ID = need('SHOP_ID'), PRODUCT_ID = need('PRODUCT_ID');

const client = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
let pass = 0, fail = 0, skip = 0;
const report = (ok, label, got) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  [obtenu : ${got}]`}`); };
const note = (label, got) => { skip++; console.log(`INFO  ${label}  [${got}]`); };
const code = (r) => (r.error ? r.error.code : 'aucune erreur');

const specs = { ram_gb: 16, storage_gb: 256 };
const newReport = (uid, over = {}, ref = randomUUID()) => ({
  product_id: PRODUCT_ID, shop_id: SHOP_ID, condition: 'used', price_fcfa: 200000 + Math.floor(Math.random() * 1000),
  reported_specs: specs, proof_paths: [`${uid}/${Date.now()}/test.jpg`, `${uid}/${Date.now()}/test2.jpg`], client_ref: ref, ...over,
});

async function main() {
  // ---- visiteur sans session
  const pub = client();
  let r = await pub.from('current_prices').select('report_id,city_id,config_hash,check_codes').limit(1);
  report(!r.error, 'visiteur : current_prices lisible avec city_id et config_hash', code(r));
  r = await pub.from('current_prices').select('check_reason').limit(1);
  report(r.error?.code === '42703', 'visiteur : current_prices n\'a plus check_reason (42703)', code(r));
  r = await pub.from('price_reports').select('check_reason').limit(1);
  report(r.error?.code === '42501', 'visiteur : price_reports.check_reason refusé (42501)', code(r));
  r = await pub.from('price_reports').select('*').limit(1);
  report(r.error?.code === '42501', 'visiteur : price_reports select * refusé (42501)', code(r));
  r = await pub.from('price_reports_visible').select('id').limit(1);
  report(r.error?.code === '42501', 'visiteur : price_reports_visible refusée (42501)', code(r));

  // ---- agent
  const agent = client();
  const a = await agent.auth.signInWithPassword(AGENT);
  if (a.error) { report(false, 'agent : connexion', a.error.message); return; }
  const uid = a.data.user.id;

  const ref = randomUUID();
  r = await agent.from('price_reports').insert(newReport(uid, {}, ref)).select('id,status,check_level,check_codes');
  report(!r.error && r.data?.length === 1, 'agent : insertion + .select() de colonnes ouvertes', code(r));
  const firstId = r.data?.[0]?.id;

  r = await agent.from('price_reports').insert(newReport(uid, {}, ref)).select('id');
  report(r.error?.code === '23505', 'agent : même client_ref = 23505', code(r));
  report(/price_reports_client_ref_key/.test(`${r.error?.message ?? ''} ${r.error?.details ?? ''}`),
         'agent : l\'erreur nomme price_reports_client_ref_key (sinon lire error.message)',
         `${r.error?.message} | ${r.error?.details}`);

  r = await agent.from('price_reports').insert(newReport(uid)).select();
  report(r.error?.code === '42501', 'agent : insertion + .select() complet refusée (42501)', code(r));

  r = await agent.from('price_reports_visible').select('id,check_reason,proof_paths');
  report(!r.error && r.data.length >= 1 && r.data.every((x) => 'check_reason' in x), 'agent : lit ses relevés par price_reports_visible', code(r));
  if (firstId) {
    r = await agent.from('price_reports').update({ status: 'published' }).eq('id', firstId).select('id');
    report(!r.error && (r.data ?? []).length === 0, 'agent : ne peut pas modifier un relevé (0 ligne)', code(r));
  }

  // ---- photo : dossier propre accepté, autre dossier refusé, pas d'écrasement ni de suppression
  const body = new Uint8Array([0xff]);
  const mine = `${uid}/${Date.now()}/x.jpg`;
  let u = await agent.storage.from('proofs').upload(mine, body, { contentType: 'image/jpeg' });
  report(!u.error, 'agent : photo dans son dossier acceptée', u.error?.message);
  u = await agent.storage.from('proofs').upload(`${randomUUID()}/${Date.now()}/x.jpg`, body, { contentType: 'image/jpeg' });
  report(!!u.error, 'agent : photo dans le dossier d\'un autre refusée', u.error ? 'refusée' : 'acceptée');
  u = await agent.storage.from('proofs').upload(mine, body, { contentType: 'image/jpeg', upsert: true });
  report(!!u.error, 'agent : écrasement (upsert) refusé', u.error ? 'refusé' : 'accepté');
  await agent.storage.from('proofs').remove([mine]);
  const folder = mine.split('/').slice(0, 2).join('/');
  const ls = await agent.storage.from('proofs').list(folder);
  report(!ls.error && (ls.data ?? []).some((f) => f.name === 'x.jpg'), 'agent : suppression sans effet (la photo existe toujours)', ls.error?.message ?? 'photo disparue');

  // ---- un relevé en attente pour tester le modérateur (RAM hors liste)
  const pend = await agent.from('price_reports')
    .insert(newReport(uid, { reported_specs: { ram_gb: 7, storage_gb: 256 }, price_fcfa: 111111 }))
    .select('id,status,check_codes');
  const pendId = pend.data?.[0]?.id;

  // ---- modérateur
  const mod = client();
  const m = await mod.auth.signInWithPassword(MOD);
  if (m.error) { report(false, 'modérateur : connexion', m.error.message); }
  else if (!pendId || pend.data[0].status !== 'pending') {
    note('modérateur : tests de rejet ignorés (le relevé de test n\'est pas en attente : fiche sans allowed_ram_gb ?)', pend.error?.message ?? pend.data?.[0]?.status);
  } else {
    r = await mod.from('price_reports').update({ status: 'rejected' }).eq('id', pendId);
    report(r.error?.code === 'PB032', 'modérateur : rejet sans note = PB032', code(r));
    r = await mod.from('price_reports').update({ status: 'rejected', review_note: 'Test automatique : photo illisible' }).eq('id', pendId);
    report(!r.error, 'modérateur : rejet avec note, sans .select(), réussit', code(r));

    // --- propriétaire de SHOP_ID : colonnes réservées à l'auteur et au personnel ---
    const MASKED = ['proof_paths', 'check_reason', 'review_note',
      'reported_by', 'reviewed_by', 'reviewed_at', 'client_ref'];

    // Ce que voit le modérateur : sert à savoir si un NULL côté propriétaire prouve quelque chose
    const modView = await mod.from('price_reports_visible').select('*').eq('id', pendId).maybeSingle();
    for (const col of MASKED) {
      if (modView.data?.[col] === null || modView.data?.[col] === undefined) {
        note(`propriétaire : ${col} est vide même pour le modérateur, le test de masquage ne prouve rien pour cette colonne`, 'donnée de test à compléter');
      }
    }

    const owner = client();
    const ownerLogin = await owner.auth.signInWithPassword(OWNER);
    report(!ownerLogin.error, 'propriétaire : connexion', ownerLogin.error?.message);

    r = await owner.from('price_reports_visible').select('*').eq('id', pendId).maybeSingle();
    report(!r.error && !!r.data, 'propriétaire : voit le relevé de sa boutique (abonnement actif ?)', r.error ? code(r) : 'aucune ligne');
    const row = r.data;
    report(!!row && row.price_fcfa != null && row.status != null && row.check_level != null,
      'propriétaire : prix, statut et niveau visibles', row ? 'colonne vide' : 'aucune ligne');
    for (const col of MASKED) {
      report(!!row && row[col] === null, `propriétaire : ${col} masqué`, row ? String(row[col]) : 'aucune ligne');
    }
    r = await mod.from('price_reports_visible').select('id,status,review_note,reviewed_by').eq('id', pendId).single();
    report(!r.error && r.data.status === 'rejected' && !!r.data.review_note, 'modérateur : relit le rejet par price_reports_visible', code(r));
  }

  // ---- connexion anonyme : signalement
  const anon = client();
  const s = await anon.auth.signInAnonymously();
  if (s.error) { report(false, 'connexion anonyme (activée dans le tableau de bord ?)', s.error.message); }
  else {
    const flagId = randomUUID();
    r = await anon.from('flags').insert({ id: flagId, shop_id: SHOP_ID, reason: 'Test automatique du site', status: 'dismissed' });
    report(!r.error, 'connexion anonyme : signalement avec status dismissed accepté (sans .select())', code(r));
    r = await anon.from('flags').select('id').eq('id', flagId);
    report((r.data ?? []).length === 0, 'connexion anonyme : ne relit pas son signalement', r.error ? code(r) : `${r.data.length} ligne(s)`);
    if (m.error) note('statut du signalement non vérifié (modérateur non connecté)', '');
    else {
      r = await mod.from('flags').select('status').eq('id', flagId).single();
      report(!r.error && r.data.status === 'open', 'modérateur : le signalement est enregistré open', r.error ? code(r) : r.data.status);
    }
  }

  console.log(`\n${pass} PASS, ${fail} FAIL${skip ? `, ${skip} INFO` : ''}`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
