/** Prix affiché : séparateur de milliers, devise après, jamais de décimales (document 07, section 2). */
export function formaterPrix(prix: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(prix)} FCFA`
}

/** Un vrai nombre, ou null (les spécifications annoncées viennent d'un champ JSON libre). */
export function nombre(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
