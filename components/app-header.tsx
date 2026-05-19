"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Moon, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { patients } from "@/lib/mock-data"

export function AppHeader() {
  const { setTheme, theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const filteredPatients = patients.filter(
    (p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  )

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      {/* Global Patient Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name or phone..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowResults(e.target.value.length > 0)
          }}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onFocus={() => searchQuery.length > 0 && setShowResults(true)}
          className="pl-9 h-9 bg-background"
        />
        {showResults && searchQuery && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg">
            {filteredPatients.length > 0 ? (
              filteredPatients.slice(0, 5).map((patient) => (
                <button
                  key={patient.id}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
                  onMouseDown={() => {
                    router.push(`/patients`)
                    setSearchQuery("")
                    setShowResults(false)
                  }}
                >
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-popover-foreground">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{patient.phone}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">No patients found</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@medicore.com</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
