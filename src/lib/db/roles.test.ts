import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ACCES, aUnRole, lireRoles, rolesConnus, suiteSure } from './roles'

function faux(reponse: { data: unknown; error: unknown }) {
  return { from: () => ({ select: async () => reponse }) } as unknown as SupabaseClient
}

describe('rôles', () => {
  it('rolesConnus ignore les valeurs inattendues', () => {
    expect(rolesConnus(['agent', 'root', 42, 'admin'])).toEqual(['admin', 'agent'])
  })

  it('aUnRole : qui entre où', () => {
    expect(aUnRole(['moderator'], ACCES.admin)).toBe(true)
    expect(aUnRole(['agent'], ACCES.admin)).toBe(false)
    expect(aUnRole(['agent'], ACCES.agent)).toBe(true)
    expect(aUnRole([], ACCES.agent)).toBe(false)
  })

  it('suiteSure refuse tout ce qui sort du site', () => {
    expect(suiteSure('/agent')).toBe('/agent')
    expect(suiteSure('/agent?x=1')).toBe('/agent?x=1')
    expect(suiteSure('//evil.com')).toBe('/')
    expect(suiteSure('https://evil.com')).toBe('/')
    expect(suiteSure('/\\evil.com')).toBe('/')
    expect(suiteSure(null)).toBe('/')
    expect(suiteSure(undefined, '/agent')).toBe('/agent')
  })

  it('lireRoles filtre les valeurs inconnues', async () => {
    const client = faux({ data: [{ role: 'agent' }, { role: 'x' }], error: null })
    expect(await lireRoles(client)).toEqual(['agent'])
  })

  it('lireRoles : une erreur ne donne aucun rôle', async () => {
    expect(await lireRoles(faux({ data: null, error: { code: '42501' } }))).toEqual([])
  })
})
