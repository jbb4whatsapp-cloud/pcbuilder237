import { describe, expect, it } from 'vitest'
import { envoyerReleve, type Dependances } from './envoi'
import type { ErreurLegere, Saisie } from './releve'

const UID = 'f0000000-0000-0000-0000-0000000000c1'
const REF = 'f4000000-0000-0000-0000-000000000001'

const saisie: Saisie = {
  productId: 'p1',
  shopId: 's1',
  condition: 'used',
  prix: '200000',
  enStock: true,
  garantieChoix: 'months',
  garantieMois: '3',
  ram: '16',
  stockage: '256',
  cpu: 'i5-8350U',
  configSource: 'machine',
  batterie: '',
}
const photo = () => new Blob(['x'])

function faux(
  opts: {
    photo?: (chemin: string) => ErreurLegere | null
    releve?: () => { statut: string | null; erreur: ErreurLegere | null }
  } = {}
) {
  const journal: string[] = []
  const deps: Dependances = {
    async televerser(chemin) {
      journal.push('photo ' + chemin)
      return opts.photo ? opts.photo(chemin) : null
    },
    async inserer(ligne) {
      journal.push('releve ' + ligne.proof_paths.length)
      return opts.releve ? opts.releve() : { statut: 'published', erreur: null }
    },
  }
  return { deps, journal }
}

describe('envoyerReleve', () => {
  it('envoie les photos puis le relevé, et rend le statut', async () => {
    const { deps, journal } = faux({ releve: () => ({ statut: 'pending', erreur: null }) })
    const etapes: string[] = []
    const r = await envoyerReleve(saisie, [photo(), photo()], UID, REF, deps, (f, t) => etapes.push(`${f}/${t}`))
    expect(r).toEqual({ ok: true, statut: 'pending', dejaEnvoye: false })
    expect(journal).toEqual([`photo ${UID}/${REF}/1.jpg`, `photo ${UID}/${REF}/2.jpg`, 'releve 2'])
    expect(etapes).toEqual(['1/2', '2/2'])
  })

  it('une photo déjà présente (409) est sautée, l\'envoi continue', async () => {
    const { deps } = faux({ photo: () => ({ statusCode: 409, message: 'The resource already exists' }) })
    const r = await envoyerReleve(saisie, [photo(), photo()], UID, REF, deps)
    expect(r.ok).toBe(true)
  })

  it('une photo refusée arrête tout avant le relevé', async () => {
    const { deps, journal } = faux({ photo: () => ({ message: 'Failed to fetch' }) })
    const r = await envoyerReleve(saisie, [photo(), photo()], UID, REF, deps)
    expect(r).toEqual({ ok: false, etape: 'photos', erreur: { message: 'Failed to fetch' } })
    expect(journal.some((l) => l.startsWith('releve'))).toBe(false)
  })

  it('un relevé déjà enregistré (même client_ref) est un succès', async () => {
    const { deps } = faux({
      releve: () => ({
        statut: null,
        erreur: { code: '23505', message: 'duplicate key value violates unique constraint "price_reports_client_ref_key"' },
      }),
    })
    const r = await envoyerReleve(saisie, [photo(), photo()], UID, REF, deps)
    expect(r).toEqual({ ok: true, statut: null, dejaEnvoye: true })
  })

  it('une autre erreur du relevé est rendue telle quelle', async () => {
    const erreur = { code: '23514', message: 'violates check constraint "price_reports_needs_two_proofs"' }
    const { deps } = faux({ releve: () => ({ statut: null, erreur }) })
    const r = await envoyerReleve(saisie, [photo(), photo()], UID, REF, deps)
    expect(r).toEqual({ ok: false, etape: 'releve', erreur })
  })

  it('une exception réseau devient une erreur d\'étape', async () => {
    const deps: Dependances = {
      async televerser() {
        throw new Error('Failed to fetch')
      },
      async inserer() {
        return { statut: 'published', erreur: null }
      },
    }
    const r = await envoyerReleve(saisie, [photo(), photo()], UID, REF, deps)
    expect(r).toEqual({ ok: false, etape: 'photos', erreur: { message: 'Failed to fetch' } })
  })

  it('refuse sans les photos requises, et n\'envoie rien', async () => {
    const { deps, journal } = faux()
    await expect(envoyerReleve(saisie, [photo()], UID, REF, deps)).rejects.toThrow('photos insuffisantes')
    expect(journal).toEqual([])
  })

  it('refuse une saisie invalide, et n\'envoie rien', async () => {
    const { deps, journal } = faux()
    await expect(envoyerReleve({ ...saisie, prix: '' }, [photo(), photo()], UID, REF, deps)).rejects.toThrow('saisie invalide')
    expect(journal).toEqual([])
  })
})
