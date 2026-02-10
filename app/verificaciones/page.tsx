import { createViaje } from './actions'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function VerificacionesList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Query con LEFT JOIN para contar transportistas
    const { data: viajes } = await supabase
        .from('viajes_verificacion')
        .select('*, viaje_transportistas(count)')
        .order('created_at', { ascending: false })

    const list = (viajes || []).map(v => ({
        ...v,
        transportistas_visitados: v.viaje_transportistas?.[0]?.count || 0
    }))

    return (
        <div className="min-h-screen bg-black text-slate-200 p-4 pb-20">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Viajes de Verificación</h1>
                <form action={createViaje}>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        + Nuevo Viaje
                    </button>
                </form>
            </header>

            <div className="space-y-3">
                {list.map((v: any) => (
                    <Link
                        key={v.id}
                        href={`/verificaciones/${v.id}`}
                        className="block bg-slate-900 border border-slate-800 rounded-xl p-4 active:scale-[0.98] transition-all hover:border-indigo-500/50"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-lg text-white">{v.region || 'Sin región'}</h2>
                                <p className="text-sm text-slate-500">{v.fecha_viaje}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-xl font-bold text-emerald-400">
                                    ${(v.gasto_gasolina + v.gasto_comida + v.gasto_hospedaje + v.gasto_otros).toFixed(2)}
                                </span>
                                <span className="text-xs text-slate-500">Total Viáticos</span>
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <div className="text-xs text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-900/50">
                                {v.transportistas_visitados} Transportistas Visitados
                            </div>
                        </div>
                    </Link>
                ))}

                {list.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No hay viajes registrados.
                    </div>
                )}
            </div>

            <Link href="/" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur border border-slate-700 text-slate-300 px-6 py-2 rounded-full text-sm">
                Menú Principal
            </Link>
        </div>
    )
}
