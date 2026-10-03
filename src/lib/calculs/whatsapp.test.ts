import { describe, it, expect } from 'vitest'
import { prixPourMessage, numeroWhatsapp, lienWhatsapp } from './whatsapp'

describe('prixPourMessage', () => {
  it('espace simple entre les milliers', () => {
    expect(prixPourMessage(235000)).toBe('235 000')
    expect(prixPourMessage(1250000)).toBe('1 250 000')
  })
})

describe('numeroWhatsapp', () => {
  it('retire le plus', () => {
    expect(numeroWhatsapp('+237612345678')).toBe('237612345678')
  })
  it('refuse un numéro absent ou mal formé', () => {
    expect(numeroWhatsapp(null)).toBeNull()
    expect(numeroWhatsapp('')).toBeNull()
    expect(numeroWhatsapp('612345678')).toBeNull()
    expect(numeroWhatsapp('+23769')).toBeNull()
    expect(numeroWhatsapp('+237112345678')).toBeNull()
  })
})

describe('lienWhatsapp', () => {
  const message = 'Prix 235 000 FCFA, é'
  it('construit le lien sans plus et avec le texte encodé', () => {
    expect(lienWhatsapp({ contactable: true, phone: '+237612345678', message })).toBe(
      'https://wa.me/237612345678?text=Prix%20235%20000%20FCFA%2C%20%C3%A9'
    )
  })
  it('pas de lien si la boutique n’est pas contactable', () => {
    expect(lienWhatsapp({ contactable: false, phone: '+237612345678', message })).toBeNull()
    expect(lienWhatsapp({ contactable: null, phone: '+237612345678', message })).toBeNull()
  })
  it('pas de lien sans numéro valide', () => {
    expect(lienWhatsapp({ contactable: true, phone: null, message })).toBeNull()
    expect(lienWhatsapp({ contactable: true, phone: '+23769', message })).toBeNull()
  })
})
