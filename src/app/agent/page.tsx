"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AgentPage(){
  const [countries,setCountries]=useState<any[]>([])
  const [cities,setCities]=useState<any[]>([])
  const [hoods,setHoods]=useState<any[]>([])
  const [shops,setShops]=useState<any[]>([])
  const [models,setModels]=useState<any[]>([])
  const [cId,setCId]=useState(''); const [cityId,setCityId]=useState(''); const [hoodId,setHoodId]=useState('')
  const [shopId,setShopId]=useState(''); const [modelId,setModelId]=useState(''); const [price,setPrice]=useState(''); const [phone,setPhone]=useState('699000000'); const [msg,setMsg]=useState('')

  useEffect(()=>{
    supabase.from('countries').select('*').then(r=>setCountries(r.data||[]))
    supabase.from('models').select('*').then(r=>setModels(r.data||[]))
  },[])
  useEffect(()=>{ if(cId) supabase.from('cities').select('*').eq('country_id',cId).then(r=>setCities(r.data||[])) },[cId])
  useEffect(()=>{ if(cityId) supabase.from('neighborhoods').select('*').eq('city_id',cityId).then(r=>setHoods(r.data||[])) },[cityId])
  useEffect(()=>{ if(hoodId) supabase.from('shops').select('*').eq('neighborhood_id',hoodId).then(r=>setShops(r.data||[])) },[hoodId])

  const submit = async ()=>{
    setMsg('Envoi...')
    let {data: agent} = await supabase.from('agents').select('*').eq('phone',phone).single()
    if(!agent){ const {data}= await supabase.from('agents').insert({phone, full_name:'Agent '+phone}).select().single(); agent=data }
    const {error}= await supabase.from('price_reports').insert({shop_id:shopId, model_id:modelId, price:parseInt(price), agent_id:agent?.id})
    if(error) setMsg('Erreur: '+error.message); else { setMsg(`✅ ${price} FCFA ajouté!`); setPrice('') }
  }

  return (
    <div className="min-h-screen bg-white p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Agent PCBuilder 237 🤳</h1>
      <div className="mt-4 space-y-3">
        <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full h-[48px] px-4 border"/>
        <select value={cId} onChange={e=>setCId(e.target.value)} className="w-full h-[48px] px-4 border"><option value="">Pays</option>{countries.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={cityId} onChange={e=>setCityId(e.target.value)} className="w-full h-[48px] px-4 border"><option value="">Ville ({cities.length})</option>{cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={hoodId} onChange={e=>setHoodId(e.target.value)} className="w-full h-[48px] px-4 border"><option value="">Quartier ({hoods.length})</option>{hoods.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select>
        <select value={shopId} onChange={e=>setShopId(e.target.value)} className="w-full h-[48px] px-4 border bg-yellow-50"><option value="">Boutique ({shops.length})</option>{shops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={modelId} onChange={e=>setModelId(e.target.value)} className="w-full h-[48px] px-4 border"><option value="">Modèle</option>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="185000" className="w-full h-[52px] px-4 border-2 border-black font-bold"/>
        <button onClick={submit} disabled={!shopId||!modelId||!price} className="w-full h-[56px] bg-black text-white font-bold disabled:bg-gray-300">Envoyer prix →</button>
        {msg && <div className="p-3 bg-green-50 border text-sm">{msg}</div>}
      </div>
      <a href="/" className="block mt-6 text-center underline text-sm">← Comparateur</a>
    </div>
  )
}