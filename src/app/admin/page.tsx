"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Admin(){
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [quartierId, setQuartierId] = useState('07b45be1-683f-44b7-8d66-5a506ac88c12')
  const [msg, setMsg] = useState('')

  async function addShop(){
    const { error } = await supabase.from('shops').insert({
      name, phone, neighborhood_id: quartierId
    })
    if(error) setMsg('Erreur: '+error.message)
    else { setMsg('✅ Boutique ajoutée !'); setName(''); setPhone('') }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Ajouter une boutique</h1>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom boutique ex: Etok Informatique Mokolo" className="w-full p-3 border mb-3" />
      <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="WhatsApp +237699314077" className="w-full p-3 border mb-3" />
      <button onClick={addShop} className="w-full bg-black text-white p-3">Ajouter</button>
      <p className="mt-4">{msg}</p>
    </div>
  )
}