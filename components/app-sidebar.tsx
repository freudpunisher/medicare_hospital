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

const mainNav = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Patients", href: "/patients", icon: Users },
  { title: "Doctors", href: "/doctors", icon: UserCog },
]

const clinicalNav = [
  { title: "Departments", href: "/departments", icon: Building2 },
  { title: "Specialties", href: "/specialties", icon: Stethoscope },
  { title: "Services", href: "/services", icon: Layers },
  { title: "Medical Acts", href: "/acts", icon: Activity },
]

const insuranceNav = [
  { title: "Insurances", href: "/insurances", icon: Shield },
  { title: "Insurance Rules", href: "/insurance-rules", icon: ScrollText },
]

const billingNav = [
  { title: "Billing", href: "/billing", icon: Receipt },
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
  { title: "Mouvements", href: "/pharmacy/movements", icon: History },
  { title: "Catalogue", href: "/pharmacy/medicines", icon: Boxes },
  { title: "Catégories", href: "/pharmacy/categories", icon: Tags },
  { title: "Fournisseurs", href: "/pharmacy/suppliers", icon: Truck },
]

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
        <NavGroup label="Overview" items={mainNav} />
        <NavGroup label="Clinical" items={clinicalNav} />
        <NavGroup label="Insurance" items={insuranceNav} />
        <NavGroup label="Billing" items={billingNav} />
        <NavGroup label="Pharmacy" items={pharmacyNav} />
        <NavGroup label="Finance" items={financeNav} />
        <NavGroup label="System" items={parametrageNav} />
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="px-3 py-2">
          <p className="text-[10px] text-sidebar-foreground/40">MediCore HMS v1.0</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
