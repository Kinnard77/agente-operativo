'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/utils/supabase/server'
import { generarBorradorItinerario, IngestaDatosBase } from '@/ingesta'
import { validarItinerario } from '@/validator'
import { CheckpointOperativo, ItinerarioSalida, DESTINO_FIJO } from '@/blueprint'
import { generarPaqueteTransportistaHTML } from '@/paquete_transportista'

// --- 1. CREAR SALIDA ---
export async function createSalida(payload: IngestaDatosBase) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user')

    // 1. Generar Borrador Determinista (Agente)
    const itinerario = generarBorradorItinerario(payload)

    // 2. Validar Estado Inicial
    itinerario.auditoria = validarItinerario(itinerario)

    // 3. Persistir JSONB
    const { error } = await supabase.from('itinerario_salidas').insert({
        id_salida: itinerario.id_salida,
        ciudad_origen: itinerario.ciudad_origen,
        destino_final: DESTINO_FIJO,
        fecha_salida: itinerario.fecha_salida,
        estado: itinerario.auditoria.estado,
        modo: itinerario.modo,
        itinerario: itinerario, // JSONB completo
        user_id: user.id
    })

    if (error) throw new Error(error.message)
    return { success: true, id: itinerario.id_salida }
}

// --- 2. UPDATE PATCH ---
export async function updateSalida(id_salida: string, patch: Partial<ItinerarioSalida>) {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sesión expirada. Vuelve a iniciar sesión.' }

    // 2. Cargar estado actual
    const { data: records, error: fetchError } = await supabase
        .from('itinerario_salidas')
        .select('itinerario')
        .eq('id_salida', id_salida)
        .order('created_at', { ascending: false })
        .limit(1)

    if (fetchError) return { success: false, error: `Error al leer salida: ${fetchError.message}` }

    const record = records?.[0] ?? null
    if (!record) return { success: false, error: `Salida '${id_salida}' no encontrada en la base de datos.` }

    let itinerario = record.itinerario as ItinerarioSalida

    // 3. Aplicar Patch
    itinerario = { ...itinerario, ...patch }

    // 4. Re-Validar (Siempre autoritario)
    itinerario.auditoria = validarItinerario(itinerario)

    // 5. Persistir — incluye todas las columnas desnormalizadas
    const { error: saveError } = await supabase
        .from('itinerario_salidas')
        .update({
            // JSONB completo (fuente de verdad)
            itinerario: itinerario,
            // Columnas desnormalizadas para filtros/queries rápidos
            estado: itinerario.auditoria.estado,
            modo: itinerario.modo,
            ciudad_origen: itinerario.ciudad_origen,
            destino_final: DESTINO_FIJO,
            fecha_salida: itinerario.fecha_salida,
            coordenadas_salida: itinerario.coordenadas_salida ?? null,
            // Nuevas columnas creadas por el usuario
            precio: itinerario.precio_total ?? null,
            punto_encuentro: itinerario.punto_encuentro ?? null,
            pax_meta: itinerario.logistica?.capacidad_requerida ?? null,
            updated_at: new Date().toISOString()
        })
        .eq('id_salida', id_salida)

    if (saveError) return { success: false, error: `Error al guardar (${saveError.code}): ${saveError.message}` }

    revalidatePath('/salidas')
    revalidatePath(`/salidas/${id_salida}`)

    return { success: true, estado: itinerario.auditoria.estado, bloqueadores: itinerario.auditoria.bloqueadores }
}

export async function deleteSalida(formData: FormData) {
    const id_salida = formData.get('id_salida') as string
    if (!id_salida) return

    const supabase = await createClient()

    // Auth check implied by page protection, but good to have constraint
    const { error } = await supabase
        .from('itinerario_salidas')
        .delete()
        .eq('id_salida', id_salida)

    if (error) throw new Error(error.message)

    revalidatePath('/salidas')
}

// --- 3. CERTIFICAR ---
export async function certificarSalida(id_salida: string) {
    const supabase = await createClient()

    // 1. Cargar
    const { data: records } = await supabase
        .from('itinerario_salidas')
        .select('itinerario')
        .eq('id_salida', id_salida)
        .order('created_at', { ascending: false })
        .limit(1)

    const record = records?.[0] ?? null
    if (!record) throw new Error('No found')
    let itinerario = record.itinerario as ItinerarioSalida

    // 2. Cambiar Modo
    itinerario.modo = 'CERTIFICACIÓN'

    // 3. Validar con Rigor Máximo
    itinerario.auditoria = validarItinerario(itinerario)

    // 4. Bloquear si falla
    if (itinerario.auditoria.estado === 'BLOQUEADO' || itinerario.auditoria.estado === 'INCOMPLETO') {
        // Revertir modo si se desea, o guardar el estado bloqueado para mostrar errores
        // Guardamos para mostrar los errores al usuario
    }

    // 5. Persistir
    await supabase.from('itinerario_salidas').update({
        itinerario: itinerario,
        estado: itinerario.auditoria.estado,
        modo: itinerario.modo
    }).eq('id_salida', id_salida)

    return {
        success: itinerario.auditoria.estado === 'LISTO_PARA_OPERAR' || itinerario.auditoria.estado === 'VALIDADO',
        auditoria: itinerario.auditoria
    }
}

export async function assignTransporter(id_salida: string, transportista_id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('itinerario_salidas')
        .update({ transportista_id })
        .eq('id_salida', id_salida)

    if (error) throw new Error(error.message)
    revalidatePath(`/salidas/${id_salida}`) // Revalidate by route might imply ID, but commonly we use UUID. Revalidate the path that uses this.
    // However, the page uses [id] which might be UUID or ID_SALIDA.
    // Safest is to revalidate '/' or catch all.
}

// --- 4. GENERAR PAQUETE HTML ---
export async function getPaqueteTransportistaHTML(id_salida: string) {
    const supabase = await createClient()
    const { data: records } = await supabase.from('itinerario_salidas').select('itinerario').eq('id_salida', id_salida).order('created_at', { ascending: false }).limit(1)
    const data = records?.[0] ?? null

    if (!data) return "<h1>Error: Salida no encontrada</h1>"

    const html = generarPaqueteTransportistaHTML(data.itinerario)
    return html
}
