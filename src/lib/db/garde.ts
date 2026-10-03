import { redirect } from 'next/navigation'
import { createServerSessionClient } from './server'
import { getUserOrNull } from './session'
import { aUnRole, lireRoles, type Role } from './roles'

/**
 * Garde d'une route privée (document 09, section 6.6 à 6.8).
 * Sans session (ou connexion anonyme) : page de connexion. Sans le bon rôle : accès refusé.
 * Ce garde règle l'affichage ; la protection réelle des données reste la RLS.
 */
export async function exigerRole(autorises: readonly Role[], chemin: string): Promise<Role[]> {
  const user = await getUserOrNull()
  if (!user || user.is_anonymous) {
    redirect(`/connexion?suite=${encodeURIComponent(chemin)}`)
  }
  const supabase = await createServerSessionClient()
  const roles = await lireRoles(supabase)
  if (!aUnRole(roles, autorises)) redirect('/acces-refuse')
  return roles
}
