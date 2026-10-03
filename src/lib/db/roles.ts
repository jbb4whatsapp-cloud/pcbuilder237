import type { SupabaseClient } from '@supabase/supabase-js'

/** Rôles stockés (document 09, section 3). Le propriétaire de boutique est calculé, pas stocké. */
export type Role = 'admin' | 'moderator' | 'agent'
const ROLES: readonly Role[] = ['admin', 'moderator', 'agent']

/** Qui entre où. Le personnel peut relever des prix (le porteur relève et modère, D1 et D2). */
export const ACCES: Record<'agent' | 'admin', readonly Role[]> = {
  agent: ['agent', 'moderator', 'admin'],
  admin: ['moderator', 'admin'],
}

/** Garde seulement les rôles connus : une valeur inattendue n'ouvre rien. */
export function rolesConnus(valeurs: readonly unknown[]): Role[] {
  return ROLES.filter((r) => valeurs.includes(r))
}

export function aUnRole(roles: readonly Role[], autorises: readonly Role[]): boolean {
  return autorises.some((r) => roles.includes(r))
}

/** Lit ses propres rôles (politique roles_read) ; en cas d'erreur, aucun rôle. */
export async function lireRoles(supabase: SupabaseClient): Promise<Role[]> {
  const { data, error } = await supabase.from('user_roles').select('role')
  if (error || !data) return []
  return rolesConnus(data.map((ligne: { role: unknown }) => ligne.role))
}

/** Adresse de retour après connexion : uniquement un chemin de ce site (pas de redirection ouverte). */
export function suiteSure(suite: string | null | undefined, defaut = '/'): string {
  if (!suite || !suite.startsWith('/') || suite.startsWith('//') || suite.includes('\\')) return defaut
  return suite
}
