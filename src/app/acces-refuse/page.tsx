import type { Metadata } from 'next'
import { BoutonDeconnexion } from '@/app/connexion/deconnexion'
import { message } from '@/lib/messages'

export const metadata: Metadata = {
  title: 'Accès refusé',
  robots: { index: false, follow: false },
}

export default function AccesRefuse() {
  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{message('login.denied_title')}</h1>
      <p className="mb-6">{message('login.denied_text')}</p>
      <BoutonDeconnexion />
    </main>
  )
}
