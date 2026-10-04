import { describe, expect, it } from 'vitest'
import { dimensionsCibles } from './photo'

describe('dimensionsCibles', () => {
  it('ne touche pas une image déjà assez petite', () => {
    expect(dimensionsCibles(1200, 800)).toEqual({ largeur: 1200, hauteur: 800 })
  })
  it('réduit une photo de téléphone en gardant les proportions', () => {
    expect(dimensionsCibles(4000, 3000)).toEqual({ largeur: 1600, hauteur: 1200 })
  })
  it('réduit une photo verticale', () => {
    expect(dimensionsCibles(3000, 4000)).toEqual({ largeur: 1200, hauteur: 1600 })
  })
  it('ne descend jamais sous 1 pixel', () => {
    expect(dimensionsCibles(100000, 1)).toEqual({ largeur: 1600, hauteur: 1 })
  })
  it('refuse des dimensions nulles', () => {
    expect(() => dimensionsCibles(0, 100)).toThrow()
  })
})
