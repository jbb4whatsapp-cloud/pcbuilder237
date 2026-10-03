import type { CurrentPriceRow } from '../db/types'
import { message } from '../messages'
import { nombre } from './affichage'
import { dateCourte } from './dates'
import { prixPourMessage } from './whatsapp'

/** Message WhatsApp pré-rempli pour une ligne de prix (document 07, section 5.2). */
export function messageProduit(l: CurrentPriceRow, avecAlerte: boolean): string {
  const ram = nombre(l.reported_specs?.ram_gb)
  const stockage = nombre(l.reported_specs?.storage_gb)
  const batterie = nombre(l.reported_specs?.battery_health_pct)

  const config =
    ram !== null && stockage !== null ? message('whatsapp.config', { ram, storage: stockage }) : ''

  let extras = ''
  if (l.warranty_months !== null && l.warranty_months > 0) {
    extras += message('whatsapp.warranty', { months: l.warranty_months })
  }
  if (l.condition !== 'new' && batterie !== null) {
    extras += message('whatsapp.battery', { pct: batterie })
  }

  return message('whatsapp.single_product', {
    product: `${l.brand} ${l.product_name}`,
    condition: message(`condition.${l.condition}`).toLowerCase(),
    config,
    price: prixPourMessage(l.price_fcfa),
    date: dateCourte(l.reported_at),
    extras,
    question: message(avecAlerte ? 'whatsapp.question_confirm_specs' : 'whatsapp.question_available'),
  })
}
