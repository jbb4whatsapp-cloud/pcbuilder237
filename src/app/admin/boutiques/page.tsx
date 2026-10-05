"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Snackbar, type Notif } from '../../../components/Snackbar'
import { chargerDemandes, creerBoutique, refuser, type FileDemandes } from '../../../lib/admin/demandes'
import { noteRejetValide } from '../../../lib/admin/releves'
import { getBrowserClient } from '../../../lib/db/browser'
import type { ShopRequestRow } from '../../../lib/db/types'
import { message } from '../../../lib/messages'

const MODELES_NOTE = ['duplicate', 'unclear', 'not_computer'] as const

const champ: CSSProperties = { display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }
const bouton: CSSProperties = { ...champ, cursor: 'pointer', fontWeight: 600 }

const t = (cle: string, variables?: Record<string, string | number>) => message(`moderation_shops.${cle}`, variables)

function Ligne({ nom, valeur }: { nom: string; valeur: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
      <dt style={{ fontWeight: 600, minWidth: 140 }}>{nom}</dt>
      <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{valeur}</dd>
    </div>
  )
}

function CarteDemande(props: {
  d: ShopRequestRow
  quartier: string | null
  occupe: boolean
  onCreer: (id: string) => void
  onRefuser: (id: string, note: string) => void
}) {
  const { d, quartier, occupe, onCreer, onRefuser } = props
  const [rejet, setRejet] = useState(false)
  const [note, setNote] = useState('')
  const [manque, setManque] = useState(false)
  const vide = t('not_given')

  function confirmer() {
    if (!noteRejetValide(note)) {
      setManque(true)
      return
    }
    setManque(false)
    onRefuser(d.id, note)
  }

  return (
    <article style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>{d.name}</h2>
      <dl style={{ margin: 0 }}>
        <Ligne nom={t('label.neighborhood')} valeur={quartier ?? vide} />
        <Ligne nom={t('label.address')} valeur={d.address || vide} />
        <Ligne nom={t('label.phone')} valeur={d.phone || vide} />
        <Ligne nom={t('label.note')} valeur={d.note || vide} />
        <Ligne nom={t('label.sent_at')} valeur={new Date(d.created_at).toLocaleString('fr-FR')} />
      </dl>
      <small style={{ display: 'block', marginTop: 8, opacity: 0.8 }}>{t('hint')}</small>

      {!rejet ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" style={bouton} disabled={occupe} onClick={() => onCreer(d.id)}>
            {t('action.create')}
          </button>
          <button type="button" style={bouton} disabled={occupe} onClick={() => setRejet(true)}>
            {message('moderation.action.reject')}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <small style={{ display: 'block', marginBottom: 8, opacity: 0.8 }}>{message('moderation.reject.help')}</small>
          <label htmlFor={`modele-${d.id}`} style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            {message('moderation.reject.models')}
          </label>
          <select
            id={`modele-${d.id}`}
            style={{ ...champ, marginBottom: 12 }}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setNote(t(`note_models.${e.target.value}`))
                setManque(false)
              }
            }}
          >
            <option value="">{message('moderation.reject.choose')}</option>
            {MODELES_NOTE.map((cle) => (
              <option key={cle} value={cle}>{t(`note_models.${cle}`)}</option>
            ))}
          </select>
          <label htmlFor={`note-${d.id}`} style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            {message('moderation.reject.note')}
          </label>
          <textarea
            id={`note-${d.id}`}
            style={{ ...champ, minHeight: 90 }}
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              setManque(false)
            }}
          />
          {manque && (
            <small role="alert" style={{ display: 'block', marginTop: 4, color: '#b00020' }}>
              {message('moderation.note_required')}
            </small>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" style={bouton} disabled={occupe} onClick={confirmer}>
              {message('moderation.action.confirm_reject')}
            </button>
            <button type="button" style={bouton} disabled={occupe} onClick={() => { setRejet(false); setManque(false) }}>
              {message('moderation.action.cancel')}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default function PageDemandesBoutique() {
  const [file, setFile] = useState<FileDemandes | null>(null)
  const [chargement, setChargement] = useState(true)
  const [echec, setEchec] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [notif, setNotif] = useState<Notif | null>(null)
  const fermerNotif = useCallback(() => setNotif(null), [])

  const charger = useCallback(async () => {
    setChargement(true)
    setEchec(false)
    try {
      setFile(await chargerDemandes(getBrowserClient()))
    } catch {
      setEchec(true)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  async function agir(id: string, action: () => Promise<{ ok: true } | { ok: false; cle: string }>, succes: string) {
    setOccupe(true)
    setNotif(null)
    const r = await action()
    setOccupe(false)
    if (!r.ok) {
      setNotif({ type: 'erreur', texte: message(r.cle) })
      if (r.cle === 'moderation.already_handled' || r.cle === 'error.pb025') void charger()
      return
    }
    setFile((f) => (f ? { ...f, demandes: f.demandes.filter((x) => x.id !== id) } : f))
    setNotif({ type: 'succes', texte: succes })
  }

  const n = file?.demandes.length ?? 0

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Snackbar notif={notif} onClose={fermerNotif} />

      <p><Link href="/admin">{message('moderation_flags.back')}</Link></p>
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

          {file.demandes.map((d) => (
            <CarteDemande
              key={d.id}
              d={d}
              quartier={d.neighborhood_id ? file.quartiers.get(d.neighborhood_id) ?? null : null}
              occupe={occupe}
              onCreer={(id) => void agir(id, () => creerBoutique(getBrowserClient(), id), t('done.created'))}
              onRefuser={(id, note) => void agir(id, () => refuser(getBrowserClient(), id, note), t('done.rejected'))}
            />
          ))}
        </>
      )}
    </main>
  )
}
