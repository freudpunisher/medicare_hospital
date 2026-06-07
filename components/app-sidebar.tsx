"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Building2,
  Stethoscope,
  Layers,
  Activity,
  UserCog,
  Shield,
  ScrollText,
  Receipt,
  Landmark,
  Clock,
  CreditCard,
  ArrowDownCircle,
  BookOpen,
  BarChart3,
  Heart,
  Settings,
  Pill,
  Package,
  ShoppingBag,
  History,
  Tags,
  Boxes,
  Truck,
} from "lucide-react"
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
import { canAccessGroup } from "@/config/nav-permissions"
import { useCurrentUser } from "@/hooks/use-current-user"

// ─── Nav Definitions ─────────────────────────────────────────────────────────
// To add a new section: 1) add items here, 2) add to NAV_GROUPS below,
// 3) add permissions in config/nav-permissions.ts

const mainNav = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Patients", href: "/patients", icon: Users },
  // { title: "Doctors", href: "/doctors", icon: UserCog },
]

const clinicalNav = [
  { title: "Departments", href: "/departments", icon: Building2 },
  { title: "Specialties", href: "/specialties", icon: Stethoscope },
  { title: "Services", href: "/services", icon: Layers },
  { title: "Medical Acts", href: "/acts", icon: Activity },
]

const insuranceNav = [
  { title: "Assurances", href: "/insurances", icon: Shield },
  // { title: "Bordereaux", href: "/insurances/claims", icon: ScrollText },
  // { title: "Règlements", href: "/insurances/payments", icon: History },
]

const billingNav = [
  { title: "Facturation", href: "/billing", icon: CreditCard },
  { title: "Factures", href: "/billing/invoices", icon: Receipt },
  { title: "Rapports", href: "/billing/reports", icon: BarChart3 },
]

const financeNav = [
  { title: "Cash Register", href: "/cash-register", icon: Landmark },
  { title: "Cash Sessions", href: "/cash-sessions", icon: Clock },
  { title: "Payments", href: "/payments", icon: CreditCard },
  { title: "Expenses", href: "/expenses", icon: ArrowDownCircle },
  { title: "Accounting Journal", href: "/accounting-journal", icon: BookOpen },
  { title: "Financial Reports", href: "/financial-reports", icon: BarChart3 },
]

const parametrageNav = [
  { title: "Parametrage", href: "/parametrage", icon: Settings },
]

const pharmacyNav = [
  { title: "Ventes", href: "/pharmacy/sales", icon: Pill },
  { title: "Achats", href: "/pharmacy/purchases", icon: ShoppingBag },
  { title: "Stock", href: "/pharmacy/stock", icon: Package },
  { title: "Inventaire", href: "/inventory", icon: Boxes },
  { title: "Mouvements", href: "/pharmacy/movements", icon: History },
  { title: "Catalogue", href: "/pharmacy/medicines", icon: Boxes },
  { title: "Catégories", href: "/pharmacy/categories", icon: Tags },
  { title: "Fournisseurs", href: "/pharmacy/suppliers", icon: Truck },
  { title: "Rapports", href: "/pharmacy/reports", icon: BarChart3 },
]

/**
 * NAV_GROUPS ties each group label to its items.
 * The label must match the key in NAV_PERMISSIONS in config/nav-permissions.ts
 */
const NAV_GROUPS = [
  { label: "Overview", items: mainNav },
  { label: "Clinical", items: clinicalNav },
  { label: "Insurance", items: insuranceNav },
  { label: "Billing", items: billingNav },
  { label: "Pharmacy", items: pharmacyNav },
  // { label: "Finance", items: financeNav },
  { label: "System", items: parametrageNav },
]

// ─── Components ──────────────────────────────────────────────────────────────

function NavGroup({ label, items }: { label: string; items: typeof mainNav }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
              >
                <Link href={item.href}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
            <Heart className="size-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">MediCore</span>
            <span className="text-[10px] text-sidebar-foreground/60">Hospital Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {!loading &&
          NAV_GROUPS.filter(({ label }) => canAccessGroup(label, role)).map(
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
