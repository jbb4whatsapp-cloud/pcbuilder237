import fr from '../../messages/fr.json'

/** Texte d'une clé de fr.json (« error.network »), avec variables {nom}. Clé inconnue : la clé elle-même. */
export function message(cle: string, variables: Record<string, string | number> = {}): string {
  let noeud: unknown = fr
  for (const partie of cle.split('.')) {
    if (noeud && typeof noeud === 'object' && partie in noeud) {
      noeud = (noeud as Record<string, unknown>)[partie]
    } else {
      return cle
    }
  }
  if (typeof noeud !== 'string') return cle
  return noeud.replace(/\{(\w+)\}/g, (m, nom: string) => (nom in variables ? String(variables[nom]) : m))
}
