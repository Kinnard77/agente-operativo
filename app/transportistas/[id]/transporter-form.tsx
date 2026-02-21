'use client'

import { Transportista, EstadoTransportista } from '@/lib/types_verification'
import { updateTransportista } from '../actions'
import { deleteViajeTransportista } from '../../verificaciones/actions'
import { useState } from 'react'

export default function TransporterForm({ initialData, history }: { initialData: Transportista, history: any[] }) {
    const [data, setData] = useState(initialData)
    const [loading, setLoading] = useState(false)
    const [historial, setHistorial] = useState(history)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleChange = (field: keyof Transportista, value: any) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        await updateTransportista(data.id, data)
        setLoading(false)
        alert('Guardado correctamente')
    }

    const handleCertify = async () => {
        if (!confirm('¿Confirmas que este transportista cumple con TODOS los requisitos?')) return;
        setLoading(true)
        await updateTransportista(data.id, { estado: 'CERTIFICADO' })
        setLoading(false)
        setData(prev => ({ ...prev, estado: 'CERTIFICADO' }))
    }

    const handleDeleteHistorial = async (pivotId: string) => {
        if (!confirm('¿Eliminar este registro del historial?')) return;
        setDeletingId(pivotId)
        await deleteViajeTransportista(pivotId)
        setHistorial(prev => prev.filter(h => h.id !== pivotId))
        setDeletingId(null)
    }

    const hasApprovedVisits = historial.some(h => h.resultado === 'APROBADO')
    const canCertify = data.estado === 'VERIFICANDO' && hasApprovedVisits

    return (
        <div className="space-y-6">
            {/* Estado Banner */}
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div>
                    <label className="text-xs text-slate-500 uppercase">Estado Actual</label>
                    <div className="font-bold text-xl text-white">{data.estado}</div>
                </div>
                {canCertify && (
                    <button
                        onClick={handleCertify}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20"
                    >
                        ✓ CERTIFICAR
                    </button>
                )}
            </div>

            {/* Formulario */}
            <div className="space-y-4">
                <Input label="Nombre de la Empresa" value={data.nombre} onChange={(v: string) => handleChange('nombre', v)} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Contacto" value={data.contacto || ''} onChange={(v: string) => handleChange('contacto', v)} />
                    <Input label="Teléfono" value={data.telefono || ''} onChange={(v: string) => handleChange('telefono', v)} />
                </div>
                <Input label="Email" type="email" value={data.email || ''} onChange={(v: string) => handleChange('email', v)} />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Tipo Unidades" value={data.tipo_unidades || ''} placeholder="Ej. Sprinter" onChange={(v: string) => handleChange('tipo_unidades', v)} />
                    <Input label="Capacidad Max (PAX)" type="number" value={data.capacidad_maxima} onChange={(v: string) => handleChange('capacidad_maxima', parseInt(v))} />
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                    <Checkbox
                        id="seguro"
                        label="Tiene Seguro de Viajero Vigente"
                        checked={!!data.tiene_seguro_viajero}
                        onChange={v => handleChange('tiene_seguro_viajero', v)}
                    />
                    <Checkbox
                        id="contrato"
                        label="Contrato Firmado"
                        checked={!!data.contrato_firmado}
                        onChange={v => handleChange('contrato_firmado', v)}
                    />
                </div>

                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Estado</label>
                    <select
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"
                        value={data.estado}
                        onChange={e => handleChange('estado', e.target.value)}
                    >
                        <option value="CANDIDATO">CANDIDATO</option>
                        <option value="VERIFICANDO">VERIFICANDO</option>
                        <option value="CERTIFICADO">CERTIFICADO</option>
                        <option value="RECHAZADO">RECHAZADO</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Notas</label>
                    <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white h-24"
                        value={data.notas || ''}
                        onChange={e => handleChange('notas', e.target.value)}
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-4 rounded-xl font-bold text-lg sticky bottom-4 shadow-xl transition-all"
            >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            {/* Historial con edición/borrado */}
            <div className="pt-8 border-t border-slate-800">
                <h3 className="text-lg font-bold text-slate-400 mb-4">Historial de Verificaciones</h3>
                {historial.length === 0 ? (
                    <p className="text-slate-600 italic">No verificado en ningún viaje aún.</p>
                ) : (
                    <div className="space-y-3">
                        {historial.map((h: any) => (
                            <div key={h.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-bold text-slate-300">{h.viaje?.region || 'Viaje sin región'}</div>
                                        <div className="text-xs text-slate-500">{h.viaje?.fecha_viaje}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded border 
                                            ${h.resultado === 'APROBADO' ? 'text-emerald-400 border-emerald-900 bg-emerald-900/20' :
                                                h.resultado === 'RECHAZADO' ? 'text-rose-400 border-rose-900 bg-rose-900/20' :
                                                    'text-amber-400 border-amber-900 bg-amber-900/20'}`}>
                                            {h.resultado}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteHistorial(h.id)}
                                            disabled={deletingId === h.id}
                                            className="text-rose-500 hover:text-rose-400 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                                            title="Eliminar registro"
                                        >
                                            {deletingId === h.id ? '...' : '🗑️'}
                                        </button>
                                    </div>
                                </div>
                                {h.notas_visita && (
                                    <p className="text-xs text-slate-500 mt-2 italic border-t border-slate-800 pt-2">{h.notas_visita}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function Input({ label, type = 'text', value, onChange, placeholder }: any) {
    return (
        <div>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <input
                type={type}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    )
}

function Checkbox({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 cursor-pointer" onClick={() => onChange(!checked)}>
            <input
                type="checkbox"
                id={id}
                className="w-5 h-5 accent-indigo-500 cursor-pointer"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                onClick={e => e.stopPropagation()}
            />
            <label htmlFor={id} className="text-sm font-medium cursor-pointer select-none">{label}</label>
        </div>
    )
}
