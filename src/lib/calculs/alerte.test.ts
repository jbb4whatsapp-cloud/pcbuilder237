import { describe, it, expect } from 'vitest'
import type { CheckLevel } from '@/lib/db/types'
import { alerteDe, parametresAlerte } from './alerte'

function r(check_level: CheckLevel, check_codes: string[]) {
  return { check_level, check_codes }
}

describe('alerteDe', () => {
  it('ok : aucune alerte, même avec des codes', () => {
    expect(alerteDe(r('ok', []))).toEqual({ type: 'aucune' })
    expect(alerteDe(r('ok', ['price_low']))).toEqual({ type: 'aucune' })
  })
  it('un paragraphe par code connu, sans doublon', () => {
    expect(alerteDe(r('suspect', ['price_low', 'ram_above_max', 'price_low']))).toEqual({
      type: 'motifs',
      codes: ['ram_above_max', 'price_low'],
    })
  })
  it('codes vides ou inconnus avec un niveau non ok : alerte générale', () => {
    expect(alerteDe(r('suspect', []))).toEqual({ type: 'generale' })
    expect(alerteDe(r('impossible', ['code_futur']))).toEqual({ type: 'generale' })
  })
  it('un relevé ok avec un code de confiance ne produit aucune alerte', () => {
    expect(alerteDe(r('ok', ['new_agent']))).toEqual({ type: 'aucune' })
    expect(alerteDe(r('ok', ['no_reference', 'price_deviation']))).toEqual({ type: 'aucune' })
  })

  it('un code de confiance est ignoré parmi les motifs d\'alerte', () => {
    expect(alerteDe(r('suspect', ['ram_not_allowed', 'new_agent']))).toEqual({
      type: 'motifs',
      codes: ['ram_not_allowed'],
    })
  })

  it('un relevé ok avec un code de confiance ne produit aucune alerte', () => {
    expect(alerteDe(r('ok', ['new_agent']))).toEqual({ type: 'aucune' })
    expect(alerteDe(r('ok', ['no_reference', 'price_deviation']))).toEqual({ type: 'aucune' })
  })

  it('un code de confiance est ignoré parmi les motifs d\'alerte', () => {
    expect(alerteDe(r('suspect', ['ram_not_allowed', 'new_agent']))).toEqual({
      type: 'motifs',
      codes: ['ram_not_allowed'],
    })
  })
})

describe('parametresAlerte', () => {
  it('lit les nombres de la RAM annoncée et maximale', () => {
    expect(
      parametresAlerte({ reported_specs: { ram_gb: 16 }, product_specs: { max_ram_gb: 8 } })
    ).toEqual({ ram_gb: 16, max_ram_gb: 8 })
  })
  it('texte, absent ou nul : null', () => {
    expect(
      parametresAlerte({ reported_specs: null, product_specs: { max_ram_gb: '8 Go' } })
    ).toEqual({ ram_gb: null, max_ram_gb: null })
  })
})
