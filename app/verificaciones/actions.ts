'use server'

import { createClient } from '@/utils/supabase/server'
import { ViajeVerificacion, ViajeTransportistaPivot } from '@/lib/types_verification'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// --- VIAJES ---

export async function getViajes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data, error } = await supabase
        .from('viajes_verificacion')
        .select('*, pivot:viaje_transportistas(count)')
        .order('fecha_viaje', { ascending: false })

    if (error) throw new Error(error.message)
    // Map pivot count
    return data.map((v: any) => ({
        ...v,
        transportistas_visitados: v.pivot[0]?.count || 0
    }))
}

export async function getViaje(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Get Viaje
    const { data: viaje, error } = await supabase
        .from('viajes_verificacion')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw new Error(error.message)

    // 2. Get Pivot (Transporters in this trip)
    const { data: pivots } = await supabase
        .from('viaje_transportistas')
        .select('*, transportista:transportistas(*)')
        .eq('viaje_id', id)
        .order('created_at', { ascending: true })

    return {
        viaje: viaje as ViajeVerificacion,
        pivots: (pivots || []) as ViajeTransportistaPivot[]
    }
}

export async function createViaje() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data, error } = await supabase
        .from('viajes_verificacion')
        .insert({
            region: 'Nueva Región',
            user_id: user.id,
            fecha_viaje: new Date().toISOString()
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    redirect(`/verificaciones/${data.id}`)
}

export async function updateViaje(id: string, patch: Partial<ViajeVerificacion>) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('viajes_verificacion')
        .update(patch)
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath(`/verificaciones/${id}`)
    revalidatePath('/verificaciones')
}

// --- PIVOT (Relación Viaje <-> Transportista) ---

export async function getAvailableTransportistas(viajeId: string) {
    const supabase = await createClient()

    // Get IDs already in trip
    const { data: existing } = await supabase
        .from('viaje_transportistas')
        .select('transportista_id')
        .eq('viaje_id', viajeId)

    const excludedIds = existing?.map((e: any) => e.transportista_id) || []

    let query = supabase.from('transportistas').select('*').neq('estado', 'RECHAZADO') // Opcional filtro

    if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`)
    }

    const { data } = await query.limit(20)
    return data || []
}

export async function addTransportistaToViaje(viajeId: string, transportistaId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('viaje_transportistas')
        .insert({
            viaje_id: viajeId,
            transportista_id: transportistaId
        })

    if (error) throw new Error(error.message)
    revalidatePath(`/verificaciones/${viajeId}`)
}

export async function updateViajeTransportista(pivotId: string, patch: Partial<ViajeTransportistaPivot>) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('viaje_transportistas')
        .update(patch)
        .eq('id', pivotId)

    if (error) throw new Error(error.message)
    revalidatePath('/transportistas')
    revalidatePath('/verificaciones')
}

export async function deleteViajeTransportista(pivotId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { error } = await supabase
        .from('viaje_transportistas')
        .delete()
        .eq('id', pivotId)

    if (error) throw new Error(error.message)
    revalidatePath('/transportistas')
}

// --- FOTOS ---
// Server Action para subir fotos a Storage
export async function uploadTicketPhoto(pivotId: string, formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File
    const userId = (await supabase.auth.getUser()).data.user?.id

    if (!file || !userId) throw new Error('File required')

    // Path: {user_id}/{viaje_id_placeholder? mejor solo pivot_id}/{timestamp}-{filename}
    // Usamos pivotId como carpeta organizadora
    const path = `${userId}/${pivotId}/${Date.now()}-${file.name}`

    const { data, error } = await supabase
        .storage
        .from('tickets-viaticos')
        .upload(path, file)

    if (error) throw new Error(error.message)

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage.from('tickets-viaticos').getPublicUrl(path)

    // Update DB array
    // Primero leemos el array actual para hacer append
    const { data: current } = await supabase.from('viaje_transportistas').select('fotos_tickets').eq('id', pivotId).single()
    const newPhotos = [...(current?.fotos_tickets || []), publicUrl]

    await supabase.from('viaje_transportistas').update({ fotos_tickets: newPhotos }).eq('id', pivotId)

    revalidatePath('/') // Brute force refresh
    return publicUrl
}
