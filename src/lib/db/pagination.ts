/**
 * Bornes pour .range(from, to) (document 09, principe 7). Page numérotée depuis 0.
 * L'API plafonne une réponse (1 000 lignes par défaut) : toute liste est paginée.
 */
export function plage(page: number, taille: number): [number, number] {
  if (!Number.isInteger(page) || page < 0) throw new RangeError('page invalide')
  if (!Number.isInteger(taille) || taille < 1 || taille > 1000) {
    throw new RangeError('taille invalide (1 à 1000)')
  }
  const debut = page * taille
  return [debut, debut + taille - 1]
}
