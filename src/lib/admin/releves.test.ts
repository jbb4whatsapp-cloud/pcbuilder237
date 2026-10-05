import { describe, expect, it } from 'vitest'
import { decider, miseAJour, noteRejetValide } from './releves'

type Client = Parameters<typeof decider>[0]
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
  eq(colonne: string) {
    this.journal.push(`eq ${colonne}`)
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

describe('noteRejetValide', () => {
  it('refuse une note vide ou faite d\'espaces', () => {
    expect(noteRejetValide('')).toBe(false)
    expect(noteRejetValide('   ')).toBe(false)
    expect(noteRejetValide('\n\t')).toBe(false)
  })
  it('accepte une vraie note', () => {
    expect(noteRejetValide('Photo illisible')).toBe(true)
  })
})

describe('miseAJour', () => {
  it('publier : seulement le statut', () => {
    expect(miseAJour({ action: 'publier' })).toEqual({ status: 'published' })
  })
  it('rejeter : statut et note rognée, rien d\'autre', () => {
    expect(miseAJour({ action: 'rejeter', note: '  Photo illisible  ' })).toEqual({
      status: 'rejected',
      review_note: 'Photo illisible',
    })
  })
})

describe('decider', () => {
  it('publie un relevé en attente', async () => {
    const { client, journal } = faux({ error: null, count: 1 })
    expect(await decider(client, 'r1', { action: 'publier' })).toEqual({ ok: true })
    expect(journal).toEqual([
      'from price_reports',
      'update {"status":"published"} {"count":"exact"}',
      'eq id',
      'eq status',
    ])
  })

  it('rejette avec une note rognée', async () => {
    const { client, journal } = faux({ error: null, count: 1 })
    const r = await decider(client, 'r1', { action: 'rejeter', note: '  Doublon ' })
    expect(r).toEqual({ ok: true })
    expect(journal[1]).toBe('update {"status":"rejected","review_note":"Doublon"} {"count":"exact"}')
  })

  it('refuse un rejet sans note et n\'envoie rien', async () => {
    const { client, journal } = faux({ error: null, count: 1 })
    expect(await decider(client, 'r1', { action: 'rejeter', note: '   ' })).toEqual({
      ok: false,
      cle: 'moderation.note_required',
    })
    expect(journal).toEqual([])
  })

  it('PB032 du serveur devient la clé error.pb032', async () => {
    const { client } = faux({ error: { code: 'PB032', message: 'note obligatoire' }, count: null })
    expect(await decider(client, 'r1', { action: 'rejeter', note: 'x' })).toEqual({ ok: false, cle: 'error.pb032' })
  })

  it('aucune ligne modifiée : déjà traité', async () => {
    const { client } = faux({ error: null, count: 0 })
    expect(await decider(client, 'r1', { action: 'publier' })).toEqual({
      ok: false,
      cle: 'moderation.already_handled',
    })
  })

  it('42501 devient la clé error.forbidden', async () => {
    const { client } = faux({ error: { code: '42501', message: 'permission denied' }, count: null })
    expect(await decider(client, 'r1', { action: 'publier' })).toEqual({ ok: false, cle: 'error.forbidden' })
  })
})
