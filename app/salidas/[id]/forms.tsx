'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckpointOperativo, ItinerarioSalida, Hora } from '@/blueprint'
import { updateSalida, assignTransporter } from '../../actions'
import {
    establecerVentanaComida,
    definirPuntoSalida,
    actualizarCapacidad,
    actualizarCronograma
} from '@/operador'

// Helper para convertir input vacio a "POR DEFINIR"
const toHora = (val: string): Hora => val.trim() === '' ? 'POR DEFINIR' : val as Hora
const fromHora = (h: Hora): string => h === 'POR DEFINIR' ? '' : h

interface BaseProps {
    itinerario: ItinerarioSalida
}

export function VentanaComidaForm({ itinerario }: BaseProps) {
    const router = useRouter()
    const [inicio, setInicio] = useState(fromHora(itinerario.ventana_comida.inicio))
    const [fin, setFin] = useState(fromHora(itinerario.ventana_comida.fin))
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        // Clonar para no mutar prop directa si se usa en otro lado (aunque aqui no importa tanto)
        const clone = JSON.parse(JSON.stringify(itinerario))

        // Usar logica de operador
        const updated = establecerVentanaComida(clone, toHora(inicio), toHora(fin))

        // Enviar patch
        await updateSalida(itinerario.id_salida, { ventana_comida: updated.ventana_comida })

        setLoading(false)
        router.refresh()
    }

    return (
        <div className="border border-slate-700 p-4 rounded bg-slate-900/50 my-2">
            <h3 className="font-bold text-indigo-400 mb-2">Ventana de Comida</h3>
            <div className="flex gap-2">
                <input
                    type="time"
                    className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-sm"
                    value={inicio}
                    onChange={e => setInicio(e.target.value)}
                />
                <span className="text-slate-400 self-center">-</span>
                <input
                    type="time"
                    className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-sm"
                    value={fin}
                    onChange={e => setFin(e.target.value)}
                />
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                    {loading ? '...' : 'Guardar'}
                </button>
            </div>
        </div>
    )
}

export function PuntoSalidaForm({ itinerario }: BaseProps) {
    const router = useRouter()
    // Asumimos que el punto de salida es el primer nodo
    const currentLoc = itinerario.ruta_critica[0]?.localizacion || ''
    const [loc, setLoc] = useState(currentLoc === 'POR DEFINIR' ? '' : currentLoc)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const clone = JSON.parse(JSON.stringify(itinerario))

        // Logica operador
        const valToSave = loc.trim() === '' ? 'POR DEFINIR' : loc
        const updated = definirPuntoSalida(clone, valToSave)

        await updateSalida(itinerario.id_salida, { ruta_critica: updated.ruta_critica })

        setLoading(false)
        router.refresh()
    }

    return (
        <div className="border border-slate-700 p-4 rounded bg-slate-900/50 my-2">
            <h3 className="font-bold text-indigo-400 mb-2">Punto de Salida</h3>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Dirección o Lugar exacto"
                    className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-sm flex-1"
                    value={loc}
                    onChange={e => setLoc(e.target.value)}
                />
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                    {loading ? '...' : 'Guardar'}
                </button>
            </div>
        </div>
    )
}

export function CapacidadForm({ itinerario }: BaseProps) {
    const router = useRouter()
    const [cap, setCap] = useState(itinerario.logistica.capacidad_requerida.toString())
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const clone = JSON.parse(JSON.stringify(itinerario))

        const num = parseInt(cap) || 0 // 0 podria interpretarse como no definido si la logica lo dicta, pero aqui pasamos el numero
        const updated = actualizarCapacidad(clone, num)

        await updateSalida(itinerario.id_salida, { logistica: updated.logistica })

        setLoading(false)
        router.refresh()
    }

    return (
        <div className="border border-slate-700 p-4 rounded bg-slate-900/50 my-2">
            <h3 className="font-bold text-indigo-400 mb-2">Capacidad Requerida</h3>
            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="PAX"
                    className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-sm w-24"
                    value={cap}
                    onChange={e => setCap(e.target.value)}
                />
                <span className="self-center text-slate-400 text-sm">Pasajeros</span>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                    {loading ? '...' : 'Guardar'}
                </button>
            </div>
        </div>
    )
}

export function CronogramaForm({ itinerario }: BaseProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Estado local para todos los checkpoints
    const [times, setTimes] = useState<{ [id: string]: { l: string, s: string } }>(() => {
        const init: any = {}
        itinerario.ruta_critica.forEach(cp => {
            init[cp.id] = {
                l: fromHora(cp.h_llegada),
                s: fromHora(cp.h_salida)
            }
        })
        return init
    })

    const handleChange = (id: string, field: 'l' | 's', val: string) => {
        setTimes(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: val }
        }))
    }

    const handleSave = async () => {
        setLoading(true)
        const clone = JSON.parse(JSON.stringify(itinerario))

        // Preparar payload para operador
        const payload: any = {}
        Object.keys(times).forEach(id => {
            payload[id] = {
                l: toHora(times[id].l),
                s: toHora(times[id].s)
            }
        })

        const updated = actualizarCronograma(clone, payload)

        await updateSalida(itinerario.id_salida, { ruta_critica: updated.ruta_critica })

        setLoading(false)
        router.refresh()
    }

    return (
        <div className="border border-slate-700 p-4 rounded bg-slate-900/50 my-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-indigo-400">Cronograma (Ruta Crítica)</h3>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                    {loading ? '...' : 'Guardar Todo'}
                </button>
            </div>

            <div className="space-y-2">
                {itinerario.ruta_critica.map(cp => (
                    <div key={cp.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-sm border-b border-slate-800 pb-2 last:border-0">
                        <div className="text-slate-200 font-medium">
                            {cp.localizacion === 'POR DEFINIR' ? <span className="text-amber-500/50 italic">Ubicación pendiente</span> : cp.localizacion}
                        </div>
                        <div className="flex flex-col items-end">
                            <label className="text-[10px] text-slate-500">Llegada</label>
                            <input
                                type="time"
                                className="bg-slate-800 border border-slate-600 rounded p-0.5 text-white w-24 text-center"
                                value={times[cp.id]?.l || ''}
                                onChange={e => handleChange(cp.id, 'l', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col items-end">
                            <label className="text-[10px] text-slate-500">Salida</label>
                            <input
                                type="time"
                                className="bg-slate-800 border border-slate-600 rounded p-0.5 text-white w-24 text-center"
                                value={times[cp.id]?.s || ''}
                                onChange={e => handleChange(cp.id, 's', e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function TransporterSelector({ idSalida, currentId, candidates }: { idSalida: string, currentId: string | null, candidates: any[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState(currentId || '')

    const handleAssign = async () => {
        if (!selected) return // Allow user to verify current state if same
        setLoading(true)
        try {
            await assignTransporter(idSalida, selected)
            // Force refresh to update server state and UI
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('Error asignando transportista')
        } finally {
            setLoading(false)
        }
    }

    // Update local state if props change (e.g. after refresh)
    if (currentId && selected !== currentId && !loading) {
        // This might cause infinite loop if not careful. 
        // Actually, let's just initialize state. Better yet, useEffect.
    }
    // Simple version: rely on router.refresh matching currentId, so component re-mounts or we just show current

    return (
        <div className="border border-slate-700 p-4 rounded bg-slate-900/50 my-2">
            <h3 className="font-bold text-emerald-400 mb-2">Asignar Transportista</h3>
            <div className="flex gap-2 items-center">
                <select
                    className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-sm flex-1 h-9"
                    value={selected}
                    onChange={e => setSelected(e.target.value)}
                >
                    <option value="">-- Seleccionar --</option>
                    {candidates.map((c: any) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre} ({c.tipo_unidades})
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleAssign}
                    disabled={loading || !selected}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50 h-9"
                >
                    {loading ? '...' : (selected === currentId ? 'Actualizado' : 'Asignar')}
                </button>
            </div>
            {currentId && (
                <div className="mt-2 text-xs text-emerald-400/80">
                    <span className="font-bold">Asignado:</span> {candidates.find((c: any) => c.id === currentId)?.nombre || 'Desconocido'}
                </div>
            )}
        </div>
    )
}
