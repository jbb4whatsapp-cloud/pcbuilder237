/** Prix affiché : séparateur de milliers, devise après, jamais de décimales (document 07, section 2). */
export function formaterPrix(prix: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(prix)} FCFA`
}
