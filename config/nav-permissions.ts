/**
 * Navigation Access Control Configuration
 * ----------------------------------------
 * Define which roles can see each navigation group.
 *
 * roles:
 *   - "admin"       → Full access: IT, managers
 *   - "doctor"      → Clinical + patient-facing areas
 *   - "cashier"     → Billing, pharmacy sales, payments
 *   - "pharmacist"  → Pharmacy only
 *   - "user"        → Default / read-only baseline
 *
 * To grant access to ALL roles, use "*".
 * To restrict a group, list specific role names.
 */

export type UserRole = "admin" | "doctor" | "cashier" | "pharmacist" | "user"

export interface NavPermission {
    /** Nav group key — must match the key used in AppSidebar */
    group: string
    /** Allowed roles, or "*" for unrestricted */
    roles: UserRole[] | "*"
}

export const NAV_PERMISSIONS: NavPermission[] = [
    { group: "Overview", roles: "*" },
    { group: "Clinical", roles: ["admin", "doctor", "user"] },
    { group: "Insurance", roles: ["admin", "cashier", "user"] },
    { group: "Billing", roles: ["admin", "cashier", "user"] },
    { group: "Pharmacy", roles: ["admin", "pharmacist", "cashier", "user"] },
    { group: "Finance", roles: ["admin", "cashier", "user"] },
    { group: "System", roles: ["admin", "user"] },
]

export interface NavItem {
    title: string
    href: string
    iconName: string // Store icon name as string to avoid circular or heavy imports
}

export interface NavGroupDefinition {
    label: string
    items: NavItem[]
}

export const NAV_GROUPS_CONFIG: NavGroupDefinition[] = [
    {
        label: "Overview",
        items: [
            { title: "Dashboard", href: "/", iconName: "LayoutDashboard" },
            { title: "Patients", href: "/patients", iconName: "Users" },
        ]
    },
    {
        label: "Clinical",
        items: [
            { title: "Departments", href: "/departments", iconName: "Building2" },
            { title: "Specialties", href: "/specialties", iconName: "Stethoscope" },
            { title: "Services", href: "/services", iconName: "Layers" },
            { title: "Medical Acts", href: "/acts", iconName: "Activity" },
        ]
    },
    {
        label: "Insurance",
        items: [
            { title: "Assurances", href: "/insurances", iconName: "Shield" },
            { title: "Bordereaux", href: "/insurances/claims", iconName: "ScrollText" },
            { title: "Règlements", href: "/insurances/payments", iconName: "History" },
        ]
    },
    {
        label: "Billing",
        items: [
            { title: "Facturation", href: "/billing", iconName: "CreditCard" },
            { title: "Factures", href: "/billing/invoices", iconName: "Receipt" },
            { title: "Rapports", href: "/billing/reports", iconName: "BarChart3" },
        ]
    },
    {
        label: "Pharmacy",
        items: [
            { title: "Ventes", href: "/pharmacy/sales", iconName: "Pill" },
            { title: "Achats", href: "/pharmacy/purchases", iconName: "ShoppingBag" },
            { title: "Stock", href: "/pharmacy/stock", iconName: "Package" },
            { title: "Inventaire", href: "/inventory", iconName: "Boxes" },
            { title: "Mouvements", href: "/pharmacy/movements", iconName: "History" },
            { title: "Catalogue", href: "/pharmacy/medicines", iconName: "Boxes" },
            { title: "Catégories", href: "/pharmacy/categories", iconName: "Tags" },
            { title: "Fournisseurs", href: "/pharmacy/suppliers", iconName: "Truck" },
            { title: "Rapports", href: "/pharmacy/reports", iconName: "BarChart3" },
        ]
    },
    {
        label: "Finance",
        items: [
            { title: "Point de Vente / Caisse", href: "/cash-register", iconName: "Landmark" },
            { title: "Sessions de Caisse", href: "/cash-sessions", iconName: "Clock" },
            // { title: "Historique Paiements", href: "/payments", iconName: "CreditCard" },
            // { title: "Dépenses & Frais", href: "/expenses", iconName: "ArrowDownCircle" },
            // { title: "Journal Comptable", href: "/accounting-journal", iconName: "BookOpen" },
            { title: "Tableau de Bord Finance", href: "/finance", iconName: "BarChart3" },
        ]
    },
    {
        label: "System",
        items: [
            { title: "Parametrage", href: "/parametrage", iconName: "Settings" },
        ]
    },
]

/**
 * Checks if a given role has access to a nav group.
 */
export function canAccessGroup(group: string, role: string): boolean {
    const permission = NAV_PERMISSIONS.find((p) => p.group === group)
    if (!permission) return false
    if (permission.roles === "*") return true
    return (permission.roles as string[]).includes(role)
}
