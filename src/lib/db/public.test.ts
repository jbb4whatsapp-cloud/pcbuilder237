import { describe, it, expect, afterEach, vi } from 'vitest'
import { createPublicClient } from './public'

afterEach(() => vi.unstubAllEnvs())

describe('createPublicClient', () => {
  it('construit un client sans réseau quand les variables existent', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'cle')
    expect(typeof createPublicClient(300).from).toBe('function')
  })

  it('échoue si les variables manquent', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    expect(() => createPublicClient(300)).toThrow(/Variables manquantes/)
  })
})
