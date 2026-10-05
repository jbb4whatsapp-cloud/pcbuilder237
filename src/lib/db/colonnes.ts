/**
 * Liste des colonnes de chaque lecture : écrite UNE fois, ici (document 09, principe 2).
 * Jamais de chaîne de colonnes recopiée dans une page.
 */
const joindre = (colonnes: readonly string[]) => colonnes.join(',')

export const COLONNES = {
  // check_reason est absent : il n'existe plus dans la vue (patch contrat de données, C3).
  currentPrices: [
    'report_id', 'product_id', 'shop_id', 'condition', 'price_fcfa', 'in_stock',
    'warranty_months', 'reported_specs', 'check_level', 'reported_at', 'category',
    'brand', 'product_name', 'product_specs', 'shop_name', 'shop_phone',
    'neighborhood_id', 'shop_verified', 'source', 'shop_subscribed',
    'shop_contactable', 'check_codes', 'city_id', 'config_hash',
  ],
  shopsPublic: [
    'id', 'name', 'neighborhood_id', 'address', 'status', 'is_verified',
    'offers_assembly', 'assembly_fee_fcfa', 'opening_hours', 'created_at',
    'phone', 'contactable', 'subscribed', 'city_id',
  ],
  // Jamais les colonnes d'audit (created_by, reviewed_by, review_note) : risque R6.
  products: ['id', 'category', 'brand', 'name', 'specs'],
  countries: ['id', 'name'],
  cities: ['id', 'country_id', 'name'],
  neighborhoods: ['id', 'city_id', 'name'],
  // Seules colonnes de la table price_reports lisibles par tous.
  reportsOpen: [
    'id', 'product_id', 'shop_id', 'condition', 'price_fcfa', 'in_stock',
    'warranty_months', 'reported_specs', 'config_hash', 'check_level',
    'check_codes', 'status', 'source', 'reported_at',
  ],
  // Relue après une insertion : colonnes ouvertes seulement.
  reportInsertResult: ['id', 'status', 'check_level', 'check_codes'],
  // Vue des ayants droit : auteur, propriétaire de la boutique, personnel.
  reportsVisible: [
    'id', 'product_id', 'shop_id', 'condition', 'price_fcfa', 'in_stock',
    'warranty_months', 'reported_specs', 'config_hash', 'proof_paths',
    'check_level', 'check_reason', 'check_codes', 'status', 'source',
    'reported_by', 'reported_at', 'reviewed_by', 'reviewed_at', 'review_note',
    'client_ref',
  ],
  // Signalements : jamais created_by (audit, risque R6).
  flags: ['id', 'shop_id', 'report_id', 'reason', 'status', 'created_at'],
  // Demandes de boutique : jamais requested_by ni handled_by (audit).
  shopRequests: [
    'id', 'name', 'neighborhood_id', 'address', 'phone', 'note', 'status',
    'shop_id', 'handled_at', 'handled_note', 'created_at',
  ],
} as const

export const SELECT = {
  currentPrices: joindre(COLONNES.currentPrices),
  shopsPublic: joindre(COLONNES.shopsPublic),
  products: joindre(COLONNES.products),
  countries: joindre(COLONNES.countries),
  cities: joindre(COLONNES.cities),
  neighborhoods: joindre(COLONNES.neighborhoods),
  reportsOpen: joindre(COLONNES.reportsOpen),
  reportInsertResult: joindre(COLONNES.reportInsertResult),
  reportsVisible: joindre(COLONNES.reportsVisible),
  flags: joindre(COLONNES.flags),
  shopRequests: joindre(COLONNES.shopRequests),
} as const
