import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseEnv } from './env'
import { withRevalidate } from './fetch'

/**
 * Client « public serveur » : clé publique, AUCUNE session, aucun cookie.
 * Pour toute page susceptible d'être mise en cache (document 09, section 3) :
 * téléphone, adresse et horaires dépendent de la personne qui lit.
 * La durée de cache est obligatoire (voir REVALIDATE).
 */
export function createPublicClient(revalidate: number): SupabaseClient {
  const { url, key } = supabaseEnv()
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: withRevalidate(revalidate) },
  })
}
