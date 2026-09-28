"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage(){
  const [countries, setCountries] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [shops, setShops] = useState<any[]>([])

  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedZone, setSelectedZone] = useState("")

  // 1. Charger les pays au début
  useEffect(()=>{
    supabase.from('cities').select('country, country_code').then(({data})=>{
      const unique = [...new Map(data?.map(c=>[c.country_code, c])||[]).values()]
      setCountries(unique)
    })
  },[])

  // 2. Quand pays change -> charger villes
  useEffect(()=>{
    if(!selectedCountry) return
    supabase.from('cities').select('*').eq('country_code', selectedCountry).then(({data})=> setCities(data||[]))
    setSelectedCity(""); setSelectedZone(""); setZones([]); setShops([])
  },[selectedCountry])

  // 3. Quand ville change -> charger quartiers
  useEffect(()=>{
    if(!selectedCity) return
    supabase.from('zones').select('*').eq('city_id', selectedCity).then(({data})=> setZones(data||[]))
    setSelectedZone(""); setShops([])
  },[selectedCity])

  // 4. Quand quartier change -> charger boutiques + prix
  useEffect(()=>{
    if(!selectedZone) return
    supabase.from('shops').select(`
      *, price_reports!inner(price, is_verified, models(name))
    `).eq('zone_id', selectedZone).eq('price_reports.is_verified', true)
   .then(({data})=> setShops(data||[]))
  },[selectedZone])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">PC Builder 237 🖥️</h1>
      <p className="opacity-60">Pays → Ville → Quartier → Boutiques (10 000 ready)</p>

      <div className="grid grid-cols-3 gap-2 mt-6">
        <select value={selectedCountry} onChange={e=>setSelectedCountry(e.target.value)} className="border p-3">
          <option value="">Pays</option>
          {countries.map(c=> <option key={c.country_code} value={c.country_code}>{c.country}</option>)}
        </select>

        <select value={selectedCity} onChange={e=>setSelectedCity(e.target.value)} className="border p-3" disabled={!selectedCountry}>
          <option value="">Ville</option>
          {cities.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={selectedZone} onChange={e=>setSelectedZone(e.target.value)} className="border p-3" disabled={!selectedCity}>
          <option value="">Quartier</option>
          {zones.map(z=> <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {shops.map(shop=>(
          <div key={shop.id} className="border p-4 rounded-lg">
            <h3 className="font-bold">{shop.name}</h3>
            <p className="text-sm opacity-60">{shop.phone}</p>
            <div className="mt-2">
              {shop.price_reports?.map((p:any,i:number)=>(
                <div key={i} className="flex justify-between text-sm">
                  <span>{p.models.name}</span><b>{p.price.toLocaleString()} FCFA</b>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedZone && shops.length===0 && <p className="mt-8 text-center opacity-50">Aucune boutique vérifiée dans ce quartier pour l'instant.</p>}
    </div>
  )
}