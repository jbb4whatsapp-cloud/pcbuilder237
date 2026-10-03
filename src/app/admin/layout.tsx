import { exigerRole } from '@/lib/db/garde'
import { ACCES } from '@/lib/db/roles'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }: { children: React.ReactNode }) {
  await exigerRole(ACCES.admin, '/admin')
  return <>{children}</>
}
