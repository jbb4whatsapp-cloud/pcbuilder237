/**
 * Enveloppe de fetch qui impose la durée de cache de Next.js (en secondes).
 * 0 = pas de cache. Sans cela, les réponses peuvent rester en cache indéfiniment.
 */
export function withRevalidate(
  revalidate: number,
  base: typeof fetch = fetch
): typeof fetch {
  return (input, init) =>
    base(
      input,
      revalidate === 0
        ? { ...init, cache: 'no-store' }
        : ({ ...init, next: { revalidate } } as RequestInit)
    )
}
