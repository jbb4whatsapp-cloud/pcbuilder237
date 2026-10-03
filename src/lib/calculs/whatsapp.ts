/** Contact et lien WhatsApp (document 09, section 5.3). */

/** Prix avec espace simple : fr-FR produit une espace insécable fine, à remplacer. */
export function prixPourMessage(prix: number): string {
  return new Intl.NumberFormat('fr-FR').format(prix).replace(/[\u00a0\u202f]/g, ' ')
}

/** '+237XXXXXXXXX' (9 chiffres commençant par 2 ou 6) vers '237XXXXXXXXX', sans le plus. */
export function numeroWhatsapp(telephone: string | null | undefined): string | null {
  if (!telephone || !/^\+237[26]\d{8}$/.test(telephone)) return null
  return telephone.slice(1)
}

export interface EntreeLien {
  contactable: boolean | null | undefined
  phone: string | null | undefined
  /** Texte déjà construit depuis fr.json (clé whatsapp.single_product). */
  message: string
}

/** Lien wa.me, ou null : le bouton n'apparaît pas. Le site ne teste jamais la date de lancement. */
export function lienWhatsapp({ contactable, phone, message }: EntreeLien): string | null {
  if (contactable !== true) return null
  const numero = numeroWhatsapp(phone)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`
}
