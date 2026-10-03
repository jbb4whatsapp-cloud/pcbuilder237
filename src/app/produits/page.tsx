import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicClient } from '@/lib/db/public'
import { REVALIDATE } from '@/lib/db/cache'
import { SELECT } from '@/lib/db/colonnes'
import { plage } from '@/lib/db/pagination'
import { mapError } from '@/lib/db/erreurs'
import { prixDeDepart } from '@/lib/calculs/prix'
import { formaterPrix } from '@/lib/calculs/affichage'
import { message } from '@/lib/messages'
import type { CityRow, Condition, CurrentPriceRow, ProductRow } from '@/lib/db/types'

export const metadata: Metadata = { title: 'Portables' }

const TAILLE = 20
const ETATS: readonly Condition[] = ['new', 'refurbished', 'used']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Filtres {
  ville: string | null
  etat: Condition | null
  page: number
}

/** Les filtres viennent de l'adresse de la page : tout est vérifié avant d'être utilisé. */
function lire(params: { ville?: string; etat?: string; page?: string }): Filtres {
  const ville = params.ville && UUID.test(params.ville) ? params.ville : null
  const etat = ETATS.find((e) => e === params.etat) ?? null
  const n = Number(params.page)
  const page = Number.isInteger(n) && n >= 0 && n < 1000 ? n : 0
  return { ville, etat, page }
}

function lien(actuels: Filtres, changement: Partial<Filtres>): string {
  const f = { ...actuels, ...changement }
  const q = new URLSearchParams()
  if (f.ville) q.set('ville', f.ville)
  if (f.etat) q.set('etat', f.etat)
  if (f.page > 0) q.set('page', String(f.page))
  const texte = q.toString()
  return texte ? `/produits?${texte}` : '/produits'
}

const CLASSE_LIEN = 'px-3 py-2 border text-sm'
const CLASSE_ACTIF = 'px-3 py-2 border text-sm bg-black text-white'

export default async function Produits({
  searchParams,
}: {
  searchParams: Promise<{ ville?: string; etat?: string; page?: string }>
}) {
  const f = lire(await searchParams)
  const supabase = createPublicClient(REVALIDATE.pages)
  const [debut, fin] = plage(f.page, TAILLE)

  const [villes, produits] = await Promise.all([
    supabase.from('cities').select(SELECT.cities).order('name'),
    supabase
      .from('products')
      .select(SELECT.products)
      .eq('category', 'laptop')
      .order('brand')
      .order('name')
      .range(debut, fin),
  ])

  const liste = (produits.data ?? []) as unknown as ProductRow[]
  let erreur = villes.error ?? produits.error
  let lignes: CurrentPriceRow[] = []

  if (!erreur && liste.length > 0) {
    let requete = supabase
      .from('current_prices')
      .select(SELECT.currentPrices)
      .in('product_id', liste.map((p) => p.id))
    if (f.ville) requete = requete.eq('city_id', f.ville)
    const prix = await requete
    erreur = prix.error
    lignes = (prix.data ?? []) as unknown as CurrentPriceRow[]
  }

  if (erreur) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <p role="alert">{message(mapError(erreur))}</p>
      </main>
    )
  }

  const parProduit = new Map<string, CurrentPriceRow[]>()
  for (const l of lignes) {
    const deja = parProduit.get(l.product_id)
    if (deja) deja.push(l)
    else parProduit.set(l.product_id, [l])
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold">{message('list.title')}</h1>

      <nav aria-label="Villes" className="flex flex-wrap gap-2 mt-4">
        <Link href={lien(f, { ville: null, page: 0 })} className={f.ville ? CLASSE_LIEN : CLASSE_ACTIF}>
          {message('list.all_cities')}
        </Link>
        {((villes.data ?? []) as unknown as CityRow[]).map((v) => (
          <Link key={v.id} href={lien(f, { ville: v.id, page: 0 })} className={f.ville === v.id ? CLASSE_ACTIF : CLASSE_LIEN}>
            {v.name}
          </Link>
        ))}
      </nav>

      <nav aria-label="États" className="flex flex-wrap gap-2 mt-2">
        <Link href={lien(f, { etat: null, page: 0 })} className={f.etat ? CLASSE_LIEN : CLASSE_ACTIF}>
          {message('list.all_conditions')}
        </Link>
        {ETATS.map((e) => (
          <Link key={e} href={lien(f, { etat: e, page: 0 })} className={f.etat === e ? CLASSE_ACTIF : CLASSE_LIEN}>
            {message(`condition.${e}`)}
          </Link>
        ))}
      </nav>

      {liste.length === 0 ? (
        <p className="mt-6">{message('list.empty')}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {liste.map((p) => {
            const depart = prixDeDepart(parProduit.get(p.id) ?? [], f.etat)
            return (
              <li key={p.id} className="border p-4">
                <div className="text-sm text-gray-600">{p.brand}</div>
                <div className="font-bold">{p.name}</div>
                <div className="mt-2">
                  {depart === null
                    ? message('product.no_price')
                    : message('product.from', { price: formaterPrix(depart) })}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex justify-between mt-6 text-sm">
        {f.page > 0 ? (
          <Link href={lien(f, { page: f.page - 1 })} className="underline">
            {message('list.previous')}
          </Link>
        ) : (
          <span />
        )}
        {liste.length === TAILLE && (
          <Link href={lien(f, { page: f.page + 1 })} className="underline">
            {message('list.next')}
          </Link>
        )}
      </div>
    </main>
  )
}
