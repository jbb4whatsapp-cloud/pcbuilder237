export interface SupabaseEnv {
  url: string
  key: string
}

/**
 * URL du projet et clé publique (document 09, section 3).
 * Les références doivent rester littérales : Next.js ne remplace que
 * ces écritures dans le code envoyé au navigateur.
 */
export function supabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (voir .env.example)'
    )
  }
  return { url, key }
}
