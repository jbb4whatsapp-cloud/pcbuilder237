import { describe, it, expect } from 'vitest'
import { mapError, CLE } from './erreurs'

describe('mapError', () => {
  it('panne réseau : ni code ni statut', () => {
    expect(mapError({ message: 'TypeError: Failed to fetch', code: '' })).toBe(CLE.reseau)
    expect(mapError({ message: 'Failed to fetch' })).toBe(CLE.reseau)
  })

  it('erreur absente ou inconnue : message générique', () => {
    expect(mapError(null)).toBe(CLE.generique)
    expect(mapError({ code: 'XX000' })).toBe(CLE.generique)
  })

  it('codes PB connus : une clé par code', () => {
    expect(mapError({ code: 'PB032' })).toBe('error.pb032')
    expect(mapError({ code: 'PB011' })).toBe('error.pb011')
    expect(mapError({ code: 'PB099' })).toBe(CLE.generique)
  })

  it('23514 : le nom de la contrainte décide', () => {
    const viole = (nom: string) => ({
      code: '23514',
      message: `new row violates check constraint "${nom}"`,
    })
    expect(mapError(viole('price_reports_needs_proof'))).toBe(CLE.preuveRequise)
    expect(mapError(viole('price_reports_price_fcfa_check'))).toBe(CLE.prixInvalide)
    expect(mapError(viole('price_reports_warranty_months_check'))).toBe(CLE.garantieInvalide)
    expect(mapError(viole('flags_reason_check'))).toBe(CLE.motifSignalement)
    expect(mapError(viole('flags_has_target'))).toBe(CLE.cibleSignalement)
    expect(mapError(viole('shops_phone_format'))).toBe(CLE.telephoneInvalide)
    expect(mapError(viole('autre_contrainte'))).toBe(CLE.generique)
  })

  it('23505 : relevé déjà envoyé ou produit existant', () => {
    expect(
      mapError({ code: '23505', message: 'duplicate key value violates unique constraint "price_reports_client_ref_key"' })
    ).toBe(CLE.releveDejaEnvoye)
    expect(
      mapError({ code: '23505', details: 'unique constraint "products_unique"' })
    ).toBe(CLE.produitExiste)
    expect(mapError({ code: '23505', message: 'autre' })).toBe(CLE.generique)
  })

  it('droits, introuvable, session, délai', () => {
    expect(mapError({ code: '42501' })).toBe(CLE.interdit)
    expect(mapError({ code: '22P02' })).toBe(CLE.introuvable)
    expect(mapError({ code: 'PGRST116' })).toBe(CLE.introuvable)
    expect(mapError({ code: 'PGRST301' })).toBe(CLE.session)
    expect(mapError({ code: '', status: 401 })).toBe(CLE.session)
    expect(mapError({ code: '57014' })).toBe(CLE.indisponible)
  })
})
