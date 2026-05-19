'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Login failed')
        setLoading(false)
        return
      }
      // redirect home
      router.push('/')
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">MH</div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Sign in to Medicare</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Use your username and password to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-md bg-red-50 dark:bg-red-900 p-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
              placeholder="your.username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 text-blue-600" />
              <span className="text-slate-600 dark:text-slate-300">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">Don't have an account? <a href="#" className="text-blue-600 hover:underline">Contact administrator</a></div>
        </form>
      </div>
    </main>
  )
}
