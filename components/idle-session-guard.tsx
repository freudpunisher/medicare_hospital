"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertTriangle, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// After this period of inactivity the session warning appears
const IDLE_TIMEOUT_MS = 30 * 60 * 1000
// Countdown between the warning and the forced logout
const WARNING_LEAD_MS = 60 * 1000

export function IdleSessionGuard() {
    const router = useRouter()
    const pathname = usePathname() ?? ""
    const [warningOpen, setWarningOpen] = useState(false)
    const [countdown, setCountdown] = useState(Math.floor(WARNING_LEAD_MS / 1000))
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const countTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const warningRef = useRef(false)

    const stopCountdown = useCallback(() => {
        if (countTimerRef.current) clearInterval(countTimerRef.current)
        countTimerRef.current = null
    }, [])

    const doLogout = useCallback(async () => {
        stopCountdown()
        setWarningOpen(false)
        try {
            await fetch("/api/auth/logout", { method: "POST" })
        } catch {
            // ignore network errors, redirect anyway
        }
        router.push("/login?expired=1")
    }, [router, stopCountdown])

    const triggerWarning = useCallback(() => {
        warningRef.current = true
        setWarningOpen(true)
        setCountdown(Math.floor(WARNING_LEAD_MS / 1000))
        stopCountdown()
        countTimerRef.current = setInterval(() => {
            setCountdown((c) => Math.max(0, c - 1))
        }, 1000)
    }, [stopCountdown])

    const arm = useCallback(() => {
        if (warningRef.current) return
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        idleTimerRef.current = setTimeout(triggerWarning, IDLE_TIMEOUT_MS)
    }, [triggerWarning])

    useEffect(() => {
        if (pathname.startsWith("/login")) return

        const events: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"]
        events.forEach((e) => window.addEventListener(e, arm))
        arm()

        return () => {
            events.forEach((e) => window.removeEventListener(e, arm))
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            stopCountdown()
        }
    }, [pathname, arm, stopCountdown])

    // Force logout when the countdown reaches zero
    useEffect(() => {
        if (warningOpen && countdown <= 0) {
            stopCountdown()
            doLogout()
        }
    }, [warningOpen, countdown, doLogout, stopCountdown])

    const keepAlive = () => {
        warningRef.current = false
        stopCountdown()
        setWarningOpen(false)
        arm()
    }

    return (
        <Dialog open={warningOpen} onOpenChange={(open) => { if (!open) keepAlive() }}>
            <DialogContent className="sm:max-w-sm dark:bg-slate-900">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-amber-500" />
                        Session en attente
                    </DialogTitle>
                    <DialogDescription>
                        Vous êtes resté inactif pendant un long moment. Votre session expirera dans{" "}
                        <span className="font-black text-foreground">{countdown}s</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-sm">
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <p className="text-muted-foreground">
                        Après expiration, vous devrez vous reconnecter avec vos identifiants.
                    </p>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={doLogout}>Se déconnecter</Button>
                    <Button onClick={keepAlive}>Je suis toujours là</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
