import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { createSalida } from '../actions'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ItinerarioSalida } from '../../blueprint'

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false })

// Helper to get coordinates
const getCoords = (city: string) => {
    const map: Record<string, { lat: number, lng: number }> = {
        'CDMX': { lat: 19.4326, lng: -99.1332 },
        'Querétaro': { lat: 20.5888, lng: -100.3899 },
        'Puebla': { lat: 19.0414, lng: -98.2063 },
        'Toluca': { lat: 19.2826, lng: -99.6557 },
        'Pachuca': { lat: 20.1011, lng: -98.7591 },
        'Cuernavaca': { lat: 18.9242, lng: -99.2216 },
    }
    // Default or fuzzy search could be added here
    return map[city] || { lat: 19.4326, lng: -99.1332 } // Default to CDMX
}

export default async function Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: salidas } = await supabase.from('itinerario_salidas').select('*').order('created_at', { ascending: false })

    // Filter for upcoming Friday, Saturday, Sunday
    // For MVP demonstration, we might just show all, or filtered by day of week regardless of "upcoming"
    // Let's filter strictly by day of week (Fri=5, Sat=6, Sun=0)
    const weekendTrips = salidas?.filter(s => {
        // Fix date parsing if needed (assuming YYYY-MM-DD)
        // Note: new Date('2026-05-20') treats as UTC, might be off by one day in local depending on hours.
        // Better to split/parse manually or use a lib, but for MVP:
        const parts = s.fecha_salida.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const day = date.getDay();
        return day === 0 || day === 5 || day === 6;
    }).map(s => ({
        ...s,
        coords: getCoords(s.ciudad_origen)
    })) || [];

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Agente Operativo</h1>

            <div className="mb-8">
                <h2 className="font-bold text-lg mb-2">Mapa de Salidas (Vie-Dom)</h2>
                {weekendTrips.length > 0 ? (
                    // @ts-ignore
                    <MapComponent trips={weekendTrips} />
                ) : (
                    <div className="bg-slate-100 p-4 rounded text-center text-slate-500">
                        No hay salidas programadas para este fin de semana.
                    </div>
                )}
            </div>

            {/* Botón Nueva Salida Rápida (Demo) */}
            <form action={async () => {
                'use server'
                await createSalida({ ciudad_origen: 'Querétaro', fecha_salida: '2026-05-20' })
            }}>
                <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold mb-8">
                    + Nueva Salida (QRO)
                </button>
            </form>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-500 text-sm uppercase">Listado Completo</h3>
                {salidas?.map((s) => (
                    <Link key={s.id} href={`/salidas/${s.id_salida}`} className="block">
                        <div className="border p-4 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded">{s.id_salida}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${s.estado === 'LISTO_PARA_OPERAR' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    s.estado === 'BLOQUEADO' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                                    }`}>
                                    {s.estado}
                                </span>
                            </div>
                            <p className="font-bold">{s.ciudad_origen} → {s.destino_final}</p>
                            <p className="text-xs text-slate-500 mt-1">Modo: {s.modo} • {s.fecha_salida}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
