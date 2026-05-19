import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  active: boolean
  activeText?: string
  inactiveText?: string
}

export function StatusBadge({
  active,
  activeText = "Active",
  inactiveText = "Inactive",
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        active
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/30 bg-muted text-muted-foreground"
      )}
    >
      {active ? activeText : inactiveText}
    </Badge>
  )
}
