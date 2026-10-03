import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/db/public'
import { REVALIDATE } from '@/lib/db/cache'
import { SELECT } from '@/lib/db/colonnes'
import { plage } from '@/lib/db/pagination'
import { mapError } from '@/lib/db/erreurs'

// Page de diagnostic (P0-4) : jamais mise en cache, jamais indexée.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Diagnostic',
  robots: { index: false, follow: false },
}

export default async function Diagnostic() {
  const supabase = createPublicClient(REVALIDATE.aucun)
  const [debut, fin] = plage(0, 50)

  const { data, error } = await supabase
    .from('countries')
    .select(SELECT.countries)
    .range(debut, fin)

  return (
    <main style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1>Diagnostic</h1>
      {error ? (
        <>
          <p>Lecture de la base : <strong>échec</strong></p>
          <p>Clé de message : {mapError(error)}</p>
          <p>Code : {error.code || '(aucun)'}</p>
        </>
      ) : (
        <>
          <p>Lecture de la base : <strong>réussie</strong></p>
          <p>Pays lus : {data?.length ?? 0}</p>
        </>
      )}
    </main>
  )
}
