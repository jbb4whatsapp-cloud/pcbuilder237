import type { CheckCode, CurrentPriceRow } from '@/lib/db/types'

/** Alerte d'incohérence (document 09, section 5.5). Choisie d'après check_codes, jamais d'après un texte. */
const CODES_CONNUS: readonly CheckCode[] = [
  'ram_above_max',
  'ram_not_allowed',
  'storage_not_allowed',
  'price_low',
]

export type Alerte =
  | { type: 'aucune' }
  | { type: 'generale' }
  | { type: 'motifs'; codes: CheckCode[] }

export function alerteDe(ligne: Pick<CurrentPriceRow, 'check_level' | 'check_codes'>): Alerte {
  if (ligne.check_level === 'ok') return { type: 'aucune' }
  const presents = ligne.check_codes ?? []
  const codes = CODES_CONNUS.filter((c) => presents.includes(c))
  return codes.length > 0 ? { type: 'motifs', codes } : { type: 'generale' }
}

function nombre(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Nombres du texte d'alerte : RAM annoncée et RAM maximale du modèle. */
export function parametresAlerte(
  ligne: Pick<CurrentPriceRow, 'reported_specs' | 'product_specs'>
): { ram_gb: number | null; max_ram_gb: number | null } {
  return {
    ram_gb: nombre(ligne.reported_specs?.ram_gb),
    max_ram_gb: nombre(ligne.product_specs?.max_ram_gb),
  }
}
