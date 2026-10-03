import { describe, it, expect } from 'vitest'
import { message } from './messages'

describe('message', () => {
  it('lit une clé imbriquée', () => {
    expect(message('flag.thanks')).toBe('Merci, nous vérifions.')
  })
  it('remplace les variables', () => {
    expect(message('spec.ram', { value: 16 })).toBe('Mémoire : 16 Go')
  })
  it('clé inconnue ou clé de groupe : renvoie la clé', () => {
    expect(message('inconnue.cle')).toBe('inconnue.cle')
    expect(message('flag')).toBe('flag')
  })
})
