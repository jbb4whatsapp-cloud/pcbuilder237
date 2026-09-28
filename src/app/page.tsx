"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage(){
  const [countries, setCountries] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [hoods, setHoods] = useState<any[]>([])

  const [cId, setCId] = useState('')
  const [cityId, setCityId] = useState('')
  const [hoodId, setHoodId] = useState('')

  useEffect(()=>{
    supabase.from('countries').select('*').then(({data})=> setCountries(data||[]))
  },[])

  useEffect(()=>{
    if(!cId){ setCities([]); return }
    supabase.from('cities').select('*').eq('country_id', cId).then(({data})=> setCities(data||[]))
    setCityId(''); setHoods([]); setHoodId('')
  },[cId])

  useEffect(()=>{
    if(!cityId){ setHoods([]); return }
    supabase.from('neighborhoods').select('*').eq('city_id', cityId).then(({data})=> setHoods(data||[]))
    setHoodId('')
  },[cityId])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* HEADER EXACTEMENT COMME L'IMAGE */}
        <h1 className="text-[32px] font-bold tracking-tight">PC Builder 237 <span className="ml-2">🖥️</span></h1>
        <p className="text-gray-500 text-[16px] mt-1 mb-8">Pays → Ville → Quartier → Boutiques (10 000 ready)</p>

        {/* 3 SELECTS EN LIGNE COMME L'IMAGE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={cId}
            onChange={e=>setCId(e.target.value)}
            className="w-full h-[52px] px-4 border border-gray-200 bg-white outline-none focus:border-black text-[16px]"
          >
            <option value="">Pays</option>
            {countries.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={cityId}
            onChange={e=>setCityId(e.target.value)}
            disabled={!cId}
            className="w-full h-[52px] px-4 border border-gray-200 bg-white outline-none focus:border-black text-[16px] disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Ville</option>
            {cities.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={hoodId}
            onChange={e=>setHoodId(e.target.value)}
            disabled={!cityId}
            className="w-full h-[52px] px-4 border border-gray-200 bg-white outline-none focus:border-black text-[16px] disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Quartier</option>
            {hoods.map(h=> <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        {/* Petit feedback vert si sélectionné */}
        {hoodId && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-800">
            ✅ {countries.find(c=>c.id===cId)?.name} → {cities.find(c=>c.id===cityId)?.name} → {hoods.find(h=>h.id===hoodId)?.name} prêt pour les boutiques
          </div>
        )}
      </div>
    </div>
  )
}