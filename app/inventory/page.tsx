"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Package,
  AlertTriangle,
  Calendar,
  DollarSign,
  Boxes,
  History,
  Filter,
  Tag,
  Barcode,
  Loader2,
  ArrowUpDown,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface InventoryItem {
  id: string
  name: string
  genericName: string | null
  unit: string
  barcode: string | null
  sellingPrice: string
  categoryName: string
  categoryId: string | null
  totalAvailable: number
  lots: Array<{
    id: string
    lotNumber: string
    quantityRemaining: string
    expiryDate: string
    unitCost: string | null
  }>
  nearExpiryCount: number
  stockValue: number
}

interface Category {
  id: string
  name: string
}

interface Movement {
  id: string
  type: string
  quantity: string
  medicineName: string
  createdAt: string
}

interface Stats {
  totalProducts: number
  lowStock: number
  nearExpiry: number
  totalValue: number
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, lowStock: 0, nearExpiry: 0, totalValue: 0 })
  const [recentMovements, setRecentMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortField, setSortField] = useState<"name" | "totalAvailable" | "stockValue">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams()
        if (search) params.set("search", search)
        if (categoryFilter && categoryFilter !== "all") params.set("categoryId", categoryFilter)

        const res = await fetch(`/api/inventory?${params.toString()}`)
        const data = await res.json()
        if (res.ok) {
          setItems(data.data)
          setCategories(data.categories)
          setStats(data.stats)
          setRecentMovements(data.recentMovements)
        }
      } catch (err) {
        console.error("Failed to fetch inventory")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredItems = useMemo(() => {
    let result = [...items]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.genericName?.toLowerCase().includes(q) ||
          i.barcode?.toLowerCase().includes(q)
      )
    }

    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter((i) => i.categoryId === categoryFilter)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else if (sortField === "totalAvailable") cmp = a.totalAvailable - b.totalAvailable
      else if (sortField === "stockValue") cmp = a.stockValue - b.stockValue
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [items, search, categoryFilter, sortField, sortDir])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Inventaire"
        description="Gestion dynamique des stocks et inventaire des produits"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Produits"
          value={stats.totalProducts}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Valeur du Stock"
          value={`${stats.totalValue.toLocaleString()} FBU`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Stock Faible"
          value={stats.lowStock}
          icon={AlertTriangle}
          color="orange"
          alert={stats.lowStock > 0}
        />
        <StatCard
          title="Péremption ≤ 3 mois"
          value={stats.nearExpiry}
          icon={Calendar}
          color="red"
          alert={stats.nearExpiry > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  <Boxes className="size-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-black">Produits en Stock</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider">
                      {filteredItems.length} article{filteredItems.length > 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      className="pl-9 h-9 text-sm rounded-xl"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-36 rounded-xl text-xs">
                      <Filter className="size-3 mr-1" />
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <Package className="size-12 opacity-20 mb-3" />
                  <p className="italic font-medium">Aucun produit trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead
                        className="font-black text-[10px] uppercase tracking-wider cursor-pointer hover:text-primary"
                        onClick={() => {
                          if (sortField === "name") setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                          else { setSortField("name"); setSortDir("asc") }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Produit <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-wider">Catégorie</TableHead>
                      <TableHead
                        className="font-black text-[10px] uppercase tracking-wider text-right cursor-pointer hover:text-primary"
                        onClick={() => {
                          if (sortField === "totalAvailable") setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                          else { setSortField("totalAvailable"); setSortDir("desc") }
                        }}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Quantité <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-black text-[10px] uppercase tracking-wider text-right cursor-pointer hover:text-primary"
                        onClick={() => {
                          if (sortField === "stockValue") setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                          else { setSortField("stockValue"); setSortDir("desc") }
                        }}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Valeur <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-wider text-center">Statut</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const isLow = item.totalAvailable > 0 && item.totalAvailable < 10
                      const isOut = item.totalAvailable === 0
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors group">
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">{item.name}</span>
                                {item.barcode && (
                                  <Badge variant="outline" className="text-[8px] font-mono gap-1 h-5">
                                    <Barcode className="size-2.5" /> {item.barcode}
                                  </Badge>
                                )}
                              </div>
                              {item.genericName && (
                                <span className="text-[11px] text-muted-foreground italic">{item.genericName}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground/60 font-mono">
                                {item.unit} — {item.lots.length} lot{item.lots.length > 1 ? "s" : ""}
                                {item.nearExpiryCount > 0 && (
                                  <span className="text-red-500 ml-2 font-bold">
                                    ({item.nearExpiryCount} proche{item.nearExpiryCount > 1 ? "s" : ""} expiration)
                                  </span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] font-medium">
                              <Tag className="size-2.5 mr-1" />
                              {item.categoryName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "text-2xl font-black tabular-nums",
                                isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-foreground"
                              )}
                            >
                              {item.totalAvailable}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1">{item.unit}</span>
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {item.stockValue.toLocaleString()} <span className="text-[10px] text-muted-foreground">FBU</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "border-none px-3 py-1 text-[9px] font-black uppercase tracking-wider",
                                isOut
                                  ? "bg-red-500 text-white"
                                  : isLow
                                    ? "bg-amber-500 text-white"
                                    : "bg-emerald-500/10 text-emerald-600"
                              )}
                            >
                              {isOut ? "Rupture" : isLow ? "Faible" : "OK"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100">
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Lots Breakdown */}
          <Card className="border-border shadow-lg rounded-2xl">
            <CardHeader className="bg-muted/30 border-b px-5 py-4">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Boxes className="size-4 text-primary" /> Lots par Produit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-[400px] overflow-y-auto space-y-3">
              {loading ? (
                <Loader2 className="size-5 animate-spin mx-auto" />
              ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">Aucun lot</p>
              ) : (
                items
                  .filter((i) => i.lots.length > 0)
                  .slice(0, 15)
                  .map((item) => (
                    <div key={item.id} className="border rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold">{item.name}</p>
                        <Badge variant="outline" className="text-[9px]">
                          {item.totalAvailable} {item.unit}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.lots.slice(0, 4).map((lot) => {
                          const expiring = new Date(lot.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                          return (
                            <div
                              key={lot.id}
                              className={cn(
                                "text-[9px] px-2 py-1 rounded-lg font-mono font-bold",
                                expiring
                                  ? "bg-red-500/10 text-red-600 border border-red-200"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {lot.lotNumber}: {parseFloat(lot.quantityRemaining)}
                            </div>
                          )
                        })}
                        {item.lots.length > 4 && (
                          <span className="text-[9px] text-muted-foreground italic">+{item.lots.length - 4} autres</span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card className="border-border shadow-lg rounded-2xl">
            <CardHeader className="bg-muted/30 border-b px-5 py-4">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <History className="size-4 text-primary" /> Derniers Mouvements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-[300px] overflow-y-auto space-y-2">
              {loading ? (
                <Loader2 className="size-5 animate-spin mx-auto" />
              ) : recentMovements.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">Aucun mouvement</p>
              ) : (
                recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "text-[8px] uppercase font-black px-2 py-0",
                          m.type === "purchase"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : m.type === "sale" || m.type === "dispense"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-orange-500/10 text-orange-600"
                        )}
                      >
                        {m.type}
                      </Badge>
                      <span className="text-xs font-medium">{m.medicineName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold tabular-nums">{m.quantity}</span>
                      <p className="text-[9px] text-muted-foreground">
                        {format(new Date(m.createdAt), "dd/MM", { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  alert,
}: {
  title: string
  value: string | number
  icon: any
  color: string
  alert?: boolean
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    orange: "bg-orange-500/10 text-orange-600",
    red: "bg-red-500/10 text-red-600",
  }
  return (
    <Card
      className={cn(
        "border-border shadow-sm rounded-xl transition-all hover:scale-[1.02]",
        alert && "ring-2 ring-red-500/20 border-red-500/20"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl", colors[color])}>
            <Icon className="size-5" />
          </div>
          {alert && <div className="size-2.5 rounded-full bg-red-500 animate-ping" />}
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 mb-1">{title}</p>
        <p className="text-2xl font-black tracking-tighter tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}
