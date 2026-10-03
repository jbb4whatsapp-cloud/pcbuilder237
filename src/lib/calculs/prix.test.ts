import { describe, it, expect } from 'vitest'
import type { CheckLevel, Condition } from '@/lib/db/types'
import { estEligible, meilleurPrix, porteEtiquetteMeilleurPrix, trierLignes, prixDeDepart } from './prix'

function l(price_fcfa: number, in_stock: boolean, check_level: CheckLevel, condition: Condition = 'used') {
  return { price_fcfa, in_stock, check_level, condition }
}

describe('meilleur prix', () => {
  it('éligible : sans alerte et en stock', () => {
    expect(estEligible(l(100, true, 'ok'))).toBe(true)
    expect(estEligible(l(100, false, 'ok'))).toBe(false)
    expect(estEligible(l(100, true, 'suspect'))).toBe(false)
    expect(estEligible(l(100, true, 'impossible'))).toBe(false)
  })

  it('ignore les lignes hors stock ou avec alerte, même moins chères', () => {
    const lignes = [l(150, true, 'ok'), l(90, true, 'suspect'), l(80, false, 'ok'), l(120, true, 'ok')]
    expect(meilleurPrix(lignes)).toBe(120)
  })

  it('aucune ligne éligible : null', () => {
    expect(meilleurPrix([l(90, true, 'suspect'), l(80, false, 'ok')])).toBeNull()
    expect(meilleurPrix([])).toBeNull()
  })

  it('étiquette seulement sur une ligne éligible au prix le plus bas', () => {
    expect(porteEtiquetteMeilleurPrix(l(120, true, 'ok'), 120)).toBe(true)
    expect(porteEtiquetteMeilleurPrix(l(120, true, 'suspect'), 120)).toBe(false)
    expect(porteEtiquetteMeilleurPrix(l(130, true, 'ok'), 120)).toBe(false)
    expect(porteEtiquetteMeilleurPrix(l(120, true, 'ok'), null)).toBe(false)
  })
})

describe('trierLignes', () => {
  it('en stock par prix croissant, puis hors stock ; alertes comprises ; entrée intacte', () => {
    const entree = [l(300, false, 'ok'), l(200, true, 'suspect'), l(250, true, 'ok'), l(100, false, 'ok')]
    const triees = trierLignes(entree)
    expect(triees.map((x) => x.price_fcfa)).toEqual([200, 250, 100, 300])
    expect(entree.map((x) => x.price_fcfa)).toEqual([300, 200, 250, 100])
  })
})

describe('prixDeDepart', () => {
  const lignes = [l(500, true, 'ok', 'new'), l(300, true, 'ok', 'used'), l(200, true, 'suspect', 'used')]
  it("meilleur prix éligible de l'état filtré", () => {
    expect(prixDeDepart(lignes, 'used')).toBe(300)
    expect(prixDeDepart(lignes, 'new')).toBe(500)
    expect(prixDeDepart(lignes, null)).toBe(300)
  })
  it('aucune ligne éligible : pas de prix de départ', () => {
    expect(prixDeDepart(lignes, 'refurbished')).toBeNull()
  })
})
