/**
 * Compression des photos de preuve, côté téléphone (document 09, section 17, point 10).
 * Le bucket « proofs » refuse tout fichier de plus de 5 Mo et n'accepte que JPEG, PNG et WebP.
 * Redessiner l'image dans un canvas puis l'exporter en JPEG supprime aussi les données EXIF
 * (position, modèle de téléphone). Valeurs de départ : à valider sur un vrai téléphone,
 * en connexion lente.
 */

export const COTE_MAX = 1600
export const QUALITES = [0.8, 0.65, 0.5] as const
export const CIBLE_OCTETS = 1_000_000
export const LIMITE_OCTETS = 5_242_880

/** Dimensions après réduction : proportions conservées, jamais sous 1 pixel. */
export function dimensionsCibles(
  largeur: number,
  hauteur: number,
  coteMax: number = COTE_MAX
): { largeur: number; hauteur: number } {
  if (!(largeur > 0) || !(hauteur > 0)) throw new Error('dimensions invalides')
  const plusGrand = Math.max(largeur, hauteur)
  if (plusGrand <= coteMax) return { largeur: Math.round(largeur), hauteur: Math.round(hauteur) }
  const k = coteMax / plusGrand
  return {
    largeur: Math.max(1, Math.round(largeur * k)),
    hauteur: Math.max(1, Math.round(hauteur * k)),
  }
}

async function ouvrir(fichier: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(fichier, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(fichier)
  }
}

/** Navigateur seulement. Lève une erreur si la photo est illisible ou reste trop lourde. */
export async function compresserPhoto(fichier: Blob): Promise<Blob> {
  const image = await ouvrir(fichier)
  try {
    const { largeur, hauteur } = dimensionsCibles(image.width, image.height)
    const canvas = document.createElement('canvas')
    canvas.width = largeur
    canvas.height = hauteur
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas indisponible')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, largeur, hauteur)
    ctx.drawImage(image, 0, 0, largeur, hauteur)

    let dernier: Blob | null = null
    for (const qualite of QUALITES) {
      const blob = await new Promise<Blob | null>((fin) => canvas.toBlob(fin, 'image/jpeg', qualite))
      if (!blob) throw new Error('export impossible')
      dernier = blob
      if (blob.size <= CIBLE_OCTETS) return blob
    }
    if (dernier && dernier.size <= LIMITE_OCTETS) return dernier
    throw new Error('photo trop lourde')
  } finally {
    image.close()
  }
}
