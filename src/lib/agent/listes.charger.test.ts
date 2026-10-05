import { describe, expect, it } from 'vitest'
import { chargerListes } from './listes'

type Client = Parameters<typeof chargerListes>[0]

function faux() {
  const filtres: string[] = []
  const client = {
    from(table: string) {
      const resultat = { data: [], error: null }
      const req = {
        select() {
          return req
        },
        eq(colonne: string, valeur: unknown) {
          filtres.push(`${table}.${colonne}=${String(valeur)}`)
          return req
        },
        then<T>(suite: (v: typeof resultat) => T) {
          return Promise.resolve(resultat).then(suite)
        },
      }
      return req
    },
  } as unknown as Client
  return { client, filtres }
}

describe('chargerListes', () => {
  it('par défaut, ne demande que les produits actifs', async () => {
    const { client, filtres } = faux()
    await chargerListes(client)
    expect(filtres).toEqual(['products.is_active=true'])
  })
  it('la modération peut lire toutes les fiches', async () => {
    const { client, filtres } = faux()
    await chargerListes(client, { produitsActifs: false })
    expect(filtres).toEqual([])
  })
})
