import { webcrypto } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { libelleBoutique, libelleProduit, nouveauClientRef } from './listes'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(() => vi.unstubAllGlobals())

describe('libellés', () => {
  it('boutique avec quartier et ville', () => {
    expect(libelleBoutique('Tech Plus', 'Mokolo', 'Yaoundé')).toBe('Tech Plus (Mokolo, Yaoundé)')
  })
  it('boutique avec la ville seulement', () => {
    expect(libelleBoutique('Tech Plus', undefined, 'Douala')).toBe('Tech Plus (Douala)')
  })
  it('boutique sans lieu connu', () => {
    expect(libelleBoutique('Tech Plus')).toBe('Tech Plus')
  })
  it('produit : marque puis nom', () => {
    expect(libelleProduit({ brand: 'Dell', name: 'Latitude 7490' })).toBe('Dell Latitude 7490')
  })
})

describe('nouveauClientRef', () => {
  it('rend un uuid v4 différent à chaque appel', () => {
    const a = nouveauClientRef()
    expect(a).toMatch(UUID_V4)
    expect(nouveauClientRef()).not.toBe(a)
  })
  it('fonctionne sans randomUUID (contexte http)', () => {
    vi.stubGlobal('crypto', { getRandomValues: (a: Uint8Array) => webcrypto.getRandomValues(a) })
    expect(nouveauClientRef()).toMatch(UUID_V4)
  })
})
