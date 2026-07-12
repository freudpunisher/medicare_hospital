"use client"

import { Shield, Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { NAV_PERMISSIONS, type UserRole } from "@/config/nav-permissions"
import { NAV_GROUPS_CONFIG } from "@/config/nav-permissions"

const ROLES: UserRole[] = ["admin", "doctor", "cashier", "pharmacist", "user"]

export default function PermissionsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800">
        <Shield className="size-5 shrink-0" />
        <p className="text-xs font-semibold uppercase tracking-wide">
          Les permissions sont définies dans la configuration de l'application. Contactez un administrateur pour modifier les accès.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {NAV_GROUPS_CONFIG.map((groupDef) => {
          const groupPerm = NAV_PERMISSIONS.find((p) => p.group === groupDef.label)
          const isUnrestricted = groupPerm?.roles === "*"
          const allowedRoles = isUnrestricted ? ROLES : (groupPerm?.roles as UserRole[]) ?? []

          return (
            <Card key={groupDef.label} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">{groupDef.label}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Accès Navigation</CardDescription>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <Shield className={cn("size-4", isUnrestricted ? "text-emerald-500" : "text-slate-400")} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4 flex-1">
                {/* Group roles */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Accès Groupe</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((role) => (
                      <div
                        key={role}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest",
                          isUnrestricted
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : allowedRoles.includes(role)
                              ? "bg-primary/5 border-primary/20 text-primary"
                              : "bg-white border-slate-100 text-slate-300"
                        )}
                      >
                        {isUnrestricted || allowedRoles.includes(role)
                          ? <Check className="size-2.5" />
                          : <X className="size-2.5" />}
                        {role}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Item-level roles */}
                {groupDef.items.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Éléments du Menu</p>
                    {groupDef.items.map((item) => {
                      const itemPerms = groupPerm?.items?.[item.title]
                      const itemUnrestricted = itemPerms === "*"
                      const itemRoles = itemUnrestricted ? ROLES : (itemPerms as UserRole[] | undefined) ?? allowedRoles

                      return (
                        <div key={item.title} className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">{item.title}</p>
                          <div className="flex flex-wrap gap-1">
                            {ROLES.map((role) => (
                              <div
                                key={role}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest",
                                  itemUnrestricted
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : itemRoles.includes(role)
                                      ? "bg-primary/5 border-primary/20 text-primary"
                                      : "bg-white border-slate-100 text-slate-300"
                                )}
                              >
                                {itemUnrestricted || itemRoles.includes(role)
                                  ? <Check className="size-2" />
                                  : <X className="size-2" />}
                                {role}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
