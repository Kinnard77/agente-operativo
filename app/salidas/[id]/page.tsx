import { createClient } from '@/utils/supabase/server'
import { validarItinerario } from '../../../../validator'
import Link from 'next/link'
import { VentanaComidaForm, PuntoSalidaForm, CapacidadForm, CronogramaForm, TransporterSelector } from './forms'
import { ItinerarioSalida } from '../../../../blueprint'
import { redirect } from 'next/navigation'
import { getCertifiedTransportistas } from '../../transportistas/actions'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Búsqueda robusta por ID o ID_SALIDA
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let row: any = null

  if (isUuid) {
    const r = await supabase.from('itinerario_salidas').select('*').eq('id', id).maybeSingle()
    row = r.data
  } else {
    // Si hay duplicados, tomamos el más reciente
    const r = await supabase.from('itinerario_salidas').select('*').eq('id_salida', id).order('created_at', { ascending: false }).limit(1)
    row = r.data?.[0] ?? null
  }

  if (!row) return <div className="p-8 text-white">Salida no encontrada</div>

  const itinerario = row.itinerario as ItinerarioSalida
  const resultado = validarItinerario(itinerario)
  const isCertificacion = itinerario.modo === 'CERTIFICACIÓN'

  const certifiedTransportistas = await getCertifiedTransportistas()

  return (
    <div className="min-h-screen bg-black text-slate-200 pb-20">
      {/* Header Fijo / Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link className="text-indigo-400 text-sm hover:underline" href="/salidas">← Volver</Link>
          <div className="font-mono font-bold text-white">{itinerario.id_salida}</div>
          <div className={`text-xs px-2 py-1 rounded border ${resultado.estado === 'INCOMPLETO' ? 'border-amber-500 text-amber-500' :
            resultado.estado === 'BLOQUEADO' ? 'border-rose-500 text-rose-500' :
              'border-emerald-500 text-emerald-500'
            }`}>
            {resultado.estado}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-8">

        {/* Resumen de Auditoría */}
        {resultado.bloqueadores.length > 0 && (
          <div className={`p-4 rounded-lg border ${isCertificacion ? 'bg-rose-950/30 border-rose-800' : 'bg-slate-900 border-slate-700'}`}>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
              {isCertificacion ? '🚨 Bloqueos de Certificación' : '⚠️ Pendientes de Planeación'}
            </h2>
            <ul className="space-y-2">
              {resultado.bloqueadores.map((b, i) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <span className={b.critico ? 'text-rose-400' : 'text-amber-400'}>{b.critico ? '⛔' : '•'}</span>
                  <span>
                    <span className="font-bold text-slate-300">{b.categoria}:</span> {b.mensaje}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Formularios de Edición - Separados por Dominio */}

        <section>
          <h2 className="text-lg font-bold text-white mb-4 border-l-4 border-indigo-500 pl-3">Logística & Capacidad</h2>
          <CapacidadForm itinerario={itinerario} />
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 border-l-4 border-indigo-500 pl-3">Definición de Ruta</h2>
          <PuntoSalidaForm itinerario={itinerario} />
          <VentanaComidaForm itinerario={itinerario} />
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 border-l-4 border-indigo-500 pl-3">Cronograma Detallado</h2>
          <CronogramaForm itinerario={itinerario} />
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 border-l-4 border-emerald-500 pl-3">Transporte & Proveedores</h2>
          <TransporterSelector
            idSalida={itinerario.id_salida}
            currentId={row.transportista_id}
            candidates={certifiedTransportistas}
          />
        </section>

        {/* Debug Info */}
        <div className="text-[10px] text-slate-700 font-mono mt-12 pt-4 border-t border-slate-900">
          UUID: {row.id} | Mode: {itinerario.modo}<br />
          Last Audit: {resultado.timestamp_auditoria}
        </div>
      </div>
    </div>
  )
}
