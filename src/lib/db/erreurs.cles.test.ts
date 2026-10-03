import { describe, it, expect } from 'vitest'
import fr from '../../../messages/fr.json'
import { CLE, PB_CONNUS } from './erreurs'

/** Aplatit { error: { network: '…' } } en { 'error.network': '…' }. */
function aplatir(obj: unknown, prefixe = ''): Record<string, string> {
  if (typeof obj === 'string') return { [prefixe]: obj }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce(
      (acc, [k, v]) => ({ ...acc, ...aplatir(v, prefixe ? `${prefixe}.${k}` : k) }),
      {} as Record<string, string>
    )
  }
  return {}
}

const MESSAGES = aplatir(fr)

describe('fr.json et mapError', () => {
  it('chaque clé de CLE existe dans fr.json', () => {
    for (const cle of Object.values(CLE)) expect(MESSAGES, cle).toHaveProperty([cle])
  })

  it('chaque code PB connu a son message error.pbNNN', () => {
    for (const code of PB_CONNUS) {
      const cle = `error.${code.toLowerCase()}`
      expect(MESSAGES, cle).toHaveProperty([cle])
    }
  })

  it('aucun message vide', () => {
    for (const [cle, texte] of Object.entries(MESSAGES)) {
      expect(texte.trim().length, cle).toBeGreaterThan(0)
    }
  })
})
