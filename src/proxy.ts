import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseEnv } from '@/lib/db/env'

/**
 * Rafraîchit le jeton de connexion des routes privées (document 09, section 3).
 * Il ne décide d'aucun accès : la protection se fait dans chaque page, avec getUser().
 * Limité aux routes privées : les pages publiques restent sans cookies, donc cachables.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, key } = supabaseEnv()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(liste: { name: string; value: string; options: CookieOptions }[]) {
        liste.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        liste.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Vérifie le jeton auprès de Supabase Auth et le renouvelle si besoin.
  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ['/agent/:path*', '/boutique/:path*', '/admin/:path*', '/connexion'],
}
