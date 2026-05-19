'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, MapPin } from 'lucide-react'
import UsersTab from './tabs/users-tab'
import LocationsTab from './tabs/locations-tab'

export default function ParametragePage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Parametrage</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage users and administrative locations
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="users" className="gap-2">
            <Users className="size-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="size-4" />
            Locations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <LocationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
