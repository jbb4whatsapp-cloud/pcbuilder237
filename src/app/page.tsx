"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function checkScam(report:any, model:any){
  if(!report.reported_ram ||!model) return { level: 'OK', reason: '' }
  if(report.reported_ram > model.max_ram){
    return { level: 'SCAM', reason: `IMPOSSIBLE: ${model.name} max ${model.max_ram}GB, annoncé ${report.reported_ram}GB` }
  }
  if(!model.allowed_rams.includes(report.reported_ram)){
    return { level: 'SUSPECT', reason: `Suspect: ${report.reported_ram}GB non-standard pour ${model.name}` }
  }
  return { level: 'OK', reason: `${report.reported_ram}GB / ${report.reported_storage}GB conforme` }
}

export default function HomePage(){
  const [countries,setCountries]=useState<any[]>([]); const [cities,setCities]=useState<any[]>([]); const [hoods,setHoods]=useState<any[]>([]); const [shops,setShops]=useState<any[]>([]); const [models,setModels]=useState<any[]>([]); const [reports,setReports]=useState<any[]>([])
  const [cId,setCId]=useState(''); const [cityId,setCityId]=useState(''); const [hoodId,setHoodId]=useState(''); const [modelId,setModelId]=useState('')

  useEffect(()=>{ supabase.from('countries').select('*').then(r=>setCountries(r.data||[])); supabase.from('models').select('*').then(r=>setModels(r.data||[])) },[])
  useEffect(()=>{ if(cId) supabase.from('cities').select('*').eq('country_id',cId).then(r=>setCities(r.data||[])) },[cId])
  useEffect(()=>{ if(cityId) supabase.from('neighborhoods').select('*').eq('city_id',cityId).then(r=>setHoods(r.data||[])) },[cityId])
  useEffect(()=>{
    if(!hoodId) return
    const load = async ()=>{
      const {data: shopsData} = await supabase.from('shops').select('*').eq('neighborhood_id', hoodId)
      setShops(shopsData||[]); const shopIds = (shopsData||[]).map((s:any)=>s.id)
      const {data: rawReports} = await supabase.from('price_reports').select('*').order('price', {ascending:true})
      setReports((rawReports||[]).filter((r:any)=> shopIds.includes(r.shop_id)))
    }; load()
  },[hoodId])

  const filtered = modelId? reports.filter((r:any)=>r.model_id===modelId) : reports
  const bestValid = filtered.filter(r=> checkScam(r, models.find(m=>m.id===r.model_id)).level!== 'SCAM')
  const best = bestValid.length? Math.min(...bestValid.map((r:any)=>r.price)) : null

  return (
    <div className="min-h-screen bg-white"><div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-[32px] font-bold">PC Builder 237 🖥️ <span className="text-red-600 text-sm">+ ANTI-ARNAQUE</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
        <select value={cId} onChange={e=>setCId(e.target.value)} className="h-[52px] px-4 border"><option value="">Pays</option>{countries.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={cityId} onChange={e=>setCityId(e.target.value)} className="h-[52px] px-4 border"><option value="">Ville</option>{cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={hoodId} onChange={e=>setHoodId(e.target.value)} className="h-[52px] px-4 border"><option value="">Quartier</option>{hoods.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select>
        <select value={modelId} onChange={e=>setModelId(e.target.value)} className="h-[52px] px-4 border bg-black text-white"><option value="">Tous modèles</option>{models.map(m=><option key={m.id} value={m.id}>{m.name} (max {m.max_ram}GB)</option>)}</select>
      </div>

      {filtered.map((r:any)=>{
        const model = models.find(m=>m.id===r.model_id); const shop = shops.find(s=>s.id===r.shop_id); const check = checkScam(r, model)
        const isScam = check.level==='SCAM'; const isBest =!isScam && r.price===best
        return (
          <div key={r.id} className={`mt-4 border-2 p-4 ${isScam?'border-red-600 bg-red-50':'border-gray-200'} ${isBest?'!border-green-500 bg-green-50':''}`}>
            {isScam && <div className="bg-red-600 text-white text-xs font-black px-2 py-1 inline-block mb-2">🚨 ARNAQUE BLOQUÉE - NE PAS ACHETER</div>}
            {isBest &&!isScam && <div className="bg-green-600 text-white text-xs font-black px-2 py-1 inline-block mb-2">🏆 MEILLEUR PRIX VÉRIFIÉ</div>}
            {check.level==='SUSPECT' && <div className="bg-orange-500 text-white text-xs font-black px-2 py-1 inline-block mb-2">⚠️ SUSPECT</div>}
            <div className="font-bold">{model?.name}</div>
            <div className="text-sm">Annoncé: <b>{r.reported_ram}GB RAM / {r.reported_storage}GB</b></div>
            <div className={`text-xs mt-1 font-bold ${check.level !== 'OK' ? 'text-red-600' : 'text-gray-700'}`}>{check.reason}</div>
            <div className={`text-xl font-black mt-2 ${isScam?'line-through text-red-600':''}`}>{r.price.toLocaleString()} FCFA</div>
            <div className="text-sm text-gray-600">{shop?.name}</div>
            {isScam && <div className="mt-2 text-[11px] text-red-700 font-bold">→ Specs physiquement impossible. Max réel {model?.max_ram}GB. Signaler au chef Mokolo.</div>}
          </div>
        )
      })}
    </div></div>
  )
}