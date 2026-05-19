'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Province {
  id: string
  name: string
}

interface Commune {
  id: string
  name: string
}

interface Zone {
  id: string
  name: string
}

interface Quartier {
  id: string
  name: string
}

export default function LocationsPage() {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [quartiers, setQuartiers] = useState<Quartier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedCommune, setSelectedCommune] = useState<string>('')
  const [selectedZone, setSelectedZone] = useState<string>('')

  // Fetch provinces on mount
  useEffect(() => {
    async function fetchProvinces() {
      try {
        const res = await fetch('/api/locations/provinces')
        const data = await res.json()
        setProvinces(data)
      } catch (err) {
        console.error('Failed to fetch provinces:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProvinces()
  }, [])

  // Fetch communes when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCommunes([])
      setSelectedCommune('')
      setQuartiers([])
      return
    }

    async function fetchCommunes() {
      try {
        const res = await fetch(`/api/locations/communes?provinceId=${selectedProvince}`)
        const data = await res.json()
        setCommunes(data)
        setSelectedCommune('')
        setZones([])
        setSelectedZone('')
        setQuartiers([])
      } catch (err) {
        console.error('Failed to fetch communes:', err)
      }
    }
    fetchCommunes()
  }, [selectedProvince])

  // Fetch zones when commune changes
  useEffect(() => {
    if (!selectedCommune) {
      setZones([])
      setSelectedZone('')
      setQuartiers([])
      return
    }

    async function fetchZones() {
      try {
        const res = await fetch(`/api/locations/zones?communeId=${selectedCommune}`)
        const data = await res.json()
        setZones(data)
        setSelectedZone('')
        setQuartiers([])
      } catch (err) {
        console.error('Failed to fetch zones:', err)
      }
    }
    fetchZones()
  }, [selectedCommune])

  // Fetch quartiers when zone changes
  useEffect(() => {
    if (!selectedZone) {
      setQuartiers([])
      return
    }

    async function fetchQuartiers() {
      try {
        const res = await fetch(`/api/locations/quartiers?zoneId=${selectedZone}`)
        const data = await res.json()
        setQuartiers(data)
      } catch (err) {
        console.error('Failed to fetch quartiers:', err)
      }
    }
    fetchQuartiers()
  }, [selectedZone])

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-400">Loading provinces...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Locations</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Browse Burundi provinces, communes, zones, and quartiers
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Province
          </label>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
              <SelectValue placeholder="Select a province" />
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

        {selectedProvince && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Commune
            </label>
            <Select value={selectedCommune} onValueChange={setSelectedCommune}>
              <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                <SelectValue placeholder="Select a commune" />
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

        {selectedCommune && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Zone
            </label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                <SelectValue placeholder="Select a zone" />
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

        {selectedZone && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Quartier
            </label>
            <Select>
              <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                <SelectValue placeholder="Select a quartier" />
              </SelectTrigger>
              <SelectContent>
                {quartiers.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}


        <div className="pt-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p>
              <strong>Selected Province:</strong> {provinces.find((p) => p.id === selectedProvince)?.name || 'None'}
            </p>
            <p>
              <strong>Selected Commune:</strong> {communes.find((c) => c.id === selectedCommune)?.name || 'None'}
            </p>
            <p>
              <strong>Selected Zone:</strong> {zones.find((z) => z.id === selectedZone)?.name || 'None'}
            </p>

          </div>
        </div>
      </Card>
    </div>
  )
}
