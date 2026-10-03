import { exigerRole } from '@/lib/db/garde'
import { ACCES } from '@/lib/db/roles'
import { BoutonDeconnexion } from '@/app/connexion/deconnexion'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }: { children: React.ReactNode }) {
  await exigerRole(ACCES.agent, '/agent')
  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-4 text-right">
        <BoutonDeconnexion />
      </div>
      {children}
    </>
  )
}
