/**
 * Listes du formulaire agent (boutiques, produits) et identifiant de reprise (client_ref).
 * Les colonnes viennent de COLONNES (jamais recopiées ici). Les noms de tables sont réunis
 * dans TABLES : un seul endroit à corriger s'ils diffèrent.
 */
import type { getBrowserClient } from '../db/browser'
import { SELECT } from '../db/colonnes'
import type { CityRow, NeighborhoodRow, ProductRow, ShopPublicRow } from '../db/types'

type Client = ReturnType<typeof getBrowserClient>

export const TABLES = {
  produits: 'products',
  boutiques: 'shops_public',
  quartiers: 'neighborhoods',
  villes: 'cities',
} as const

export interface OptionListe {
  id: string
  libelle: string
}

export function libelleProduit(p: Pick<ProductRow, 'brand' | 'name'>): string {
  return `${p.brand} ${p.name}`.trim()
}

/** « Nom (quartier, ville) », sans les parties inconnues. */
export function libelleBoutique(nom: string, quartier?: string, ville?: string): string {
  const lieu = [quartier, ville].filter((x): x is string => !!x).join(', ')
  return lieu ? `${nom} (${lieu})` : nom
}

/** uuid v4. randomUUID n'existe qu'en HTTPS ou sur localhost : repli pour un test en http sur le réseau local. */
export function nouveauClientRef(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  const o = new Uint8Array(16)
  c.getRandomValues(o)
  o[6] = (o[6] & 0x0f) | 0x40
  o[8] = (o[8] & 0x3f) | 0x80
  const h = Array.from(o, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const parLibelle = (a: OptionListe, b: OptionListe) => a.libelle.localeCompare(b.libelle, 'fr')

/** Lève une erreur si une lecture échoue (la page affiche alors un message et propose de recharger). */
export async function chargerListes(
  client: Client
): Promise<{ produits: OptionListe[]; boutiques: OptionListe[] }> {
  const [p, b, q, v] = await Promise.all([
    client.from(TABLES.produits).select(SELECT.products),
    client.from(TABLES.boutiques).select(SELECT.shopsPublic),
    client.from(TABLES.quartiers).select(SELECT.neighborhoods),
    client.from(TABLES.villes).select(SELECT.cities),
  ])
  for (const r of [p, b, q, v]) if (r.error) throw new Error(r.error.message)

  const produits = (p.data ?? []) as unknown as ProductRow[]
  const boutiques = (b.data ?? []) as unknown as ShopPublicRow[]
  const quartiers = new Map(((q.data ?? []) as unknown as NeighborhoodRow[]).map((x) => [x.id, x.name]))
  const villes = new Map(((v.data ?? []) as unknown as CityRow[]).map((x) => [x.id, x.name]))

  return {
    produits: produits.map((x) => ({ id: x.id, libelle: libelleProduit(x) })).sort(parLibelle),
    boutiques: boutiques
      .map((x) => ({
        id: x.id,
        libelle: libelleBoutique(
          x.name,
          x.neighborhood_id ? quartiers.get(x.neighborhood_id) : undefined,
          x.city_id ? villes.get(x.city_id) : undefined
        ),
      }))
      .sort(parLibelle),
  }
}
