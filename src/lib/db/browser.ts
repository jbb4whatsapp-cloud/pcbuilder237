import { createBrowserClient } from '@supabase/ssr'
import { supabaseEnv } from './env'

let client: ReturnType<typeof createBrowserClient> | undefined

/** Client « navigateur » : session de l'utilisateur, pour les écrans interactifs. */
export function getBrowserClient() {
  if (!client) {
    const { url, key } = supabaseEnv()
    client = createBrowserClient(url, key)
  }
  return client
}
