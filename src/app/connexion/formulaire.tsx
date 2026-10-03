'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/db/browser'
import { mapError } from '@/lib/db/erreurs'
import { message } from '@/lib/messages'

export function FormulaireConnexion({ suite }: { suite: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnvoi(true)
    setErreur('')
    const { error } = await getBrowserClient().auth.signInWithPassword({
      email,
      password: motDePasse,
    })
    if (error) {
      setErreur(
        error.code === 'invalid_credentials'
          ? message('login.invalid')
          : message(mapError({ code: error.code, message: error.message, status: error.status }))
      )
      setEnvoi(false)
      return
    }
    router.replace(suite)
    router.refresh()
  }

  return (
    <form onSubmit={envoyer} className="carte space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          {message('login.email')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="mot-de-passe" className="block text-sm font-medium mb-1">
          {message('login.password')}
        </label>
        <input
          id="mot-de-passe"
          type="password"
          autoComplete="current-password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="w-full"
        />
      </div>
      {erreur && (
        <p role="alert" className="text-sm text-erreur">
          {erreur}
        </p>
      )}
      <button
        type="submit"
        disabled={envoi}
        className="bouton-principal w-full disabled:opacity-60"
      >
        {envoi ? message('login.submitting') : message('login.submit')}
      </button>
    </form>
  )
}
