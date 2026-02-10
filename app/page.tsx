import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <header className="mb-12 text-center pt-10">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
          Agente Operativo
        </h1>
        <p className="text-slate-500 mt-2">Hub de Operaciones y Logística</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

        {/* Module 1: Salidas */}
        <Link href="/salidas" className="group bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all">
          <div className="text-4xl mb-4">🛫</div>
          <h2 className="text-2xl font-bold text-white group-hover:text-indigo-300">Salidas</h2>
          <p className="text-slate-500 mt-2">Gestión de itinerarios, planeación y certificación de rutas.</p>
        </Link>

        {/* Module 2: Transportistas */}
        <Link href="/transportistas" className="group bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all">
          <div className="text-4xl mb-4">🚌</div>
          <h2 className="text-2xl font-bold text-white group-hover:text-emerald-300">Transportistas</h2>
          <p className="text-slate-500 mt-2">Directorio de proveedores, unidades y estado de certificación.</p>
        </Link>

        {/* Module 3: Verificaciones */}
        <Link href="/verificaciones" className="group bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-amber-500/50 hover:bg-slate-900/80 transition-all">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-white group-hover:text-amber-300">Verificaciones</h2>
          <p className="text-slate-500 mt-2">Control de viáticos, scouting y validación en campo.</p>
        </Link>

      </div>
    </div>
  )
}
