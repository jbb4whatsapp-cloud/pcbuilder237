import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Règles du document 09 (principe 2 et section 3), appliquées à tout le code de src/lib/db.
const dossier = fileURLToPath(new URL('.', import.meta.url))
const sources = readdirSync(dossier).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))

describe('règles du contrat de données', () => {
  it('trouve les fichiers à contrôler', () => {
    expect(sources.length).toBeGreaterThanOrEqual(7)
  })

  for (const f of sources) {
    it(`${f} : pas de lecture directe de session, de service_role ni de select étoile`, () => {
      const texte = readFileSync(join(dossier, f), 'utf-8')
      expect(texte).not.toMatch(/getSession\s*\(/)
      expect(texte).not.toMatch(/service_role/i)
      expect(texte).not.toMatch(/\.select\(\s*['"`]\*['"`]\s*\)/)
    })
  }
})
