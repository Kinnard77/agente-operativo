import { createTransportista } from './actions'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function TransportistasList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: list } = await supabase
        .from('transportistas')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-black text-slate-200 p-4 pb-20">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Transportistas</h1>
                <form action={createTransportista}>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        + Nuevo
                    </button>
                </form>
            </header>

            <div className="space-y-3">
                {(list || []).map(t => (
                    <Link
                        key={t.id}
                        href={`/transportistas/${t.id}`}
                        className="block bg-slate-900 border border-slate-800 rounded-xl p-4 active:scale-[0.98] transition-all hover:border-indigo-500/50"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-lg text-white">{t.nombre}</h2>
                                <p className="text-sm text-slate-500">{t.contacto || 'Sin contacto'} • {t.telefono || 'Sin tel'}</p>
                            </div>
                            <Badge estado={t.estado} />
                        </div>
                        <div className="mt-2 text-xs text-slate-400 bg-slate-950/50 inline-block px-2 py-1 rounded">
                            {t.tipo_unidades || 'Tipo no especificado'} • {t.capacidad_maxima || 0} PAX
                        </div>
                    </Link>
                ))}

                {(list || []).length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No hay transportistas registrados.
                    </div>
                )}
            </div>

            <Link href="/" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur border border-slate-700 text-slate-300 px-6 py-2 rounded-full text-sm">
                Menú Principal
            </Link>
        </div>
    )
}

function Badge({ estado }: { estado: string }) {
    const colors: any = {
        'CANDIDATO': 'bg-slate-700 text-slate-300',
        'VERIFICANDO': 'bg-blue-900 text-blue-300 border-blue-700',
        'CERTIFICADO': 'bg-emerald-900 text-emerald-300 border-emerald-700',
        'RECHAZADO': 'bg-rose-900 text-rose-300 border-rose-700'
    }
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold border ${colors[estado] || 'bg-slate-800'}`}>
            {estado}
        </span>
    )
}
