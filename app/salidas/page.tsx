import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { createSalida, deleteSalida } from '../actions'
import { redirect } from 'next/navigation'
import { ItinerarioSalida } from '../../blueprint'

import MapComponent from '../components/MapComponent'

// Helper to get coordinates
const getCoords = (city: string, dbCoords?: string | null) => {
    if (dbCoords) {
        const parts = dbCoords.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] };
        }
    }
    const map: Record<string, { lat: number, lng: number }> = {
        'CDMX': { lat: 19.4326, lng: -99.1332 },
        'Querétaro': { lat: 20.5888, lng: -100.3899 },
        'Puebla': { lat: 19.0414, lng: -98.2063 },
        'Toluca': { lat: 19.2826, lng: -99.6557 },
        'Pachuca': { lat: 20.1011, lng: -98.7591 },
        'Cuernavaca': { lat: 18.9242, lng: -99.2216 },
    }
    return map[city] || { lat: 19.4326, lng: -99.1332 }
}

export default async function Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: salidas } = await supabase.from('itinerario_salidas').select('*').order('created_at', { ascending: false })

    const mapTrips = salidas?.filter(s => s.estado === 'LISTO_PARA_OPERAR').map(s => ({
        ...s,
        coords: getCoords(s.ciudad_origen, s.coordenadas_salida),
        destino_final: s.destino_final.replace(/\s*\(\d+\s*paradas\)/i, '')
    })) || [];

    return (
        <div className="min-h-screen bg-black text-slate-200">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center gap-4">
                <Link href="/" className="text-indigo-400 text-sm hover:underline">← Inicio</Link>
                <h1 className="text-xl font-bold text-white">Gestión Operativa — Salidas</h1>
            </div>

            <div className="max-w-md mx-auto p-4">
                {/* Mapa principal */}
                <div className="mb-6">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-2">Mapa Operativo</h2>
                    {/* @ts-ignore */}
                    <MapComponent trips={mapTrips} />
                    <p className="text-[10px] text-slate-600 mt-1 text-center">Solo muestra salidas en LISTO PARA OPERAR</p>
                </div>

                {/* CTA Nueva Salida */}
                <form action={async () => {
                    'use server'
                    await createSalida({ ciudad_origen: 'Por Asignar', fecha_salida: '2026-05-20' })
                }}>
                    <button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider mb-6 hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20">
                        + Nueva Salida
                    </button>
                </form>

                {/* Listado completo */}
                <div className="space-y-3">
                    <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">Todas las Salidas</h3>
                    {salidas?.map((s) => (
                        <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative group hover:border-indigo-500/50 transition-all">
                            <Link href={`/salidas/${s.id_salida}`} className="block">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded">{s.id_salida}</span>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${s.estado === 'LISTO_PARA_OPERAR' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700' :
                                            s.estado === 'BLOQUEADO' ? 'bg-red-900/50 text-red-400 border-red-700' :
                                                'bg-amber-900/30 text-amber-400 border-amber-700'
                                        }`}>
                                        {s.estado}
                                    </span>
                                </div>
                                <p className="font-bold text-white">{s.ciudad_origen} — {s.destino_final.replace(/\s*\(\d+\s*paradas\)/i, '')}</p>
                                <p className="text-xs text-slate-500 mt-1">{s.modo} • {s.fecha_salida}</p>
                            </Link>

                            {/* Delete */}
                            <form action={deleteSalida} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="hidden" name="id_salida" value={s.id_salida} />
                                <button className="text-rose-500 hover:text-rose-400 p-2 bg-slate-800 rounded-full text-xs" title="Eliminar">🗑️</button>
                            </form>
                        </div>
                    ))}

                    {(salidas?.length ?? 0) === 0 && (
                        <div className="text-center py-10 text-slate-600">No hay salidas registradas.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
