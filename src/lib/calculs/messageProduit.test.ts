import { describe, it, expect } from 'vitest'
import type { CurrentPriceRow } from '../db/types'
import { messageProduit } from './messageProduit'

function ligne(changements: Partial<CurrentPriceRow> = {}): CurrentPriceRow {
  return {
    brand: 'Lenovo',
    product_name: 'ThinkPad T480',
    condition: 'used',
    price_fcfa: 235000,
    reported_at: '2026-09-28T10:00:00Z',
    warranty_months: null,
    reported_specs: { ram_gb: 16, storage_gb: 256 },
    ...changements,
  } as unknown as CurrentPriceRow
}

describe('messageProduit', () => {
  it("reproduit l'exemple du document 07", () => {
    expect(messageProduit(ligne(), false)).toBe(
      "Bonjour, j'ai vu sur PC Builder 237 : Lenovo ThinkPad T480, occasion, 16 Go / 256 Go, 235 000 FCFA (prix constaté le 28/09). Est-il toujours disponible ?"
    )
  })

  it('ajoute la garantie et la batterie quand elles sont renseignées', () => {
    const texte = messageProduit(
      ligne({ warranty_months: 3, reported_specs: { ram_gb: 16, storage_gb: 256, battery_health_pct: 82 } }),
      false
    )
    expect(texte).toContain('Garantie annoncée : 3 mois.')
    expect(texte).toContain('Batterie annoncée : 82 %.')
  })

  it('avec alerte : demande de confirmer la mémoire et le stockage', () => {
    const texte = messageProduit(ligne(), true)
    expect(texte.endsWith('Pouvez-vous me confirmer la mémoire et le stockage de cette machine ?')).toBe(true)
    expect(texte).not.toContain('Est-il toujours disponible')
  })

  it('sans configuration connue : pas de bloc mémoire / disque', () => {
    expect(messageProduit(ligne({ reported_specs: {} }), false)).not.toContain(' Go /')
  })

  it('neuf : jamais de batterie ; garantie à 0 : pas de mention', () => {
    const texte = messageProduit(
      ligne({ condition: 'new', warranty_months: 0, reported_specs: { battery_health_pct: 90 } }),
      false
    )
    expect(texte).toContain('neuf')
    expect(texte).not.toContain('Batterie')
    expect(texte).not.toContain('Garantie')
  })
})
