/**
 * Logique pure du formulaire agent : aucun réseau, aucun DOM, donc testable seule.
 * Règles : D4 (deux photos hors neuf), D5 (config_source), D7 (garantie explicite).
 * Elles reprennent celles de la base (document 09) ; la base reste l'autorité.
 */

export type Etat = 'new' | 'used' | 'refurbished'
export type GarantieChoix = '' | 'none' | 'months' | 'unspecified'
export type SourceConfig = '' | 'machine' | 'label'

export interface Saisie {
  productId: string
  shopId: string
  condition: Etat | ''
  prix: string
  enStock: boolean
  garantieChoix: GarantieChoix
  garantieMois: string
  ram: string
  stockage: string
  cpu: string
  configSource: SourceConfig
  batterie: string
}

export type CodeErreur =
  | 'produit_requis'
  | 'boutique_requise'
  | 'etat_requis'
  | 'prix_invalide'
  | 'garantie_requise'
  | 'garantie_invalide'
  | 'memoire_invalide'
  | 'stockage_invalide'
  | 'processeur_requis'
  | 'source_config_requise'
  | 'batterie_invalide'

export type Erreurs = Partial<Record<keyof Saisie, CodeErreur>>

/** Entier strictement positif, en chiffres seulement, au plus `max`. */
function entier(texte: string, max: number): number | null {
  const t = texte.trim()
  if (!/^[0-9]{1,9}$/.test(t)) return null
  const n = Number(t)
  return n >= 1 && n <= max ? n : null
}

/** D4 : une photo pour le neuf, deux pour l'occasion et le reconditionné. */
export function photosRequises(condition: Etat | ''): number {
  return condition === '' || condition === 'new' ? 1 : 2
}

export function validerSaisie(s: Saisie): Erreurs {
  const e: Erreurs = {}
  if (!s.productId) e.productId = 'produit_requis'
  if (!s.shopId) e.shopId = 'boutique_requise'
  if (!s.condition) e.condition = 'etat_requis'
  if (entier(s.prix, 99_999_999) === null) e.prix = 'prix_invalide'
  // D7 : un choix explicite, jamais vide par oubli
  if (s.garantieChoix === '') e.garantieChoix = 'garantie_requise'
  else if (s.garantieChoix === 'months' && entier(s.garantieMois, 60) === null) {
    e.garantieMois = 'garantie_invalide'
  }
  if (entier(s.ram, 99_999) === null) e.ram = 'memoire_invalide'
  if (entier(s.stockage, 999_999) === null) e.stockage = 'stockage_invalide'
  if (!s.cpu.trim()) e.cpu = 'processeur_requis'
  // D5 : dire d'où vient la configuration
  if (s.configSource === '') e.configSource = 'source_config_requise'
  if (s.batterie.trim() !== '' && entier(s.batterie, 100) === null) e.batterie = 'batterie_invalide'
  return e
}

/** Chemin unique par photo : `{uid}/{client_ref}/{rang}.jpg` (la base exige le dossier `{uid}/`). */
export function cheminPreuve(uid: string, clientRef: string, rang: number): string {
  if (!/^[A-Za-z0-9-]{8,64}$/.test(clientRef)) throw new Error('client_ref invalide')
  if (!/^[A-Za-z0-9-]{8,64}$/.test(uid)) throw new Error('uid invalide')
  if (!Number.isInteger(rang) || rang < 1 || rang > 10) throw new Error('rang de photo invalide')
  return `${uid}/${clientRef}/${rang}.jpg`
}

/** Ligne à insérer dans price_reports. Le statut, l'origine et le niveau sont fixés par le serveur. */
export function construireReleve(s: Saisie, clientRef: string, chemins: readonly string[]) {
  if (Object.keys(validerSaisie(s)).length > 0) throw new Error('saisie invalide')
  const condition = s.condition as Etat
  if (chemins.length < photosRequises(condition)) throw new Error('photos insuffisantes')

  const specs: Record<string, string | number> = {
    ram_gb: Number(s.ram),
    storage_gb: Number(s.stockage),
    cpu: s.cpu.trim().slice(0, 80),
    config_source: s.configSource,
  }
  if (condition !== 'new' && s.batterie.trim() !== '') {
    specs.battery_health_pct = Number(s.batterie)
  }

  const garantie =
    s.garantieChoix === 'none' ? 0 : s.garantieChoix === 'months' ? Number(s.garantieMois) : null

  return {
    product_id: s.productId,
    shop_id: s.shopId,
    condition,
    price_fcfa: Number(s.prix),
    in_stock: s.enStock,
    warranty_months: garantie,
    reported_specs: specs,
    proof_paths: [...chemins],
    client_ref: clientRef,
  }
}

export interface ErreurLegere {
  code?: string | null
  message?: string | null
  details?: string | null
  status?: number | null
  statusCode?: string | number | null
}

/** Renvoi après coupure : le relevé est déjà enregistré, on le traite comme un succès. */
export function estDoublonReleve(erreur: ErreurLegere | null | undefined): boolean {
  if (!erreur || erreur.code !== '23505') return false
  return `${erreur.message ?? ''} ${erreur.details ?? ''}`.includes('price_reports_client_ref_key')
}

/** Renvoi après coupure : la photo est déjà dans le bucket, on passe à la suivante. */
export function estFichierDejaPresent(erreur: ErreurLegere | null | undefined): boolean {
  if (!erreur) return false
  if (String(erreur.statusCode ?? erreur.status ?? '') === '409') return true
  return /already exists|duplicate/i.test(erreur.message ?? '')
}
