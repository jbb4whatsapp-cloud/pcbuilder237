import { describe, it, expect, vi } from 'vitest'
import { withRevalidate } from './fetch'

function faux() {
  return vi.fn((_i: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response('{}'))
  )
}

describe('withRevalidate', () => {
  it('transmet la durée de revalidation à Next.js', async () => {
    const base = faux()
    await withRevalidate(300, base as unknown as typeof fetch)('https://exemple.test/x', {
      method: 'GET',
    })
    const init = base.mock.calls[0][1] as RequestInit & { next?: { revalidate: number } }
    expect(init.next).toEqual({ revalidate: 300 })
    expect(init.method).toBe('GET')
  })

  it('0 désactive le cache', async () => {
    const base = faux()
    await withRevalidate(0, base as unknown as typeof fetch)('https://exemple.test/x')
    const init = base.mock.calls[0][1] as RequestInit
    expect(init.cache).toBe('no-store')
  })
})
