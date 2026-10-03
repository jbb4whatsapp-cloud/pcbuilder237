import { describe, it, expect } from 'vitest'

// Vérifie les deux dépendances d'environnement dont le module de lecture a besoin
// (document 09, sections 5.3 et 5.4 ; document 07, section 2).
describe('outillage', () => {
  it('dates relatives en français et fuseau Africa/Douala', () => {
    const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
    expect(rtf.format(-1, 'day')).toBe('hier')

    // 23:30 UTC = 00:30 à Douala (UTC+1)
    const parties = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Africa/Douala',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date('2026-10-03T23:30:00Z'))
    expect(parties.find((p) => p.type === 'hour')?.value).toBe('00')
  })

  it("le séparateur de milliers fr-FR n'est pas une espace simple", () => {
    const brut = new Intl.NumberFormat('fr-FR').format(235000)
    // Espace insécable fine (U+202F) : à remplacer par une espace simple dans les liens WhatsApp
    expect(brut).not.toBe('235 000')
    expect(brut.replace(/[\u00a0\u202f]/g, ' ')).toBe('235 000')
  })
})
