'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Edit2, Power, PowerOff } from 'lucide-react'

interface User {
  id: string
  username: string
  fullName: string | null
  role: string
  isActive: boolean
  createdAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ROLES = ['admin', 'user', 'doctor', 'staff']

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'user',
  })

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/list?page=${page}&limit=10&search=${search}`)
      const data = await res.json()
      setUsers(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError('Failed to fetch users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setIsEditMode(false)
    setEditingUserId(null)
    setFormData({ username: '', password: '', fullName: '', role: 'user' })
    setIsDialogOpen(true)
    setError(null)
    setSuccess(null)
  }

  function openEditDialog(user: User) {
    setIsEditMode(true)
    setEditingUserId(user.id)
    setFormData({ username: user.username, password: '', fullName: user.fullName || '', role: user.role })
    setIsDialogOpen(true)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const url = isEditMode ? `/api/users/${editingUserId}` : '/api/users/create'
      const method = isEditMode ? 'PATCH' : 'POST'
      const body = isEditMode
        ? { fullName: formData.fullName, role: formData.role }
        : { ...formData }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to save user')
        return
      }

      setSuccess(isEditMode ? 'User updated successfully!' : `User "${formData.username}" created successfully!`)
      setFormData({ username: '', password: '', fullName: '', role: 'user' })
      setIsDialogOpen(false)
      fetchUsers()
    } catch (err) {
      setError('Network error while saving user')
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!res.ok) throw new Error('Failed to update')
      setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (err) {
      setError('Failed to update user status')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setSuccess('User deleted successfully')
      fetchUsers()
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="size-4" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit User' : 'Create New User'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update user information' : 'Add a new user to the system'}
              </DialogDescription>
            </DialogHeader>
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
                  disabled={isEditMode}
                  className="dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              {!isEditMode && (
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
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Role</label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{isEditMode ? 'Update User' : 'Create User'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {user.fullName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.username}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(user)}
                          title="Edit user"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          className={user.isActive ? 'text-blue-600 hover:text-blue-700' : 'text-orange-600 hover:text-orange-700'}
                        >
                          {user.isActive ? <Power className="size-4" /> : <PowerOff className="size-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete user"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                {page} / {pagination.totalPages}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
