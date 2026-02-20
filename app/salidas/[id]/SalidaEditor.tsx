'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ItinerarioSalida, CheckpointOperativo, Hora } from '@/blueprint'
import { updateSalida, assignTransporter } from '../../actions'
import Link from 'next/link'
import {
    establecerVentanaComida,
    actualizarCapacidad,
    actualizarCronograma
} from '@/operador'

// Helper types & functions
const toHora = (val: string): Hora => val.trim() === '' ? 'POR DEFINIR' : val as Hora
const fromHora = (h: Hora | undefined): string => (!h || h === 'POR DEFINIR') ? '' : h

export default function SalidaEditor({ initialItinerario, certifiedTransportistas }: { initialItinerario: ItinerarioSalida, certifiedTransportistas: any[] }) {
    const router = useRouter()

    // Global State
    const [itinerario, setItinerario] = useState<ItinerarioSalida>(initialItinerario)
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // Autosave Logic (Debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (status === 'saving') return // Already saving? actually this logic is tricky with debounce.
            // Better approach: When itinerario changes, set status to 'pending-save'. 
            // Then another effect watches 'pending-save' and triggers save after delay.
        }, 1000)
        return () => clearTimeout(timer)
    }, [itinerario])

    // Specific Autosave Implementation
    // We will trigger save immediately on blur or specific actions for now to be robust, 
    // or use a separate "dirty" flag.
    // Let's use a simpler "Trigger Save" function that we call explicitly on blur/change complete.

    const saveChanges = useCallback(async (newItinerario: ItinerarioSalida) => {
        setStatus('saving')
        try {
            await updateSalida(newItinerario.id_salida, {
                // We send specific fields or the whole object depending on backend logic.
                // For MVP actions.ts handles a merge, so we can send the whole thing or parts.
                // Let's send the whole updated JSONB structure to be safe.
                ...newItinerario
            })
            setStatus('saved')
            setLastSaved(new Date())
            router.refresh()

            // Output visual feedback reset
            setTimeout(() => setStatus('idle'), 2000)
        } catch (e) {
            console.error(e)
            setStatus('error')
        }
    }, [router])

    // --- Field Updaters ---

    const updateField = (field: keyof ItinerarioSalida, value: any) => {
        const next = { ...itinerario, [field]: value }

        // SYNC LOGIC: Top -> Bottom
        if (field === 'hora_salida') {
            // Sync to first checkpoint
            if (next.ruta_critica.length > 0) {
                next.ruta_critica[0].h_salida = toHora(value)
            }
        }
        if (field === 'punto_encuentro') {
            // Sync to first checkpoint
            if (next.ruta_critica.length > 0) {
                next.ruta_critica[0].localizacion = value
            }
        }

        setItinerario(next)
        // Trigger save? For text inputs, maybe wait for blur. 
        // For selects/toggles, trigger now.
    }

    const handleBlur = () => {
        saveChanges(itinerario)
    }

    // --- Complex Updaters (Delegated to Operator Logic) ---

    const handleCronogramaChange = (id: string, type: 'l' | 's', val: string) => {
        const next = JSON.parse(JSON.stringify(itinerario)) as ItinerarioSalida
        const cp = next.ruta_critica.find(c => c.id === id)
        if (cp) {
            if (type === 'l') cp.h_llegada = toHora(val)
            if (type === 's') cp.h_salida = toHora(val)
        }

        // If first point modified, sync back to Top? (Optional, maybe Bottom -> Top too?)
        // Let's keep Top -> Bottom authoritative for now.

        setItinerario(next)
        // We'll save on blur of the inputs
    }

    // --- Render ---

    const isPlanning = itinerario.auditoria.estado === 'INCOMPLETO' || itinerario.auditoria.estado === 'BLOQUEADO'

    return (
        <div className="min-h-screen bg-black text-slate-200 pb-20">
            {/* --- HEADER --- */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link className="text-indigo-400 text-sm hover:underline" href="/salidas">← Volver</Link>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            Tour {itinerario.destino || 'Sin Destino'}
                        </h1>
                        <p className="text-[10px] text-slate-400">{itinerario.ciudad_salida} • {itinerario.fecha_salida}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Autosave Status */}
                    <div className={`text-xs font-mono transition-opacity duration-300 ${status === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
                        {status === 'saving' && <span className="text-amber-400">Guardando...</span>}
                        {status === 'saved' && <span className="text-emerald-400">✓ Guardado</span>}
                        {status === 'error' && <span className="text-rose-500">Error al guardar</span>}
                    </div>

                    <div className={`text-xs px-2 py-1 rounded border font-bold ${itinerario.auditoria.estado === 'LISTO_PARA_OPERAR' ? 'border-emerald-500 text-emerald-500 bg-emerald-950/30' :
                        'border-amber-500 text-amber-500 bg-amber-950/30'
                        }`}>
                        {itinerario.auditoria.estado}
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-8 mt-4">

                {/* --- 1. DATOS GENERALES --- */}
                <section className="bg-slate-900/50 border border-slate-800 rounded p-4">
                    <h2 className="text-indigo-400 font-bold mb-4 text-sm uppercase tracking-wider">Definición de Salida</h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Hora Salida</label>
                            <input
                                type="time"
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                value={fromHora(itinerario.hora_salida as Hora)}
                                onChange={e => updateField('hora_salida', e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Precio Total (MXN)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                value={itinerario.precio_total}
                                onChange={e => updateField('precio_total', parseFloat(e.target.value))}
                                onBlur={handleBlur}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-xs text-slate-500 block mb-1">Punto de Encuentro (Dirección)</label>
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                            value={itinerario.punto_encuentro}
                            onChange={e => updateField('punto_encuentro', e.target.value)}
                            onBlur={handleBlur}
                            placeholder="Ej. Ángel de la Independencia..."
                        />
                    </div>

                    <div className="mb-2">
                        <label className="text-xs text-slate-500 block mb-1">Coordenadas (Lat, Lng) - Para Mapa Web</label>
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none transition-colors"
                            value={itinerario.coordenadas_salida || ''}
                            onChange={e => updateField('coordenadas_salida', e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleBlur()
                                        (e.target as HTMLInputElement).blur()
                                }
                            }}
                            placeholder="19.4326, -99.1332"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">Copia y pega desde Google Maps.</p>
                    </div>
                </section>

                {/* --- 2. LOGÍSTICA --- */}
                <section className="bg-slate-900/50 border border-slate-800 rounded p-4">
                    <h2 className="text-indigo-400 font-bold mb-4 text-sm uppercase tracking-wider">Logística</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-24">
                            <label className="text-xs text-slate-500 block mb-1">Pax Meta</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-center"
                                value={itinerario.logistica.capacidad_requerida}
                                onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    const next = { ...itinerario, logistica: { ...itinerario.logistica, capacidad_requerida: val } }
                                    setItinerario(next);
                                }}
                                onBlur={handleBlur}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 block mb-1">Transportista Asignado</label>
                            <select
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm"
                                value={itinerario.transportista_id || ''}
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    const next = { ...itinerario, transportista_id: val };
                                    setItinerario(next);
                                    setStatus('saving');
                                    await assignTransporter(itinerario.id_salida, val);
                                    setStatus('saved');
                                    setTimeout(() => setStatus('idle'), 2000);
                                }}
                            >
                                <option value="">-- Por Asignar --</option>
                                {certifiedTransportistas.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre} ({c.tipo_unidades})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* --- 3. CRONOGRAMA --- */}
                <section className="bg-slate-900/50 border border-slate-800 rounded p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-indigo-400 font-bold text-sm uppercase tracking-wider">Itinerario Minuto a Minuto</h2>
                        <span className="text-[10px] text-slate-500 italic">Se sincroniza con Arriba</span>
                    </div>

                    <div className="space-y-3">
                        {itinerario.ruta_critica.map((cp, idx) => (
                            <div key={cp.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center border-b border-slate-800 pb-2 last:border-0 hover:bg-slate-800/30 p-2 rounded transition-colors">
                                <div>
                                    <div className={`font-medium text-sm ${idx === 0 ? 'text-indigo-300' : 'text-slate-200'}`}>
                                        {cp.localizacion === 'POR DEFINIR' ? 'Ubicación Pendiente' : cp.localizacion}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase">{cp.id}</div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <label className="text-[9px] text-slate-500 mb-0.5">LLEGADA</label>
                                    <input
                                        type="time"
                                        className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs w-20 text-center text-slate-300 focus:border-indigo-500 focus:text-white"
                                        value={fromHora(cp.h_llegada)}
                                        onChange={e => handleCronogramaChange(cp.id, 'l', e.target.value)}
                                        onBlur={handleBlur}
                                        disabled={idx === 0} // First point arrival usually irrelevant or same as dep? Keep active just in case
                                    />
                                </div>
                                <div className="flex flex-col items-end">
                                    <label className="text-[9px] text-slate-500 mb-0.5">SALIDA</label>
                                    <input
                                        type="time"
                                        className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs w-20 text-center text-slate-300 focus:border-indigo-500 focus:text-white"
                                        value={fromHora(cp.h_salida)}
                                        onChange={e => handleCronogramaChange(cp.id, 's', e.target.value)}
                                        onBlur={handleBlur}
                                        disabled={idx === 0} // First point Output controlled by Header?
                                    // Actually user requested Sync Top -> Bottom. So if they edit here, does it update top? 
                                    // For now let's leave enabled but Top writes to here.
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- FOOTER --- */}
                <div className="text-center pt-8 pb-4 border-t border-slate-900">
                    <p className="text-[10px] text-slate-600 font-mono">
                        ID TÉCNICO: {itinerario.id_salida} <br />
                        UUID: {itinerario.id} <br />
                        MODO: {itinerario.modo}
                    </p>
                </div>
            </div>
        </div>
    )
}
