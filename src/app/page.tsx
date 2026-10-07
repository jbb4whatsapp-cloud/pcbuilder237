import { redirect } from 'next/navigation'

/** L'accueil mène à la liste des portables. L'ancien prototype est supprimé. */
export default function HomePage() {
  redirect('/produits')
}
