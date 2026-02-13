'use client'

import { ViajeVerificacion, ViajeTransportistaPivot } from '@/lib/types_verification'
import { updateViaje, getAvailableTransportistas, addTransportistaToViaje, updateViajeTransportista, uploadTicketPhoto } from '../actions'
import { useState, useEffect } from 'react'

export default function ViajeForm({ initialData, initialPivots }: { initialData: ViajeVerificacion, initialPivots: ViajeTransportistaPivot[] }) {
    const [data, setData] = useState(initialData)
    const [pivots, setPivots] = useState(initialPivots)
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [candidates, setCandidates] = useState<any[]>([])

    // total local
    const total = (data.gasto_gasolina || 0) + (data.gasto_comida || 0) + (data.gasto_hospedaje || 0) + (data.gasto_otros || 0)

    const handleChange = (field: keyof ViajeVerificacion, value: any) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        await updateViaje(data.id, data)
        setLoading(false)
        alert('Viaje guardado')
    }

    const openAddModal = async () => {
        const c = await getAvailableTransportistas(data.id)
        setCandidates(c)
        setModalOpen(true)
    }

    const handleAddCandidate = async (tid: string) => {
        setLoading(true)
        await addTransportistaToViaje(data.id, tid)
        setModalOpen(false)
        setLoading(false)
        window.location.reload() // Force refresh to get new pivot
    }

    return (
        <div className="space-y-8">

            {/* 1. SECCIÓN VIÁTICOS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h2 className="text-indigo-400 font-bold mb-4 uppercase text-xs tracking-widest">Resumen del Viaje</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Input label="Región / Ruta" value={data.region} onChange={(v: string) => handleChange('region', v)} />
                    <Input label="Fecha" type="date" value={data.fecha_viaje} onChange={(v: string) => handleChange('fecha_viaje', v)} />
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-slate-800/50">
                    <h3 className="text-slate-400 text-xs mb-3">GASTOS OPERATIVOS</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Gasolina" type="number" value={data.gasto_gasolina} onChange={(v: string) => handleChange('gasto_gasolina', parseFloat(v))} />
                        <Input label="Comida" type="number" value={data.gasto_comida} onChange={(v: string) => handleChange('gasto_comida', parseFloat(v))} />
                        <Input label="Hospedaje" type="number" value={data.gasto_hospedaje} onChange={(v: string) => handleChange('gasto_hospedaje', parseFloat(v))} />
                        <Input label="Otros" type="number" value={data.gasto_otros} onChange={(v: string) => handleChange('gasto_otros', parseFloat(v))} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-300">TOTAL VIÁTICOS</span>
                        <span className="text-xl font-bold text-emerald-400">${total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-4">
                    <Input label="Notas Generales" type="textarea" value={data.notas_generales || ''} onChange={(v: string) => handleChange('notas_generales', v)} />
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium text-sm transition-colors"
                >
                    {loading ? 'Guardando...' : 'Guardar Datos Generales'}
                </button>
            </div>

            {/* 2. SECCIÓN TRANSPORTISTAS VISITADOS */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-indigo-400 font-bold uppercase text-xs tracking-widest">Transportistas Visitados</h2>
                    <button onClick={openAddModal} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-500">
                        + Agregar Visita
                    </button>
                </div>

                <div className="space-y-4">
                    {pivots.map(p => (
                        <PivotCard key={p.id} pivot={p} />
                    ))}
                    {pivots.length === 0 && <p className="text-slate-600 text-center text-sm py-4">No hay visitas registradas en este viaje.</p>}
                </div>
            </div>

            {/* MODAL ADD */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="font-bold text-white mb-4">Seleccionar Transportista</h3>
                        <div className="space-y-2">
                            {candidates.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleAddCandidate(c.id)}
                                    className="w-full text-left p-3 rounded bg-slate-800 hover:bg-indigo-900/30 border border-slate-700 flex justify-between"
                                >
                                    <span className="text-sm font-bold text-slate-200">{c.nombre}</span>
                                    <span className="text-xs text-slate-500">{c.estado}</span>
                                </button>
                            ))}
                            {candidates.length === 0 && <p className="text-slate-500 text-sm">No hay candidatos disponibles.</p>}
                        </div>
                        <button onClick={() => setModalOpen(false)} className="mt-4 w-full py-2 text-slate-400 hover:text-white">Cerrar</button>
                    </div>
                </div>
            )}

        </div>
    )
}

function PivotCard({ pivot }: { pivot: ViajeTransportistaPivot }) {
    const [notes, setNotes] = useState(pivot.notas_visita || '')
    const [result, setResult] = useState(pivot.resultado)
    const [uploading, setUploading] = useState(false)

    const handleUpdate = async (field: string, val: any) => {
        if (field === 'notas_visita') setNotes(val)
        if (field === 'resultado') setResult(val)

        await updateViajeTransportista(pivot.id, { [field]: val })
    }

    const handleUpload = async (e: any) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            await uploadTicketPhoto(pivot.id, formData)
            // Refresh simple
            window.location.reload()
        } catch (err) {
            alert('Error upload')
        }
        setUploading(false)
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-white">{pivot.transportista?.nombre}</h3>
                <select
                    value={result}
                    onChange={e => handleUpdate('resultado', e.target.value)}
                    className={`text-xs font-bold px-2 py-1 rounded border bg-slate-950 outline-none
                        ${result === 'APROBADO' ? 'text-emerald-400 border-emerald-900' :
                            result === 'RECHAZADO' ? 'text-rose-400 border-rose-900' :
                                'text-amber-400 border-amber-900'}`}
                >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="APROBADO">APROBADO</option>
                    <option value="RECHAZADO">RECHAZADO</option>
                </select>
            </div>

            <textarea
                className="w-full bg-black/20 border border-slate-800 rounded p-2 text-sm text-slate-300 h-20 mb-3"
                placeholder="Notas de la visita (unidades, trato, etc)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={() => handleUpdate('notas_visita', notes)}
            />

            <div>
                <label className="text-xs text-slate-500 mb-2 block">Evidencia / Tickets</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {pivot.fotos_tickets?.map((url, i) => (
                        <a key={i} href={url} target="_blank" className="w-12 h-12 rounded bg-slate-800 border border-slate-700 overflow-hidden relative block hover:opacity-80">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="ticket" className="w-full h-full object-cover" />
                        </a>
                    ))}
                    <label className="w-12 h-12 rounded bg-slate-800 border border-slate-700 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-700 text-slate-500">
                        {uploading ? '...' : '+'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </div>
        </div>
    )
}

function Input({ label, type = 'text', value, onChange }: any) {
    if (type === 'textarea') {
        return (
            <div>
                <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                <textarea
                    className="w-full bg-black/20 border border-slate-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none h-24"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        )
    }
    return (
        <div>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <input
                type={type}
                className="w-full bg-black/20 border border-slate-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    )
}
