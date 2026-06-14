"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Icons from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { canAccessGroup, NAV_GROUPS_CONFIG } from "@/config/nav-permissions"
import { useCurrentUser } from "@/hooks/use-current-user"

// ─── Components ──────────────────────────────────────────────────────────────

function NavGroup({
  label,
  items,
  checkAccess
}: {
  label: string;
  items: any[];
  checkAccess: (label: string, itemTitle?: string) => boolean
}) {
  const pathname = usePathname()

  // Filter items based on access
  const visibleItems = items.filter(item => checkAccess(label, item.title))
  if (visibleItems.length === 0) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const IconComponent = (Icons as any)[item.iconName] || Icons.HelpCircle
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <IconComponent className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { user, loading } = useCurrentUser()
  const role = user?.role ?? "user"
  const [dbPermissions, setDbPermissions] = useState<Record<string, string[] | "*">>({})
  const [loadingPerms, setLoadingPerms] = useState(true)

  useEffect(() => {
    async function fetchPerms() {
      try {
        const res = await fetch("/api/system/permissions")
        const json = await res.json()
        if (res.ok) {
          const mapping: Record<string, string[] | "*"> = {}
          json.data.forEach((p: any) => {
            mapping[p.group] = p.roles === "*" ? "*" : p.roles.split(",")
          })
          setDbPermissions(mapping)
        }
      } catch (err) {
        console.error("Failed to fetch menu permissions", err)
      } finally {
        setLoadingPerms(false)
      }
    }
    fetchPerms()
  }, [])

  function checkAccess(groupLabel: string, itemTitle?: string) {
    const key = itemTitle ? `${groupLabel}:${itemTitle}` : groupLabel

    // If we have DB permissions for this exact key, use them
    if (dbPermissions[key]) {
      const perms = dbPermissions[key]
      if (perms === "*") return true
      return perms.includes(role)
    }

    // Special case: if we are checking an item and it has no DB record, 
    // it defaults to the group permission or static config.
    if (itemTitle) {
      // Just return true for items if no specific record exists (defaulting to group perms)
      // because the group filtering happens at the parent.
      return true
    }

    // Fallback for Groups only
    return canAccessGroup(groupLabel, role)
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="px-3 py-4">
        <Link href="/" className="flex items-center gap-2 px-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Icons.Heart className="size-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">MediCore</span>
            <span className="text-[10px] text-sidebar-foreground/60">Hospital Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {(!loading && !loadingPerms) &&
          NAV_GROUPS_CONFIG.filter(({ label }) => checkAccess(label)).map(
            ({ label, items }) => (
              <NavGroup key={label} label={label} items={items} checkAccess={checkAccess} />
            )
          )}
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="px-3 py-2 space-y-0.5">
          {user && (
            <p className="text-[10px] text-sidebar-foreground/60 font-medium uppercase tracking-widest">
              {user.fullName ?? user.username}
              <span className="ml-1 opacity-50">· {user.role}</span>
            </p>
          )}
          <p className="text-[10px] text-sidebar-foreground/40">MediCore HMS v1.0</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
