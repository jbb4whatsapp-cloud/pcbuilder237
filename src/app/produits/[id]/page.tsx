import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/db/public'
import { REVALIDATE } from '@/lib/db/cache'
import { SELECT } from '@/lib/db/colonnes'
import { plage } from '@/lib/db/pagination'
import { mapError } from '@/lib/db/erreurs'
import { alerteDe, parametresAlerte } from '@/lib/calculs/alerte'
import { estEligible, meilleurPrix, porteEtiquetteMeilleurPrix, trierLignes } from '@/lib/calculs/prix'
import { formaterPrix, nombre } from '@/lib/calculs/affichage'
import { dateComplete, libelleRelatif } from '@/lib/calculs/dates'
import { lienWhatsapp } from '@/lib/calculs/whatsapp'
import { messageProduit } from '@/lib/calculs/messageProduit'
import { message } from '@/lib/messages'
import type { CityRow, Condition, CurrentPriceRow, NeighborhoodRow, ProductRow } from '@/lib/db/types'

export const metadata: Metadata = { title: 'Fiche produit' }

const ETATS: readonly Condition[] = ['new', 'refurbished', 'used']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Filtres {
  ville: string | null
  etat: Condition | null
}

function lire(params: { ville?: string; etat?: string }): Filtres {
  return {
    ville: params.ville && UUID.test(params.ville) ? params.ville : null,
    etat: ETATS.find((e) => e === params.etat) ?? null,
  }
}

function lien(id: string, actuels: Filtres, changement: Partial<Filtres>): string {
  const f = { ...actuels, ...changement }
  const q = new URLSearchParams()
  if (f.ville) q.set('ville', f.ville)
  if (f.etat) q.set('etat', f.etat)
  const texte = q.toString()
  return texte ? `/produits/${id}?${texte}` : `/produits/${id}`
}

function texteGarantie(mois: number | null): string {
  if (mois === null) return message('warranty.unknown')
  if (mois === 0) return message('warranty.none')
  return message('warranty.months', { months: mois })
}

const CLASSE_LIEN = 'pastille'
const CLASSE_ACTIF = 'pastille pastille-active'
const CLASSE_BADGE = 'badge badge-neutre'

export default async function Fiche({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ville?: string; etat?: string }>
}) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const f = lire(await searchParams)

  const supabase = createPublicClient(REVALIDATE.pages)
  const [debut, fin] = plage(0, 200)

  const [produit, villes, quartiers] = await Promise.all([
    supabase.from('products').select(SELECT.products).eq('id', id).maybeSingle(),
    supabase.from('cities').select(SELECT.cities).order('name'),
    supabase.from('neighborhoods').select(SELECT.neighborhoods),
  ])

  let erreur = produit.error ?? villes.error ?? quartiers.error
  // Fiche absente, inactive, en attente ou refusée : page introuvable, jamais une erreur technique.
  if (!erreur && !produit.data) notFound()

  let lignes: CurrentPriceRow[] = []
  if (!erreur) {
    let requete = supabase.from('current_prices').select(SELECT.currentPrices).eq('product_id', id)
    if (f.ville) requete = requete.eq('city_id', f.ville)
    if (f.etat) requete = requete.eq('condition', f.etat)
    const prix = await requete.range(debut, fin)
    erreur = prix.error
    lignes = (prix.data ?? []) as unknown as CurrentPriceRow[]
  }

  if (erreur) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <p role="alert" className="text-erreur">{message(mapError(erreur))}</p>
      </main>
    )
  }

  const p = produit.data as unknown as ProductRow
  const listeVilles = (villes.data ?? []) as unknown as CityRow[]
  const nomVille = new Map<string, string>(listeVilles.map((v) => [v.id, v.name] as [string, string]))
  const lieu = new Map<string, string>(
    ((quartiers.data ?? []) as unknown as NeighborhoodRow[]).map(
      (q) => [q.id, `${q.name}, ${nomVille.get(q.city_id) ?? ''}`] as [string, string]
    )
  )

  // Meilleur prix : par état et par configuration, et seulement s'il y a de quoi comparer (2 lignes éligibles).
  const groupes = new Map<string, CurrentPriceRow[]>()
  for (const l of lignes) {
    const cle = `${l.condition}|${l.config_hash}`
    const deja = groupes.get(cle)
    if (deja) deja.push(l)
    else groupes.set(cle, [l])
  }
  const meilleur = new Map<string, number | null>()
  for (const [cle, g] of groupes) {
    meilleur.set(cle, g.filter(estEligible).length >= 2 ? meilleurPrix(g) : null)
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      <Link href="/produits" className="inline-flex min-h-[44px] items-center text-sm text-vert underline">
        {message('product.back')}
      </Link>
      <div className="mt-4 text-sm text-secondaire">{p.brand}</div>
      <h1 className="text-2xl font-bold">{p.name}</h1>

      <nav aria-label="Villes" className="flex flex-wrap gap-2 mt-4">
        <Link href={lien(id, f, { ville: null })} className={f.ville ? CLASSE_LIEN : CLASSE_ACTIF}>
          {message('list.all_cities')}
        </Link>
        {listeVilles.map((v) => (
          <Link key={v.id} href={lien(id, f, { ville: v.id })} className={f.ville === v.id ? CLASSE_ACTIF : CLASSE_LIEN}>
            {v.name}
          </Link>
        ))}
      </nav>
      <nav aria-label="États" className="flex flex-wrap gap-2 mt-2">
        <Link href={lien(id, f, { etat: null })} className={f.etat ? CLASSE_LIEN : CLASSE_ACTIF}>
          {message('list.all_conditions')}
        </Link>
        {ETATS.map((e) => (
          <Link key={e} href={lien(id, f, { etat: e })} className={f.etat === e ? CLASSE_ACTIF : CLASSE_LIEN}>
            {message(`condition.${e}`)}
          </Link>
        ))}
      </nav>

      {lignes.length === 0 ? (
        <p className="mt-6">{message('state.empty_prices')}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {trierLignes(lignes).map((l) => {
            const alerte = alerteDe(l)
            const enAlerte = alerte.type !== 'aucune'
            const etiquette = porteEtiquetteMeilleurPrix(l, meilleur.get(`${l.condition}|${l.config_hash}`) ?? null)
            const ram = nombre(l.reported_specs?.ram_gb)
            const stockage = nombre(l.reported_specs?.storage_gb)
            const batterie = nombre(l.reported_specs?.battery_health_pct)
            const variables = {
              ram_gb: parametresAlerte(l).ram_gb ?? '?',
              max_ram_gb: parametresAlerte(l).max_ram_gb ?? '?',
              storage_gb: stockage ?? '?',
            }
            const wa = l.in_stock
              ? lienWhatsapp({
                  contactable: l.shop_contactable,
                  phone: l.shop_phone,
                  message: messageProduit(l, enAlerte),
                })
              : null

            return (
              <li key={l.report_id} className={`carte ${l.in_stock ? '' : 'carte-grisee'}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="font-medium">{l.shop_name}</div>
                    {l.neighborhood_id && lieu.get(l.neighborhood_id) && (
                      <div className="text-sm text-secondaire">{lieu.get(l.neighborhood_id)}</div>
                    )}
                  </div>
                  <div className="text-xl font-medium">{formaterPrix(l.price_fcfa)}</div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {etiquette && !enAlerte && (
                    <span className="badge badge-ocre" title={message('badge.best_price.tooltip')}>
                      {message('badge.best_price.label')}
                    </span>
                  )}
                  {enAlerte && (
                    <span className="badge badge-alerte" title={message('badge.alert.tooltip')}>
                      {message('badge.alert.label')}
                    </span>
                  )}
                  {l.shop_verified && !enAlerte && (
                    <span className="badge badge-succes" title={message('badge.verified.tooltip')}>
                      {message('badge.verified.label')}
                    </span>
                  )}
                  <span className={CLASSE_BADGE} title={message('badge.source.tooltip')}>
                    {message(`source.${l.source}`)}
                  </span>
                  <span className={CLASSE_BADGE}>{message(`condition.${l.condition}`)}</span>
                  {l.in_stock && <span className={CLASSE_BADGE}>{message('stock.in')}</span>}
                </div>

                <ul className="text-sm mt-2 space-y-1">
                  {ram !== null && <li>{message('spec.ram', { value: ram })}</li>}
                  {stockage !== null && <li>{message('spec.storage', { value: stockage })}</li>}
                  {batterie !== null && <li>{message('spec.battery', { value: batterie })}</li>}
                  <li>{texteGarantie(l.warranty_months)}</li>
                  <li title={dateComplete(l.reported_at)}>
                    {message('product.seen', { when: libelleRelatif(l.reported_at) })}
                  </li>
                </ul>

                {alerte.type !== 'aucune' && (
                  <div role="note" className="bloc-alerte mt-3">
                    <p className="font-bold">{message('alert.title')}</p>
                    {alerte.type === 'motifs' &&
                      alerte.codes.slice(0, 2).map((code) => (
                        <p key={code} className="mt-1">
                          {message(`alert.reason.${code}`, variables)}
                        </p>
                      ))}
                    {alerte.type === 'motifs' && alerte.codes.length > 2 && (
                      <p className="mt-1">{message('alert.more')}</p>
                    )}
                    <p className="mt-1">{message('alert.advice')}</p>
                    <p className="mt-2 text-sm text-secondaire">{message('alert.footer')}</p>
                  </div>
                )}

                {l.in_stock && !wa && (
                  <p className="mt-3 text-sm text-secondaire">{message('contact.unavailable')}</p>
                )}
                {!l.in_stock ? (
                  <p className="mt-3 text-sm text-secondaire">{message('stock.out_last')}</p>
                ) : (
                  wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bouton-whatsapp mt-3"
                    >
                      {message('contact.whatsapp')}
                    </a>
                  )
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-8 text-sm text-secondaire">{message('disclaimer.prices')}</p>
    </main>
  )
}
