'use client'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/db/browser'
import { message } from '@/lib/messages'

export function BoutonDeconnexion() {
  const router = useRouter()

  async function sortir() {
    await getBrowserClient().auth.signOut()
    router.replace('/connexion')
    router.refresh()
  }

  return (
    <button type="button" onClick={sortir} className="bouton-secondaire">
      {message('login.logout')}
    </button>
  )
}
