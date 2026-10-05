"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Snackbar, type Notif } from '../../components/Snackbar'
import { getBrowserClient } from '../../lib/db/browser'
import { SELECT } from '../../lib/db/colonnes'
import { envoyerReleve, MAX_PHOTOS, type Dependances, type ResultatEnvoi } from '../../lib/agent/envoi'
import { chargerListes, nouveauClientRef, type OptionListe } from '../../lib/agent/listes'
import { compresserPhoto } from '../../lib/agent/photo'
import {
  photosRequises,
  validerSaisie,
  type CodeErreur,
  type ErreurLegere,
  type GarantieChoix,
  type Saisie,
} from '../../lib/agent/releve'
import { message } from '../../lib/messages'

// Textes absents de fr.json pour l'instant (à y déplacer plus tard).
const CONDITIONS = [
  { valeur: 'new', libelle: 'Neuf' },
  { valeur: 'refurbished', libelle: 'Reconditionné' },
  { valeur: 'used', libelle: 'Occasion' },
] as const
const T = {
  choisir: 'Choisir',
  chargement: 'Chargement des listes…',
  chargementEchec: 'Impossible de charger les listes. Rechargez la page.',
  corriger: 'Certains champs sont à corriger : ils sont signalés en rouge.',
  fermer: 'Fermer',
}

const GARANTIES: GarantieChoix[] = ['none', 'months', 'unspecified']
const SOURCES = ['machine', 'label'] as const
const SAISIE_VIDE: Saisie = {
  productId: '',
  shopId: '',
  condition: '',
  prix: '',
  enStock: false,
  garantieChoix: '',
  garantieMois: '',
  ram: '',
  stockage: '',
  cpu: '',
  configSource: '',
  batterie: '',
}

interface PhotoPrete {
  id: string
  blob: Blob
  url: string
}
type Phase = 'repos' | 'photos' | 'releve'

const champ: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 12,
  fontSize: 16, // 16 px : évite le zoom automatique sur iPhone
  boxSizing: 'border-box',
}
const bouton: CSSProperties = { ...champ, cursor: 'pointer', fontWeight: 600 }

/** Les erreurs du stockage et de la base n'ont pas la même forme : on les ramène à ErreurLegere. */
function versErreurLegere(e: { message: string; code?: string; statusCode?: string | number }): ErreurLegere {
  const sortie: Record<string, unknown> = { message: e.message }
  if (e.code !== undefined) sortie.code = e.code
  const n = Number(e.statusCode)
  if (e.statusCode !== undefined && Number.isFinite(n)) sortie.statusCode = n
  return sortie as unknown as ErreurLegere
}

function Champ(props: { id: string; label: string; aide?: string; erreur?: CodeErreur | 'photos'; children: ReactNode }) {
  const { id, label, aide, erreur, children } = props
  return (
    <div style={{ marginBottom: 20 }}>
      <label htmlFor={id} style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
        {label}
      </label>
      {children}
      {aide && <small style={{ display: 'block', marginTop: 4, opacity: 0.75 }}>{aide}</small>}
      {erreur && (
        <small role="alert" style={{ display: 'block', marginTop: 4, color: '#b00020' }}>
          {message(erreur === 'photos' ? 'agent_form.error.photos_manquantes' : `agent_form.error.${erreur}`)}
        </small>
      )}
    </div>
  )
}

export default function PageAgent() {
  const [listes, setListes] = useState<{ produits: OptionListe[]; boutiques: OptionListe[] } | null>(null)
  const [listesEchec, setListesEchec] = useState(false)

  const [saisie, setSaisie] = useState<Saisie>(SAISIE_VIDE)
  const [photos, setPhotos] = useState<PhotoPrete[]>([])
  const [clientRef, setClientRef] = useState(() => nouveauClientRef())
  const [tentative, setTentative] = useState(false)
  const [essais, setEssais] = useState(0) // compte les envois refusés par la validation

  const [compression, setCompression] = useState(false)
  const [phase, setPhase] = useState<Phase>('repos')
  const [progression, setProgression] = useState({ fait: 0, total: 0 })
  const [notif, setNotif] = useState<Notif | null>(null)
  const [echec, setEchec] = useState<{ detail: string } | null>(null)

  const formulaire = useRef<HTMLFormElement>(null)
  const entreePhoto = useRef<HTMLInputElement>(null)
  const photosRef = useRef<PhotoPrete[]>([])
  photosRef.current = photos

  const fermerNotif = useCallback(() => setNotif(null), [])
  const notifier = (type: Notif['type'], texte: string) => setNotif({ type, texte })

  useEffect(() => {
    let actif = true
    chargerListes(getBrowserClient())
      .then((l) => actif && setListes(l))
      .catch(() => actif && setListesEchec(true))
    return () => {
      actif = false
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [])

  // Après un envoi refusé par la validation : on amène la première erreur à l'écran.
  useEffect(() => {
    if (essais === 0) return
    formulaire.current?.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [essais])

  const erreurs = tentative ? validerSaisie(saisie) : {}
  const requises = photosRequises(saisie.condition)
  const photosManquantes = tentative && photos.length < requises
  const occupe = phase !== 'repos' || compression
  // Après un échec, les photos sont figées : le renvoi garde les mêmes chemins et le même client_ref.
  const photosFigees = echec !== null

  function maj<K extends keyof Saisie>(cle: K, valeur: Saisie[K]) {
    setSaisie((s) => ({ ...s, [cle]: valeur }))
  }

  async function ajouterPhoto(fichier: File | undefined) {
    if (!fichier || photos.length >= MAX_PHOTOS) return
    setCompression(true)
    try {
      const blob = await compresserPhoto(fichier)
      setPhotos((liste) => [...liste, { id: nouveauClientRef(), blob, url: URL.createObjectURL(blob) }])
    } catch {
      notifier('erreur', message('agent_form.error.photo_illisible'))
    } finally {
      setCompression(false)
    }
  }

  function retirerPhoto(id: string) {
    setPhotos((liste) => {
      liste.filter((p) => p.id === id).forEach((p) => URL.revokeObjectURL(p.url))
      return liste.filter((p) => p.id !== id)
    })
  }

  function dependances(client: ReturnType<typeof getBrowserClient>): Dependances {
    return {
      async televerser(chemin, photo) {
        const { error } = await client.storage
          .from('proofs')
          .upload(chemin, photo, { contentType: 'image/jpeg', upsert: false })
        return error ? versErreurLegere(error) : null
      },
      async inserer(ligne) {
        // Colonnes ouvertes seulement, jamais .select() sans argument.
        const { data, error } = await client.from('price_reports').insert(ligne).select(SELECT.reportInsertResult)
        const lignes = data as unknown as { status?: string }[] | null
        return { statut: lignes?.[0]?.status ?? null, erreur: error ? versErreurLegere(error) : null }
      },
    }
  }

  async function envoyer() {
    setNotif(null)
    setTentative(true)

    const saisieInvalide = Object.keys(validerSaisie(saisie)).length > 0
    const photosKo = photos.length < photosRequises(saisie.condition)
    if (saisieInvalide || photosKo) {
      setEssais((n) => n + 1)
      notifier('erreur', saisieInvalide ? T.corriger : message('agent_form.error.photos_manquantes'))
      return
    }

    setEchec(null)
    setPhase('photos')
    setProgression({ fait: 0, total: photos.length })

    let r: ResultatEnvoi
    try {
      const client = getBrowserClient()
      const { data } = await client.auth.getSession()
      const uid = data.session?.user.id
      if (!uid) throw new Error('session absente')
      r = await envoyerReleve(
        saisie,
        photos.map((p) => p.blob),
        uid,
        clientRef,
        dependances(client),
        (fait, total) => {
          setProgression({ fait, total })
          if (fait === total) setPhase('releve')
        }
      )
    } catch (e) {
      r = { ok: false, etape: 'photos', erreur: { message: e instanceof Error ? e.message : String(e) } }
    }
    setPhase('repos')

    if (!r.ok) {
      setEchec({ detail: r.erreur?.message ?? '' })
      notifier('erreur', message('agent_form.status.interrupted'))
      return
    }
    // Succès : on garde la boutique (l'agent relève plusieurs produits au même endroit),
    // on vide le reste et on prend un nouveau client_ref.
    photos.forEach((p) => URL.revokeObjectURL(p.url))
    setPhotos([])
    setSaisie({ ...SAISIE_VIDE, shopId: saisie.shopId })
    setClientRef(nouveauClientRef())
    setTentative(false)
    notifier(
      'succes',
      r.dejaEnvoye
        ? message('agent_form.status.already_sent')
        : [message('agent_form.status.sent'), r.statut ? message(`agent_form.status.${r.statut}`) : '']
            .filter(Boolean)
            .join(' ')
    )
  }

  const f = (cle: string) => `agent_form.${cle}`

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <Snackbar notif={notif} onClose={fermerNotif} />

      <h1>{message(f('title'))}</h1>

      {listesEchec && <p role="alert">{T.chargementEchec}</p>}
      {!listes && !listesEchec && <p>{T.chargement}</p>}

      {listes && (
        <form
          ref={formulaire}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (!occupe) void envoyer()
          }}
        >
          <Champ id="boutique" label={message(f('field.shop'))} aide={message(f('help.shop'))} erreur={erreurs.shopId}>
            <select id="boutique" style={champ} value={saisie.shopId} onChange={(e) => maj('shopId', e.target.value)}>
              <option value="">{T.choisir}</option>
              {listes.boutiques.map((o) => (
                <option key={o.id} value={o.id}>{o.libelle}</option>
              ))}
            </select>
          </Champ>

          <Champ id="produit" label={message(f('field.product'))} aide={message(f('help.product'))} erreur={erreurs.productId}>
            <select id="produit" style={champ} value={saisie.productId} onChange={(e) => maj('productId', e.target.value)}>
              <option value="">{T.choisir}</option>
              {listes.produits.map((o) => (
                <option key={o.id} value={o.id}>{o.libelle}</option>
              ))}
            </select>
          </Champ>

          <Champ id="etat" label={message(f('field.condition'))} aide={message(f('help.condition'))} erreur={erreurs.condition}>
            <select
              id="etat"
              style={champ}
              value={saisie.condition}
              onChange={(e) => maj('condition', e.target.value as Saisie['condition'])}
            >
              <option value="">{T.choisir}</option>
              {CONDITIONS.map((c) => (
                <option key={c.valeur} value={c.valeur}>{c.libelle}</option>
              ))}
            </select>
          </Champ>

          <Champ id="prix" label={message(f('field.price'))} aide={message(f('help.price'))} erreur={erreurs.prix}>
            <input id="prix" style={champ} inputMode="numeric" autoComplete="off" value={saisie.prix} onChange={(e) => maj('prix', e.target.value)} />
          </Champ>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600 }}>
              <input type="checkbox" checked={saisie.enStock} onChange={(e) => maj('enStock', e.target.checked)} />{' '}
              {message(f('field.in_stock'))}
            </label>
            <small style={{ display: 'block', marginTop: 4, opacity: 0.75 }}>{message(f('help.in_stock'))}</small>
          </div>

          <fieldset style={{ marginBottom: 20 }}>
            <legend style={{ fontWeight: 600 }}>{message(f('field.warranty'))}</legend>
            {GARANTIES.map((g) => (
              <label key={g} style={{ display: 'block', padding: '6px 0' }}>
                <input type="radio" name="garantie" checked={saisie.garantieChoix === g} onChange={() => maj('garantieChoix', g)} />{' '}
                {message(f(`warranty_choice.${g}`))}
              </label>
            ))}
            <small style={{ display: 'block', opacity: 0.75 }}>{message(f('help.warranty'))}</small>
            {erreurs.garantieChoix && (
              <small role="alert" style={{ display: 'block', color: '#b00020' }}>{message(f(`error.${erreurs.garantieChoix}`))}</small>
            )}
          </fieldset>

          {saisie.garantieChoix === 'months' && (
            <Champ id="mois" label={message(f('field.warranty_months'))} erreur={erreurs.garantieMois}>
              <input id="mois" style={champ} inputMode="numeric" value={saisie.garantieMois} onChange={(e) => maj('garantieMois', e.target.value)} />
            </Champ>
          )}

          <Champ id="ram" label={message(f('field.ram'))} aide={message(f('help.ram'))} erreur={erreurs.ram}>
            <input id="ram" style={champ} inputMode="numeric" value={saisie.ram} onChange={(e) => maj('ram', e.target.value)} />
          </Champ>

          <Champ id="stockage" label={message(f('field.storage'))} aide={message(f('help.storage'))} erreur={erreurs.stockage}>
            <input id="stockage" style={champ} inputMode="numeric" value={saisie.stockage} onChange={(e) => maj('stockage', e.target.value)} />
          </Champ>

          <Champ id="cpu" label={message(f('field.cpu'))} aide={message(f('help.cpu'))} erreur={erreurs.cpu}>
            <input id="cpu" style={champ} autoComplete="off" value={saisie.cpu} onChange={(e) => maj('cpu', e.target.value)} />
          </Champ>

          <fieldset style={{ marginBottom: 20 }}>
            <legend style={{ fontWeight: 600 }}>{message(f('field.config_source'))}</legend>
            {SOURCES.map((s) => (
              <label key={s} style={{ display: 'block', padding: '6px 0' }}>
                <input type="radio" name="source" checked={saisie.configSource === s} onChange={() => maj('configSource', s)} />{' '}
                {message(f(`config_choice.${s}`))}
              </label>
            ))}
            <small style={{ display: 'block', opacity: 0.75 }}>{message(f('help.config_source'))}</small>
            {erreurs.configSource && (
              <small role="alert" style={{ display: 'block', color: '#b00020' }}>{message(f(`error.${erreurs.configSource}`))}</small>
            )}
          </fieldset>

          <Champ id="batterie" label={message(f('field.battery'))} aide={message(f('help.battery'))} erreur={erreurs.batterie}>
            <input id="batterie" style={champ} inputMode="numeric" value={saisie.batterie} onChange={(e) => maj('batterie', e.target.value)} />
          </Champ>

          <Champ
            id="photos"
            label={message(f('field.proofs'))}
            aide={message(f(requises === 1 ? 'help.proofs_new' : 'help.proofs_used'))}
            erreur={photosManquantes ? 'photos' : undefined}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {photos.map((p) => (
                <div key={p.id} style={{ width: 96 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" style={{ width: 96, height: 96, objectFit: 'cover', display: 'block' }} />
                  <button type="button" disabled={occupe || photosFigees} onClick={() => retirerPhoto(p.id)} style={{ width: '100%', fontSize: 12, padding: 6 }}>
                    {message(f('action.remove_photo'))}
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={entreePhoto}
              id="photos"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const fichier = e.target.files?.[0]
                e.target.value = '' // permet de rechoisir le même fichier
                void ajouterPhoto(fichier)
              }}
            />
            <button
              type="button"
              style={bouton}
              disabled={occupe || photosFigees || photos.length >= MAX_PHOTOS}
              onClick={() => entreePhoto.current?.click()}
            >
              {message(f('action.add_photo'))}
            </button>
            {compression && <small role="status" style={{ display: 'block', marginTop: 4 }}>{message(f('status.compressing'))}</small>}
          </Champ>

          {phase !== 'repos' && (
            <p role="status">
              {phase === 'photos'
                ? `${message(f('status.uploading'))} ${progression.fait}/${progression.total}`
                : message(f('status.saving'))}
            </p>
          )}

          {echec && (
            <div role="alert" style={{ padding: 12, marginBottom: 20, border: '1px solid #b00020' }}>
              <strong>{message(f('status.interrupted'))}</strong>
              {echec.detail && <small style={{ display: 'block', marginTop: 4, opacity: 0.7 }}>{echec.detail}</small>}
            </div>
          )}

          <button type="submit" style={bouton} disabled={occupe}>
            {message(f('action.submit'))}
          </button>
        </form>
      )}
    </main>
  )
}
