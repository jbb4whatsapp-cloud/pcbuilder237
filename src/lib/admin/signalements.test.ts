import { describe, expect, it } from 'vitest'
import { miseAJour, traiter } from './signalements'

type Client = Parameters<typeof traiter>[0]
interface Resultat {
  error: { code?: string; message?: string } | null
  count: number | null
}

class Requete {
  resultat: Resultat
  journal: string[]
  constructor(resultat: Resultat, journal: string[]) {
    this.resultat = resultat
    this.journal = journal
  }
  eq(colonne: string, valeur: unknown) {
    this.journal.push(`eq ${colonne} ${String(valeur)}`)
    return this
  }
  then<T>(suite: (v: Resultat) => T) {
    return Promise.resolve(this.resultat).then(suite)
  }
}

function faux(resultat: Resultat) {
  const journal: string[] = []
  const client = {
    from(table: string) {
      journal.push(`from ${table}`)
      return {
        update(valeurs: unknown, options: unknown) {
          journal.push(`update ${JSON.stringify(valeurs)} ${JSON.stringify(options)}`)
          return new Requete(resultat, journal)
        },
      }
    },
  } as unknown as Client
  return { client, journal }
}

describe('miseAJour', () => {
  it('envoie seulement le statut', () => {
    expect(miseAJour('reviewed')).toEqual({ status: 'reviewed' })
    expect(miseAJour('dismissed')).toEqual({ status: 'dismissed' })
  })
})

describe('traiter', () => {
  it('marque un signalement ouvert comme traité', async () => {
    const { client, journal } = faux({ error: null, count: 1 })
    expect(await traiter(client, 's1', 'reviewed')).toEqual({ ok: true })
    expect(journal).toEqual([
      'from flags',
      'update {"status":"reviewed"} {"count":"exact"}',
      'eq id s1',
      'eq status open',
    ])
  })

  it('écarte un signalement ouvert', async () => {
    const { client, journal } = faux({ error: null, count: 1 })
    expect(await traiter(client, 's1', 'dismissed')).toEqual({ ok: true })
    expect(journal[1]).toBe('update {"status":"dismissed"} {"count":"exact"}')
  })

  it('aucune ligne modifiée : déjà traité', async () => {
    const { client } = faux({ error: null, count: 0 })
    expect(await traiter(client, 's1', 'reviewed')).toEqual({ ok: false, cle: 'moderation.already_handled' })
  })

  it('42501 devient la clé error.forbidden', async () => {
    const { client } = faux({ error: { code: '42501', message: 'permission denied' }, count: null })
    expect(await traiter(client, 's1', 'reviewed')).toEqual({ ok: false, cle: 'error.forbidden' })
  })
})
