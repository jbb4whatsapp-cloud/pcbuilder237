import { describe, expect, it } from 'vitest'
import { mapError } from './erreurs'

describe('mapError : preuves photo (D4)', () => {
  it('deux preuves exigées hors neuf', () => {
    expect(mapError({
      code: '23514',
      message: 'new row for relation "price_reports" violates check constraint "price_reports_needs_two_proofs"',
    })).toBe('error.two_proofs_missing')
  })
  it('aucune preuve garde son message', () => {
    expect(mapError({
      code: '23514',
      message: 'new row for relation "price_reports" violates check constraint "price_reports_needs_proof"',
    })).toBe('error.proof_required')
  })
})
