import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { createSalida } from '../actions'
import { redirect } from 'next/navigation'

export default async function Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: salidas } = await supabase.from('itinerario_salidas').select('*').order('created_at', { ascending: false })

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Agente Operativo</h1>

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
                            <p className="text-xs text-slate-500 mt-1">Modo: {s.modo}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
