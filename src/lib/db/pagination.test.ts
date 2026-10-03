import { describe, it, expect } from 'vitest'
import { plage } from './pagination'

describe('plage', () => {
  it('page 0 et page suivante', () => {
    expect(plage(0, 20)).toEqual([0, 19])
    expect(plage(2, 20)).toEqual([40, 59])
  })
  it('refuse une page ou une taille invalide', () => {
    expect(() => plage(-1, 20)).toThrow(RangeError)
    expect(() => plage(1.5, 20)).toThrow(RangeError)
    expect(() => plage(0, 0)).toThrow(RangeError)
    expect(() => plage(0, 1001)).toThrow(RangeError)
  })
})
