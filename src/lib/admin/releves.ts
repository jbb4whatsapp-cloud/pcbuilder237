/**
 * File de modération des relevés (P1-2a).
 * Lecture : price_reports_visible (le personnel voit tout, y compris check_reason et les chemins de photos).
 * Décision : update de status (et review_note pour un rejet), jamais de .select() complet ensuite.
 * L'auteur et la date de la décision sont fixés par le serveur : on ne les envoie pas.
 */
import { chargerListes } from '../agent/listes'
import type { getBrowserClient } from '../db/browser'
import { SELECT } from '../db/colonnes'
import { mapError } from '../db/erreurs'
import type { ReportVisibleRow } from '../db/types'

type Client = ReturnType<typeof getBrowserClient>

export type Decision = { action: 'publier' } | { action: 'rejeter'; note: string }

export interface FileReleves {
  releves: ReportVisibleRow[]
  produits: Map<string, string>
  boutiques: Map<string, string>
}

export type ResultatDecision = { ok: true } | { ok: false; cle: string }

/** Un rejet exige une note non vide (la base refuse sinon : PB032). */
export function noteRejetValide(note: string): boolean {
  return note.trim().length > 0
}

/** Ce qui part vers la base : seulement status et, pour un rejet, la note. */
export function miseAJour(d: Decision): { status: 'published' } | { status: 'rejected'; review_note: string } {
  return d.action === 'publier' ? { status: 'published' } : { status: 'rejected', review_note: d.note.trim() }
}

/** Relevés en attente, du plus ancien au plus récent, avec les noms des produits et des boutiques. Lève une erreur si la lecture échoue. */
export async function chargerFile(client: Client): Promise<FileReleves> {
  const [lecture, listes] = await Promise.all([
    client
      .from('price_reports_visible')
      .select(SELECT.reportsVisible)
      .eq('status', 'pending')
      .order('reported_at', { ascending: true }),
    chargerListes(client, { produitsActifs: false }),
  ])
  if (lecture.error) throw new Error(lecture.error.message)
  return {
    releves: (lecture.data ?? []) as unknown as ReportVisibleRow[],
    produits: new Map(listes.produits.map((o) => [o.id, o.libelle])),
    boutiques: new Map(listes.boutiques.map((o) => [o.id, o.libelle])),
  }
}

/**
 * Publie ou rejette un relevé encore en attente.
 * Rend une clé de message en cas d'échec ; « déjà traité » si aucune ligne n'a été modifiée.
 */
export async function decider(client: Client, id: string, d: Decision): Promise<ResultatDecision> {
  if (d.action === 'rejeter' && !noteRejetValide(d.note)) {
    return { ok: false, cle: 'moderation.note_required' }
  }
  const { error, count } = await client
    .from('price_reports')
    .update(miseAJour(d), { count: 'exact' })
    .eq('id', id)
    .eq('status', 'pending')
  if (error) return { ok: false, cle: mapError(error) }
  if (!count) return { ok: false, cle: 'moderation.already_handled' }
  return { ok: true }
}
