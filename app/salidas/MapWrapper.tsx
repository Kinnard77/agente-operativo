'use client'
import React from 'react'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('../components/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-slate-900 animate-pulse rounded-xl flex items-center justify-center text-slate-500 text-sm">Cargando mapa...</div>
})

interface MapWrapperProps {
    trips: any[];
}

export default function MapWrapper({ trips }: MapWrapperProps) {
    return <MapComponent trips={trips} />
}
