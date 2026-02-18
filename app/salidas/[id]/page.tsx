import { createClient } from '@/utils/supabase/server'
import { validarItinerario } from '@/validator'
import { ItinerarioSalida } from '@/blueprint'
import { redirect } from 'next/navigation'
import { getCertifiedTransportistas } from '../../transportistas/actions'
import SalidaEditor from './SalidaEditor'

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

  // Inject ID into itinerario object if missing (since it's JSONB)
  const itinerario = { ...row.itinerario, id: row.id } as ItinerarioSalida

  // Re-validar al vuelo por si acaso
  itinerario.auditoria = validarItinerario(itinerario)

  const certifiedTransportistas = await getCertifiedTransportistas()

  return <SalidaEditor initialItinerario={itinerario} certifiedTransportistas={certifiedTransportistas} />
}
