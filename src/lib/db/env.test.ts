import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseEnv } from './env'

afterEach(() => vi.unstubAllEnvs())

describe('supabaseEnv', () => {
  it('renvoie URL et clé quand elles sont définies', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'cle')
    expect(supabaseEnv()).toEqual({ url: 'https://x.supabase.co', key: 'cle' })
  })

  it("échoue clairement si l'URL manque", () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'cle')
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('échoue clairement si la clé manque', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  })
})
