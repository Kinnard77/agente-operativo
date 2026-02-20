import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { createSalida, deleteSalida } from '../actions'
import { redirect } from 'next/navigation'
// import dynamic from 'next/dynamic'
import { ItinerarioSalida } from '../../blueprint'

import MapComponent from '../components/MapComponent'

// Helper to get coordinates
const getCoords = (city: string, dbCoords?: string | null) => {
    // 1. Try to parse DB coordinates first
    if (dbCoords) {
        const parts = dbCoords.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] };
        }
    }

    // 2. Fallback to hardcoded city map
    const map: Record<string, { lat: number, lng: number }> = {
        'CDMX': { lat: 19.4326, lng: -99.1332 },
        'Querétaro': { lat: 20.5888, lng: -100.3899 },
        'Puebla': { lat: 19.0414, lng: -98.2063 },
        'Toluca': { lat: 19.2826, lng: -99.6557 },
        'Pachuca': { lat: 20.1011, lng: -98.7591 },
        'Cuernavaca': { lat: 18.9242, lng: -99.2216 },
    }

    return map[city] || { lat: 19.4326, lng: -99.1332 } // Default to CDMX
}

export default async function Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: salidas } = await supabase.from('itinerario_salidas').select('*').order('created_at', { ascending: false })

    // Prepare data for Global Map (All active trips)
    const mapTrips = salidas?.map(s => ({
        ...s,
        coords: getCoords(s.ciudad_origen, s.coordenadas_salida),
        destino_final: s.destino_final.replace(/\s*\(\d+\s*paradas\)/i, '') // Clean for map popup too
    })) || [];

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">GESTIÓN OPERATIVA - 19/02/2026</h1>

            <div className="mb-8">
                <h2 className="font-bold text-lg mb-2">Mapa de Salidas</h2>
                {/* @ts-ignore */}
                <MapComponent trips={mapTrips} />
            </div>

            {/* Botón Nueva Salida Rápida (Demo) */}
            <form action={async () => {
                'use server'
                await createSalida({ ciudad_origen: 'Por Asignar', fecha_salida: '2026-05-20' })
            }}>
                <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold mb-8">
                    + Nueva Salida
                </button>
            </form>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-500 text-sm uppercase">Listado Completo</h3>
                {salidas?.map((s) => (
                    <div key={s.id} className="border p-4 rounded-lg hover:bg-slate-50 transition-colors relative group">
                        <Link href={`/salidas/${s.id_salida}`} className="block">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded">{s.id_salida}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${s.estado === 'LISTO_PARA_OPERAR' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    s.estado === 'BLOQUEADO' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                                    }`}>
                                    {s.estado}
                                </span>
                            </div>
                            <p className="font-bold">{s.ciudad_origen} → {s.destino_final.replace(/\s*\(\d+\s*paradas\)/i, '')}</p>
                            <p className="text-xs text-slate-500 mt-1">Modo: {s.modo} • {s.fecha_salida}</p>
                        </Link>

                        {/* Delete Button */}
                        <form action={deleteSalida} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input type="hidden" name="id_salida" value={s.id_salida} />
                            <button className="text-red-500 hover:text-red-700 p-2 bg-white rounded-full shadow-sm hover:bg-red-50" title="Eliminar">
                                🗑️
                            </button>
                        </form>
                    </div>
                ))}
            </div>
        </div>
    )
}
