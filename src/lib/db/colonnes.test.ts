import { describe, it, expect } from 'vitest'
import { COLONNES, SELECT } from './colonnes'

const RESERVEES = [
  'proof_paths', 'check_reason', 'review_note', 'reported_by',
  'reviewed_by', 'reviewed_at', 'client_ref',
]

describe('colonnes', () => {
  it('aucune lecture ne demande une étoile, ne se répète ni ne reste vide', () => {
    for (const [nom, liste] of Object.entries(COLONNES)) {
      expect(liste.length, nom).toBeGreaterThan(0)
      expect(new Set(liste).size, nom).toBe(liste.length)
      expect(liste.join(','), nom).not.toContain('*')
    }
  })

  it('SELECT est la jointure par virgule de COLONNES', () => {
    expect(SELECT.products).toBe('id,category,brand,name,specs')
    expect(SELECT.reportInsertResult).toBe('id,status,check_level,check_codes')
  })

  it('current_prices : 24 colonnes, sans check_reason, avec city_id et config_hash', () => {
    const liste: readonly string[] = COLONNES.currentPrices
    expect(liste).toHaveLength(24)
    expect(liste).not.toContain('check_reason')
    expect(liste).toContain('city_id')
    expect(liste).toContain('config_hash')
  })

  it('shops_public : 14 colonnes, city_id en dernier', () => {
    expect(COLONNES.shopsPublic).toHaveLength(14)
    expect(COLONNES.shopsPublic[13]).toBe('city_id')
  })

  it('price_reports : aucune colonne réservée dans les colonnes ouvertes (R10)', () => {
    const ouvertes: readonly string[] = COLONNES.reportsOpen
    expect(ouvertes).toHaveLength(14)
    for (const c of RESERVEES) expect(ouvertes, c).not.toContain(c)
    for (const c of COLONNES.reportInsertResult) expect(ouvertes, c).toContain(c)
  })

  it('price_reports_visible : 21 colonnes, avec les sept réservées', () => {
    const liste: readonly string[] = COLONNES.reportsVisible
    expect(liste).toHaveLength(21)
    for (const c of RESERVEES) expect(liste, c).toContain(c)
  })

  it('products : pas de colonnes d’audit (R6)', () => {
    const liste: readonly string[] = COLONNES.products
    for (const c of ['created_by', 'reviewed_by', 'reviewed_at', 'review_note', 'status', 'is_active']) {
      expect(liste, c).not.toContain(c)
    }
  })
})
