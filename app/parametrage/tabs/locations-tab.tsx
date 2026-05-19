'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react'


interface Province {
  id: string
  name: string
  createdAt: string
}

interface Commune {
  id: string
  name: string
  provinceId: string
  createdAt: string
}

interface Zone {
  id: string
  name: string
  communeId: string
  createdAt: string
}

interface Quartier {
  id: string
  name: string
  zoneId: string
  createdAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function LocationsTab() {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [quartiers, setQuartiers] = useState<Quartier[]>([])
  const [loading, setLoading] = useState<{ provinces: boolean; communes: boolean; zones: boolean; quartiers: boolean }>({
    provinces: true,
    communes: true,
    zones: true,
    quartiers: true,
  })
  const [search, setSearch] = useState<{ provinces: string; communes: string; zones: string; quartiers: string }>({
    provinces: '',
    communes: '',
    zones: '',
    quartiers: '',
  })
  const [page, setPage] = useState<{ provinces: number; communes: number; zones: number; quartiers: number }>({
    provinces: 1,
    communes: 1,
    zones: 1,
    quartiers: 1,
  })
  const [pagination, setPagination] = useState<Record<string, PaginationInfo>>({
    provinces: { page: 1, limit: 10, total: 0, totalPages: 0 },
    communes: { page: 1, limit: 10, total: 0, totalPages: 0 },
    zones: { page: 1, limit: 10, total: 0, totalPages: 0 },
    quartiers: { page: 1, limit: 10, total: 0, totalPages: 0 },
  })

  // Fetch data on load and when page/search changes
  useEffect(() => {
    fetchProvinces()
  }, [page.provinces, search.provinces])

  useEffect(() => {
    fetchCommunes()
  }, [page.communes, search.communes])

  useEffect(() => {
    fetchZones()
  }, [page.zones, search.zones])

  useEffect(() => {
    fetchQuartiers()
  }, [page.quartiers, search.quartiers])

  async function fetchProvinces() {
    try {
      const res = await fetch(
        `/api/locations/provinces/list?page=${page.provinces}&limit=10&search=${search.provinces}`
      )
      const data = await res.json()
      setProvinces(data.data)
      setPagination((prev) => ({ ...prev, provinces: data.pagination }))
    } catch (err) {
      console.error('Failed to fetch provinces:', err)
    } finally {
      setLoading((prev) => ({ ...prev, provinces: false }))
    }
  }

  async function fetchCommunes() {
    try {
      const res = await fetch(
        `/api/locations/communes/list?page=${page.communes}&limit=10&search=${search.communes}`
      )
      const data = await res.json()
      setCommunes(data.data)
      setPagination((prev) => ({ ...prev, communes: data.pagination }))
    } catch (err) {
      console.error('Failed to fetch communes:', err)
    } finally {
      setLoading((prev) => ({ ...prev, communes: false }))
    }
  }

  async function fetchZones() {
    try {
      const res = await fetch(
        `/api/locations/zones/list?page=${page.zones}&limit=10&search=${search.zones}`
      )
      const data = await res.json()
      setZones(data.data)
      setPagination((prev) => ({ ...prev, zones: data.pagination }))
    } catch (err) {
      console.error('Failed to fetch zones:', err)
    } finally {
      setLoading((prev) => ({ ...prev, zones: false }))
    }
  }

  async function fetchQuartiers() {
    try {
      const res = await fetch(
        `/api/locations/quartiers/list?page=${page.quartiers}&limit=10&search=${search.quartiers}`
      )
      const data = await res.json()
      setQuartiers(data.data)
      setPagination((prev) => ({ ...prev, quartiers: data.pagination }))
    } catch (err) {
      console.error('Failed to fetch quartiers:', err)
    } finally {
      setLoading((prev) => ({ ...prev, quartiers: false }))
    }
  }

  async function handleAdd(title: string, name: string, parentId?: string) {
    let endpoint = ''
    let body = {}

    switch (title) {
      case 'Provinces':
        endpoint = '/api/locations/provinces'
        body = { name }
        break
      case 'Communes':
        endpoint = '/api/locations/communes'
        body = { name, provinceId: parentId }
        break
      case 'Zones':
        endpoint = '/api/locations/zones'
        body = { name, communeId: parentId }
        break
      case 'Quartiers':
        endpoint = '/api/locations/quartiers'
        body = { name, zoneId: parentId }
        break
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to add location')

      toast.success(`${title.slice(0, -1)} added successfully`)

      // Refresh data
      if (title === 'Provinces') fetchProvinces()
      if (title === 'Communes') fetchCommunes()
      if (title === 'Zones') fetchZones()
      if (title === 'Quartiers') fetchQuartiers()

      return true
    } catch (error) {
      toast.error(`Error adding ${title.slice(0, -1).toLowerCase()}`)
      return false
    }
  }

  return (
    <Tabs defaultValue="provinces" className="w-full">
      <TabsList className="grid w-fit grid-cols-4">
        <TabsTrigger value="provinces">Provinces ({pagination.provinces.total})</TabsTrigger>
        <TabsTrigger value="communes">Communes ({pagination.communes.total})</TabsTrigger>
        <TabsTrigger value="zones">Zones ({pagination.zones.total})</TabsTrigger>
        <TabsTrigger value="quartiers">Quartiers ({pagination.quartiers.total})</TabsTrigger>
      </TabsList>

      <TabsContent value="provinces" className="mt-6">
        <LocationTable
          title="Provinces"
          data={provinces}
          loading={loading.provinces}
          search={search.provinces}
          onSearchChange={(s) => {
            setSearch((prev) => ({ ...prev, provinces: s }))
            setPage((prev) => ({ ...prev, provinces: 1 }))
          }}
          page={page.provinces}
          pagination={pagination.provinces}
          onPageChange={(p) => setPage((prev) => ({ ...prev, provinces: p }))}
          columns={['name', 'createdAt']}
          onAdd={(name) => handleAdd('Provinces', name)}
        />
      </TabsContent>

      <TabsContent value="communes" className="mt-6">
        <LocationTable
          title="Communes"
          data={communes}
          loading={loading.communes}
          search={search.communes}
          onSearchChange={(s) => {
            setSearch((prev) => ({ ...prev, communes: s }))
            setPage((prev) => ({ ...prev, communes: 1 }))
          }}
          page={page.communes}
          pagination={pagination.communes}
          onPageChange={(p) => setPage((prev) => ({ ...prev, communes: p }))}
          columns={['name', 'provinceName', 'createdAt']}
          onAdd={(name, parentId) => handleAdd('Communes', name, parentId)}
        />
      </TabsContent>

      <TabsContent value="zones" className="mt-6">
        <LocationTable
          title="Zones"
          data={zones}
          loading={loading.zones}
          search={search.zones}
          onSearchChange={(s) => {
            setSearch((prev) => ({ ...prev, zones: s }))
            setPage((prev) => ({ ...prev, zones: 1 }))
          }}
          page={page.zones}
          pagination={pagination.zones}
          onPageChange={(p) => setPage((prev) => ({ ...prev, zones: p }))}
          columns={['name', 'communeName', 'createdAt']}
          onAdd={(name, parentId) => handleAdd('Zones', name, parentId)}
        />
      </TabsContent>

      <TabsContent value="quartiers" className="mt-6">
        <LocationTable
          title="Quartiers"
          data={quartiers}
          loading={loading.quartiers}
          search={search.quartiers}
          onSearchChange={(s) => {
            setSearch((prev) => ({ ...prev, quartiers: s }))
            setPage((prev) => ({ ...prev, quartiers: 1 }))
          }}
          page={page.quartiers}
          pagination={pagination.quartiers}
          onPageChange={(p) => setPage((prev) => ({ ...prev, quartiers: p }))}
          columns={['name', 'zoneName', 'createdAt']}
          onAdd={(name, parentId) => handleAdd('Quartiers', name, parentId)}
        />
      </TabsContent>
    </Tabs>
  )
}

interface LocationTableProps {
  title: string
  data: any[]
  loading: boolean
  search: string
  onSearchChange: (search: string) => void
  page: number
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  columns: string[]
  onAdd: (name: string, parentId?: string) => Promise<boolean>
}

function LocationTable({
  title,
  data,
  loading,
  search,
  onSearchChange,
  page,
  pagination,
  onPageChange,
  columns,
  onAdd,
}: LocationTableProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedCommune, setSelectedCommune] = useState<string>('')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const [provinces, setProvinces] = useState<any[]>([])
  const [communes, setCommunes] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      if (title !== 'Provinces') fetchProvinces()
    } else {
      setName('')
      setSelectedProvince('')
      setSelectedCommune('')
      setSelectedZone('')
    }
  }, [open, title])

  useEffect(() => {
    if (selectedProvince) fetchCommunes(selectedProvince)
    else setCommunes([])
  }, [selectedProvince])

  useEffect(() => {
    if (selectedCommune) fetchZones(selectedCommune)
    else setZones([])
  }, [selectedCommune])

  async function fetchProvinces() {
    const res = await fetch('/api/locations/provinces')
    const data = await res.json()
    setProvinces(data)
  }

  async function fetchCommunes(provinceId: string) {
    const res = await fetch(`/api/locations/communes?provinceId=${provinceId}`)
    const data = await res.json()
    setCommunes(data)
  }

  async function fetchZones(communeId: string) {
    const res = await fetch(`/api/locations/zones?communeId=${communeId}`)
    const data = await res.json()
    setZones(data)
  }

  const handleSubmit = async () => {
    if (!name) return
    let parentId = undefined
    if (title === 'Communes') parentId = selectedProvince
    if (title === 'Zones') parentId = selectedCommune
    if (title === 'Quartiers') parentId = selectedZone

    if (title !== 'Provinces' && !parentId) {
      toast.error('Please select the parent administrative level')
      return
    }

    setSubmitting(true)
    const success = await onAdd(name, parentId)
    setSubmitting(false)
    if (success) setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Add {title.slice(0, -1)}
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>Add New {title.slice(0, -1)}</DialogTitle>
              <DialogDescription>Add a new {title.toLowerCase().slice(0, -1)} to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {(title === 'Communes' || title === 'Zones' || title === 'Quartiers') && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Province</label>
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="dark:bg-slate-800">
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(title === 'Zones' || title === 'Quartiers') && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Commune</label>
                  <Select
                    value={selectedCommune}
                    onValueChange={setSelectedCommune}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger className="dark:bg-slate-800">
                      <SelectValue placeholder="Select Commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {communes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {title === 'Quartiers' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Zone</label>
                  <Select
                    value={selectedZone}
                    onValueChange={setSelectedZone}
                    disabled={!selectedCommune}
                  >
                    <SelectTrigger className="dark:bg-slate-800">
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          {z.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  placeholder={`${title.slice(0, -1)} name`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                  Add {title.slice(0, -1)}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>


      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading {title.toLowerCase()}...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">No {title.toLowerCase()} found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Name
                  </th>
                  {columns.includes('provinceName') && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Province
                    </th>
                  )}
                  {columns.includes('communeName') && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Commune
                    </th>
                  )}
                  {columns.includes('zoneName') && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Zone
                    </th>
                  )}
                  {columns.includes('createdAt') && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Created
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    {columns.includes('provinceName') && (
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {item.provinceName || 'Unknown'}
                      </td>
                    )}
                    {columns.includes('communeName') && (
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {item.communeName || 'Unknown'}
                      </td>
                    )}
                    {columns.includes('zoneName') && (
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {item.zoneName || 'Unknown'}
                      </td>
                    )}
                    {columns.includes('createdAt') && (
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit2 className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
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
        {!loading && data.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total}{' '}
              {title.toLowerCase()}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                {page} / {pagination.totalPages}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => onPageChange(page + 1)}
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
