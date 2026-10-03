/** Dates affichées dans le fuseau Africa/Douala (document 09, section 5.4). */
const FUSEAU = 'Africa/Douala'

const JOUR = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSEAU,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const RELATIF = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
const COMPLET = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function jourDouala(d: Date): number {
  const p = JOUR.format(d).split('-').map(Number)
  return Date.UTC(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1)
}

/** « aujourd'hui », « hier », « il y a N jours » : écart en jours calendaires à Douala. */
export function libelleRelatif(iso: string, maintenant: Date = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const jours = Math.max(0, Math.round((jourDouala(maintenant) - jourDouala(d)) / 86_400_000))
  return RELATIF.format(jours === 0 ? 0 : -jours, 'day')
}

/** Date complète pour le toucher : « 4 octobre 2026 ». */
export function dateComplete(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return COMPLET.format(d)
}

const COURT = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU,
  day: '2-digit',
  month: '2-digit',
})

/** Jour/mois sans année, pour les messages WhatsApp : « 28/09 ». */
export function dateCourte(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return COURT.format(d)
}
