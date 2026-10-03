/**
 * mapError : choisit une clé de message d'après le CODE de l'erreur (document 09, section 8).
 * Les clés sont provisoires : à aligner sur fr.json (document 07, section 7.2).
 * Le détail technique va au journal, jamais à l'écran.
 */
export interface ErreurSupabase {
  code?: string | null
  message?: string | null
  details?: string | null
  status?: number | null
}

export const CLE = {
  reseau: 'error.network',
  generique: 'error.generic',
  interdit: 'error.forbidden',
  introuvable: 'error.not_found',
  session: 'error.session_expired',
  indisponible: 'error.unavailable',
  produitExiste: 'error.product_exists',
  releveDejaEnvoye: 'error.report_already_sent',
  preuveRequise: 'error.proof_required',
  prixInvalide: 'error.price_invalid',
  garantieInvalide: 'error.warranty_invalid',
  motifSignalement: 'error.flag_reason_invalid',
  cibleSignalement: 'error.flag_target_missing',
  telephoneInvalide: 'error.phone_invalid',
} as const

// PB001 à PB003, PB010 à PB013, PB020 à PB025, PB030 à PB032
const PB_CONNUS = new Set([
  'PB001', 'PB002', 'PB003',
  'PB010', 'PB011', 'PB012', 'PB013',
  'PB020', 'PB021', 'PB022', 'PB023', 'PB024', 'PB025',
  'PB030', 'PB031', 'PB032',
])

function contrainte(texte: string, table: readonly [string, string][]): string {
  for (const [nom, cle] of table) {
    if (texte.includes(nom)) return cle
  }
  return CLE.generique
}

export function mapError(erreur: ErreurSupabase | null | undefined): string {
  if (!erreur) return CLE.generique
  const code = erreur.code ?? ''
  const texte = `${erreur.message ?? ''} ${erreur.details ?? ''}`

  if (/^PB\d{3}$/.test(code)) {
    return PB_CONNUS.has(code) ? `error.${code.toLowerCase()}` : CLE.generique
  }
  if (code === '23514') {
    return contrainte(texte, [
      ['price_reports_needs_proof', CLE.preuveRequise],
      ['price_reports_price_fcfa_check', CLE.prixInvalide],
      ['price_reports_warranty_months_check', CLE.garantieInvalide],
      ['flags_reason_check', CLE.motifSignalement],
      ['flags_has_target', CLE.cibleSignalement],
      ['shops_phone_format', CLE.telephoneInvalide],
    ])
  }
  if (code === '23505') {
    return contrainte(texte, [
      ['price_reports_client_ref_key', CLE.releveDejaEnvoye],
      ['products_unique', CLE.produitExiste],
    ])
  }
  if (code === '42501') return CLE.interdit
  if (code === '22P02' || code === 'PGRST116') return CLE.introuvable
  if (code.startsWith('PGRST30')) return CLE.session
  if (code === '57014') return CLE.indisponible

  if (!code) {
    if (erreur.status === 401) return CLE.session
    if (erreur.status === 403) return CLE.interdit
    if (!erreur.status) return CLE.reseau
  }
  return CLE.generique
}
