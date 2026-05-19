'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function UsersPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to create user')
        return
      }

      setSuccess(`User "${formData.username}" created successfully!`)
      setFormData({ username: '', password: '', fullName: '' })
    } catch (err) {
      setError('Network error while creating user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Users</h1>
        <p className="text-slate-600 dark:text-slate-400">Create and manage system users</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
          Create New User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900 p-3 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900 p-3 text-sm text-green-700 dark:text-green-200">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Full Name
            </label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Doe"
              required
              className="dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Username
            </label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="john.doe"
              required
              className="dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Password
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
