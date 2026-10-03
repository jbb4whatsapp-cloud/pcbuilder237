import { describe, it, expect } from 'vitest'
import { formaterPrix } from './affichage'

// Les espaces de milliers sont insécables : on les ramène à une espace simple pour comparer.
const simple = (s: string) => s.replace(/\s/g, ' ')

describe('formaterPrix', () => {
  it('espace entre les milliers, devise après', () => {
    expect(simple(formaterPrix(235000))).toBe('235 000 FCFA')
    expect(simple(formaterPrix(1250000))).toBe('1 250 000 FCFA')
  })
  it('petits montants et pas de décimales', () => {
    expect(simple(formaterPrix(950))).toBe('950 FCFA')
    expect(simple(formaterPrix(1999.6))).toBe('2 000 FCFA')
  })
})
