import type { Condition, CurrentPriceRow } from '@/lib/db/types'

/** Meilleur prix et ordre d'affichage (document 09, section 5.2). */
export type LignePrix = Pick<CurrentPriceRow, 'price_fcfa' | 'in_stock' | 'check_level'>

/** Éligible au meilleur prix : sans alerte ET en stock. */
export function estEligible(ligne: LignePrix): boolean {
  return ligne.check_level === 'ok' && ligne.in_stock
}

/** À appeler sur des lignes d'un même état (et d'une même configuration sur la fiche produit). */
export function meilleurPrix(lignes: readonly LignePrix[]): number | null {
  let meilleur: number | null = null
  for (const l of lignes) {
    if (estEligible(l) && (meilleur === null || l.price_fcfa < meilleur)) meilleur = l.price_fcfa
  }
  return meilleur
}

/** Étiquette « meilleur prix » : jamais sur une ligne avec alerte ou hors stock. */
export function porteEtiquetteMeilleurPrix(ligne: LignePrix, meilleur: number | null): boolean {
  return meilleur !== null && estEligible(ligne) && ligne.price_fcfa === meilleur
}

/** En stock par prix croissant (alertes comprises), puis hors stock. L'abonnement n'entre jamais dans le tri. */
export function trierLignes<T extends LignePrix>(lignes: readonly T[]): T[] {
  return [...lignes].sort(
    (a, b) => Number(b.in_stock) - Number(a.in_stock) || a.price_fcfa - b.price_fcfa
  )
}

/** « À partir de X FCFA » : meilleur prix éligible de l'état filtré ; null si aucune ligne éligible. */
export function prixDeDepart<T extends LignePrix & { condition: Condition }>(
  lignes: readonly T[],
  etat: Condition | null
): number | null {
  return meilleurPrix(etat ? lignes.filter((l) => l.condition === etat) : lignes)
}
