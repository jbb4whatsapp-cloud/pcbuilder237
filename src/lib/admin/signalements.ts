/**
 * File de modération des signalements (P1-2b).
 * Lecture : table flags (réservée au personnel), statut 'open', du plus ancien au plus récent.
 * Décision : update de status seulement ('reviewed' ou 'dismissed'), jamais de .select() ensuite.
 * Un signalement justifié sur un prix se traite à part : le relevé se rejette depuis la page des relevés.
 */
import { chargerListes } from '../agent/listes'
import type { getBrowserClient } from '../db/browser'
import { SELECT } from '../db/colonnes'
import { mapError } from '../db/erreurs'
import type { FlagRow, ReportVisibleRow } from '../db/types'

type Client = ReturnType<typeof getBrowserClient>

export type Traitement = 'reviewed' | 'dismissed'

export interface FileSignalements {
  signalements: FlagRow[]
  releves: Map<string, ReportVisibleRow>
  produits: Map<string, string>
  boutiques: Map<string, string>
}

export type ResultatTraitement = { ok: true } | { ok: false; cle: string }

/** Ce qui part vers la base : seulement le statut. */
export function miseAJour(t: Traitement): { status: Traitement } {
  return { status: t }
}

/** Signalements ouverts avec les relevés visés, les produits et les boutiques. Lève une erreur si la lecture échoue. */
export async function chargerSignalements(client: Client): Promise<FileSignalements> {
  const [lecture, listes] = await Promise.all([
    client.from('flags').select(SELECT.flags).eq('status', 'open').order('created_at', { ascending: true }),
    chargerListes(client, { produitsActifs: false }),
  ])
  if (lecture.error) throw new Error(lecture.error.message)
  const signalements = (lecture.data ?? []) as unknown as FlagRow[]

  const releves = new Map<string, ReportVisibleRow>()
  const ids = [...new Set(signalements.map((s) => s.report_id).filter((x): x is string => !!x))]
  if (ids.length > 0) {
    const r = await client.from('price_reports_visible').select(SELECT.reportsVisible).in('id', ids)
    if (r.error) throw new Error(r.error.message)
    for (const ligne of (r.data ?? []) as unknown as ReportVisibleRow[]) releves.set(ligne.id, ligne)
  }

  return {
    signalements,
    releves,
    produits: new Map(listes.produits.map((o) => [o.id, o.libelle])),
    boutiques: new Map(listes.boutiques.map((o) => [o.id, o.libelle])),
  }
}

/** Traite un signalement encore ouvert. « Déjà traité » si aucune ligne n'a été modifiée. */
export async function traiter(client: Client, id: string, t: Traitement): Promise<ResultatTraitement> {
  const { error, count } = await client
    .from('flags')
    .update(miseAJour(t), { count: 'exact' })
    .eq('id', id)
    .eq('status', 'open')
  if (error) return { ok: false, cle: mapError(error) }
  if (!count) return { ok: false, cle: 'moderation.already_handled' }
  return { ok: true }
}
