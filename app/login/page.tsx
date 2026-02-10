'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Cuenta creada. Ahora inicia sesión.')
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = '/salidas'
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
          Agente Operativo
        </h1>
        <p className="text-slate-500 text-center mb-6 text-sm">
          {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white placeholder:text-slate-500"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white placeholder:text-slate-500"
            required
          />

          {error && (
            <div className="bg-rose-900/30 border border-rose-800 text-rose-300 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-300 p-3 rounded text-sm">
              {success}
            </div>
          )}

          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded font-medium">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full mt-4 text-slate-400 text-sm hover:text-indigo-400"
        >
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}
