/**
 * Durées de cache en secondes : propositions du document 09, section 9.
 * Décision D11 encore ❓ : à confirmer avant la production.
 */
export const REVALIDATE = {
  accueil: 600,
  pages: 300,
  geographie: 86400,
  aucun: 0,
} as const
