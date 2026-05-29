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
    {
        group: "Overview",
        roles: "*",
    },
    {
        group: "Clinical",
        roles: ["admin", "doctor", "user"],
    },
    {
        group: "Insurance",
        roles: ["admin", "cashier"],
    },
    {
        group: "Billing",
        roles: ["admin", "cashier"],
    },
    {
        group: "Pharmacy",
        roles: ["admin", "pharmacist", "cashier"],
    },
    {
        group: "Finance",
        roles: ["admin"],
    },
    {
        group: "System",
        roles: ["admin"],
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
