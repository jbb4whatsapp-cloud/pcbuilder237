/**
 * Types écrits à la main (document 09, section 10). Les vues sortent de la
 * génération automatique avec tous leurs champs nullables : on les précise ici.
 */
export type Condition = 'new' | 'refurbished' | 'used'
export type CheckLevel = 'ok' | 'suspect' | 'impossible'
export type CheckCode =
  | 'ram_above_max'
  | 'ram_not_allowed'
  | 'storage_not_allowed'
  | 'price_low'
export type ReportStatus = 'pending' | 'published' | 'rejected'
export type ReportSource = 'agent' | 'shop'

export interface ReportedSpecs {
  ram_gb?: number
  storage_gb?: number
  cpu?: string
  battery_health_pct?: number
}

/** Ligne de la vue current_prices (sans check_reason, volontairement). */
export interface CurrentPriceRow {
  report_id: string
  product_id: string
  shop_id: string
  condition: Condition
  price_fcfa: number
  in_stock: boolean
  warranty_months: number | null
  reported_specs: ReportedSpecs | null
  check_level: CheckLevel
  reported_at: string
  category: string
  brand: string
  product_name: string
  product_specs: Record<string, unknown> | null
  shop_name: string
  shop_phone: string | null
  neighborhood_id: string | null
  shop_verified: boolean
  source: ReportSource
  shop_subscribed: boolean
  shop_contactable: boolean
  /** Codes connus : voir CheckCode. Une chaîne inconnue est ignorée par le site. */
  check_codes: string[]
  city_id: string | null
  /** Jamais affichée. */
  config_hash: string
}

export interface ShopPublicRow {
  id: string
  name: string
  neighborhood_id: string | null
  address: string | null
  status: string
  is_verified: boolean
  offers_assembly: boolean
  assembly_fee_fcfa: number | null
  opening_hours: string | null
  created_at: string
  phone: string | null
  contactable: boolean
  subscribed: boolean
  city_id: string | null
}

export interface ProductRow {
  id: string
  category: string
  brand: string
  name: string
  specs: Record<string, unknown>
}

export interface CountryRow {
  id: string
  name: string
}
export interface CityRow {
  id: string
  country_id: string
  name: string
}
export interface NeighborhoodRow {
  id: string
  city_id: string
  name: string
}

/** Ce que le client a le droit d'envoyer pour un relevé (document 09, section 7). */
export interface ReportInsert {
  product_id: string
  shop_id: string
  condition: Condition
  price_fcfa: number
  in_stock: boolean
  warranty_months: number | null
  reported_specs: ReportedSpecs
  /** '<uid>/<horodatage>/<fichier>', sans le nom du bucket. */
  proof_paths: string[]
  /** uuid généré à l'ouverture du formulaire et conservé dans le brouillon. */
  client_ref: string
}

/** Colonnes ouvertes relues après une insertion. */
export interface ReportInsertResult {
  id: string
  status: ReportStatus
  check_level: CheckLevel
  check_codes: string[]
}

/** Vue price_reports_visible : les sept dernières colonnes sont nulles pour qui n'y a pas droit. */
export interface ReportVisibleRow {
  id: string
  product_id: string
  shop_id: string
  condition: Condition
  price_fcfa: number
  in_stock: boolean
  warranty_months: number | null
  reported_specs: ReportedSpecs | null
  config_hash: string
  check_level: CheckLevel
  check_codes: string[]
  status: ReportStatus
  source: ReportSource
  reported_at: string
  proof_paths: string[] | null
  check_reason: string | null
  reported_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  client_ref: string | null
}

export type FlagStatus = 'open' | 'reviewed' | 'dismissed'

/** Table flags, colonnes de COLONNES.flags (jamais created_by). */
export interface FlagRow {
  id: string
  shop_id: string | null
  report_id: string | null
  reason: string
  status: FlagStatus
  created_at: string
}
