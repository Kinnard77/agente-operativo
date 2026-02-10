'use server'

import { createClient } from '@/utils/supabase/server'
import { Transportista } from '@/lib/types_verification'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function getTransportistas() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data, error } = await supabase
        .from('transportistas')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as Transportista[]
}

export async function getTransportista(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data, error } = await supabase
        .from('transportistas')
        .select('*')
        .eq('id', id)
        .single()

    // Fetch History (Pivot + Viaje)
    const { data: history } = await supabase
        .from('viaje_transportistas')
        .select('*, viaje:viajes_verificacion(*)')
        .eq('transportista_id', id)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return {
        transportista: data as Transportista,
        historial: history || []
    }
}

export async function createTransportista() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data, error } = await supabase
        .from('transportistas')
        .insert({
            nombre: 'Nuevo Transportista',
            estado: 'CANDIDATO',
            user_id: user.id
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    redirect(`/transportistas/${data.id}`)
}

export async function updateTransportista(id: string, patch: Partial<Transportista>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Si se está certificando, agregar fecha
    if (patch.estado === 'CERTIFICADO') {
        const { data: current } = await supabase.from('transportistas').select('estado').eq('id', id).single()
        if (current.estado !== 'CERTIFICADO') {
            // @ts-ignore
            patch.fecha_certificacion = new Date().toISOString()
        }
    }

    const { error } = await supabase
        .from('transportistas')
        .update(patch)
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath(`/transportistas/${id}`)
    revalidatePath('/transportistas')
}

export async function getCertifiedTransportistas() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('transportistas')
        .select('id, nombre, tipo_unidades, capacidad_maxima')
        .eq('estado', 'CERTIFICADO')
        .order('nombre')

    return data || []
}
