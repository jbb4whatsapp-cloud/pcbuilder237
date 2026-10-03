import type { User } from '@supabase/supabase-js'
import { createServerSessionClient } from './server'

/**
 * Utilisateur vérifié auprès de Supabase Auth, ou null.
 * Ne jamais se fier à la lecture directe du jeton du cookie : il n'est pas vérifié
 * (document 09, section 3). Une connexion anonyme est un utilisateur : tester user.is_anonymous.
 */
export async function getUserOrNull(): Promise<User | null> {
  const supabase = await createServerSessionClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}
