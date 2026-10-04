/**
 * Envoi d'un relevé : photos d'abord, puis le relevé avec son client_ref, relu dans la même
 * requête (colonnes ouvertes seulement, jamais .select() sans argument : document 09).
 * Reprise après coupure : on renvoie avec le MÊME client_ref. Une photo déjà présente est
 * sautée, un relevé déjà enregistré est traité comme un succès.
 * Ce module ne parle pas à Supabase : la page lui passe deux fonctions (testable seul).
 */
import {
  cheminPreuve,
  construireReleve,
  estDoublonReleve,
  estFichierDejaPresent,
  photosRequises,
  validerSaisie,
  type ErreurLegere,
  type Saisie,
} from './releve'

export const MAX_PHOTOS = 10

export type LigneReleve = ReturnType<typeof construireReleve>
export type Etape = 'photos' | 'releve'

export interface Dependances {
  /** Envoie une photo ; renvoie l'erreur éventuelle (un refus du serveur n'est pas une exception). */
  televerser(chemin: string, photo: Blob): Promise<ErreurLegere | null>
  /** Insère le relevé et relit status, check_level, check_codes. */
  inserer(ligne: LigneReleve): Promise<{ statut: string | null; erreur: ErreurLegere | null }>
}

export type ResultatEnvoi =
  | { ok: true; statut: 'published' | 'pending' | null; dejaEnvoye: boolean }
  | { ok: false; etape: Etape; erreur: ErreurLegere | null }

function erreurDe(e: unknown): ErreurLegere {
  return { message: e instanceof Error ? e.message : String(e) }
}

/**
 * Lève une erreur si la saisie ou le nombre de photos est invalide : c'est un défaut de la page
 * (elle aurait dû l'empêcher), et rien n'est envoyé dans ce cas.
 */
export async function envoyerReleve(
  saisie: Saisie,
  photos: readonly Blob[],
  uid: string,
  clientRef: string,
  deps: Dependances,
  progression?: (fait: number, total: number) => void
): Promise<ResultatEnvoi> {
  if (Object.keys(validerSaisie(saisie)).length > 0) throw new Error('saisie invalide')
  if (photos.length < photosRequises(saisie.condition)) throw new Error('photos insuffisantes')
  if (photos.length > MAX_PHOTOS) throw new Error('trop de photos')

  const paires = photos.map((photo, i) => ({ photo, chemin: cheminPreuve(uid, clientRef, i + 1) }))

  let fait = 0
  for (const { photo, chemin } of paires) {
    let erreur: ErreurLegere | null
    try {
      erreur = await deps.televerser(chemin, photo)
    } catch (e) {
      erreur = erreurDe(e)
    }
    if (erreur && !estFichierDejaPresent(erreur)) return { ok: false, etape: 'photos', erreur }
    fait += 1
    progression?.(fait, paires.length)
  }

  const ligne = construireReleve(saisie, clientRef, paires.map((p) => p.chemin))
  let retour: { statut: string | null; erreur: ErreurLegere | null }
  try {
    retour = await deps.inserer(ligne)
  } catch (e) {
    retour = { statut: null, erreur: erreurDe(e) }
  }

  if (retour.erreur) {
    if (estDoublonReleve(retour.erreur)) return { ok: true, statut: null, dejaEnvoye: true }
    return { ok: false, etape: 'releve', erreur: retour.erreur }
  }
  const statut = retour.statut === 'published' || retour.statut === 'pending' ? retour.statut : null
  return { ok: true, statut, dejaEnvoye: false }
}
