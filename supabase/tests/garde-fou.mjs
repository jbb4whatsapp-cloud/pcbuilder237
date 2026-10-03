// Refuse de lancer les tests sur un projet qui n'est pas la base de test.
const INTERDITS = ['qvgrltdvxcfuwyucmdcu'] // projet du site en ligne

const url = process.env.TEST_SUPABASE_URL ?? ''
const ref = (url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/) ?? [])[1]

if (!ref) {
  console.error('Refus : TEST_SUPABASE_URL est absente ou invalide.')
  process.exit(2)
}
if (INTERDITS.includes(ref)) {
  console.error(`Refus : ${ref} est un projet du site, pas la base de test.`)
  process.exit(2)
}
