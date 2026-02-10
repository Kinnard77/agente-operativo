import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // 1. Obtener la salida por su ID público (id_salida)
    const { data: salida } = await supabase.from('itinerario_salidas').select('id, itinerario').eq('id_salida', params.id).single()
    if (!salida) return <div>Salida no válida</div>

    const it = salida.itinerario
    const rutaCritica: any[] = Array.isArray(it?.ruta_critica) ? it.ruta_critica : []

    // Si no hay ruta crítica, mostrar estado vacío
    if (rutaCritica.length === 0) {
        return (
            <div className="p-4 max-w-md mx-auto bg-slate-50 min-h-screen">
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <h1 className="text-xl font-bold mb-1">Bitácora de Campo</h1>
                    <p className="text-sm text-slate-500 font-mono">{params.id}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-700 text-sm">
                    No hay checkpoints definidos aún. La ruta está en estado POR DEFINIR.
                </div>
            </div>
        )
    }

    async function registrarVisita(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const salida_id = formData.get('salida_id') as string
        const nombre = formData.get('nombre') as string
        const notas = formData.get('notas') as string

        await supabase.from('transportistas_visitas').insert({
            salida_id,
            nombre,
            notas
        })

        redirect(`/salidas/${params.id}`)
    }

    return (
        <div className="p-4 max-w-md mx-auto bg-slate-50 min-h-screen">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <h1 className="text-xl font-bold mb-1">Bitácora de Campo</h1>
                <p className="text-sm text-slate-500 font-mono">{params.id}</p>
            </div>

            <div className="space-y-4">
                {rutaCritica.map((cp: any) => (
                    <div key={cp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold">{cp.localizacion}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-mono ${cp.h_llegada === 'POR DEFINIR' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100'}`}>
                                {cp.h_llegada}
                            </span>
                        </div>
                        {cp.es_comida && <span className="text-xs text-rose-500 font-bold">PARADA RÍGIDA — COMIDA</span>}
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <h2 className="text-sm font-bold text-slate-500 uppercase mb-3">Registrar Transportista</h2>
                <form action={registrarVisita} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <input type="hidden" name="salida_id" value={salida.id} />
                    <input
                        name="nombre"
                        placeholder="Nombre empresa / chofer"
                        className="w-full border p-2 rounded mb-3 text-sm"
                    />
                    <textarea
                        name="notas"
                        placeholder="Notas..."
                        className="w-full border p-2 rounded mb-3 text-sm"
                    ></textarea>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm">
                        + Agregar Transportista
                    </button>
                </form>
            </div>
        </div>
    )
}
