'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface Review {
  id?: string
  passenger_name?: string
  city?: string
  rating?: number
  comment?: string
  status?: string
  created_at?: string
}

export default function ResenasPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch('https://api.odiseachallenge.com/reviews')
      const data = await res.json()
      if (data && data.reviews) {
        setReviews(data.reviews)
      } else {
        setReviews([])
      }
    } catch (err: any) {
      setError('Error al obtener reseñas del servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <Link href="/" className="text-xs font-bold text-orange-400 hover:underline">
              ← Inicio Agente Operativo
            </Link>
            <h1 className="text-3xl font-bold text-white mt-1">Moderación de Reseñas</h1>
            <p className="text-slate-400 text-xs">Administra y revisa los testimonios dejados por los pasajeros.</p>
          </div>
          <button
            onClick={fetchReviews}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
            Cargando reseñas de pasajeros...
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Reviews List */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                No hay reseñas registradas aún.
              </div>
            ) : (
              reviews.map((r, idx) => (
                <div key={r.id || idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base">{r.passenger_name || 'Pasajero Odisea'}</h3>
                      <p className="text-xs text-slate-400">{r.city || 'San Miguel de Allende'}</p>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-2.5 py-1 rounded-full">
                      {'⭐'.repeat(r.rating || 5)}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    "{r.comment}"
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                    <span>{r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente'}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Aprobada para Web
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  )
}
