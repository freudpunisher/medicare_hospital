import { useState, useEffect } from 'react'
import type { UserRole } from '@/config/nav-permissions'

interface CurrentUser {
    id: string
    username: string
    fullName: string | null
    role: UserRole
}

interface UseCurrentUserResult {
    user: CurrentUser | null
    loading: boolean
}

export function useCurrentUser(): UseCurrentUserResult {
    const [user, setUser] = useState<CurrentUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.success) setUser(data.data)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return { user, loading }
}
