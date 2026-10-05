"use client"

import { useEffect } from 'react'

export interface Notif {
  type: 'succes' | 'erreur'
  texte: string
}

const DUREE_CONFIRMATION_MS = 6000

/**
 * Bande fixe en haut de l'écran : visible sans défiler.
 * Confirmation : disparaît seule. Erreur : reste jusqu'à la fermeture ou à l'action suivante.
 */
export function Snackbar(props: { notif: Notif | null; onClose: () => void; fermer?: string }) {
  const { notif, onClose, fermer = 'Fermer' } = props

  useEffect(() => {
    if (!notif || notif.type !== 'succes') return
    const minuteur = setTimeout(onClose, DUREE_CONFIRMATION_MS)
    return () => clearTimeout(minuteur)
  }, [notif, onClose])

  if (!notif) return null
  const ok = notif.type === 'succes'
  return (
    <div
      role={ok ? 'status' : 'alert'}
      aria-live={ok ? 'polite' : 'assertive'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 8px 0',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: 480,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 8,
          background: ok ? '#1b5e20' : '#b00020',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ flex: 1, fontWeight: 600 }}>{notif.texte}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={fermer}
          style={{ background: 'transparent', color: '#ffffff', border: '1px solid #ffffff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
        >
          {fermer}
        </button>
      </div>
    </div>
  )
}
