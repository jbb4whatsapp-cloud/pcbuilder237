import type { Metadata } from 'next'
import { FormulaireConnexion } from './formulaire'
import { message } from '@/lib/messages'
import { suiteSure } from '@/lib/db/roles'

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
}

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>
}) {
  const { suite } = await searchParams
  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{message('login.title')}</h1>
      <FormulaireConnexion suite={suiteSure(suite)} />
    </main>
  )
}
