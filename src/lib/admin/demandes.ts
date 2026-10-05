/**
 * Demandes d'ajout de boutique (P1-2c-1).
 * Lecture : table shop_requests (le personnel voit tout), statut 'open', de la plus ancienne à la plus récente.
 * Création : fonction create_shop_from_request (réservée au personnel, passe la demande à 'done').
 * Refus : update de status et handled_note ; l'auteur et la date du traitement sont fixés par le serveur.
 */
import type { getBrowserClient } from '../db/browser'
import { SELECT } from '../db/colonnes'
import { mapError } from '../db/erreurs'
import type { ShopRequestRow } from '../db/types'
import { noteRejetValide } from './releves'

type Client = ReturnType<typeof getBrowserClient>

export interface FileDemandes {
  demandes: ShopRequestRow[]
  quartiers: Map<string, string>
}

export type ResultatDemande = { ok: true } | { ok: false; cle: string }

/** Demandes ouvertes avec les noms de quartier. Lève une erreur si la lecture échoue. */
export async function chargerDemandes(client: Client): Promise<FileDemandes> {
  const [lecture, quartiers] = await Promise.all([
    client.from('shop_requests').select(SELECT.shopRequests).eq('status', 'open').order('created_at', { ascending: true }),
    client.from('neighborhoods').select(SELECT.neighborhoods),
  ])
  if (lecture.error) throw new Error(lecture.error.message)
  if (quartiers.error) throw new Error(quartiers.error.message)
  const lignes = (quartiers.data ?? []) as unknown as { id: string; name: string }[]
  return {
    demandes: (lecture.data ?? []) as unknown as ShopRequestRow[],
    quartiers: new Map(lignes.map((q) => [q.id, q.name])),
  }
}

/** Crée la boutique et clôt la demande. Une demande déjà traitée donne error.pb025. */
export async function creerBoutique(client: Client, id: string): Promise<ResultatDemande> {
  const { error } = await client.rpc('create_shop_from_request', { _request: id })
  if (error) return { ok: false, cle: mapError(error) }
  return { ok: true }
}

/** Refuse une demande ouverte ; la note est obligatoire (la base refuse sinon : PB022). */
export async function refuser(client: Client, id: string, note: string): Promise<ResultatDemande> {
  if (!noteRejetValide(note)) return { ok: false, cle: 'moderation.note_required' }
  const { error, count } = await client
    .from('shop_requests')
    .update({ status: 'rejected', handled_note: note.trim() }, { count: 'exact' })
    .eq('id', id)
    .eq('status', 'open')
  if (error) return { ok: false, cle: mapError(error) }
  if (!count) return { ok: false, cle: 'moderation.already_handled' }
  return { ok: true }
}
