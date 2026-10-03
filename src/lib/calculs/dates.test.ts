import { describe, it, expect } from 'vitest'
import { libelleRelatif, dateComplete, dateCourte } from './dates'

// 23:30 UTC le 3 octobre = 00:30 le 4 octobre à Douala (UTC+1)
const MAINTENANT = new Date('2026-10-03T23:30:00Z')

describe('libelleRelatif', () => {
  it("même jour à Douala : aujourd'hui", () => {
    expect(libelleRelatif('2026-10-04T00:10:00+01:00', MAINTENANT)).toMatch(/aujourd.hui/)
  })
  it('compte les jours à Douala, pas en UTC : hier', () => {
    // 12:00 UTC le 3 octobre est encore le 3 à Douala, alors qu’il est déjà le 4 là-bas
    expect(libelleRelatif('2026-10-03T12:00:00Z', MAINTENANT)).toBe('hier')
  })
  it('il y a N jours', () => {
    expect(libelleRelatif('2026-09-29T12:00:00Z', MAINTENANT)).toBe('il y a 5 jours')
  })
  it('une date dans le futur ne passe pas en négatif', () => {
    expect(libelleRelatif('2026-10-10T12:00:00Z', MAINTENANT)).toMatch(/aujourd.hui/)
  })
  it('date invalide : chaîne vide', () => {
    expect(libelleRelatif('pas une date', MAINTENANT)).toBe('')
  })
})

describe('dateComplete', () => {
  it('date au fuseau de Douala', () => {
    expect(dateComplete('2026-10-03T23:30:00Z')).toBe('4 octobre 2026')
  })
  it('date invalide : chaîne vide', () => {
    expect(dateComplete('x')).toBe('')
  })
})

describe('dateCourte', () => {
  it('jour/mois au fuseau de Douala', () => {
    expect(dateCourte('2026-10-03T23:30:00Z')).toBe('04/10')
    expect(dateCourte('2026-09-28T10:00:00Z')).toBe('28/09')
  })
  it('date invalide : chaîne vide', () => {
    expect(dateCourte('x')).toBe('')
  })
})
