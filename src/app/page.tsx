import prices from "../data/prices.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold">PC Builder 237 🛠️</h1>
        <p className="text-zinc-400 mt-2">Vérifie avant d'acheter à Mokolo. Détecte les arnaques SSD/RAM.</p>
        
        <div className="grid gap-4 mt-8">
          {prices.laptops.map((pc) => (
            <div key={pc.model} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900">
              <h2 className="font-semibold text-lg">{pc.model} - {pc.cpu}</h2>
              <p className="text-sm text-zinc-400">Base: {pc.ram_base} | Max: {pc.ram_max} | Slots SSD: {pc.ssd_slots}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-xl font-bold text-green-400">{pc.prix_mokolo.toLocaleString()} FCFA</span>
                <span className={`text-xs px-2 py-1 rounded-full ${pc.arnaque_freq === 'faible' ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'}`}>
                  Arnaque: {pc.arnaque_freq}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-8">Dernière MAJ: {prices.meta.last_update}</p>
      </div>
    </main>
  );
}
