"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Snackbar, type Notif } from '../../../components/Snackbar'
import { chargerSignalements, traiter, type FileSignalements, type Traitement } from '../../../lib/admin/signalements'
import { getBrowserClient } from '../../../lib/db/browser'
import type { FlagRow } from '../../../lib/db/types'
import { message } from '../../../lib/messages'

const bouton: CSSProperties = { display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box', cursor: 'pointer', fontWeight: 600 }

const t = (cle: string, variables?: Record<string, string | number>) => message(`moderation_flags.${cle}`, variables)

function Ligne({ nom, valeur }: { nom: string; valeur: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
      <dt style={{ fontWeight: 600, minWidth: 140 }}>{nom}</dt>
      <dd style={{ margin: 0 }}>{valeur}</dd>
    </div>
  )
}

function CarteSignalement(props: {
  s: FlagRow
  file: FileSignalements
  occupe: boolean
  onTraiter: (id: string, tr: Traitement) => void
}) {
  const { s, file, occupe, onTraiter } = props
  const releve = s.report_id ? file.releves.get(s.report_id) : undefined
  const nomBoutique = (id: string) => file.boutiques.get(id) ?? message('moderation.unknown_shop', { id: id.slice(0, 8) })

  return (
    <article style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>{s.report_id ? t('target_report') : t('target_shop')}</h2>

      <dl style={{ margin: 0 }}>
        {s.shop_id && <Ligne nom={t('label.shop')} valeur={nomBoutique(s.shop_id)} />}
        {s.report_id && !releve && <Ligne nom={t('label.price')} valeur={t('report_missing')} />}
        {releve && (
          <>
            <Ligne
              nom={message('moderation.label.product')}
              valeur={file.produits.get(releve.product_id) ?? message('moderation.unknown_product', { id: releve.product_id.slice(0, 8) })}
            />
            <Ligne nom={t('label.shop')} valeur={nomBoutique(releve.shop_id)} />
            <Ligne nom={t('label.condition')} valeur={message(`condition.${releve.condition}`)} />
            <Ligne nom={t('label.price')} valeur={`${new Intl.NumberFormat('fr-FR').format(releve.price_fcfa)} FCFA`} />
            <Ligne nom={t('label.report_status')} valeur={t(`report_status.${releve.status}`)} />
          </>
        )}
        <Ligne nom={t('label.sent_at')} valeur={new Date(s.created_at).toLocaleString('fr-FR')} />
      </dl>

      <p style={{ fontWeight: 600, marginBottom: 4 }}>{t('label.reason')}</p>
      <p style={{ marginTop: 0, whiteSpace: 'pre-wrap' }}>{s.reason}</p>
      {s.report_id && <small style={{ display: 'block', opacity: 0.8 }}>{t('hint')}</small>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" style={bouton} disabled={occupe} onClick={() => onTraiter(s.id, 'reviewed')}>
          {t('action.reviewed')}
        </button>
        <button type="button" style={bouton} disabled={occupe} onClick={() => onTraiter(s.id, 'dismissed')}>
          {t('action.dismissed')}
        </button>
      </div>
    </article>
  )
}

export default function PageSignalements() {
  const [file, setFile] = useState<FileSignalements | null>(null)
  const [chargement, setChargement] = useState(true)
  const [echec, setEchec] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [notif, setNotif] = useState<Notif | null>(null)
  const fermerNotif = useCallback(() => setNotif(null), [])

  const charger = useCallback(async () => {
    setChargement(true)
    setEchec(false)
    try {
      setFile(await chargerSignalements(getBrowserClient()))
    } catch {
      setEchec(true)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  async function agir(id: string, tr: Traitement) {
    setOccupe(true)
    setNotif(null)
    const r = await traiter(getBrowserClient(), id, tr)
    setOccupe(false)
    if (!r.ok) {
      setNotif({ type: 'erreur', texte: message(r.cle) })
      if (r.cle === 'moderation.already_handled') void charger()
      return
    }
    setFile((f) => (f ? { ...f, signalements: f.signalements.filter((x) => x.id !== id) } : f))
    setNotif({ type: 'succes', texte: t(`done.${tr}`) })
  }

  const n = file?.signalements.length ?? 0

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Snackbar notif={notif} onClose={fermerNotif} />

      <p><Link href="/admin">{t('back')}</Link></p>
      <h1>{t('title')}</h1>

      {echec && <p role="alert">{t('load_failed')}</p>}
      {chargement && !file && <p>{t('loading')}</p>}

      {file && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
            <strong>{n === 1 ? t('open_one') : t('open_many', { n })}</strong>
            <button type="button" disabled={occupe || chargement} onClick={() => void charger()} style={{ padding: '8px 12px', cursor: 'pointer' }}>
              {t('refresh')}
            </button>
          </div>

          {n === 0 && <p>{t('empty')}</p>}

          {file.signalements.map((s) => (
            <CarteSignalement key={s.id} s={s} file={file} occupe={occupe} onTraiter={(id, tr) => void agir(id, tr)} />
          ))}
        </>
      )}
    </main>
  )
}
