"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Moon,
  Sun,
  User,
  KeyRound,
  Loader2,
  ShieldCheck,
  LayoutGrid,
  Zap,
  LayoutDashboard,
  Users,
  ClipboardList,
  FlaskConical,
  Shield,
  ScrollText,
  Receipt,
  ReceiptText,
  Pill,
  Package,
  Landmark,
  Clock,
  ClipboardCheck,
  Building2,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useCurrentUser } from "@/hooks/use-current-user"
import { canAccessGroup } from "@/config/nav-permissions"
import { toast } from "sonner"

interface Shortcut {
  title: string
  href: string
  group: string
  icon: any
}

const SHORTCUTS: Shortcut[] = [
  { title: "Dashboard", href: "/", group: "Overview", icon: LayoutDashboard },
  { title: "Patients", href: "/patients", group: "Overview", icon: Users },
  { title: "Consultations", href: "/consultations", group: "Clinical", icon: ClipboardList },
  { title: "Demandes Laboratoire", href: "/lab/orders", group: "Laboratory", icon: FlaskConical },
  { title: "Assurances", href: "/insurances", group: "Insurance", icon: Shield },
  { title: "Bordereaux", href: "/insurances/claims", group: "Insurance", icon: ScrollText },
  { title: "Facturation", href: "/billing", group: "Billing", icon: Receipt },
  { title: "Factures", href: "/billing/invoices", group: "Billing", icon: ReceiptText },
  { title: "Ventes Pharmacie", href: "/pharmacy/sales", group: "Pharmacy", icon: Pill },
  { title: "Stock Pharmacie", href: "/pharmacy/stock", group: "Pharmacy", icon: Package },
  { title: "Point de Vente", href: "/cash-register", group: "Finance", icon: Landmark },
  { title: "Sessions de Caisse", href: "/cash-sessions", group: "Finance", icon: Clock },
  { title: "Admissions", href: "/hospital/admissions", group: "Hospital", icon: ClipboardCheck },
  { title: "Partenaires", href: "/partners", group: "Corporate", icon: Building2 },
]

function getInitials(name: string | null | undefined, username: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  }
  return (username || "?").slice(0, 2).toUpperCase()
}

function ProfileDialog({
  user,
  open,
  onOpenChange,
}: {
  user: { id: string; username: string; fullName: string | null; role: string; email?: string | null; phone?: string | null; createdAt?: string | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("La confirmation ne correspond pas au nouveau mot de passe")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Échec de la modification du mot de passe")
        return
      }
      toast.success(data.message || "Mot de passe modifié avec succès")
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error("Erreur réseau lors de la modification du mot de passe")
    } finally {
      setSubmitting(false)
    }
  }

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1)
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR")
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Mon Profil</DialogTitle>
          <DialogDescription>Vos informations personnelles et mot de passe</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-black">
              {getInitials(user.fullName, user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-base font-black text-foreground truncate">{user.fullName || user.username}</p>
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            <Badge variant="outline" className="mt-1.5 rounded-full capitalize">
              <ShieldCheck className="size-3 mr-1" />
              {roleLabel}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
            <p className="mt-1 font-bold text-foreground break-words">{user.email || "—"}</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Téléphone</p>
            <p className="mt-1 font-bold text-foreground break-words">{user.phone || "—"}</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membre depuis</p>
            <p className="mt-1 font-bold text-foreground">{createdAt || "—"}</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identifiant</p>
            <p className="mt-1 font-bold text-foreground">{user.id.slice(0, 8)}</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground">
            <KeyRound className="size-4 text-primary" /> Changer le mot de passe
          </p>
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-xs font-bold">Mot de passe actuel</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-bold">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs font-bold">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Mettre à jour
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutsMenu() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const role = user?.role ?? "user"

  const visibleShortcuts = SHORTCUTS.filter((s) => canAccessGroup(s.group, role))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 rounded-full px-3" title="Raccourcis">
          <LayoutGrid className="size-4 text-primary" />
          <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Raccourcis</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Zap className="size-4 text-primary" /> Accès rapide
          <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            {role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleShortcuts.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">Aucun raccourci disponible pour votre rôle</p>
        ) : (
          visibleShortcuts.map((shortcut) => {
            const IconComponent = shortcut.icon
            return (
              <DropdownMenuItem
                key={shortcut.href}
                onSelect={() => router.push(shortcut.href)}
              >
                <IconComponent className="size-4 text-muted-foreground" />
                <span className="flex-1">{shortcut.title}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/70">
                  {shortcut.group}
                </span>
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppHeader() {
  const { setTheme, theme } = useTheme()
  const { user, loading } = useCurrentUser()
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      {/* Role-aware shortcuts menu */}
      <ShortcutsMenu />

      <div className="flex-1" />

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
                  {loading ? "..." : getInitials(user?.fullName, user?.username || "")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{loading ? "..." : (user?.fullName || user?.username || "Utilisateur")}</p>
              <p className="text-xs text-muted-foreground truncate">
                {loading ? "..." : `@${user?.username} · ${user?.role}`}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
              <User className="size-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <span className="text-destructive">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileDialog
        user={{
          id: user?.id || "",
          username: user?.username || "",
          fullName: user?.fullName || null,
          role: user?.role || "user",
          email: user?.email,
          phone: user?.phone,
          createdAt: user?.createdAt,
        }}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </header>
  )
}
