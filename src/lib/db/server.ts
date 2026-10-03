import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseEnv } from './env'

/**
 * Client « serveur avec session » : cookies de l'utilisateur.
 * Pour la protection des routes /agent, /boutique et /admin.
 * Rend la page dynamique (cookies) : jamais pour une page publique en cache.
 * Asynchrone : depuis Next 15, cookies() renvoie une promesse.
 */
export async function createServerSessionClient() {
  const { url, key } = supabaseEnv()
  const store = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll()
      },
      setAll(liste: { name: string; value: string; options: CookieOptions }[]) {
        try {
          liste.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // Appelé depuis un composant serveur : l'écriture de cookies y est interdite.
          // Le rafraîchissement du jeton relève du proxy (lot P0-6).
        }
      },
    },
  })
}
