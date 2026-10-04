import { describe, expect, it } from 'vitest'
import {
  cheminPreuve,
  construireReleve,
  estDoublonReleve,
  estFichierDejaPresent,
  photosRequises,
  validerSaisie,
  type Saisie,
} from './releve'

const UID = '11111111-2222-3333-4444-555555555555'
const REF = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

function saisie(sur: Partial<Saisie> = {}): Saisie {
  return {
    productId: 'p1', shopId: 's1', condition: 'used', prix: '235000', enStock: true,
    garantieChoix: 'months', garantieMois: '3', ram: '16', stockage: '256',
    cpu: 'i5-8350U', configSource: 'machine', batterie: '',
    ...sur,
  }
}

describe('validerSaisie', () => {
  it('accepte une saisie complète', () => {
    expect(validerSaisie(saisie())).toEqual({})
  })
  it('exige les champs obligatoires', () => {
    const e = validerSaisie(saisie({
      productId: '', shopId: '', condition: '', prix: '', garantieChoix: '',
      ram: '', stockage: '', cpu: '', configSource: '',
    }))
    expect(Object.keys(e).sort()).toEqual([
      'condition', 'configSource', 'cpu', 'garantieChoix', 'prix', 'productId', 'ram', 'shopId', 'stockage',
    ])
  })
  it('D7 : « aucune » et « non précisée » sont des réponses valides', () => {
    expect(validerSaisie(saisie({ garantieChoix: 'none', garantieMois: '' }))).toEqual({})
    expect(validerSaisie(saisie({ garantieChoix: 'unspecified', garantieMois: '' }))).toEqual({})
  })
  it('D7 : le nombre de mois va de 1 à 60', () => {
    expect(validerSaisie(saisie({ garantieMois: '0' })).garantieMois).toBe('garantie_invalide')
    expect(validerSaisie(saisie({ garantieMois: '61' })).garantieMois).toBe('garantie_invalide')
    expect(validerSaisie(saisie({ garantieMois: '60' }))).toEqual({})
  })
  it('refuse les nombres écrits avec une unité', () => {
    expect(validerSaisie(saisie({ ram: '16 Go' })).ram).toBe('memoire_invalide')
    expect(validerSaisie(saisie({ prix: '235 000' })).prix).toBe('prix_invalide')
  })
  it('batterie facultative, mais entre 1 et 100 si donnée', () => {
    expect(validerSaisie(saisie({ batterie: '82' }))).toEqual({})
    expect(validerSaisie(saisie({ batterie: '120' })).batterie).toBe('batterie_invalide')
  })
})

describe('photosRequises (D4)', () => {
  it('une photo pour le neuf, deux sinon', () => {
    expect(photosRequises('new')).toBe(1)
    expect(photosRequises('used')).toBe(2)
    expect(photosRequises('refurbished')).toBe(2)
  })
})

describe('construireReleve', () => {
  const deux = [`${UID}/${REF}/1.jpg`, `${UID}/${REF}/2.jpg`]
  it('refuse une occasion avec une seule photo', () => {
    expect(() => construireReleve(saisie(), REF, [deux[0]])).toThrow('photos insuffisantes')
  })
  it('accepte une occasion avec deux photos', () => {
    const r = construireReleve(saisie(), REF, deux)
    expect(r.proof_paths).toHaveLength(2)
    expect(r.client_ref).toBe(REF)
    expect(r.price_fcfa).toBe(235000)
  })
  it('accepte un neuf avec une photo et ignore la batterie', () => {
    const r = construireReleve(saisie({ condition: 'new', batterie: '90' }), REF, [deux[0]])
    expect('battery_health_pct' in r.reported_specs).toBe(false)
  })
  it('D5 : config_source est dans reported_specs', () => {
    const r = construireReleve(saisie({ configSource: 'label' }), REF, deux)
    expect(r.reported_specs.config_source).toBe('label')
  })
  it('D7 : traduit les trois garanties', () => {
    expect(construireReleve(saisie({ garantieChoix: 'none' }), REF, deux).warranty_months).toBe(0)
    expect(construireReleve(saisie({ garantieChoix: 'unspecified' }), REF, deux).warranty_months).toBeNull()
    expect(construireReleve(saisie({ garantieMois: '6' }), REF, deux).warranty_months).toBe(6)
  })
  it("n'envoie ni statut, ni origine, ni niveau de contrôle", () => {
    const r = construireReleve(saisie(), REF, deux) as Record<string, unknown>
    for (const k of ['status', 'source', 'check_level', 'check_codes', 'reported_by']) {
      expect(k in r).toBe(false)
    }
  })
  it('refuse une saisie invalide', () => {
    expect(() => construireReleve(saisie({ prix: '' }), REF, deux)).toThrow('saisie invalide')
  })
})

describe('cheminPreuve', () => {
  it('reste dans le dossier de l’agent', () => {
    const c = cheminPreuve(UID, REF, 2)
    expect(c.startsWith(`${UID}/`)).toBe(true)
    expect(c.endsWith('/2.jpg')).toBe(true)
  })
  it('refuse un client_ref ou un rang douteux', () => {
    expect(() => cheminPreuve(UID, '../x', 1)).toThrow()
    expect(() => cheminPreuve(UID, REF, 0)).toThrow()
  })
})

describe('renvoi après coupure', () => {
  it('reconnaît le doublon de client_ref', () => {
    expect(estDoublonReleve({ code: '23505', message: 'duplicate key value violates unique constraint "price_reports_client_ref_key"' })).toBe(true)
    expect(estDoublonReleve({ code: '23505', message: 'products_unique' })).toBe(false)
    expect(estDoublonReleve(null)).toBe(false)
  })
  it('reconnaît une photo déjà présente', () => {
    expect(estFichierDejaPresent({ statusCode: '409' })).toBe(true)
    expect(estFichierDejaPresent({ message: 'The resource already exists' })).toBe(true)
    expect(estFichierDejaPresent({ message: 'Payload too large', statusCode: '413' })).toBe(false)
  })
})
