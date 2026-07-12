"use client"

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
}: {
  label: string;
  items: any[];
}) {
  const pathname = usePathname()
  const { user } = useCurrentUser()
  const role = user?.role ?? "user"

  const visibleItems = items.filter(item => {
    const itemKey = `${label}:${item.title}`
    return canAccessGroup(itemKey, role)
  })

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
        {!loading &&
          NAV_GROUPS_CONFIG.filter(({ label }) => canAccessGroup(label, role)).map(
            ({ label, items }) => (
              <NavGroup key={label} label={label} items={items} />
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
