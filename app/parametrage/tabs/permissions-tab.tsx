"use client"

import { useState, useEffect } from "react"
import { Shield, Save, Loader2, Check, X, Info, ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { NAV_GROUPS_CONFIG } from "@/config/nav-permissions"

const ROLES = ["admin", "doctor", "cashier", "pharmacist", "user"]

interface PermissionMapping {
    group: string
    roles: string
}

export default function PermissionsTab() {
    const [permissions, setPermissions] = useState<Record<string, string[] | "*">>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchPermissions()
    }, [])

    async function fetchPermissions() {
        try {
            const res = await fetch("/api/system/permissions")
            const json = await res.json()
            if (res.ok) {
                const mapping: Record<string, string[] | "*"> = {}
                json.data.forEach((p: PermissionMapping) => {
                    mapping[p.group] = p.roles === "*" ? "*" : p.roles.split(",").filter(Boolean)
                })
                setPermissions(mapping)
            }
        } catch (err) {
            toast.error("Erreur de chargement")
        } finally {
            setLoading(false)
        }
    }

    function getGroupPerms(group: string): { isFullAccess: boolean; roles: string[] } {
        const p = permissions[group]
        return {
            isFullAccess: p === "*",
            roles: Array.isArray(p) ? p as string[] : []
        }
    }

    function getItemPerms(group: string, item: string): { isFullAccess: boolean; roles: string[] } {
        const key = `${group}:${item}`
        const p = permissions[key]
        return {
            isFullAccess: p === "*",
            roles: Array.isArray(p) ? p as string[] : []
        }
    }

    function handleGroupFullAccess(group: string, isUnrestricted: boolean) {
        setPermissions(prev => ({ ...prev, [group]: isUnrestricted ? "*" : [] }))
    }

    function handleGroupRole(group: string, role: string) {
        const current = permissions[group] || []
        if (current === "*") return
        const next = current.includes(role)
            ? (current as string[]).filter(r => r !== role)
            : [...(current as string[]), role]
        setPermissions(prev => ({ ...prev, [group]: next }))
    }

    function handleItemFullAccess(group: string, item: string, isUnrestricted: boolean) {
        const key = `${group}:${item}`
        setPermissions(prev => ({ ...prev, [key]: isUnrestricted ? "*" : [] }))
    }

    function handleItemRole(group: string, item: string, role: string) {
        const key = `${group}:${item}`
        const current = permissions[key]
        if (current === "*") return
        const currentRoles = Array.isArray(current) ? current as string[] : []
        const next = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role]
        setPermissions(prev => ({ ...prev, [key]: next }))
    }

    async function handleSave(group: string) {
        setSaving(group)

        const groupRoles = permissions[group] === "*" ? "*" : (permissions[group] as string[])?.join(",") || "*"
        try {
            const res = await fetch("/api/system/permissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ group, roles: groupRoles })
            })
            if (!res.ok) throw new Error()

            const groupConfig = NAV_GROUPS_CONFIG.find(g => g.label === group)
            if (groupConfig) {
                for (const item of groupConfig.items) {
                    const key = `${group}:${item.title}`
                    if (permissions[key] !== undefined) {
                        const itemRoles = permissions[key] === "*" ? "*" : (permissions[key] as string[])?.join(",")
                        await fetch("/api/system/permissions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ group: key, roles: itemRoles })
                        })
                    }
                }
            }

            toast.success(`Permissions pour ${group} mises à jour`)
        } catch (err) {
            toast.error("Erreur lors de la sauvegarde")
        } finally {
            setSaving(null)
        }
    }

    function toggleGroup(group: string) {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
    }

    if (loading) return <div className="p-12 text-center"><Loader2 className="size-8 animate-spin mx-auto opacity-20" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800">
                <Info className="size-5 shrink-0" />
                <p className="text-xs font-semibold uppercase tracking-wide">
                    Les modifications ici impactent directement la visibilité des menus pour tous les utilisateurs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {NAV_GROUPS_CONFIG.map((groupDef) => {
                    const group = groupDef.label
                    const { isFullAccess: groupFull, roles: groupRoles } = getGroupPerms(group)
                    const isExpanded = expandedGroups[group] ?? false
                    const hasItems = groupDef.items.length > 0

                    return (
                        <Card key={group} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden flex flex-col">
                            <CardHeader
                                className={cn(
                                    "bg-slate-50 border-b border-slate-100 pb-4 cursor-pointer select-none",
                                    isExpanded && "rounded-none"
                                )}
                                onClick={() => toggleGroup(group)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {hasItems && (
                                            <div className="text-slate-400 mt-0.5">
                                                {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                            </div>
                                        )}
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">{group}</CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Accès Navigation</CardDescription>
                                        </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                        <Shield className={cn("size-4", groupFull ? "text-emerald-500" : "text-slate-400")} />
                                    </div>
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="p-6 space-y-6 flex-1">
                                    {/* Group-level permissions */}
                                    <div>
                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Groupe - Accès Public (*)</Label>
                                            <Checkbox
                                                checked={groupFull}
                                                onCheckedChange={(val) => handleGroupFullAccess(group, val as boolean)}
                                                className="rounded-lg h-5 w-5"
                                            />
                                        </div>

                                        {!groupFull && (
                                            <div className="space-y-2 mb-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rôles du Groupe</Label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {ROLES.map((role) => (
                                                        <div
                                                            key={role}
                                                            className={cn(
                                                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest",
                                                                groupRoles.includes(role)
                                                                    ? "bg-primary/5 border-primary/20 text-primary"
                                                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                            )}
                                                            onClick={() => handleGroupRole(group, role)}
                                                        >
                                                            {groupRoles.includes(role) ? <Check className="size-2.5" /> : <X className="size-2.5 opacity-20" />}
                                                            {role}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Item-level permissions */}
                                    {groupDef.items.length > 0 && (
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Éléments du Menu</Label>
                                            {groupDef.items.map((item) => {
                                                const { isFullAccess: itemFull, roles: itemRoles } = getItemPerms(group, item.title)

                                                return (
                                                    <div key={item.title} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{item.title}</span>
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Public</Label>
                                                                <Checkbox
                                                                    checked={itemFull}
                                                                    onCheckedChange={(val) => handleItemFullAccess(group, item.title, val as boolean)}
                                                                    className="rounded-lg h-4 w-4"
                                                                />
                                                            </div>
                                                        </div>

                                                        {!itemFull && (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {ROLES.map((role) => (
                                                                    <div
                                                                        key={role}
                                                                        className={cn(
                                                                            "flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all cursor-pointer text-[9px] font-bold uppercase tracking-widest",
                                                                            itemRoles.includes(role)
                                                                                ? "bg-primary/5 border-primary/20 text-primary"
                                                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                                        )}
                                                                        onClick={() => handleItemRole(group, item.title, role)}
                                                                    >
                                                                        {itemRoles.includes(role) ? <Check className="size-2" /> : <X className="size-2 opacity-20" />}
                                                                        {role}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            )}

                            <div className="p-4 bg-slate-50 border-t border-slate-100">
                                <Button
                                    className="w-full rounded-2xl h-10 font-black uppercase text-[10px] tracking-widest bg-slate-900 hover:bg-black text-white"
                                    onClick={() => handleSave(group)}
                                    disabled={saving === group}
                                >
                                    {saving === group ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                                    Enregistrer
                                </Button>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
