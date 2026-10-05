"use client"

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Snackbar, type Notif } from '../../components/Snackbar'
import { chargerFile, decider, noteRejetValide, type Decision, type FileReleves } from '../../lib/admin/releves'
import { getBrowserClient } from '../../lib/db/browser'
import type { ReportedSpecs, ReportVisibleRow } from '../../lib/db/types'
import { message } from '../../lib/messages'

const MODELES_NOTE = [
  'photo_unreadable',
  'photo_unrelated',
  'config_incoherent',
  'price_unrealistic',
  'duplicate',
  'wrong_target',
] as const

const COULEUR_NIVEAU = { ok: '#1b5e20', suspect: '#b26a00', impossible: '#b00020' } as const

const champ: CSSProperties = { display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }
const bouton: CSSProperties = { ...champ, cursor: 'pointer', fontWeight: 600 }

const t = (cle: string, variables?: Record<string, string | number>) => message(`moderation.${cle}`, variables)

function texteGarantie(mois: number | null): string {
  if (mois === null) return t('warranty_unknown')
  if (mois === 0) return t('warranty_none')
  return t('warranty_months', { n: mois })
}

/** Liens temporaires vers les photos de preuve (le bucket est privé). Une photo illisible donne null. */
async function lirePhotos(chemins: string[]): Promise<(string | null)[]> {
  const { data } = await getBrowserClient().storage.from('proofs').createSignedUrls(chemins, 3600)
  const liens = new Map<string, string>()
  for (const d of data ?? []) {
    if (d.path && d.signedUrl) liens.set(d.path, d.signedUrl)
  }
  return chemins.map((c) => liens.get(c) ?? null)
}

/** Photos de preuve. Un clic ouvre la photo en grand. */
function Preuves({ chemins }: { chemins: string[] }) {
  const cle = chemins.join('|')
  const [urls, setUrls] = useState<(string | null)[] | null>(null)

  useEffect(() => {
    let actif = true
    const liste = cle ? cle.split('|') : []
    if (liste.length === 0) {
      setUrls([])
      return
    }
    lirePhotos(liste)
      .then((liens) => actif && setUrls(liens))
      .catch(() => actif && setUrls(liste.map(() => null)))
    return () => {
      actif = false
    }
  }, [cle])

  if (urls === null) return <small>…</small>
  if (urls.length === 0) return <small>{t('photos_none')}</small>
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {urls.map((url, i) =>
        url ? (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={t('photo', { n: i + 1 })} style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }} />
          </a>
        ) : (
          <small key={i}>{t('photo_unavailable')}</small>
        )
      )}
    </div>
  )
}

function CarteReleve(props: {
  r: ReportVisibleRow
  produit: string
  boutique: string
  occupe: boolean
  onDecider: (id: string, d: Decision) => void
}) {
  const { r, produit, boutique, occupe, onDecider } = props
  const [rejet, setRejet] = useState(false)
  const [note, setNote] = useState('')
  const [manque, setManque] = useState(false)
  const specs: ReportedSpecs = r.reported_specs ?? {}

  const lignes: [string, string][] = [
    [t('label.shop'), boutique],
    [t('label.condition'), message(`condition.${r.condition}`)],
    [t('label.price'), `${new Intl.NumberFormat('fr-FR').format(r.price_fcfa)} FCFA`],
    [t('label.stock'), r.in_stock ? t('in_stock') : t('out_stock')],
    [t('label.warranty'), texteGarantie(r.warranty_months)],
  ]
  if (specs.ram_gb !== undefined) lignes.push([t('label.ram'), t('gb', { n: specs.ram_gb })])
  if (specs.storage_gb !== undefined) lignes.push([t('label.storage'), t('gb', { n: specs.storage_gb })])
  if (specs.cpu) lignes.push([t('label.cpu'), specs.cpu])
  if (specs.battery_health_pct !== undefined) lignes.push([t('label.battery'), t('percent', { n: specs.battery_health_pct })])
  lignes.push([t('label.source'), t(`source.${r.source}`)])
  lignes.push([t('label.reported_at'), new Date(r.reported_at).toLocaleString('fr-FR')])

  function confirmerRejet() {
    if (!noteRejetValide(note)) {
      setManque(true)
      return
    }
    setManque(false)
    onDecider(r.id, { action: 'rejeter', note })
  }

  return (
    <article style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>{produit}</h2>

      <dl style={{ margin: 0 }}>
        {lignes.map(([nom, valeur]) => (
          <div key={nom} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
            <dt style={{ fontWeight: 600, minWidth: 140 }}>{nom}</dt>
            <dd style={{ margin: 0 }}>{valeur}</dd>
          </div>
        ))}
      </dl>

      <p style={{ color: COULEUR_NIVEAU[r.check_level], fontWeight: 600, marginBottom: 4 }}>
        {t('label.level')} : {t(`level.${r.check_level}`)}
      </p>
      {r.check_reason && (
        <p style={{ marginTop: 0 }}>
          <small>{t('label.reason')} : {r.check_reason}</small>
        </p>
      )}

      <Preuves chemins={r.proof_paths ?? []} />

      {!rejet ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" style={bouton} disabled={occupe} onClick={() => onDecider(r.id, { action: 'publier' })}>
            {t('action.publish')}
          </button>
          <button type="button" style={bouton} disabled={occupe} onClick={() => setRejet(true)}>
            {t('action.reject')}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <small style={{ display: 'block', marginBottom: 8, opacity: 0.8 }}>{t('reject.help')}</small>
          <label htmlFor={`modele-${r.id}`} style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            {t('reject.models')}
          </label>
          <select
            id={`modele-${r.id}`}
            style={{ ...champ, marginBottom: 12 }}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setNote(t(`note_models.${e.target.value}`))
                setManque(false)
              }
            }}
          >
            <option value="">{t('reject.choose')}</option>
            {MODELES_NOTE.map((cle) => (
              <option key={cle} value={cle}>{t(`note_models.${cle}`)}</option>
            ))}
          </select>
          <label htmlFor={`note-${r.id}`} style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            {t('reject.note')}
          </label>
          <textarea
            id={`note-${r.id}`}
            style={{ ...champ, minHeight: 90 }}
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              setManque(false)
            }}
          />
          {manque && (
            <small role="alert" style={{ display: 'block', marginTop: 4, color: '#b00020' }}>{t('note_required')}</small>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" style={bouton} disabled={occupe} onClick={confirmerRejet}>
              {t('action.confirm_reject')}
            </button>
            <button type="button" style={bouton} disabled={occupe} onClick={() => { setRejet(false); setManque(false) }}>
              {t('action.cancel')}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default function PageModeration() {
  const [file, setFile] = useState<FileReleves | null>(null)
  const [chargement, setChargement] = useState(true)
  const [echec, setEchec] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [notif, setNotif] = useState<Notif | null>(null)
  const fermerNotif = useCallback(() => setNotif(null), [])

  const charger = useCallback(async () => {
    setChargement(true)
    setEchec(false)
    try {
      setFile(await chargerFile(getBrowserClient()))
    } catch {
      setEchec(true)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  async function traiter(id: string, d: Decision) {
    setOccupe(true)
    setNotif(null)
    const r = await decider(getBrowserClient(), id, d)
    setOccupe(false)
    if (!r.ok) {
      setNotif({ type: 'erreur', texte: message(r.cle) })
      if (r.cle === 'moderation.already_handled') void charger()
      return
    }
    setFile((f) => (f ? { ...f, releves: f.releves.filter((x) => x.id !== id) } : f))
    setNotif({ type: 'succes', texte: t(d.action === 'publier' ? 'done.published' : 'done.rejected') })
  }

  const n = file?.releves.length ?? 0

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Snackbar notif={notif} onClose={fermerNotif} />

      <h1>{t('title')}</h1>

      {echec && <p role="alert">{t('load_failed')}</p>}
      {chargement && !file && <p>{t('loading')}</p>}

      {file && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
            <strong>{n === 1 ? t('pending_one') : t('pending_many', { n })}</strong>
            <button type="button" disabled={occupe || chargement} onClick={() => void charger()} style={{ padding: '8px 12px', cursor: 'pointer' }}>
              {t('refresh')}
            </button>
          </div>

          {n === 0 && <p>{t('empty')}</p>}

          {file.releves.map((r) => (
            <CarteReleve
              key={r.id}
              r={r}
              produit={file.produits.get(r.product_id) ?? t('unknown_product', { id: r.product_id.slice(0, 8) })}
              boutique={file.boutiques.get(r.shop_id) ?? t('unknown_shop', { id: r.shop_id.slice(0, 8) })}
              occupe={occupe}
              onDecider={(id, d) => void traiter(id, d)}
            />
          ))}
        </>
      )}
    </main>
  )
}
