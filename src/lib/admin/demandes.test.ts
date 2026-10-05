import { describe, expect, it } from 'vitest'
import { creerBoutique, refuser } from './demandes'

type Client = Parameters<typeof creerBoutique>[0]
interface Erreur { code?: string; message?: string }
interface Resultat { error: Erreur | null; count?: number | null }

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
    rpc(nom: string, args: unknown) {
      journal.push(`rpc ${nom} ${JSON.stringify(args)}`)
      return Promise.resolve({ data: null, error: resultat.error })
    },
  } as unknown as Client
  return { client, journal }
}

describe('creerBoutique', () => {
  it('appelle la fonction du serveur avec l\'identifiant de la demande', async () => {
    const { client, journal } = faux({ error: null })
    expect(await creerBoutique(client, 'd1')).toEqual({ ok: true })
    expect(journal).toEqual(['rpc create_shop_from_request {"_request":"d1"}'])
  })
  it('PB025 (déjà traitée) devient error.pb025', async () => {
    const { client } = faux({ error: { code: 'PB025', message: 'demande déjà traitée' } })
    expect(await creerBoutique(client, 'd1')).toEqual({ ok: false, cle: 'error.pb025' })
  })
  it('PB023 (réservé au personnel) devient error.pb023', async () => {
    const { client } = faux({ error: { code: 'PB023', message: 'réservé au personnel' } })
    expect(await creerBoutique(client, 'd1')).toEqual({ ok: false, cle: 'error.pb023' })
  })
})

describe('refuser', () => {
  it('refuse avec une note rognée, sur une demande encore ouverte', async () => {
    const { client, journal } = faux({ error: null, count: 1 })
    expect(await refuser(client, 'd1', '  Doublon ')).toEqual({ ok: true })
    expect(journal).toEqual([
      'from shop_requests',
      'update {"status":"rejected","handled_note":"Doublon"} {"count":"exact"}',
      'eq id d1',
      'eq status open',
    ])
  })
  it('sans note : rien n\'est envoyé', async () => {
    const { client, journal } = faux({ error: null, count: 1 })
    expect(await refuser(client, 'd1', '   ')).toEqual({ ok: false, cle: 'moderation.note_required' })
    expect(journal).toEqual([])
  })
  it('aucune ligne modifiée : déjà traitée', async () => {
    const { client } = faux({ error: null, count: 0 })
    expect(await refuser(client, 'd1', 'x')).toEqual({ ok: false, cle: 'moderation.already_handled' })
  })
  it('PB022 du serveur devient error.pb022', async () => {
    const { client } = faux({ error: { code: 'PB022', message: 'note obligatoire' }, count: null })
    expect(await refuser(client, 'd1', 'x')).toEqual({ ok: false, cle: 'error.pb022' })
  })
})
