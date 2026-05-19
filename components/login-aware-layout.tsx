"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export default function LoginAwareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const hide = pathname === "/login" || pathname.startsWith("/login/")

  return (
    <SidebarProvider>
      {!hide && <AppSidebar />}
      <div className="flex flex-1 flex-col w-full">
        {!hide && <AppHeader />}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  )
}
