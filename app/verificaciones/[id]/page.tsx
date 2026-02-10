import ViajeForm from './viaje-form'
import { getViaje } from '../actions'
import Link from 'next/link'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { viaje, pivots } = await getViaje(id)

    return (
        <div className="min-h-screen bg-black text-slate-200 pb-20">
            <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <Link className="text-indigo-400 text-sm hover:underline" href="/verificaciones">← Volver</Link>
                    <h1 className="font-bold text-white">Verificación: {viaje.region}</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4">
                <ViajeForm initialData={viaje} initialPivots={pivots} />
            </div>
        </div>
    )
}
